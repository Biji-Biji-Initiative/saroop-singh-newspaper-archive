import { and, count, eq, gte, inArray, isNotNull, like, or } from "drizzle-orm";
import { getDb } from "@/db";
import { archiveImages, restorationRuns } from "@/db/schema";
import { getFamilyWorkspace, familyWorkspaceConfigured } from "@/lib/family-workspace";
import { publicStudyLabel } from "@/lib/public-gallery";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";
import { configuredDailyLimit, dailyRequestSourceHash } from "@/lib/request-source";
import {
  createRestorationDerivative,
  RestorationRequestError,
  validRestorationModel,
  validRestorationRecipe,
} from "@/lib/restoration-service";

export const runtime = "nodejs";

const imageIdPattern = /^[a-zA-Z0-9_-]{1,128}$/;
const familyResponseHeaders = { "Cache-Control": "private, no-store" };

function rankedFirst<T extends { galleryRank: number | null; createdAt: string; id: string }>(left: T, right: T) {
  const leftRank = left.galleryRank ?? Number.MAX_SAFE_INTEGER;
  const rightRank = right.galleryRank ?? Number.MAX_SAFE_INTEGER;
  return leftRank - rightRank || left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id);
}

function familyAccessError() {
  return familyJson(
    {
      error: {
        code: "FAMILY_ACCESS_REQUIRED",
        message: "Open the family link once to make and view private image studies here.",
      },
    },
    401,
  );
}

function familyJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: familyResponseHeaders });
}

function outputUrl(key: string | null) {
  return key ? `/api/media/${encodeURIComponent(key)}` : null;
}

export async function GET(request: Request) {
  const workspace = await getFamilyWorkspace();
  if (!workspace) return familyAccessError();

  const imageId = new URL(request.url).searchParams.get("image") || "";
  if (!imageIdPattern.test(imageId)) {
    return familyJson({ error: { code: "INVALID_IMAGE", message: "Choose a photograph from the archive." } }, 400);
  }

  const runs = await getDb()
    .select()
    .from(restorationRuns)
    .where(
      and(
        eq(restorationRuns.imageId, imageId),
        or(
          eq(restorationRuns.familySessionHash, workspace.sessionHash),
          and(
            inArray(restorationRuns.reviewStatus, ["approved", "recovered-historical"]),
            isNotNull(restorationRuns.outputKey),
          ),
        ),
      ),
    );
  const studies = runs
    .sort(rankedFirst)
    .map(run => {
      const recovered = run.reviewStatus === "recovered-historical";
      return {
        id: run.id,
        imageId: run.imageId,
        type: publicStudyLabel(run.recipe, recovered ? "recovered-historical" : "recorded"),
        url: outputUrl(run.outputKey),
        provenance: recovered ? "recovered-historical" : "recorded",
        provider: recovered ? "not-recorded" : run.provider,
        model: recovered ? "not-recorded" : run.model,
        recipe: run.recipe,
        interventionClass: run.interventionClass,
        promptVersion: recovered ? null : run.promptVersion,
        prompt: recovered ? null : run.prompt,
        outputSha256: run.outputSha256,
        status: run.status,
        error: run.error,
        createdAt: run.createdAt,
        private: run.familySessionHash === workspace.sessionHash && !["approved", "recovered-historical"].includes(run.reviewStatus),
        familyRating: run.familyRating,
        galleryRank: run.galleryRank,
        galleryVisibility: run.galleryVisibility === "hidden" ? "hidden" : "visible",
      };
    });
  return familyJson({ data: { imageId, studies } });
}

export async function POST(request: Request) {
  if (!hasTrustedArchiveOrigin(request)) {
    return familyJson({ error: { code: "UNTRUSTED_ORIGIN", message: "Untrusted request origin." } }, 403);
  }
  if (!familyWorkspaceConfigured()) {
    return familyJson({ error: { code: "FAMILY_ACCESS_UNAVAILABLE", message: "Family image-making is not configured yet." } }, 503);
  }
  const workspace = await getFamilyWorkspace();
  if (!workspace) return familyAccessError();

  const body = await request.json() as { imageId?: unknown; model?: unknown; recipe?: unknown; notes?: unknown };
  const imageId = typeof body.imageId === "string" ? body.imageId : "";
  const requestedModel = typeof body.model === "string" ? body.model : "gpt-image-2";
  if (!imageIdPattern.test(imageId)) {
    return familyJson({ error: { code: "INVALID_IMAGE", message: "Choose a photograph from the archive." } }, 400);
  }
  if (!validRestorationModel(requestedModel)) {
    return familyJson({ error: { code: "UNSUPPORTED_MODEL", message: "Choose one of the archive image models." } }, 400);
  }
  const recipe = validRestorationRecipe(body.recipe) ? body.recipe : "conservative";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 1200) : "";

  const [image] = await getDb()
    .select({ id: archiveImages.id })
    .from(archiveImages)
    .where(and(eq(archiveImages.id, imageId), eq(archiveImages.status, "published"), isNotNull(archiveImages.publishedAt)))
    .limit(1);
  if (!image) {
    return familyJson({ error: { code: "SOURCE_NOT_AVAILABLE", message: "This source is not available for the family workspace." } }, 404);
  }

  const day = new Date().toISOString().slice(0, 10);
  const sourceHash = dailyRequestSourceHash(request, "family-generation");
  const actor = `family:${sourceHash}`;
  const networkLimit = configuredDailyLimit("FAMILY_GENERATION_DAILY_NETWORK_LIMIT", 12, 40);
  const globalLimit = configuredDailyLimit("FAMILY_GENERATION_DAILY_GLOBAL_LIMIT", 100, 500);
  const [[{ value: generatedToday }], [{ value: generatedGlobally }], existing] = await Promise.all([
    getDb().select({ value: count() }).from(restorationRuns).where(and(eq(restorationRuns.createdBy, actor), gte(restorationRuns.createdAt, `${day} 00:00:00`))),
    getDb().select({ value: count() }).from(restorationRuns).where(and(like(restorationRuns.createdBy, "family:%"), gte(restorationRuns.createdAt, `${day} 00:00:00`))),
    getDb().select({ id: restorationRuns.id }).from(restorationRuns).where(and(eq(restorationRuns.imageId, imageId), eq(restorationRuns.familySessionHash, workspace.sessionHash), eq(restorationRuns.status, "processing"))).limit(1),
  ]);
  if (existing) {
    return familyJson({ error: { code: "STUDY_IN_PROGRESS", message: "A version of this source is already being made for you." } }, 409);
  }
  if (generatedToday >= networkLimit || generatedGlobally >= globalLimit) {
    return familyJson({ error: { code: "DAILY_LIMIT_REACHED", message: "The family image-making limit has been reached for today. Please try again tomorrow." } }, 429);
  }

  try {
    const study = await createRestorationDerivative({
      imageId,
      model: requestedModel,
      recipe,
      notes,
      createdBy: actor,
      familySessionHash: workspace.sessionHash,
    });
    return familyJson({
      data: {
        ...study,
        type: publicStudyLabel(study.recipe, "recorded"),
        provenance: "recorded",
        status: "ready",
        error: null,
        private: true,
        familyRating: null,
        galleryRank: null,
        galleryVisibility: "visible",
      },
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The new version could not be made.";
    return familyJson(
      { error: { code: error instanceof RestorationRequestError ? "RESTORATION_REQUEST_REJECTED" : "RESTORATION_FAILED", message } },
      error instanceof RestorationRequestError ? error.status : 502,
    );
  }
}
