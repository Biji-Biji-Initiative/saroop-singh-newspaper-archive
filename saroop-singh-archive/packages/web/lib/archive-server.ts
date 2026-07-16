import { createHash } from "node:crypto";
import { archiveBucket } from "@/lib/archive-bucket";
import { getDb } from "@/db";
import { archiveImages, restorationRuns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RESTORATION_MODELS } from "@/lib/restoration-contract";

export {
  buildRestorationPrompt,
  RESTORATION_PROMPT_VERSION,
  RESTORATION_RECIPES,
  type RestorationModel,
} from "@/lib/restoration-contract";

export const FAMILY_AI_CONSENT_VERSION = "family-ai-study-v1-2026-07";
export const MODEL_REGISTRY = RESTORATION_MODELS;

export type RasterDimensions = { width: number; height: number };

export const MAX_RESTORATION_ASPECT_RATIO_DRIFT = 0.02;

export function detectSafeRaster(bytes: Uint8Array): { type: "image/jpeg" | "image/png" | "image/webp"; extension: "jpg" | "png" | "webp" } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { type: "image/jpeg", extension: "jpg" };
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return { type: "image/png", extension: "png" };
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.subarray(8, 12)) === "WEBP") return { type: "image/webp", extension: "webp" };
  return null;
}

/**
 * Read dimensions from the format's bounded structural header without decoding
 * pixels. This is deliberately strict: truncated or internally inconsistent
 * files return null and must not be sent to a restoration provider.
 */
export function readSafeRasterDimensions(bytes: Uint8Array): RasterDimensions | null {
  const detected = detectSafeRaster(bytes);
  if (!detected) return null;
  if (detected.type === "image/png") return readPngDimensions(bytes);
  if (detected.type === "image/jpeg") return readJpegDimensions(bytes);
  return readWebpDimensions(bytes);
}

export function validateRestorationAspectRatio(source: Uint8Array, output: Uint8Array) {
  const sourceDimensions = readSafeRasterDimensions(source);
  if (!sourceDimensions) throw new Error("The original image dimensions could not be verified safely.");
  const outputDimensions = readSafeRasterDimensions(output);
  if (!outputDimensions) throw new Error("The restoration output dimensions could not be verified safely.");
  const sourceRatio = sourceDimensions.width / sourceDimensions.height;
  const outputRatio = outputDimensions.width / outputDimensions.height;
  const drift = Math.abs(outputRatio - sourceRatio) / sourceRatio;
  if (!Number.isFinite(drift) || drift > MAX_RESTORATION_ASPECT_RATIO_DRIFT) {
    throw new Error(
      `The restoration changed the source aspect ratio materially (${sourceDimensions.width}x${sourceDimensions.height} to ${outputDimensions.width}x${outputDimensions.height}). The study was rejected before storage.`,
    );
  }
  return { source: sourceDimensions, output: outputDimensions, drift };
}

function dimensions(width: number, height: number): RasterDimensions | null {
  return Number.isSafeInteger(width) && Number.isSafeInteger(height) && width > 0 && height > 0
    ? { width, height }
    : null;
}

function readUint16BE(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint24LE(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function readUint32BE(bytes: Uint8Array, offset: number) {
  return bytes[offset] * 0x1000000 + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
}

function readUint32LE(bytes: Uint8Array, offset: number) {
  return bytes[offset] + bytes[offset + 1] * 0x100 + bytes[offset + 2] * 0x10000 + bytes[offset + 3] * 0x1000000;
}

function readPngDimensions(bytes: Uint8Array) {
  if (bytes.length < 24 || readUint32BE(bytes, 8) !== 13 || new TextDecoder().decode(bytes.subarray(12, 16)) !== "IHDR") return null;
  return dimensions(readUint32BE(bytes, 16), readUint32BE(bytes, 20));
}

function readJpegDimensions(bytes: Uint8Array) {
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return null;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue;
    if (offset + 2 > bytes.length) return null;
    const segmentLength = readUint16BE(bytes, offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;
    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) return null;
      return dimensions(readUint16BE(bytes, offset + 5), readUint16BE(bytes, offset + 3));
    }
    offset += segmentLength;
  }
  return null;
}

function readWebpDimensions(bytes: Uint8Array) {
  if (bytes.length < 20) return null;
  const declaredEnd = readUint32LE(bytes, 4) + 8;
  if (declaredEnd < 20 || declaredEnd > bytes.length) return null;
  let offset = 12;
  while (offset + 8 <= declaredEnd) {
    const chunkType = new TextDecoder().decode(bytes.subarray(offset, offset + 4));
    const chunkLength = readUint32LE(bytes, offset + 4);
    const dataOffset = offset + 8;
    if (!Number.isSafeInteger(chunkLength) || dataOffset + chunkLength > declaredEnd) return null;
    if (chunkType === "VP8X" && chunkLength >= 10) {
      return dimensions(1 + readUint24LE(bytes, dataOffset + 4), 1 + readUint24LE(bytes, dataOffset + 7));
    }
    if (chunkType === "VP8 " && chunkLength >= 10 && bytes[dataOffset + 3] === 0x9d && bytes[dataOffset + 4] === 0x01 && bytes[dataOffset + 5] === 0x2a) {
      const width = (bytes[dataOffset + 6] | (bytes[dataOffset + 7] << 8)) & 0x3fff;
      const height = (bytes[dataOffset + 8] | (bytes[dataOffset + 9] << 8)) & 0x3fff;
      return dimensions(width, height);
    }
    if (chunkType === "VP8L" && chunkLength >= 5 && bytes[dataOffset] === 0x2f) {
      const width = 1 + bytes[dataOffset + 1] + ((bytes[dataOffset + 2] & 0x3f) << 8);
      const height = 1 + (bytes[dataOffset + 2] >> 6) + (bytes[dataOffset + 3] << 2) + ((bytes[dataOffset + 4] & 0x0f) << 10);
      return dimensions(width, height);
    }
    offset = dataOffset + chunkLength + (chunkLength % 2);
  }
  return null;
}

export function detectSafeAudio(bytes: Uint8Array): { type: string; extension: string } | null {
  const head = new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.length, 16)));
  if (bytes.length >= 12 && head.startsWith("RIFF") && head.slice(8, 12) === "WAVE") return { type: "audio/wav", extension: "wav" };
  if (bytes.length >= 4 && head.startsWith("OggS")) return { type: "audio/ogg", extension: "ogg" };
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return { type: "audio/webm", extension: "webm" };
  if (bytes.length >= 3 && (head.startsWith("ID3") || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))) return { type: "audio/mpeg", extension: "mp3" };
  if (bytes.length >= 12 && head.slice(4, 8) === "ftyp") return { type: "audio/mp4", extension: "m4a" };
  return null;
}

export async function sha256Hex(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function bucket() {
  return archiveBucket;
}

export async function getImage(id: string) {
  const rows = await getDb().select().from(archiveImages).where(eq(archiveImages.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getRun(id: string) {
  const rows = await getDb().select().from(restorationRuns).where(eq(restorationRuns.id, id)).limit(1);
  return rows[0] ?? null;
}

export function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

export function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
