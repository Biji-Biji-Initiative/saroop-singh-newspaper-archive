import { randomUUID } from 'node:crypto'

import { NextRequest, NextResponse } from 'next/server'

import {
  ArchiveStorageValidationError,
  galleryItemPath,
  removeArchiveDirectory,
  writeJsonAtomically,
} from '@/lib/archive-storage'
import { consumeContributionQuota } from '@/lib/contribution-rate-limit'
import { contributionsEnabled } from '@/lib/contributions'
import {
  isSafeImageDimensionCount,
  isSupportedImage,
  readSafeImageDimensions,
} from '@/lib/image-validation'
import { hasTrustedArchiveOrigin } from '@/lib/request-origin'
import {
  createRestorationSessionAccessToken,
  extensionForImageMimeType,
  purgeExpiredRestorationSessions,
  restorationAssetUrl,
  restorationSessionDirectory,
  writeRestorationAsset,
  writeRestorationSession,
  type RestorationSession,
} from '@/lib/restoration-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_CONTRIBUTION_UPLOAD_BYTES = 25 * 1024 * 1024
const MAX_CONTRIBUTION_REQUEST_BYTES =
  MAX_CONTRIBUTION_UPLOAD_BYTES + 256 * 1024
const MAX_TAGS = 12

interface PendingFamilyContribution {
  id: string
  sessionId: string
  source: 'family-contribution'
  restorations: Array<{
    id: string
    name: string
    imageUrl: string
    selected: true
  }>
  metadata: {
    title: string
    description: string
    dateText?: string
    familyMember?: string
    tags: string[]
    contributorConsent: true
    isPublic: false
  }
  privateContributor: {
    name: string
    relationship?: string
    contact?: string
  }
  submittedAt: string
  isPublic: false
  status: 'pending'
  thumbnailUrl: string
}

function optionalText(
  value: FormDataEntryValue | null,
  fieldName: string,
  maximumLength: number
): string | undefined {
  if (value === null) {
    return undefined
  }
  if (typeof value !== 'string') {
    throw new ArchiveStorageValidationError(`${fieldName} must be text`)
  }

  const normalized = value.trim()
  if (normalized.length > maximumLength || /\u0000/.test(normalized)) {
    throw new ArchiveStorageValidationError(`${fieldName} is invalid`)
  }

  return normalized || undefined
}

function requiredText(
  value: FormDataEntryValue | null,
  fieldName: string,
  maximumLength: number
): string {
  const text = optionalText(value, fieldName, maximumLength)
  if (!text) {
    throw new ArchiveStorageValidationError(`${fieldName} is required`)
  }
  return text
}

function parseTags(value: FormDataEntryValue | null): string[] {
  const text = optionalText(value, 'Tags', 720)
  if (!text) {
    return []
  }

  const tags = new Map<string, string>()
  for (const entry of text.split(',')) {
    const tag = entry.trim()
    if (!tag || tag.length > 60 || /\u0000/.test(tag)) {
      throw new ArchiveStorageValidationError(
        'Each tag must be at most 60 characters'
      )
    }
    tags.set(tag.toLocaleLowerCase(), tag)
  }

  if (tags.size > MAX_TAGS) {
    throw new ArchiveStorageValidationError(
      `Use at most ${MAX_TAGS} archive tags`
    )
  }

  return [...tags.values()]
}

function defaultTitle(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '').trim()
  return withoutExtension.slice(0, 160) || 'Family photograph'
}

export async function POST(request: NextRequest) {
  if (!hasTrustedArchiveOrigin(request)) {
    return NextResponse.json(
      { error: 'Untrusted request origin' },
      { status: 403 }
    )
  }

  if (!contributionsEnabled()) {
    return NextResponse.json(
      { error: 'Family contributions are temporarily unavailable.' },
      { status: 503 }
    )
  }

  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const bytes = Number(contentLength)
    if (
      !Number.isSafeInteger(bytes) ||
      bytes < 0 ||
      bytes > MAX_CONTRIBUTION_REQUEST_BYTES
    ) {
      return NextResponse.json(
        { error: 'Each contribution must be no larger than 25 MB.' },
        { status: 413 }
      )
    }
  }

  let sessionId: string | null = null
  try {
    const formData = await request.formData()

    // Quietly accept bot traffic without creating a durable record.
    if (optionalText(formData.get('website'), 'Website', 200)) {
      return NextResponse.json({ received: true }, { status: 202 })
    }

    if (formData.get('consent') !== 'yes') {
      throw new ArchiveStorageValidationError(
        'Please confirm that you have permission to preserve this material'
      )
    }

    const contributorName = requiredText(
      formData.get('contributorName'),
      'Your name',
      120
    )
    const relationship = optionalText(
      formData.get('relationship'),
      'Relationship',
      160
    )
    const contact = optionalText(formData.get('contact'), 'Contact', 240)
    const file = formData.get('file')
    if (!(file instanceof File)) {
      throw new ArchiveStorageValidationError('Choose a photograph to preserve')
    }
    if (file.size === 0 || file.size > MAX_CONTRIBUTION_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Each contribution must be between 1 byte and 25 MB.' },
        { status: 413 }
      )
    }

    const mimeType = file.type.toLowerCase()
    const extension = extensionForImageMimeType(mimeType)
    if (!extension) {
      return NextResponse.json(
        { error: 'Use a JPG, PNG, or WEBP photograph.' },
        { status: 415 }
      )
    }

    const image = Buffer.from(await file.arrayBuffer())
    if (!isSupportedImage(image, mimeType)) {
      return NextResponse.json(
        { error: 'The uploaded file does not match its image type.' },
        { status: 415 }
      )
    }

    const dimensions = readSafeImageDimensions(image, mimeType)
    if (!dimensions || !isSafeImageDimensionCount(dimensions)) {
      return NextResponse.json(
        {
          error: 'The photograph dimensions are not safe for archive storage.',
        },
        { status: 413 }
      )
    }

    const quota = await consumeContributionQuota()
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error:
            'The archive has reached today’s private contribution limit. Please try again tomorrow.',
        },
        {
          status: 429,
          headers: { 'Retry-After': quota.retryAfterSeconds.toString() },
        }
      )
    }

    await purgeExpiredRestorationSessions()

    const title =
      optionalText(formData.get('title'), 'Photo title', 160) ||
      defaultTitle(file.name)
    const description =
      optionalText(formData.get('story'), 'Story', 2_000) || ''
    const familyMember = optionalText(
      formData.get('people'),
      'People pictured',
      240
    )
    const dateText = optionalText(
      formData.get('dateText'),
      'Approximate date',
      100
    )
    const tags = parseTags(formData.get('tags'))

    sessionId = randomUUID()
    const originalFileName = `original.${extension}`
    const preservationId = `${sessionId}-original`
    const session: RestorationSession = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      accessToken: createRestorationSessionAccessToken(),
      kind: 'contribution',
      originalFileName,
      originalMimeType: mimeType,
      restorations: [
        {
          id: preservationId,
          name: 'Original family photograph',
          style: 'preservation',
          description:
            'The unaltered photograph as contributed by family; private until archive review approves publication.',
          fileName: originalFileName,
          mimeType,
        },
      ],
    }
    const originalUrl = restorationAssetUrl(session, originalFileName)
    const galleryId = `gallery-${sessionId}`
    const contribution: PendingFamilyContribution = {
      id: galleryId,
      sessionId,
      source: 'family-contribution',
      restorations: [
        {
          id: preservationId,
          name: 'Original family photograph',
          imageUrl: originalUrl,
          selected: true,
        },
      ],
      metadata: {
        title,
        description,
        ...(dateText ? { dateText } : {}),
        ...(familyMember ? { familyMember } : {}),
        tags,
        contributorConsent: true,
        isPublic: false,
      },
      privateContributor: {
        name: contributorName,
        ...(relationship ? { relationship } : {}),
        ...(contact ? { contact } : {}),
      },
      submittedAt: session.createdAt,
      isPublic: false,
      status: 'pending',
      thumbnailUrl: originalUrl,
    }

    await writeRestorationAsset(sessionId, originalFileName, image)
    await writeRestorationSession(session)
    await writeJsonAtomically(galleryItemPath(galleryId), contribution)

    return NextResponse.json(
      {
        success: true,
        galleryId,
        status: contribution.status,
        message: 'Family photograph received for private archive review',
      },
      { status: 201 }
    )
  } catch (error) {
    if (sessionId) {
      await removeArchiveDirectory(
        restorationSessionDirectory(sessionId)
      ).catch(() => undefined)
    }

    if (
      error instanceof ArchiveStorageValidationError ||
      error instanceof SyntaxError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Family contribution intake error', {
      error: error instanceof Error ? error.message : 'unknown error',
    })
    return NextResponse.json(
      { error: 'Unable to preserve this family contribution right now.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'family-contribution-intake',
    method: 'POST',
    maximumImageSizeMb: MAX_CONTRIBUTION_UPLOAD_BYTES / 1024 / 1024,
    maxUploadsAtOnce: 12,
  })
}
