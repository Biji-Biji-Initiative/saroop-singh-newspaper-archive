import { randomUUID } from 'node:crypto'

import { NextRequest, NextResponse } from 'next/server'

import {
  createRestorationSessionAccessToken,
  extensionForImageMimeType,
  MAX_RESTORATION_REQUEST_BYTES,
  MAX_RESTORATION_UPLOAD_BYTES,
  purgeExpiredRestorationSessions,
  restorationAssetUrl,
  writeRestorationAsset,
  writeRestorationSession,
} from '@/lib/restoration-storage'
import { consumeRestorationQuota } from '@/lib/restoration-rate-limit'
import { contributionsEnabled } from '@/lib/contributions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface GeminiPart {
  inlineData?: {
    data?: string
    mimeType?: string
  }
  inline_data?: {
    data?: string
    mime_type?: string
  }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[]
    }
  }>
}

function requestIp(request: NextRequest): string {
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) {
    return realIp
  }

  const cloudflareIp = request.headers.get('cf-connecting-ip')?.trim()
  if (cloudflareIp) {
    return cloudflareIp
  }

  const forwardedAddresses = request.headers
    .get('x-forwarded-for')
    ?.split(',')
    .map(address => address.trim())
    .filter(Boolean)
  return forwardedAddresses?.at(-1) || 'unknown'
}

function hasTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

function isSupportedImage(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    )
  }

  if (mimeType === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    )
  }

  if (mimeType === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    )
  }

  return false
}

function restorationPrompt(): string {
  return [
    'Create one careful archival restoration of this historical photograph.',
    'Preserve the exact people, composition, crop, identity, period details, and documentary meaning.',
    'Repair only visible damage, fading, noise, contrast, and exposure defects.',
    'Do not invent, add, remove, recolor, beautify, or alter historical details.',
    'Return only the restored image.',
  ].join(' ')
}

function imageFromGeminiResponse(response: GeminiResponse): {
  buffer: Buffer
  mimeType: string
} | null {
  const imagePart = response.candidates
    ?.flatMap(candidate => candidate.content?.parts || [])
    .find(
      part =>
        typeof part.inlineData?.data === 'string' ||
        typeof part.inline_data?.data === 'string'
    )

  const encodedImage = imagePart?.inlineData?.data || imagePart?.inline_data?.data
  const mimeType =
    imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || 'image/png'
  if (!encodedImage || !extensionForImageMimeType(mimeType)) {
    return null
  }

  return { buffer: Buffer.from(encodedImage, 'base64'), mimeType }
}

function responseShape(response: GeminiResponse): {
  candidateCount: number
  parts: Array<{
    hasInlineData: boolean
    dataLength: number
    mimeType: string | null
    textLength: number
  }>
} {
  const candidates = response.candidates ?? []

  return {
    candidateCount: candidates.length,
    parts: candidates.flatMap(candidate =>
      (candidate.content?.parts ?? []).map(part => {
        const camelCaseImage = part.inlineData
        const snakeCaseImage = part.inline_data
        return {
          hasInlineData:
            typeof camelCaseImage?.data === 'string' ||
            typeof snakeCaseImage?.data === 'string',
          dataLength:
            camelCaseImage?.data?.length ?? snakeCaseImage?.data?.length ?? 0,
          mimeType:
            camelCaseImage?.mimeType ?? snakeCaseImage?.mime_type ?? null,
          textLength: 0,
        }
      })
    ),
  }
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json(
      { error: 'Untrusted request origin' },
      { status: 403 }
    )
  }

  if (!contributionsEnabled()) {
    return NextResponse.json(
      { error: 'Photo restoration is temporarily unavailable.' },
      { status: 503 }
    )
  }

  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const contentLengthBytes = Number(contentLength)
    if (
      !Number.isSafeInteger(contentLengthBytes) ||
      contentLengthBytes < 0 ||
      contentLengthBytes > MAX_RESTORATION_REQUEST_BYTES
    ) {
      return NextResponse.json(
        { error: 'Images must be no larger than 10 MB.' },
        { status: 413 }
      )
    }
  }

  const geminiApiKey = process.env.GEMINI_API_KEY?.trim()
  if (!geminiApiKey) {
    return NextResponse.json(
      { error: 'Photo restoration is not configured yet.' },
      { status: 503 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('image')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Please choose an image to restore.' },
        { status: 400 }
      )
    }

    const inputMimeType = file.type.toLowerCase()
    const inputExtension = extensionForImageMimeType(inputMimeType)
    if (!inputExtension) {
      return NextResponse.json(
        { error: 'Use a JPG, PNG, or WEBP image.' },
        { status: 415 }
      )
    }

    if (file.size === 0 || file.size > MAX_RESTORATION_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Images must be between 1 byte and 10 MB.' },
        { status: 413 }
      )
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer())
    if (!isSupportedImage(inputBuffer, inputMimeType)) {
      return NextResponse.json(
        { error: 'The uploaded file does not match its image type.' },
        { status: 415 }
      )
    }

    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-image'
    let generatedImage: { buffer: Buffer; mimeType: string } | null = null

    // Gemini can occasionally finish an image request with a text-only
    // candidate. A single bounded retry keeps a genuine restoration request
    // useful without creating an unbounded paid retry loop.
    for (let attempt = 0; attempt < 2 && !generatedImage; attempt += 1) {
      // Every provider request (including a bounded retry) spends one durable
      // quota unit, so the configured cost ceiling remains accurate.
      const quota = await consumeRestorationQuota(requestIp(request))
      if (!quota.allowed) {
        return NextResponse.json(
          { error: 'Restoration limit reached. Please try again later.' },
          {
            status: 429,
            headers: { 'Retry-After': quota.retryAfterSeconds.toString() },
          }
        )
      }

      if (attempt === 0) {
        await purgeExpiredRestorationSessions()
      }

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiApiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: restorationPrompt() },
                  {
                    inlineData: {
                      mimeType: inputMimeType,
                      data: inputBuffer.toString('base64'),
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          }),
          signal: AbortSignal.timeout(120_000),
        }
      )

      if (!geminiResponse.ok) {
        console.error('Gemini restoration request failed', {
          status: geminiResponse.status,
        })
        const status = geminiResponse.status === 429 ? 429 : 502
        return NextResponse.json(
          {
            error:
              status === 429
                ? 'The restoration service is busy. Please try again shortly.'
                : 'The restoration service could not process this image.',
          },
          { status }
        )
      }

      const geminiResult = (await geminiResponse.json()) as GeminiResponse
      generatedImage = imageFromGeminiResponse(geminiResult)

      if (!generatedImage) {
        console.warn('Gemini restoration result did not include an image', {
          attempt: attempt + 1,
          response: responseShape(geminiResult),
        })

        // A brief pause avoids immediately repeating a model-side text-only
        // candidate while preserving the two-attempt cost ceiling.
        if (attempt === 0) {
          await new Promise(resolve => setTimeout(resolve, 750))
        }
      }
    }

    if (!generatedImage || generatedImage.buffer.length === 0) {
      return NextResponse.json(
        { error: 'The restoration service did not return an image.' },
        { status: 502 }
      )
    }

    const outputExtension = extensionForImageMimeType(generatedImage.mimeType)
    const outputMimeType = generatedImage.mimeType.toLowerCase()
    if (
      !outputExtension ||
      !isSupportedImage(generatedImage.buffer, outputMimeType)
    ) {
      return NextResponse.json(
        { error: 'The restoration service returned an invalid image format.' },
        { status: 502 }
      )
    }

    const sessionId = randomUUID()
    const originalFileName = `original.${inputExtension}`
    const restorationFileName = `archival-restoration.${outputExtension}`
    const restorationId = `${sessionId}-archival`
    const sessionAccessToken = createRestorationSessionAccessToken()
    const session = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      accessToken: sessionAccessToken,
      originalFileName,
      originalMimeType: inputMimeType,
      restorations: [
        {
          id: restorationId,
          name: 'Archival restoration',
          style: 'archival' as const,
          description:
            'A conservative AI-assisted restoration for review; compare it against the original before publishing.',
          fileName: restorationFileName,
          mimeType: outputMimeType,
        },
      ],
    }

    await writeRestorationAsset(sessionId, originalFileName, inputBuffer)
    await writeRestorationAsset(
      sessionId,
      restorationFileName,
      generatedImage.buffer
    )
    await writeRestorationSession(session)

    const restorationUrl = restorationAssetUrl(session, restorationFileName)

    return NextResponse.json({
      success: true,
      sessionId,
      sessionAccessToken,
      originalImageUrl: restorationAssetUrl(session, originalFileName),
      restorations: [
        {
          id: restorationId,
          name: 'Archival restoration',
          style: 'archival',
          description:
            'A conservative AI-assisted restoration for review; compare it against the original before publishing.',
          imageUrl: restorationUrl,
          downloadUrl: restorationUrl,
        },
      ],
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'The restoration service timed out. Please try again.' },
        { status: 504 }
      )
    }

    console.error('Photo restoration error', error)
    return NextResponse.json(
      { error: 'Unable to restore this image right now.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'archive-restoration',
    method: 'POST',
    maximumImageSizeMb: MAX_RESTORATION_UPLOAD_BYTES / 1024 / 1024,
  })
}
