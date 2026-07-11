import { and, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/db";
import { archiveImages, restorationRuns } from "@/db/schema";
import { getLegacyCollection } from "@/lib/legacy-gallery";

export type PublicGalleryStudy = {
  id: string;
  type: string;
  url: string;
};

export type PublicGalleryRecord = {
  id: string;
  title: string;
  date?: string;
  familyMember?: string;
  description: string;
  rights: string;
  originalImageUrl: string;
  original: {
    filename: string;
    bytes: number;
    mimeType: string;
    sha256?: string | null;
  };
  dateConfidence: string;
  studies: PublicGalleryStudy[];
  isLegacy: boolean;
  hasIiifManifest: boolean;
};

function mediaUrl(key: string) {
  return `/api/media/${encodeURIComponent(key)}`;
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

export async function getPublicGalleryRecord(id: string): Promise<PublicGalleryRecord | null> {
  const legacy = getLegacyCollection(id);
  if (legacy) {
    const original = legacy.fixity?.original;
    return {
      id: legacy.id,
      title: legacy.metadata?.title || legacy.title,
      date: legacy.metadata?.date || legacy.date,
      familyMember: legacy.metadata?.familyMember,
      description:
        legacy.metadata?.description ||
        "A surviving photograph from the Saroop Singh family collection.",
      rights: "Copyright status and reuse rights are not yet determined.",
      originalImageUrl: legacy.originalImageUrl,
      original: {
        filename: original?.filename || legacy.originalImageUrl.split("/").at(-1) || "source-file",
        bytes: original?.bytes || 0,
        mimeType: original?.mimeType || "image/jpeg",
        sha256: original?.sha256,
      },
      dateConfidence: legacy.fixity?.dateConfidence || "unknown",
      studies: (legacy.restorations || []).map((study) => ({
        id: study.id,
        type: study.type,
        url: study.url,
      })),
      isLegacy: true,
      hasIiifManifest: true,
    };
  }

  const db = getDb();
    const [image] = await db
      .select()
      .from(archiveImages)
      .where(and(eq(archiveImages.id, id), eq(archiveImages.status, "published")))
      .limit(1);
    if (!image) return null;

    let studies: PublicGalleryStudy[] = [];
    if (image.publishedKey && image.publishedKey !== image.originalKey) {
      const [publishedRun] = await db
        .select()
        .from(restorationRuns)
        .where(
          and(
            eq(restorationRuns.imageId, image.id),
            eq(restorationRuns.outputKey, image.publishedKey),
            eq(restorationRuns.status, "ready"),
            eq(restorationRuns.reviewStatus, "approved"),
            isNotNull(restorationRuns.publishedAt),
          ),
        )
        .limit(1);
      if (publishedRun?.outputKey) {
        studies = [
          {
            id: publishedRun.id,
            type: publicStudyLabel(publishedRun.recipe),
            url: mediaUrl(publishedRun.outputKey),
          },
        ];
      }
    }

    return {
      id: image.id,
      title: image.title,
      date: image.estimatedDate || undefined,
      familyMember: image.people || "People not yet identified",
      description:
        image.description ||
        "A family photograph preserved privately, reviewed, and deliberately published by the archive.",
      rights: image.rights,
      originalImageUrl: mediaUrl(image.originalKey),
      original: {
        filename: image.originalName,
        bytes: image.originalBytes,
        mimeType: image.originalType,
        sha256: image.originalSha256,
      },
      dateConfidence: image.estimatedDate ? "family estimate" : "unknown",
      studies,
      isLegacy: false,
      hasIiifManifest: false,
    };
}
