import { NextRequest, NextResponse } from 'next/server'

import { hasValidAdminBearerToken } from '@/lib/admin-auth'
import {
  ArchiveStorageValidationError,
  galleryDataDirectory,
  galleryItemPath,
  isSafeArchiveId,
  listArchiveDirectory,
  readJsonFile,
} from '@/lib/archive-storage'
import type { PhotoAnalysis } from '@/lib/photo-analysis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_PAGE_SIZE = 100

type ModerationStatus = 'pending' | 'published' | 'rejected'

interface StoredGalleryItem {
  id: string
  submittedAt: string
  isPublic: boolean
  status?: ModerationStatus
  thumbnailUrl?: string
  restorations?: unknown[]
  metadata?: {
    title?: string
    description?: string
    date?: string
    familyMember?: string
    tags?: string[]
  }
  photoAnalysis?: PhotoAnalysis
}

function isStoredGalleryItem(value: unknown): value is StoredGalleryItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'id' in value &&
    'submittedAt' in value &&
    'isPublic' in value &&
    typeof value.id === 'string' &&
    isSafeArchiveId(value.id) &&
    typeof value.submittedAt === 'string' &&
    typeof value.isPublic === 'boolean'
  )
}

function parseStatus(value: string | null): ModerationStatus {
  if (value === null || value === 'pending') {
    return 'pending'
  }

  if (value === 'published' || value === 'rejected') {
    return value
  }

  throw new ArchiveStorageValidationError(
    'Moderation status must be pending, published, or rejected'
  )
}

function parseLimit(value: string | null): number {
  if (value === null) {
    return 25
  }

  if (!/^\d+$/.test(value)) {
    throw new ArchiveStorageValidationError('Limit must be a positive integer')
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > MAX_PAGE_SIZE) {
    throw new ArchiveStorageValidationError(
      `Limit must be between 1 and ${MAX_PAGE_SIZE}`
    )
  }

  return parsed
}

export async function GET(request: NextRequest) {
  if (!hasValidAdminBearerToken(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = parseStatus(searchParams.get('status'))
    const limit = parseLimit(searchParams.get('limit'))
    const records = await Promise.all(
      (await listArchiveDirectory(galleryDataDirectory()))
        .filter(fileName => fileName.endsWith('.json'))
        .map(fileName => fileName.slice(0, -'.json'.length))
        .filter(isSafeArchiveId)
        .map(async itemId => readJsonFile<unknown>(galleryItemPath(itemId)))
    )

    const items = records
      .filter(isStoredGalleryItem)
      .filter(item => (item.status ?? 'pending') === status)
      .sort(
        (left, right) =>
          Date.parse(right.submittedAt) - Date.parse(left.submittedAt)
      )
      .slice(0, limit)
      .map(item => ({
        id: item.id,
        status: item.status ?? 'pending',
        isPublic: item.isPublic,
        submittedAt: item.submittedAt,
        metadata: item.metadata ?? {},
        photoAnalysis: item.photoAnalysis,
        thumbnailUrl: item.thumbnailUrl ?? null,
        restorationCount: Array.isArray(item.restorations)
          ? item.restorations.length
          : 0,
      }))

    return NextResponse.json({
      success: true,
      status,
      items,
      count: items.length,
    })
  } catch (error) {
    if (error instanceof ArchiveStorageValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Gallery moderation queue error', error)
    return NextResponse.json(
      { error: 'Failed to read the moderation queue' },
      { status: 500 }
    )
  }
}
