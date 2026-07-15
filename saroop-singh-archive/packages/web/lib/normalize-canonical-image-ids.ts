import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  archiveEvents,
  archiveImages,
  contributionBatchItems,
  memorySubmissions,
  publicIdentityTagEvents,
  publicIdentityTags,
  restorationRuns,
} from "@/db/schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ImageIdNormalization = {
  previousId: string;
  canonicalId: string;
};

export async function normalizeCanonicalImageIds(actor: string): Promise<ImageIdNormalization[]> {
  const db = getDb();
  return db.transaction(transaction => {
    const normalizations = transaction
      .select({ id: archiveImages.id })
      .from(archiveImages)
      .all()
      .filter(image => !UUID.test(image.id))
      .map(image => ({ previousId: image.id, canonicalId: crypto.randomUUID() }));

    if (!normalizations.length) return [];

    transaction.run(sql`PRAGMA defer_foreign_keys = ON`);
    for (const { previousId, canonicalId } of normalizations) {
      transaction
        .update(archiveImages)
        .set({ id: canonicalId })
        .where(eq(archiveImages.id, previousId))
        .run();
      transaction
        .update(restorationRuns)
        .set({ imageId: canonicalId })
        .where(eq(restorationRuns.imageId, previousId))
        .run();
      transaction
        .update(archiveEvents)
        .set({ imageId: canonicalId })
        .where(eq(archiveEvents.imageId, previousId))
        .run();
      transaction
        .update(contributionBatchItems)
        .set({ imageId: canonicalId })
        .where(eq(contributionBatchItems.imageId, previousId))
        .run();
      transaction
        .update(memorySubmissions)
        .set({ subjectId: canonicalId })
        .where(eq(memorySubmissions.subjectId, previousId))
        .run();
      transaction
        .update(publicIdentityTags)
        .set({ subjectId: canonicalId })
        .where(eq(publicIdentityTags.subjectId, previousId))
        .run();
      transaction
        .update(publicIdentityTagEvents)
        .set({ subjectId: canonicalId })
        .where(eq(publicIdentityTagEvents.subjectId, previousId))
        .run();
      transaction
        .insert(archiveEvents)
        .values({
          id: crypto.randomUUID(),
          imageId: canonicalId,
          eventType: "identifier:normalized",
          actor,
          detail: JSON.stringify({ previousId }),
        })
        .run();
    }
    return normalizations;
  });
}
