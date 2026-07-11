import { ZipArchive } from 'archiver'
import { PassThrough } from 'node:stream'

import { NextRequest, NextResponse } from 'next/server'

import {
  ArchiveStorageValidationError,
  assertSafeArchiveId,
  assertUuid,
} from '@/lib/archive-storage'
import {
  hasRestorationSessionAccess,
  readRestorationAsset,
  readRestorationSession,
} from '@/lib/restoration-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requestedRestorationIds(
  value: unknown,
  sessionId: string
): string[] | null {
  if (value === undefined) {
    return null
  }

  if (!Array.isArray(value) || value.length === 0 || value.length > 12) {
    throw new ArchiveStorageValidationError(
      'restorationIds must contain between 1 and 12 entries'
    )
  }

  const ids = value.map((id, index) =>
    assertSafeArchiveId(id, `restorationIds[${index}]`)
  )
  if (ids.some(id => !id.startsWith(`${sessionId}-`))) {
    throw new ArchiveStorageValidationError(
      'Every restoration must belong to the requested session'
    )
  }

  return [...new Set(ids)]
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new ArchiveStorageValidationError('Request body must be an object')
    }

    const requestBody = body as Record<string, unknown>
    const sessionId = assertUuid(
      requestBody.sessionId,
      'Restoration session ID'
    )
    const selectedIds = requestedRestorationIds(
      requestBody.restorationIds,
      sessionId
    )
    const session = await readRestorationSession(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Restoration session not found' },
        { status: 404 }
      )
    }

    if (!hasRestorationSessionAccess(session, requestBody.sessionAccessToken)) {
      return NextResponse.json(
        { error: 'Restoration session not found' },
        { status: 404 }
      )
    }

    const selectedRestorations = session.restorations.filter(
      restoration => !selectedIds || selectedIds.includes(restoration.id)
    )
    if (selectedRestorations.length === 0) {
      return NextResponse.json(
        { error: 'No matching restorations were found' },
        { status: 404 }
      )
    }

    const archive = new ZipArchive({ zlib: { level: 9 } })
    const passThrough = new PassThrough()
    const archiveBuffers: Buffer[] = []
    passThrough.on('data', chunk => archiveBuffers.push(Buffer.from(chunk)))

    return await new Promise<NextResponse>((resolve, reject) => {
      passThrough.on('end', () => {
        const zipBuffer = Buffer.concat(archiveBuffers)
        resolve(
          new NextResponse(zipBuffer, {
            headers: {
              'Content-Type': 'application/zip',
              'Content-Disposition': `attachment; filename="saroop-restoration-${sessionId}.zip"`,
              'Content-Length': zipBuffer.length.toString(),
              'Cache-Control': 'private, no-store',
            },
          })
        )
      })

      archive.on('error', reject)
      archive.pipe(passThrough)

      Promise.all(
        selectedRestorations.map(async restoration => {
          const file = await readRestorationAsset(
            sessionId,
            restoration.fileName
          )
          if (!file) {
            throw new Error(`Missing restoration asset ${restoration.fileName}`)
          }
          archive.append(file, { name: restoration.fileName })
        })
      )
        .then(() => archive.finalize())
        .catch(reject)
    })
  } catch (error) {
    if (
      error instanceof ArchiveStorageValidationError ||
      error instanceof SyntaxError
    ) {
      return NextResponse.json(
        {
          error:
            error instanceof SyntaxError
              ? 'Invalid JSON request body'
              : error.message,
        },
        { status: 400 }
      )
    }

    console.error('Restoration ZIP download error', error)
    return NextResponse.json(
      { error: 'Unable to create the restoration download.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'archive-restoration-download',
    method: 'POST',
  })
}
