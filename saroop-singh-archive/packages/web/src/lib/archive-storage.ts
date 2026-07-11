import 'server-only'

import { randomUUID } from 'node:crypto'
import {
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  unlink,
} from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'

const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/
const SAFE_PATH_SEGMENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const configuredArchiveDataDir = process.env.ARCHIVE_DATA_DIR?.trim()

/**
 * Persistent server-side archive data. Production deployments must mount this
 * path to durable storage through ARCHIVE_DATA_DIR; the local fallback keeps
 * development data outside Next's public output directory.
 */
export const ARCHIVE_DATA_DIR = resolve(
  configuredArchiveDataDir || join(process.cwd(), 'archive-data')
)

export class ArchiveStorageValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ArchiveStorageValidationError'
  }
}

export function isSafeArchiveId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ID_PATTERN.test(value)
}

export function assertSafeArchiveId(value: unknown, fieldName = 'id'): string {
  if (!isSafeArchiveId(value)) {
    throw new ArchiveStorageValidationError(
      `${fieldName} must use only letters, numbers, underscores, and hyphens`
    )
  }

  return value
}

export function assertUuid(value: unknown, fieldName = 'id'): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new ArchiveStorageValidationError(`${fieldName} must be a UUID`)
  }

  return value.toLowerCase()
}

export function assertSafeArchivePathSegment(
  value: unknown,
  fieldName = 'path segment'
): string {
  if (
    typeof value !== 'string' ||
    !SAFE_PATH_SEGMENT_PATTERN.test(value) ||
    value === '.' ||
    value === '..'
  ) {
    throw new ArchiveStorageValidationError(`${fieldName} is invalid`)
  }

  return value
}

function assertPathInsideArchiveDataDir(candidatePath: string): string {
  const resolvedPath = resolve(candidatePath)
  const relativePath = relative(ARCHIVE_DATA_DIR, resolvedPath)

  if (
    relativePath.length === 0 ||
    relativePath === '..' ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new ArchiveStorageValidationError(
      'Archive path must remain inside ARCHIVE_DATA_DIR'
    )
  }

  return resolvedPath
}

/** Construct an archive path from allowlisted path segments only. */
export function archiveDataPath(...segments: string[]): string {
  if (segments.length === 0) {
    throw new ArchiveStorageValidationError(
      'At least one archive path segment is required'
    )
  }

  return assertPathInsideArchiveDataDir(
    resolve(
      ARCHIVE_DATA_DIR,
      ...segments.map(segment => assertSafeArchivePathSegment(segment))
    )
  )
}

export function galleryDataDirectory(): string {
  return archiveDataPath('gallery')
}

export function galleryItemPath(itemId: unknown): string {
  const safeItemId = assertSafeArchiveId(itemId, 'gallery item id')
  return archiveDataPath('gallery', `${safeItemId}.json`)
}

export function galleryPublicAssetDirectory(itemId: unknown): string {
  return archiveDataPath(
    'gallery-public',
    assertSafeArchiveId(itemId, 'gallery item id')
  )
}

export function galleryPublicAssetPath(
  itemId: unknown,
  fileName: unknown
): string {
  return archiveDataPath(
    'gallery-public',
    assertSafeArchiveId(itemId, 'gallery item id'),
    assertSafeArchivePathSegment(fileName, 'gallery asset filename')
  )
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  )
}

async function syncDirectory(directoryPath: string): Promise<void> {
  const directoryHandle = await open(directoryPath, 'r')
  try {
    await directoryHandle.sync()
  } finally {
    await directoryHandle.close()
  }
}

/** Read a JSON record, returning null only when it has not been created yet. */
export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  const safePath = assertPathInsideArchiveDataDir(filePath)

  try {
    return JSON.parse(await readFile(safePath, 'utf8')) as T
  } catch (error) {
    if (isMissingFileError(error)) {
      return null
    }

    throw error
  }
}

/** List a server-side archive directory without exposing missing-directory errors. */
export async function listArchiveDirectory(
  directoryPath: string
): Promise<string[]> {
  const safePath = assertPathInsideArchiveDataDir(directoryPath)

  try {
    return await readdir(safePath)
  } catch (error) {
    if (isMissingFileError(error)) {
      return []
    }

    throw error
  }
}

/**
 * Write JSON through a same-directory temporary file and atomic rename so a
 * crash never leaves a partially written gallery record at its final path.
 */
export async function writeJsonAtomically(
  filePath: string,
  value: unknown
): Promise<void> {
  const safePath = assertPathInsideArchiveDataDir(filePath)
  const directoryPath = dirname(safePath)
  const serialized = JSON.stringify(value, null, 2)

  if (serialized === undefined) {
    throw new ArchiveStorageValidationError(
      'Value cannot be serialized as JSON'
    )
  }

  await mkdir(directoryPath, { recursive: true })

  const temporaryPath = resolve(
    directoryPath,
    `.${process.pid}-${randomUUID()}.tmp`
  )
  let handle: Awaited<ReturnType<typeof open>> | undefined

  try {
    handle = await open(temporaryPath, 'wx', 0o600)
    await handle.writeFile(`${serialized}\n`, 'utf8')
    await handle.sync()
    await handle.close()
    handle = undefined

    await rename(temporaryPath, safePath)

    // Persist the rename itself on filesystems that support directory fsync.
    await syncDirectory(directoryPath)
  } catch (error) {
    await handle?.close().catch(() => undefined)
    await unlink(temporaryPath).catch(() => undefined)
    throw error
  }
}

/** Write binary content atomically, using the same durability semantics as JSON. */
export async function writeArchiveFileAtomically(
  filePath: string,
  contents: Uint8Array
): Promise<void> {
  const safePath = assertPathInsideArchiveDataDir(filePath)
  const directoryPath = dirname(safePath)

  await mkdir(directoryPath, { recursive: true })

  const temporaryPath = resolve(
    directoryPath,
    `.${process.pid}-${randomUUID()}.tmp`
  )
  let handle: Awaited<ReturnType<typeof open>> | undefined

  try {
    handle = await open(temporaryPath, 'wx', 0o600)
    await handle.writeFile(contents)
    await handle.sync()
    await handle.close()
    handle = undefined

    await rename(temporaryPath, safePath)
    await syncDirectory(directoryPath)
  } catch (error) {
    await handle?.close().catch(() => undefined)
    await unlink(temporaryPath).catch(() => undefined)
    throw error
  }
}

/** Remove an already-resolved archive file, reporting whether it existed. */
export async function removeArchiveFile(filePath: string): Promise<boolean> {
  const safePath = assertPathInsideArchiveDataDir(filePath)

  try {
    await unlink(safePath)
    await syncDirectory(dirname(safePath))
    return true
  } catch (error) {
    if (isMissingFileError(error)) {
      return false
    }

    throw error
  }
}

/** Remove a generated archive directory and all of its children safely. */
export async function removeArchiveDirectory(
  directoryPath: string
): Promise<boolean> {
  const safePath = assertPathInsideArchiveDataDir(directoryPath)

  try {
    await rm(safePath, { recursive: true, force: false })
    await syncDirectory(dirname(safePath))
    return true
  } catch (error) {
    if (isMissingFileError(error)) {
      return false
    }

    throw error
  }
}
