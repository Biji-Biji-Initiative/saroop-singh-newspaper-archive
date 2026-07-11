import { readFile } from 'node:fs/promises'

import { NextResponse } from 'next/server'

import {
  ArchiveStorageValidationError,
  assertSafeArchiveId,
  assertSafeArchivePathSegment,
  galleryItemPath,
  galleryPublicAssetPath,
  readJsonFile,
} from '@/lib/archive-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PublicGalleryAsset {
  fileName?: unknown
  imageUrl?: unknown
  mimeType?: unknown
}

interface PublishedGalleryItem {
  isPublic?: unknown
  status?: unknown
  restorations?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function publicAssetForFileName(
  item: PublishedGalleryItem,
  galleryId: string,
  fileName: string
): PublicGalleryAsset | null {
  if (item.isPublic !== true || item.status !== 'published') {
    return null
  }

  if (!Array.isArray(item.restorations)) {
    return null
  }

  const expectedUrl = `/api/gallery/assets/${galleryId}/${fileName}`
  const asset = item.restorations.find(
    (restoration): restoration is PublicGalleryAsset =>
      isRecord(restoration) &&
      restoration.fileName === fileName &&
      restoration.imageUrl === expectedUrl
  )

  return asset ?? null
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ galleryId: string; fileName: string }> }
) {
  try {
    const { galleryId: rawGalleryId, fileName: rawFileName } =
      await context.params
    const galleryId = assertSafeArchiveId(rawGalleryId, 'gallery item id')
    const fileName = assertSafeArchivePathSegment(
      rawFileName,
      'gallery asset filename'
    )
    const item = await readJsonFile<PublishedGalleryItem>(
      galleryItemPath(galleryId)
    )
    const asset = item && publicAssetForFileName(item, galleryId, fileName)

    if (!asset || typeof asset.mimeType !== 'string') {
      return NextResponse.json(
        { error: 'Gallery image not found' },
        { status: 404 }
      )
    }

    const image = await readFile(galleryPublicAssetPath(galleryId, fileName))
    return new NextResponse(Uint8Array.from(image), {
      headers: {
        'Content-Type': asset.mimeType,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    if (error instanceof ArchiveStorageValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return NextResponse.json(
        { error: 'Gallery image not found' },
        { status: 404 }
      )
    }

    console.error('Gallery asset read error', error)
    return NextResponse.json(
      { error: 'Unable to load this gallery image.' },
      { status: 500 }
    )
  }
}
