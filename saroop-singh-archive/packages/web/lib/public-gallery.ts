import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { getDb } from "@/db";
import { archiveImages, restorationRuns } from "@/db/schema";
import {
  loadPublishedIdentityTags,
  publicPeopleLabel,
  type PublicIdentityTag,
} from "@/lib/public-identifications";

export type PublicGalleryStudy = {
  id: string;
  type: string;
  url: string;
  provider: string;
  model: string;
  recipe: string;
  interventionClass: string;
  promptVersion: string;
  createdAt: string;
  reviewedAt: string | null;
  outputSha256: string | null;
};

export type PublicGalleryRecord = {
  id: string;
  title: string;
  date?: string;
  familyMember?: string;
  description: string;
  rights: string;
  sourceProvenance: string;
  originalImageUrl: string;
  original: {
    filename: string;
    bytes: number;
    mimeType: string;
    sha256?: string | null;
    width?: number | null;
    height?: number | null;
  };
  dateConfidence: string;
  tags: string[];
  submittedAt: string;
  studies: PublicGalleryStudy[];
  identityTags: PublicIdentityTag[];
  hasIiifManifest: boolean;
};

function mediaUrl(key: string) {
  return `/api/media/${encodeURIComponent(key)}`;
}

function parseTags(value: string): string[] {
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.some(tag => typeof tag !== "string")) {
    throw new Error("Archive image tags are invalid.");
  }
  return parsed;
}

/** Public labels describe historical intent without leaking provider internals. */
export function publicStudyLabel(recipe: string) {
  switch (recipe) {
    case "conservative":
      return "Clean & preserve";
    case "structural":
      return "Damage repair";
    case "colourResearch":
      return "Colour interpretation";
    case "clarity":
      return "Clarity study";
    default:
      return "Approved restoration study";
  }
}

/**
 * The public gallery has one authority: published archive records and their
 * approved, explicitly published derivatives in the persistent archive.
 */
export async function listPublicGalleryRecords(): Promise<PublicGalleryRecord[]> {
  const db = getDb();
  const images = await db
    .select()
    .from(archiveImages)
    .where(and(eq(archiveImages.status, "published"), isNotNull(archiveImages.publishedAt)))
    .orderBy(desc(archiveImages.publishedAt), desc(archiveImages.createdAt));
  if (!images.length) return [];

  const imageIds = images.map(image => image.id);
  const [runs, identityTags] = await Promise.all([
    db
      .select()
      .from(restorationRuns)
      .where(
        and(
          inArray(restorationRuns.imageId, imageIds),
          eq(restorationRuns.status, "ready"),
          eq(restorationRuns.reviewStatus, "approved"),
          isNotNull(restorationRuns.outputKey),
          isNotNull(restorationRuns.publishedAt),
        ),
      ),
    loadPublishedIdentityTags(imageIds),
  ]);
  const identitiesBySubject = new Map<string, PublicIdentityTag[]>();
  for (const identity of identityTags) {
    const current = identitiesBySubject.get(identity.subjectId) || [];
    current.push(identity);
    identitiesBySubject.set(identity.subjectId, current);
  }

  const runsByImage = new Map<string, typeof runs>();
  for (const run of runs) {
    const current = runsByImage.get(run.imageId) || [];
    current.push(run);
    runsByImage.set(run.imageId, current);
  }

  return images.map(image => {
    const identityTagsForImage = identitiesBySubject.get(image.id) || [];
    const studies = (runsByImage.get(image.id) || [])
      .filter(run => run.outputKey === image.publishedKey)
      .map(run => ({
        id: run.id,
        type: publicStudyLabel(run.recipe),
        url: mediaUrl(run.outputKey!),
        provider: run.provider,
        model: run.model,
        recipe: run.recipe,
        interventionClass: run.interventionClass,
        promptVersion: run.promptVersion,
        createdAt: run.createdAt,
        reviewedAt: run.reviewedAt,
        outputSha256: run.outputSha256,
      }));
    return {
      id: image.id,
      title: image.title,
      date: image.estimatedDate || undefined,
      familyMember: publicPeopleLabel(image.people, identityTagsForImage),
      description: image.description,
      rights: image.rights,
      sourceProvenance: image.sourceProvenance,
      originalImageUrl: mediaUrl(image.originalKey),
      original: {
        filename: image.originalName,
        bytes: image.originalBytes,
        mimeType: image.originalType,
        sha256: image.originalSha256,
        width: image.originalWidth,
        height: image.originalHeight,
      },
      dateConfidence: image.dateConfidence,
      tags: parseTags(image.tags),
      submittedAt: image.publishedAt!,
      studies,
      identityTags: identityTagsForImage,
      hasIiifManifest: image.originalWidth !== null && image.originalHeight !== null,
    };
  });
}

export async function getPublicGalleryRecord(id: string): Promise<PublicGalleryRecord | null> {
  const records = await listPublicGalleryRecords();
  return records.find(record => record.id === id) || null;
}
