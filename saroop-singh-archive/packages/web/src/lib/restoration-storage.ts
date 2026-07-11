import 'server-only'

import { randomBytes, timingSafeEqual } from 'node:crypto'
import { readFile } from 'node:fs/promises'

import {
  archiveDataPath,
  assertSafeArchivePathSegment,
  assertUuid,
  readJsonFile,
  writeArchiveFileAtomically,
  writeJsonAtomically,
} from '@/lib/archive-storage'

export const MAX_RESTORATION_UPLOAD_BYTES = 10 * 1024 * 1024

const MIME_TYPES_TO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const SESSION_ACCESS_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/

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
