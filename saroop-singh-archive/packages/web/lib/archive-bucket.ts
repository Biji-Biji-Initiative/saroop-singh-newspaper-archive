import "server-only";

import { createHash, randomUUID } from "node:crypto";
import {
  access,
  mkdir,
  open,
  readFile,
  rename,
  rm,
  stat,
  unlink,
} from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { ARCHIVE_DATA_DIR } from "@/db";

const OBJECT_ROOT = resolve(
  /* turbopackIgnore: true */ ARCHIVE_DATA_DIR,
  "objects",
);
const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,255}$/;

type PutOptions = {
  onlyIf?: { etagDoesNotMatch?: string };
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
};

type StoredMetadata = {
  contentType: string;
  customMetadata: Record<string, string>;
  etag: string;
  bytes: number;
  storedAt: string;
};

export type ArchiveObject = {
  body: Uint8Array;
  httpEtag: string;
  httpMetadata: { contentType: string };
  customMetadata: Record<string, string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  writeHttpMetadata(headers: Headers): void;
};

function objectPath(key: string): string {
  const segments = key.split("/");
  if (
    segments.length === 0 ||
    segments.some(
      segment =>
        !SAFE_SEGMENT.test(segment) ||
        segment === "." ||
        segment === "..",
    )
  ) {
    throw new Error("Archive object key is invalid.");
  }

  const candidate = resolve(
    /* turbopackIgnore: true */ OBJECT_ROOT,
    ...segments,
  );
  const relativePath = relative(OBJECT_ROOT, candidate);
  if (
    !relativePath ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new Error("Archive object key escapes the storage root.");
  }
  return candidate;
}

function metadataPath(path: string): string {
  return `${path}.archive-metadata.json`;
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
}

async function atomicWrite(path: string, bytes: Uint8Array | string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = resolve(
    /* turbopackIgnore: true */ dirname(path),
    `.${process.pid}-${randomUUID()}.tmp`,
  );
  let handle: Awaited<ReturnType<typeof open>> | undefined;

  try {
    handle = await open(temporary, "wx", 0o600);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporary, path);
  } catch (error) {
    await handle?.close().catch(() => undefined);
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

function digest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function isStoredMetadata(value: unknown): value is StoredMetadata {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const metadata = value as Record<string, unknown>;
  return (
    typeof metadata.contentType === "string" &&
    metadata.contentType.length > 0 &&
    typeof metadata.etag === "string" &&
    /^[a-f0-9]{64}$/.test(metadata.etag) &&
    typeof metadata.bytes === "number" &&
    Number.isSafeInteger(metadata.bytes) &&
    metadata.bytes >= 0 &&
    typeof metadata.storedAt === "string" &&
    Number.isFinite(Date.parse(metadata.storedAt)) &&
    typeof metadata.customMetadata === "object" &&
    metadata.customMetadata !== null &&
    !Array.isArray(metadata.customMetadata) &&
    Object.values(metadata.customMetadata).every(value => typeof value === "string")
  );
}

export const archiveBucket = {
  async get(key: string): Promise<ArchiveObject | null> {
    const path = objectPath(key);
    let contents: Buffer;
    try {
      contents = await readFile(path);
    } catch (error) {
      if (isMissing(error)) return null;
      throw error;
    }
    const metadataContents = await readFile(metadataPath(path), "utf8");
    let parsedMetadata: unknown;
    try {
      parsedMetadata = JSON.parse(metadataContents);
    } catch {
      throw new Error(`Archive object metadata is not valid JSON for ${key}.`);
    }
    if (!isStoredMetadata(parsedMetadata)) {
      throw new Error(`Archive object metadata is invalid for ${key}.`);
    }
    const metadata = parsedMetadata;
    if (
      metadata.bytes !== contents.byteLength ||
      metadata.etag !== digest(contents)
    ) {
      throw new Error(`Archive object metadata is invalid for ${key}.`);
    }
    const body = new Uint8Array(contents);

    return {
      body,
      httpEtag: `"${metadata.etag}"`,
      httpMetadata: { contentType: metadata.contentType },
      customMetadata: metadata.customMetadata,
      async arrayBuffer() {
        return body.buffer.slice(
          body.byteOffset,
          body.byteOffset + body.byteLength,
        ) as ArrayBuffer;
      },
      writeHttpMetadata(headers: Headers) {
        headers.set("content-type", metadata.contentType);
      },
    };
  },

  async put(
    key: string,
    value: Uint8Array | ArrayBuffer,
    options: PutOptions = {},
  ): Promise<{ key: string; etag: string } | null> {
    const path = objectPath(key);
    if (
      options.onlyIf?.etagDoesNotMatch === "*" &&
      (await exists(path))
    ) {
      return null;
    }

    const bytes =
      value instanceof Uint8Array ? value : new Uint8Array(value);
    const etag = digest(bytes);
    const metadata: StoredMetadata = {
      contentType: options.httpMetadata?.contentType || "application/octet-stream",
      customMetadata: options.customMetadata || {},
      etag,
      bytes: bytes.byteLength,
      storedAt: new Date().toISOString(),
    };

    await atomicWrite(path, bytes);
    await atomicWrite(metadataPath(path), `${JSON.stringify(metadata, null, 2)}\n`);
    return { key, etag };
  },

  async delete(key: string): Promise<void> {
    const path = objectPath(key);
    await Promise.all([
      rm(path, { force: true }),
      rm(metadataPath(path), { force: true }),
    ]);
  },
};

export async function verifyObjectStorageWritable(): Promise<boolean> {
  const key = `health/${randomUUID()}.txt`;
  const bytes = new TextEncoder().encode("ok");
  await archiveBucket.put(key, bytes, {
    httpMetadata: { contentType: "text/plain; charset=utf-8" },
  });
  const stored = await archiveBucket.get(key);
  await archiveBucket.delete(key);
  return Boolean(stored && (await stat(OBJECT_ROOT)).isDirectory());
}
