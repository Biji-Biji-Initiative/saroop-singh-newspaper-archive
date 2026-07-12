import 'server-only'

import { randomBytes, timingSafeEqual } from 'node:crypto'
import { readFile } from 'node:fs/promises'

import {
  archiveDataPath,
  assertSafeArchivePathSegment,
  assertUuid,
  galleryItemPath,
  galleryPublicAssetDirectory,
  listArchiveDirectory,
  readJsonFile,
  removeArchiveDirectory,
  removeArchiveFile,
  writeArchiveFileAtomically,
  writeJsonAtomically,
} from '@/lib/archive-storage'
import type { PhotoAnalysis } from '@/lib/photo-analysis'

export const MAX_RESTORATION_UPLOAD_BYTES = 10 * 1024 * 1024
// Leave room for the multipart envelope while rejecting oversized requests
// before Next parses the uploaded file into memory.
export const MAX_RESTORATION_REQUEST_BYTES =
  MAX_RESTORATION_UPLOAD_BYTES + 256 * 1024

const MIME_TYPES_TO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const SESSION_ACCESS_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/
const RESTORATION_SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const DEFAULT_RETENTION_HOURS = 7 * 24
const MAX_CLEANUP_SESSIONS_PER_RUN = 50

export interface StoredRestoration {
  id: string
  name: string
  style: 'archival'
  description: string
  fileName: string
  mimeType: string
}

export interface RestorationSession {
  id: string
  createdAt: string
  accessToken: string
  originalFileName: string
  originalMimeType: string
  photoAnalysis?: PhotoAnalysis
  restorations: StoredRestoration[]
}

export function extensionForImageMimeType(mimeType: string): string | null {
  return MIME_TYPES_TO_EXTENSIONS[mimeType.toLowerCase()] ?? null
}

export function createRestorationSessionAccessToken(): string {
  return randomBytes(32).toString('base64url')
}

function validSessionAccessToken(value: unknown): value is string {
  return typeof value === 'string' && SESSION_ACCESS_TOKEN_PATTERN.test(value)
}

export function hasRestorationSessionAccess(
  session: RestorationSession,
  suppliedToken: unknown
): boolean {
  if (
    !validSessionAccessToken(session.accessToken) ||
    !validSessionAccessToken(suppliedToken)
  ) {
    return false
  }

  const expected = Buffer.from(session.accessToken)
  const actual = Buffer.from(suppliedToken)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function restorationAssetUrl(
  session: RestorationSession,
  fileName: unknown
): string {
  const sessionId = assertUuid(session.id, 'Restoration session ID')
  const safeFileName = assertSafeArchivePathSegment(
    fileName,
    'Restoration filename'
  )

  if (!validSessionAccessToken(session.accessToken)) {
    throw new Error('Restoration session access token is invalid')
  }

  return `/api/restorations/${sessionId}/${safeFileName}?token=${encodeURIComponent(session.accessToken)}`
}

export function restorationSessionDirectory(sessionId: unknown): string {
  return archiveDataPath(
    'restorations',
    assertUuid(sessionId, 'Restoration session ID')
  )
}

function configuredRetentionHours(): number {
  const configured = Number(process.env.RESTORATION_RETENTION_HOURS)
  return Number.isInteger(configured) && configured >= 24 && configured <= 720
    ? configured
    : DEFAULT_RETENTION_HOURS
}

function isPublishedGalleryRecord(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    ((value as Record<string, unknown>).status === 'published' ||
      (value as Record<string, unknown>).isPublic === true)
  )
}

/**
 * Remove expired private originals and restoration outputs. Published gallery
 * derivatives are copied into their own durable path and therefore survive;
 * unreviewed or rejected contribution records expire with their private
 * session so uploads do not accumulate indefinitely.
 */
export async function purgeExpiredRestorationSessions(): Promise<number> {
  const cutoff = Date.now() - configuredRetentionHours() * 60 * 60 * 1_000
  const sessionIds = (
    await listArchiveDirectory(archiveDataPath('restorations'))
  )
    .filter(sessionId => RESTORATION_SESSION_ID_PATTERN.test(sessionId))
    .sort()
    .slice(0, MAX_CLEANUP_SESSIONS_PER_RUN)
  let removed = 0

  for (const sessionId of sessionIds) {
    const session = await readRestorationSession(sessionId)
    const createdAt = session ? Date.parse(session.createdAt) : Number.NaN
    if (Number.isFinite(createdAt) && createdAt > cutoff) {
      continue
    }

    const galleryId = `gallery-${sessionId}`
    const galleryRecord = await readJsonFile<unknown>(
      galleryItemPath(galleryId)
    )
    if (!isPublishedGalleryRecord(galleryRecord)) {
      await removeArchiveFile(galleryItemPath(galleryId))
      await removeArchiveDirectory(galleryPublicAssetDirectory(galleryId))
    }

    await removeArchiveDirectory(restorationSessionDirectory(sessionId))
    removed += 1
  }

  return removed
}

export function restorationAssetPath(
  sessionId: unknown,
  fileName: unknown
): string {
  return archiveDataPath(
    'restorations',
    assertUuid(sessionId, 'Restoration session ID'),
    assertSafeArchivePathSegment(fileName, 'Restoration filename')
  )
}

export function restorationSessionMetadataPath(sessionId: unknown): string {
  return restorationAssetPath(sessionId, 'session.json')
}

export async function writeRestorationAsset(
  sessionId: unknown,
  fileName: unknown,
  contents: Buffer
): Promise<void> {
  await writeArchiveFileAtomically(
    restorationAssetPath(sessionId, fileName),
    contents
  )
}

export async function readRestorationAsset(
  sessionId: unknown,
  fileName: unknown
): Promise<Buffer | null> {
  try {
    return await readFile(restorationAssetPath(sessionId, fileName))
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return null
    }

    throw error
  }
}

export async function readRestorationSession(
  sessionId: unknown
): Promise<RestorationSession | null> {
  return readJsonFile<RestorationSession>(
    restorationSessionMetadataPath(sessionId)
  )
}

export async function writeRestorationSession(
  session: RestorationSession
): Promise<void> {
  await writeJsonAtomically(restorationSessionMetadataPath(session.id), session)
}
