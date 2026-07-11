import { randomUUID } from 'node:crypto'

import { NextRequest, NextResponse } from 'next/server'

import {
  ArchiveStorageValidationError,
  assertSafeArchiveId,
  assertSafeArchivePathSegment,
  assertUuid,
  galleryItemPath,
  writeJsonAtomically,
} from '@/lib/archive-storage'
import {
  readRestorationAsset,
  readRestorationSession,
  restorationAssetUrl,
} from '@/lib/restoration-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_RESTORATIONS_PER_SUBMISSION = 12
const MAX_TAGS = 12

interface GalleryRestoration {
  id: string
  name: string
  imageUrl: string
  selected: true
}

interface GallerySubmission {
  id: string
  sessionId: string
  restorations: GalleryRestoration[]
  metadata: {
    title: string
    description: string
    date: string
    familyMember?: string
    tags: string[]
    isPublic: false
  }
  submittedAt: string
  isPublic: false
  status: 'pending'
  thumbnailUrl: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireRecord(
  value: unknown,
  fieldName: string
): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new ArchiveStorageValidationError(`${fieldName} must be an object`)
  }

  return value
}

function optionalText(
  value: unknown,
  fieldName: string,
  maximumLength: number
): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new ArchiveStorageValidationError(`${fieldName} must be text`)
  }

  const normalized = value.trim()
  if (normalized.length > maximumLength || /\u0000/.test(normalized)) {
    throw new ArchiveStorageValidationError(`${fieldName} is invalid`)
  }

  return normalized
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function parseArchiveDate(value: unknown): string {
  const date = optionalText(value, 'Metadata date', 10) ?? today()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ArchiveStorageValidationError('Metadata date must use YYYY-MM-DD')
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`)
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new ArchiveStorageValidationError('Metadata date is invalid')
  }

  return date
}

function parseTags(value: unknown): string[] {
  if (value === undefined || value === null) {
    return []
  }

  if (!Array.isArray(value) || value.length > MAX_TAGS) {
    throw new ArchiveStorageValidationError(
      `Metadata tags must contain at most ${MAX_TAGS} entries`
    )
  }

  const tags = value.map((tag, index) => {
    const normalized = optionalText(tag, `Metadata tag ${index + 1}`, 60)
    if (!normalized) {
      throw new ArchiveStorageValidationError(
        `Metadata tag ${index + 1} cannot be empty`
      )
    }
    return normalized
  })

  return [...new Set(tags)]
}

function parseRestorationImageUrl(value: unknown, sessionId: string): string {
  if (typeof value !== 'string') {
    throw new ArchiveStorageValidationError(
      'Restoration image URL must be text'
    )
  }

  let url: URL
  try {
    url = new URL(value, 'https://archive.local')
  } catch {
    throw new ArchiveStorageValidationError('Restoration image URL is invalid')
  }

  if (url.origin !== 'https://archive.local') {
    throw new ArchiveStorageValidationError(
      'Restoration image must use an archive-local URL'
    )
  }

  const expectedPrefix = `/api/restorations/${sessionId}/`
  if (!url.pathname.startsWith(expectedPrefix)) {
    throw new ArchiveStorageValidationError(
      'Restoration image must belong to its restoration session'
    )
  }

  const fileName = url.pathname.slice(expectedPrefix.length)
  assertSafeArchivePathSegment(fileName, 'Restoration image filename')
  return value
}

function parseRestorations(
  value: unknown,
  sessionId: string
): GalleryRestoration[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > MAX_RESTORATIONS_PER_SUBMISSION
  ) {
    throw new ArchiveStorageValidationError(
      `Select between 1 and ${MAX_RESTORATIONS_PER_SUBMISSION} restorations`
    )
  }

  const restorationIds = new Set<string>()
  const imageUrls = new Set<string>()

  return value.map((entry, index) => {
    const restoration = requireRecord(
      entry,
      `Selected restoration ${index + 1}`
    )
    const id = assertSafeArchiveId(
      restoration.id,
      `Selected restoration ${index + 1} ID`
    )

    if (!id.startsWith(`${sessionId}-`)) {
      throw new ArchiveStorageValidationError(
        'Selected restoration does not belong to its session'
      )
    }

    const imageUrl = parseRestorationImageUrl(restoration.imageUrl, sessionId)
    if (restorationIds.has(id) || imageUrls.has(imageUrl)) {
      throw new ArchiveStorageValidationError(
        'Selected restorations must be unique'
      )
    }

    restorationIds.add(id)
    imageUrls.add(imageUrl)

    return {
      id,
      name:
        optionalText(
          restoration.name,
          `Selected restoration ${index + 1} name`,
          100
        ) || id,
      imageUrl,
      selected: true,
    }
  })
}

function parseMetadata(value: unknown): GallerySubmission['metadata'] {
  const metadata = requireRecord(value, 'Metadata')
  const familyMember = optionalText(metadata.familyMember, 'Family member', 100)

  return {
    title:
      optionalText(metadata.title, 'Metadata title', 160) ||
      'Untitled Restoration',
    description:
      optionalText(metadata.description, 'Metadata description', 2_000) || '',
    date: parseArchiveDate(metadata.date),
    ...(familyMember ? { familyMember } : {}),
    tags: parseTags(metadata.tags),
    // Public visibility is an explicit moderation decision, never a client input.
    isPublic: false,
  }
}

async function assertRestorationsExistInSession(
  sessionId: string,
  restorations: GalleryRestoration[]
): Promise<void> {
  const session = await readRestorationSession(sessionId)
  if (!session) {
    throw new ArchiveStorageValidationError('Restoration session was not found')
  }

  const sessionRestorations = new Map(
    session.restorations.map(restoration => [restoration.id, restoration])
  )

  for (const restoration of restorations) {
    const storedRestoration = sessionRestorations.get(restoration.id)
    const expectedImageUrl = storedRestoration
      ? restorationAssetUrl(session, storedRestoration.fileName)
      : null

    if (!storedRestoration || restoration.imageUrl !== expectedImageUrl) {
      throw new ArchiveStorageValidationError(
        'Selected restoration does not match its saved session'
      )
    }

    const image = await readRestorationAsset(
      sessionId,
      storedRestoration.fileName
    )
    if (!image) {
      throw new ArchiveStorageValidationError(
        'Selected restoration image is no longer available'
      )
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const submissionRequest = requireRecord(body, 'Submission')
    const sessionId = assertUuid(
      submissionRequest.sessionId,
      'Restoration session ID'
    )
    const restorations = parseRestorations(
      submissionRequest.selectedRestorations,
      sessionId
    )
    await assertRestorationsExistInSession(sessionId, restorations)
    const metadata = parseMetadata(submissionRequest.metadata)
    const galleryId = `gallery-${randomUUID()}`
    const submittedAt = new Date().toISOString()

    const submission: GallerySubmission = {
      id: galleryId,
      sessionId,
      restorations,
      metadata,
      submittedAt,
      isPublic: false,
      status: 'pending',
      thumbnailUrl: restorations[0].imageUrl,
    }

    await writeJsonAtomically(galleryItemPath(galleryId), submission)

    return NextResponse.json({
      success: true,
      galleryId,
      submittedRestorations: restorations.length,
      status: submission.status,
      message: 'Contribution submitted for review',
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

    console.error('Gallery submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit gallery contribution' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Gallery contribution API',
    methods: ['POST'],
    description: 'Submit restorations to the moderation queue',
  })
}
