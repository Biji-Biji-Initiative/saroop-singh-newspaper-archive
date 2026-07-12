import 'server-only'

export const MAX_ARCHIVE_IMAGE_PIXELS = 100_000_000

export interface ImageDimensions {
  width: number
  height: number
}

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1]
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16)
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1000000 +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  )
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] +
    bytes[offset + 1] * 0x100 +
    bytes[offset + 2] * 0x10000 +
    bytes[offset + 3] * 0x1000000
  )
}

function validDimensions(
  width: number,
  height: number
): ImageDimensions | null {
  return Number.isSafeInteger(width) &&
    Number.isSafeInteger(height) &&
    width > 0 &&
    height > 0
    ? { width, height }
    : null
}

export function isSupportedImage(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    )
  }

  if (mimeType === 'image/png') {
    return (
      bytes.length >= 8 &&
      bytes
        .subarray(0, 8)
        .every(
          (value, index) =>
            value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]
        )
    )
  }

  if (mimeType === 'image/webp') {
    return (
      bytes.length >= 12 &&
      Buffer.from(bytes.subarray(0, 4)).toString('ascii') === 'RIFF' &&
      Buffer.from(bytes.subarray(8, 12)).toString('ascii') === 'WEBP'
    )
  }

  return false
}

function pngDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (
    bytes.length < 24 ||
    readUint32BE(bytes, 8) !== 13 ||
    Buffer.from(bytes.subarray(12, 16)).toString('ascii') !== 'IHDR'
  ) {
    return null
  }

  return validDimensions(readUint32BE(bytes, 16), readUint32BE(bytes, 20))
}

function jpegDimensions(bytes: Uint8Array): ImageDimensions | null {
  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ])
  let offset = 2

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      return null
    }

    while (offset < bytes.length && bytes[offset] === 0xff) {
      offset += 1
    }
    if (offset >= bytes.length) {
      return null
    }

    const marker = bytes[offset++]
    if (marker === 0xd9 || marker === 0xda) {
      return null
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue
    }
    if (offset + 2 > bytes.length) {
      return null
    }

    const segmentLength = readUint16BE(bytes, offset)
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      return null
    }
    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) {
        return null
      }
      return validDimensions(
        readUint16BE(bytes, offset + 5),
        readUint16BE(bytes, offset + 3)
      )
    }

    offset += segmentLength
  }

  return null
}

function webpDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 20) {
    return null
  }

  const declaredEnd = readUint32LE(bytes, 4) + 8
  if (declaredEnd < 20 || declaredEnd > bytes.length) {
    return null
  }

  let offset = 12
  while (offset + 8 <= declaredEnd) {
    const chunkType = Buffer.from(bytes.subarray(offset, offset + 4)).toString(
      'ascii'
    )
    const chunkLength = readUint32LE(bytes, offset + 4)
    const dataOffset = offset + 8
    if (
      !Number.isSafeInteger(chunkLength) ||
      dataOffset + chunkLength > declaredEnd
    ) {
      return null
    }

    if (chunkType === 'VP8X' && chunkLength >= 10) {
      return validDimensions(
        1 + readUint24LE(bytes, dataOffset + 4),
        1 + readUint24LE(bytes, dataOffset + 7)
      )
    }
    if (
      chunkType === 'VP8 ' &&
      chunkLength >= 10 &&
      bytes[dataOffset + 3] === 0x9d &&
      bytes[dataOffset + 4] === 0x01 &&
      bytes[dataOffset + 5] === 0x2a
    ) {
      const width =
        (bytes[dataOffset + 6] | (bytes[dataOffset + 7] << 8)) & 0x3fff
      const height =
        (bytes[dataOffset + 8] | (bytes[dataOffset + 9] << 8)) & 0x3fff
      return validDimensions(width, height)
    }
    if (
      chunkType === 'VP8L' &&
      chunkLength >= 5 &&
      bytes[dataOffset] === 0x2f
    ) {
      const width =
        1 + bytes[dataOffset + 1] + ((bytes[dataOffset + 2] & 0x3f) << 8)
      const height =
        1 +
        (bytes[dataOffset + 2] >> 6) +
        (bytes[dataOffset + 3] << 2) +
        ((bytes[dataOffset + 4] & 0x0f) << 10)
      return validDimensions(width, height)
    }

    offset = dataOffset + chunkLength + (chunkLength % 2)
  }

  return null
}

/**
 * Inspect bounded format headers without decoding pixels. This blocks valid
 * looking image files that would expand into unreasonably large workloads.
 */
export function readSafeImageDimensions(
  bytes: Uint8Array,
  mimeType: string
): ImageDimensions | null {
  if (!isSupportedImage(bytes, mimeType)) {
    return null
  }

  if (mimeType === 'image/png') {
    return pngDimensions(bytes)
  }
  if (mimeType === 'image/jpeg') {
    return jpegDimensions(bytes)
  }
  if (mimeType === 'image/webp') {
    return webpDimensions(bytes)
  }

  return null
}

export function isSafeImageDimensionCount(
  dimensions: ImageDimensions
): boolean {
  return dimensions.width * dimensions.height <= MAX_ARCHIVE_IMAGE_PIXELS
}
