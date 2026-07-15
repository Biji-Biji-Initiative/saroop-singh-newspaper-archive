import "server-only";

import { readFile } from "node:fs/promises";
import { basename, relative, resolve, sep } from "node:path";
import { and, eq } from "drizzle-orm";
import extendedFamily from "@/data/gallery/gemini-extended-family-portrait-1970s-group.json";
import extendedIndianFamily from "@/data/gallery/gemini-extended-indian-family-group-portrait-1970s-formal.json";
import youngManPortrait from "@/data/gallery/gemini-portrait-of-a-young-man-in-a-turban-vintage-monochrome.json";
import sardarAndSardarni from "@/data/gallery/gemini-sardar-and-sardarni-india-1950s-portrait.json";
import saroopRunningOne from "@/data/gallery/gemini-saroop-singh-running1.json";
import saroopRunningTwo from "@/data/gallery/gemini-saroop-singh-running2.json";
import sikhCouple from "@/data/gallery/gemini-sikh-couple-portrait-1980s-family-photo.json";
import { getDb } from "@/db";
import { archiveEvents, archiveImages, restorationRuns } from "@/db/schema";
import {
  bucket,
  detectSafeRaster,
  readSafeRasterDimensions,
  sha256Hex,
} from "@/lib/archive-server";

type ImportedStudy = {
  id: string;
  type: string;
  url: string;
  createdAt?: string;
};

type ImportedImage = {
  id: string;
  title: string;
  date?: string;
  submittedAt: string;
  metadata?: {
    title?: string;
    date?: string;
    dateConfidence?: string;
    sourceType?: string;
    familyMember?: string;
    tags?: string[];
    description?: string;
  };
  originalImageUrl: string;
  restorations?: ImportedStudy[];
};

type ImportedAsset = {
  url: string;
  filename: string;
  key: string;
  bytes: Uint8Array;
  sha256: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  width: number;
  height: number;
};

export type CanonicalGalleryImportResult = {
  imagesCreated: number;
  imagesAlreadyPresent: number;
  historicalStudiesCreated: number;
  historicalStudiesAlreadyPresent: number;
  objectsWritten: number;
  objectsAlreadyPresent: number;
};

const images: ImportedImage[] = [
  extendedFamily,
  extendedIndianFamily,
  youngManPortrait,
  sardarAndSardarni,
  saroopRunningOne,
  saroopRunningTwo,
  sikhCouple,
];

const importActor = "canonical-archive-import";
const importSchema = "canonical-archive-import/v1";
const publicRoot = resolve(process.cwd(), "public");

function publicAssetPath(url: string): string {
  if (!url.startsWith("/gallery-images/")) {
    throw new Error(`The import source references an unexpected public path: ${url}`);
  }
  const path = resolve(publicRoot, url.slice(1));
  const pathWithinPublicRoot = relative(publicRoot, path);
  if (
    !pathWithinPublicRoot ||
    pathWithinPublicRoot === ".." ||
    pathWithinPublicRoot.startsWith(`..${sep}`)
  ) {
    throw new Error(`The import source escapes the public asset directory: ${url}`);
  }
  return path;
}

async function readImportedAsset(url: string, category: "originals" | "historical-studies"): Promise<ImportedAsset> {
  const bytes = new Uint8Array(await readFile(publicAssetPath(url)));
  const detected = detectSafeRaster(bytes);
  const dimensions = readSafeRasterDimensions(bytes);
  if (!detected || !dimensions) {
    throw new Error(`The import source is not a safe raster image: ${url}`);
  }
  const sha256 = await sha256Hex(bytes);
  return {
    url,
    filename: basename(url),
    key: `${category}/sha256/${sha256}.${detected.extension}`,
    bytes,
    sha256,
    contentType: detected.type,
    width: dimensions.width,
    height: dimensions.height,
  };
}

async function persistObject(asset: ImportedAsset, metadata: Record<string, string>): Promise<"written" | "present"> {
  const stored = await bucket().get(asset.key);
  if (stored) {
    const storedHash = await sha256Hex(stored.body);
    if (storedHash !== asset.sha256) {
      throw new Error(`Object storage contains conflicting bytes for ${asset.key}.`);
    }
    return "present";
  }

  const written = await bucket().put(asset.key, asset.bytes, {
    onlyIf: { etagDoesNotMatch: "*" },
    httpMetadata: { contentType: asset.contentType },
    customMetadata: metadata,
  });
  if (written) return "written";

  const raced = await bucket().get(asset.key);
  if (!raced || (await sha256Hex(raced.body)) !== asset.sha256) {
    throw new Error(`Object storage did not retain the expected bytes for ${asset.key}.`);
  }
  return "present";
}

function details(image: ImportedImage) {
  return {
    title: image.metadata?.title || image.title,
    description:
      image.metadata?.description ||
      "A surviving photograph from the Saroop Singh family collection.",
    people: image.metadata?.familyMember || "People not yet identified",
    estimatedDate: image.metadata?.date || image.date || null,
    tags: image.metadata?.tags || [],
    sourceProvenance:
      image.metadata?.sourceType || "Best available digital source; physical-original relationship not recorded.",
    dateConfidence: image.metadata?.dateConfidence || "unknown",
  };
}

async function sourceAssets(image: ImportedImage) {
  const original = await readImportedAsset(image.originalImageUrl, "originals");
  const studies = await Promise.all(
    (image.restorations || []).map(async study => ({
      study,
      asset: await readImportedAsset(study.url, "historical-studies"),
    })),
  );
  return { image, original, studies };
}

function sameOriginal(
  existing: typeof archiveImages.$inferSelect,
  original: ImportedAsset,
) {
  return (
    existing.originalSha256 === original.sha256 &&
    existing.originalKey === original.key &&
    existing.originalBytes === original.bytes.byteLength &&
    existing.originalType === original.contentType
  );
}

function sameHistoricalStudy(
  existing: typeof restorationRuns.$inferSelect,
  imageId: string,
  study: ImportedStudy,
  asset: ImportedAsset,
) {
  return (
    existing.imageId === imageId &&
    existing.outputKey === asset.key &&
    existing.outputSha256 === asset.sha256 &&
    existing.status === "ready" &&
    existing.reviewStatus === "unreviewed"
  );
}

/**
 * Imports the recovered public corpus once into the archive's normal media,
 * image, restoration, and event records. It is idempotent by stable IDs and
 * content hashes; any conflicting record or object aborts without mutation.
 */
export async function importCanonicalGallery(): Promise<CanonicalGalleryImportResult> {
  const prepared = await Promise.all(images.map(sourceAssets));
  const ids = new Set<string>();
  const sourceHashes = new Set<string>();
  const studyIds = new Set<string>();
  for (const entry of prepared) {
    if (!ids.add(entry.image.id)) throw new Error(`The import source repeats image ID ${entry.image.id}.`);
    if (!sourceHashes.add(entry.original.sha256)) throw new Error(`The import source repeats original image bytes for ${entry.image.id}.`);
    for (const { study } of entry.studies) {
      if (!studyIds.add(study.id)) throw new Error(`The import source repeats study ID ${study.id}.`);
    }
  }

  const db = getDb();
  for (const entry of prepared) {
    const existingById = db
      .select()
      .from(archiveImages)
      .where(eq(archiveImages.id, entry.image.id))
      .get();
    if (existingById && !sameOriginal(existingById, entry.original)) {
      throw new Error(`Archive image ${entry.image.id} conflicts with the import source.`);
    }
    const existingByHash = db
      .select()
      .from(archiveImages)
      .where(eq(archiveImages.originalSha256, entry.original.sha256))
      .get();
    if (existingByHash && existingByHash.id !== entry.image.id) {
      throw new Error(`Source bytes for ${entry.image.id} already belong to ${existingByHash.id}.`);
    }
    for (const { study, asset } of entry.studies) {
      const existingStudy = db
        .select()
        .from(restorationRuns)
        .where(eq(restorationRuns.id, study.id))
        .get();
      if (existingStudy && !sameHistoricalStudy(existingStudy, entry.image.id, study, asset)) {
        throw new Error(`Historical study ${study.id} conflicts with the import source.`);
      }
    }
  }

  const result: CanonicalGalleryImportResult = {
    imagesCreated: 0,
    imagesAlreadyPresent: 0,
    historicalStudiesCreated: 0,
    historicalStudiesAlreadyPresent: 0,
    objectsWritten: 0,
    objectsAlreadyPresent: 0,
  };

  for (const entry of prepared) {
    const originalOutcome = await persistObject(entry.original, {
      contentRole: "original-source",
      importedBy: importActor,
      sha256: entry.original.sha256,
      sourceFilename: entry.original.filename,
    });
    result[originalOutcome === "written" ? "objectsWritten" : "objectsAlreadyPresent"] += 1;
    for (const { asset, study } of entry.studies) {
      const studyOutcome = await persistObject(asset, {
        contentRole: "historical-study",
        importedBy: importActor,
        sha256: asset.sha256,
        sourceFilename: asset.filename,
        sourceStudyId: study.id,
      });
      result[studyOutcome === "written" ? "objectsWritten" : "objectsAlreadyPresent"] += 1;
    }
  }

  db.transaction(transaction => {
    for (const entry of prepared) {
      const existing = transaction
        .select()
        .from(archiveImages)
        .where(eq(archiveImages.id, entry.image.id))
        .get();
      if (existing) {
        result.imagesAlreadyPresent += 1;
      } else {
        const metadata = details(entry.image);
        transaction
          .insert(archiveImages)
          .values({
            id: entry.image.id,
            title: metadata.title,
            description: metadata.description,
            people: metadata.people,
            estimatedDate: metadata.estimatedDate,
            tags: JSON.stringify(metadata.tags),
            rights: "Copyright status and reuse rights are not yet determined.",
            originalKey: entry.original.key,
            originalName: entry.original.filename,
            originalType: entry.original.contentType,
            originalBytes: entry.original.bytes.byteLength,
            originalSha256: entry.original.sha256,
            originalWidth: entry.original.width,
            originalHeight: entry.original.height,
            sourceProvenance: metadata.sourceProvenance,
            dateConfidence: metadata.dateConfidence,
            status: "published",
            createdBy: importActor,
            createdAt: entry.image.submittedAt,
            publishedAt: entry.image.submittedAt,
          })
          .run();
        transaction
          .insert(archiveEvents)
          .values({
            id: `${importSchema}:${entry.image.id}`,
            imageId: entry.image.id,
            eventType: "archive:imported",
            actor: importActor,
            detail: JSON.stringify({
              schema: importSchema,
              originalSha256: entry.original.sha256,
              originalBytes: entry.original.bytes.byteLength,
              historicalStudyCount: entry.studies.length,
            }),
            createdAt: entry.image.submittedAt,
          })
          .run();
        result.imagesCreated += 1;
      }

      for (const { study, asset } of entry.studies) {
        const existingStudy = transaction
          .select()
          .from(restorationRuns)
          .where(and(eq(restorationRuns.id, study.id), eq(restorationRuns.imageId, entry.image.id)))
          .get();
        if (existingStudy) {
          result.historicalStudiesAlreadyPresent += 1;
          continue;
        }
        transaction
          .insert(restorationRuns)
          .values({
            id: study.id,
            imageId: entry.image.id,
            provider: "historical-import",
            model: "not-recorded",
            recipe: `historical-${study.type}`,
            prompt: "The original request was not retained with this archival derivative.",
            outputKey: asset.key,
            outputType: asset.contentType,
            outputSha256: asset.sha256,
            interventionClass: "historical-study",
            promptVersion: "not-recorded",
            reviewStatus: "unreviewed",
            status: "ready",
            createdBy: importActor,
            createdAt: study.createdAt || entry.image.submittedAt,
          })
          .run();
        result.historicalStudiesCreated += 1;
      }
    }
  });

  return result;
}
