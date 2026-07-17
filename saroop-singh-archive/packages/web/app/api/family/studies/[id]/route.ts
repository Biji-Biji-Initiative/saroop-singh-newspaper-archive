import { and, eq, inArray } from "drizzle-orm";
import { archiveEvents, restorationRuns } from "@/db/schema";
import { getDb } from "@/db";
import { getFamilyWorkspace } from "@/lib/family-workspace";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";

const VISIBILITY = new Set(["visible", "hidden"]);

type CurationRequest = {
  rating?: unknown;
  rank?: unknown;
  visibility?: unknown;
};

function rankedFirst<T extends { galleryRank: number | null; createdAt: string; id: string }>(left: T, right: T) {
  const leftRank = left.galleryRank ?? Number.MAX_SAFE_INTEGER;
  const rightRank = right.galleryRank ?? Number.MAX_SAFE_INTEGER;
  return leftRank - rightRank || left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id);
}

function requestedRating(value: unknown) {
  if (value === undefined || value === null) return value;
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5 ? value : undefined;
}

function requestedRank(value: unknown) {
  if (value === undefined) return value;
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 100 ? value : undefined;
}

function familyAccessError() {
  return Response.json(
    { error: { code: "FAMILY_ACCESS_REQUIRED", message: "Open the family link once to organise image versions here." } },
    { status: 401 },
  );
}

/**
 * The family link is a deliberate shared curation capability. It can arrange
 * or hide ready variations, but cannot publish an unreviewed private study.
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasTrustedArchiveOrigin(request)) {
    return Response.json({ error: { code: "UNTRUSTED_ORIGIN", message: "Untrusted request origin." } }, { status: 403 });
  }
  const workspace = await getFamilyWorkspace();
  if (!workspace) return familyAccessError();

  const { id } = await context.params;
  const body = await request.json() as CurationRequest;
  const wantsRating = Object.hasOwn(body, "rating");
  const wantsRank = Object.hasOwn(body, "rank");
  const wantsVisibility = Object.hasOwn(body, "visibility");
  if (!wantsRating && !wantsRank && !wantsVisibility) {
    return Response.json({ error: { code: "NO_CHANGE", message: "Choose a rating, gallery position, or visibility decision." } }, { status: 400 });
  }

  const rating = requestedRating(body.rating);
  const rank = requestedRank(body.rank);
  const visibility = typeof body.visibility === "string" ? body.visibility : undefined;
  if ((wantsRating && rating === undefined) || (wantsRank && rank === undefined) || (wantsVisibility && (!visibility || !VISIBILITY.has(visibility)))) {
    return Response.json({ error: { code: "INVALID_CURATION", message: "Use a rating from one to five, a positive position, or visible/hidden." } }, { status: 400 });
  }

  const result = getDb().transaction(transaction => {
    const run = transaction.select().from(restorationRuns).where(eq(restorationRuns.id, id)).get();
    if (!run) return { error: "Image version not found.", status: 404 as const };
    if (run.status !== "ready") return { error: "Only a finished image version can be organised.", status: 409 as const };
    const publishedStudy = ["approved", "recovered-historical"].includes(run.reviewStatus);
    const sharedPrivateStudy = !publishedStudy && run.familySessionHash === workspace.sessionHash;
    if (!sharedPrivateStudy && !publishedStudy) return { error: "Image version not found.", status: 404 as const };

    const nextVisibility = visibility || run.galleryVisibility;
    const candidates = transaction
      .select()
      .from(restorationRuns)
      .where(
        sharedPrivateStudy
          ? and(eq(restorationRuns.imageId, run.imageId), eq(restorationRuns.familySessionHash, workspace.sessionHash), eq(restorationRuns.status, "ready"))
          : and(eq(restorationRuns.imageId, run.imageId), eq(restorationRuns.status, "ready"), inArray(restorationRuns.reviewStatus, ["approved", "recovered-historical"])),
      )
      .all();
    const otherVisible = candidates
      .filter(candidate => candidate.id !== run.id && candidate.galleryVisibility === "visible")
      .sort(rankedFirst);
    const visibleRuns = nextVisibility === "visible" ? [...otherVisible, run] : otherVisible;
    const currentRank = rank === undefined ? run.galleryRank || visibleRuns.length : rank;
    const requestedPosition = Math.max(1, Math.min(currentRank, visibleRuns.length || 1));
    const orderedVisible = visibleRuns.filter(candidate => candidate.id !== run.id);
    if (nextVisibility === "visible") orderedVisible.splice(requestedPosition - 1, 0, run);

    for (const [index, candidate] of orderedVisible.entries()) {
      transaction.update(restorationRuns).set({ galleryRank: index + 1 }).where(eq(restorationRuns.id, candidate.id)).run();
    }
    const nextRank = nextVisibility === "visible" ? orderedVisible.findIndex(candidate => candidate.id === run.id) + 1 : null;
    const now = new Date().toISOString();
    transaction
      .update(restorationRuns)
      .set({
        familyRating: wantsRating ? rating as number | null : run.familyRating,
        galleryRank: nextRank,
        galleryVisibility: nextVisibility,
        galleryCuratedBy: "family-workspace",
        galleryCuratedAt: now,
      })
      .where(eq(restorationRuns.id, run.id))
      .run();
    transaction.insert(archiveEvents).values({
      id: crypto.randomUUID(),
      imageId: run.imageId,
      eventType: "restoration:family-curation-updated",
      actor: "family-workspace",
      detail: JSON.stringify({ runId: run.id, rating: wantsRating ? rating : run.familyRating, rank: nextRank, visibility: nextVisibility }),
    }).run();
    return { run: { id: run.id, familyRating: wantsRating ? rating as number | null : run.familyRating, galleryRank: nextRank, galleryVisibility: nextVisibility } };
  });

  if ("error" in result) return Response.json({ error: { code: "CURATION_REJECTED", message: result.error } }, { status: result.status });
  return Response.json({ data: result.run });
}
