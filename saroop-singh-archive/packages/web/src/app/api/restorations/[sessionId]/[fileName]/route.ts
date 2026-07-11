import { NextResponse } from 'next/server'

import {
  ArchiveStorageValidationError,
  assertSafeArchivePathSegment,
  assertUuid,
} from '@/lib/archive-storage'
import {
  hasRestorationSessionAccess,
  readRestorationAsset,
  readRestorationSession,
} from '@/lib/restoration-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function contentTypeForFileName(
  fileName: string,
  session: NonNullable<Awaited<ReturnType<typeof readRestorationSession>>>
): string | null {
  if (fileName === session.originalFileName) {
    return session.originalMimeType
  }

  return (
    session.restorations.find(restoration => restoration.fileName === fileName)
      ?.mimeType ?? null
  )
}

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string; fileName: string }> }
) {
  try {
    const { sessionId: rawSessionId, fileName: rawFileName } =
      await context.params
    const sessionId = assertUuid(rawSessionId, 'Restoration session ID')
    const fileName = assertSafeArchivePathSegment(
      rawFileName,
      'Restoration filename'
    )
    const session = await readRestorationSession(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Restoration session not found' },
        { status: 404 }
      )
    }

    if (
      !hasRestorationSessionAccess(
        session,
        new URL(request.url).searchParams.get('token')
      )
    ) {
      // Keep private restoration sessions unenumerable, including their originals.
      return NextResponse.json(
        { error: 'Restoration image not found' },
        { status: 404 }
      )
    }

    const contentType = contentTypeForFileName(fileName, session)
    if (!contentType) {
      return NextResponse.json(
        { error: 'Restoration image not found' },
        { status: 404 }
      )
    }

    const image = await readRestorationAsset(sessionId, fileName)
    if (!image) {
      return NextResponse.json(
        { error: 'Restoration image not found' },
        { status: 404 }
      )
    }

    return new NextResponse(Uint8Array.from(image), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    if (error instanceof ArchiveStorageValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Restoration asset read error', error)
    return NextResponse.json(
      { error: 'Unable to load this restoration image.' },
      { status: 500 }
    )
  }
}
