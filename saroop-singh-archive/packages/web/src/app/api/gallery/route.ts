import { readFile, readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'

import { NextRequest, NextResponse } from 'next/server'

import {
  ArchiveStorageValidationError,
  assertSafeArchiveId,
  galleryDataDirectory,
  galleryItemPath,
  galleryPublicAssetDirectory,
  galleryPublicAssetPath,
  isSafeArchiveId,
  listArchiveDirectory,
  removeArchiveDirectory,
  readJsonFile,
  removeArchiveFile,
  writeArchiveFileAtomically,
  writeJsonAtomically,
} from '@/lib/archive-storage'
import {
  readRestorationAsset,
  readRestorationSession,
} from '@/lib/restoration-storage'
import { hasValidAdminBearerToken } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_PAGE_SIZE = 48
const DEFAULT_PAGE_SIZE = 12

interface GalleryMetadata {
  title?: string
  description?: string
  date?: string
  dateText?: string
  familyMember?: string
  tags?: string[]
  isPublic?: boolean
}

interface GalleryItem {
  id: string
  sessionId?: string
  title?: string
  date?: string
  submittedAt: string
  isPublic: boolean
  status?: 'pending' | 'published' | 'rejected'
  reviewedAt?: string
  metadata?: GalleryMetadata
  thumbnailUrl?: string
  restorations?: unknown[]
}

interface PublishedGalleryRestoration {
  id: string
  name: string
  imageUrl: string
  selected: true
  fileName: string
  mimeType: string
}

const LEGACY_GALLERY_DATA_DIR = join(process.cwd(), 'public', 'gallery-data')

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isGalleryItem(value: unknown): value is GalleryItem {
  return (
    isRecord(value) &&
    isSafeArchiveId(value.id) &&
    typeof value.submittedAt === 'string' &&
    typeof value.isPublic === 'boolean'
  )
}

function metadataFor(item: GalleryItem): GalleryMetadata {
  return isRecord(item.metadata) ? (item.metadata as GalleryMetadata) : {}
}

function tagsFor(item: GalleryItem): string[] {
  const tags = metadataFor(item).tags
  return Array.isArray(tags)
    ? tags.filter((tag): tag is string => typeof tag === 'string')
    : []
}

function timestampFor(value: string): number {
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : 0
}

function titleFor(item: GalleryItem): string {
  const metadataTitle = metadataFor(item).title
  return typeof metadataTitle === 'string' && metadataTitle.length > 0
    ? metadataTitle
    : typeof item.title === 'string' && item.title.length > 0
      ? item.title
      : 'Untitled'
}

function descriptionFor(item: GalleryItem): string | undefined {
  const description = metadataFor(item).description
  return typeof description === 'string' && description.length > 0
    ? description
    : undefined
}

function dateFor(item: GalleryItem): string | undefined {
  const metadataDate = metadataFor(item).date
  const metadataDateText = metadataFor(item).dateText
  return typeof metadataDate === 'string' && metadataDate.length > 0
    ? metadataDate
    : typeof metadataDateText === 'string' && metadataDateText.length > 0
      ? metadataDateText
      : typeof item.date === 'string'
        ? item.date
        : undefined
}

function familyMemberFor(item: GalleryItem): string | undefined {
  const familyMember = metadataFor(item).familyMember
  return typeof familyMember === 'string' && familyMember.length > 0
    ? familyMember
    : undefined
}

function isPublishedForPublicGallery(item: GalleryItem): boolean {
  return (
    item.isPublic === true &&
    item.status !== 'pending' &&
    item.status !== 'rejected'
  )
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
  maximum: number
): number {
  if (value === null) {
    return fallback
  }

  if (!/^\d+$/.test(value)) {
    throw new ArchiveStorageValidationError(
      'Pagination values must be positive integers'
    )
  }

  const parsedValue = Number(value)
  if (
    !Number.isSafeInteger(parsedValue) ||
    parsedValue < 1 ||
    parsedValue > maximum
  ) {
    throw new ArchiveStorageValidationError(
      `Pagination values must be between 1 and ${maximum}`
    )
  }

  return parsedValue
}

function parseOptionalFilter(
  value: string | null,
  fieldName: string
): string | undefined {
  if (value === null || value.trim().length === 0) {
    return undefined
  }

  const normalized = value.trim()
  if (normalized.length > 120 || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new ArchiveStorageValidationError(`${fieldName} is invalid`)
  }

  return normalized
}

function parseSort(value: string | null): 'newest' | 'oldest' | 'title' {
  if (value === null || value === 'newest') {
    return 'newest'
  }

  if (value === 'oldest' || value === 'title') {
    return value
  }

  throw new ArchiveStorageValidationError('Unsupported sort order')
}

async function readGalleryItems(): Promise<GalleryItem[]> {
  const fileNames = await listArchiveDirectory(galleryDataDirectory())
  const itemIds = fileNames
    .filter(fileName => fileName.endsWith('.json'))
    .map(fileName => fileName.slice(0, -'.json'.length))
    .filter(isSafeArchiveId)

  const records = await Promise.all(
    itemIds.map(async itemId => {
      try {
        return await readJsonFile<unknown>(galleryItemPath(itemId))
      } catch {
        // A damaged record should not make the whole public gallery unavailable.
        console.warn('Skipping unreadable gallery record', { itemId })
        return null
      }
    })
  )

  const durableItems = records.filter(isGalleryItem)
  const legacyItems = await readLegacyGalleryItems()
  const mergedItems = new Map<string, GalleryItem>()

  for (const item of legacyItems) {
    mergedItems.set(item.id, item)
  }

  // Durable records are the source of truth if a migrated item is ever
  // intentionally replaced or moderated after the Coolify cutover.
  for (const item of durableItems) {
    mergedItems.set(item.id, item)
  }

  return [...mergedItems.values()]
}

async function readLegacyGalleryItems(): Promise<GalleryItem[]> {
  let fileNames: string[]

  try {
    fileNames = await readdir(LEGACY_GALLERY_DATA_DIR)
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return []
    }

    throw error
  }

  const records = await Promise.all(
    fileNames
      .filter(
        fileName => fileName.endsWith('.json') && fileName !== 'index.json'
      )
      .filter(fileName => isSafeArchiveId(fileName.slice(0, -'.json'.length)))
      .map(async fileName => {
        try {
          return JSON.parse(
            await readFile(join(LEGACY_GALLERY_DATA_DIR, fileName), 'utf8')
          ) as unknown
        } catch {
          console.warn('Skipping unreadable legacy gallery record', {
            fileName,
          })
          return null
        }
      })
  )

  return records.filter(isGalleryItem)
}

async function publishGalleryAssets(
  item: GalleryItem
): Promise<PublishedGalleryRestoration[]> {
  if (!isSafeArchiveId(item.sessionId)) {
    throw new ArchiveStorageValidationError(
      'Gallery item has no valid restoration session'
    )
  }

  if (!Array.isArray(item.restorations) || item.restorations.length === 0) {
    throw new ArchiveStorageValidationError(
      'Gallery item has no restorations to publish'
    )
  }

  const session = await readRestorationSession(item.sessionId)
  if (!session) {
    throw new ArchiveStorageValidationError('Restoration session was not found')
  }

  const sessionRestorations = new Map(
    session.restorations.map(restoration => [restoration.id, restoration])
  )

  try {
    return await Promise.all(
      item.restorations.map(async (restoration, index) => {
        if (!isRecord(restoration)) {
          throw new ArchiveStorageValidationError(
            'Gallery restoration is invalid'
          )
        }

        const restorationId = assertSafeArchiveId(
          restoration.id,
          'Gallery restoration ID'
        )
        const storedRestoration = sessionRestorations.get(restorationId)
        if (!storedRestoration) {
          throw new ArchiveStorageValidationError(
            'Gallery restoration is not part of its saved session'
          )
        }

        const sourceImage = await readRestorationAsset(
          session.id,
          storedRestoration.fileName
        )
        if (!sourceImage) {
          throw new ArchiveStorageValidationError(
            'Gallery restoration image is no longer available'
          )
        }

        const extension = extname(storedRestoration.fileName)
          .slice(1)
          .toLowerCase()
        if (!['jpg', 'png', 'webp'].includes(extension)) {
          throw new ArchiveStorageValidationError(
            'Gallery restoration has an unsupported image format'
          )
        }

        const fileName = `restoration-${index + 1}.${extension}`
        await writeArchiveFileAtomically(
          galleryPublicAssetPath(item.id, fileName),
          sourceImage
        )

        return {
          id: restorationId,
          name:
            typeof restoration.name === 'string' && restoration.name.length > 0
              ? restoration.name
              : storedRestoration.name,
          imageUrl: `/api/gallery/assets/${item.id}/${fileName}`,
          selected: true,
          fileName,
          mimeType: storedRestoration.mimeType,
        }
      })
    )
  } catch (error) {
    await removeArchiveDirectory(galleryPublicAssetDirectory(item.id)).catch(
      () => undefined
    )
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parsePositiveInteger(searchParams.get('page'), 1, 1_000_000)
    const limit = parsePositiveInteger(
      searchParams.get('limit'),
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    )
    const familyMember = parseOptionalFilter(
      searchParams.get('family'),
      'Family filter'
    )
    const tag = parseOptionalFilter(searchParams.get('tag'), 'Tag filter')
    const sortBy = parseSort(searchParams.get('sort'))

    // Pending contributions must never be disclosed by a public query parameter.
    if (searchParams.get('public') === 'false') {
      return NextResponse.json(
        {
          error:
            'Only public gallery listings are available from this endpoint',
        },
        { status: 400 }
      )
    }

    let filteredItems = (await readGalleryItems()).filter(
      isPublishedForPublicGallery
    )

    if (familyMember) {
      filteredItems = filteredItems.filter(
        item => familyMemberFor(item) === familyMember
      )
    }

    if (tag) {
      filteredItems = filteredItems.filter(item => tagsFor(item).includes(tag))
    }

    filteredItems.sort((left, right) => {
      if (sortBy === 'oldest') {
        return timestampFor(left.submittedAt) - timestampFor(right.submittedAt)
      }

      if (sortBy === 'title') {
        return titleFor(left).localeCompare(titleFor(right))
      }

      return timestampFor(right.submittedAt) - timestampFor(left.submittedAt)
    })

    const total = filteredItems.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const paginatedItems = filteredItems.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      success: true,
      items: paginatedItems.map(item => ({
        id: item.id,
        title: titleFor(item),
        description: descriptionFor(item),
        date: dateFor(item),
        familyMember: familyMemberFor(item),
        tags: tagsFor(item),
        isPublic: item.isPublic,
        submittedAt: item.submittedAt,
        thumbnailUrl: item.thumbnailUrl,
        restorationCount: Array.isArray(item.restorations)
          ? item.restorations.length
          : 0,
      })),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    })
  } catch (error) {
    if (error instanceof ArchiveStorageValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Gallery fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gallery items' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  if (!hasValidAdminBearerToken(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const itemId = assertSafeArchiveId(
      searchParams.get('id'),
      'gallery item id'
    )
    const deleted = await removeArchiveFile(galleryItemPath(itemId))

    if (!deleted) {
      return NextResponse.json(
        { error: 'Gallery item not found' },
        { status: 404 }
      )
    }

    await removeArchiveDirectory(galleryPublicAssetDirectory(itemId))

    return NextResponse.json({
      success: true,
      message: 'Gallery item deleted successfully',
    })
  } catch (error) {
    if (error instanceof ArchiveStorageValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Gallery delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete gallery item' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  if (!hasValidAdminBearerToken(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const itemId = assertSafeArchiveId(
      searchParams.get('id'),
      'gallery item id'
    )
    const body: unknown = await request.json()
    if (!isRecord(body)) {
      throw new ArchiveStorageValidationError(
        'Review request must be an object'
      )
    }

    const status = body.status
    if (status !== 'published' && status !== 'rejected') {
      throw new ArchiveStorageValidationError(
        'Review status must be published or rejected'
      )
    }

    const item = await readJsonFile<unknown>(galleryItemPath(itemId))
    if (!isGalleryItem(item)) {
      return NextResponse.json(
        { error: 'Gallery item not found' },
        { status: 404 }
      )
    }

    const isPublic = status === 'published'
    const reviewedAt = new Date().toISOString()
    const publishedAssets = isPublic ? await publishGalleryAssets(item) : null
    const updatedItem: GalleryItem = {
      ...item,
      isPublic,
      status,
      reviewedAt,
      restorations: publishedAssets ?? item.restorations,
      ...(publishedAssets && publishedAssets.length > 0
        ? { thumbnailUrl: publishedAssets[0].imageUrl }
        : {}),
      metadata: {
        ...metadataFor(item),
        isPublic,
      },
    }

    await writeJsonAtomically(galleryItemPath(itemId), updatedItem)

    return NextResponse.json({
      success: true,
      id: itemId,
      status,
      isPublic,
      reviewedAt,
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

    console.error('Gallery review error:', error)
    return NextResponse.json(
      { error: 'Failed to review gallery item' },
      { status: 500 }
    )
  }
}
