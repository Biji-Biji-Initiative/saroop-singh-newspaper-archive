import { eq } from "drizzle-orm";
import { requireArchiveAdmin } from "@/lib/archive-auth";
import { getDb } from "@/db";
import { archiveEvents, archiveImages } from "@/db/schema";
import { bucket, getImage } from "@/lib/archive-server";
import {
  analyzePhotoWithGemini,
  type PhotoAnalysis,
} from "@/lib/photo-analysis";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ANALYSIS_BYTES = 20 * 1024 * 1024;

async function recordFailure(
  imageId: string,
  actor: string,
  message: string,
): Promise<void> {
  const db = getDb();
  db.transaction(transaction => {
    transaction
      .update(archiveImages)
      .set({ photoAnalysisStatus: "failed" })
      .where(eq(archiveImages.id, imageId))
      .run();
    transaction
      .insert(archiveEvents)
      .values({
        id: crypto.randomUUID(),
        imageId,
        eventType: "photo-analysis:failed",
        actor,
        detail: JSON.stringify({ message: message.slice(0, 300) }),
      })
      .run();
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasTrustedArchiveOrigin(request)) {
    return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  }
  const user = await requireArchiveAdmin("/studio");
  const { id } = await context.params;
  const image = await getImage(id);
  if (!image) {
    return Response.json({ error: "Photograph not found." }, { status: 404 });
  }

  if (
    image.createdBy === "public-family-contribution" &&
    (image.status === "submitted" || image.status === "rejected")
  ) {
    return Response.json(
      {
        error:
          "Accept this family contribution into private review before sending a working copy for face detection.",
      },
      { status: 409 },
    );
  }
  if (
    image.createdBy === "public-family-contribution" &&
    (image.aiProcessingConsent !== "granted" ||
      !image.aiProcessingConsentWordingVersion ||
      !Number.isFinite(Date.parse(image.aiProcessingConsentRecordedAt || "")))
  ) {
    return Response.json(
      {
        error:
          "Affirmative AI processing consent is required. The original remains private and unprocessed.",
      },
      { status: 409 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { error: "Gemini face detection is not configured." },
      { status: 503 },
    );
  }
  const model =
    process.env.GEMINI_ANALYSIS_MODEL?.trim() || "gemini-3.1-flash-image";
  const source = await bucket().get(image.originalKey);
  if (!source) {
    return Response.json(
      { error: "The preserved original is missing from storage." },
      { status: 409 },
    );
  }
  const sourceBytes = new Uint8Array(await source.arrayBuffer());
  if (sourceBytes.byteLength > MAX_ANALYSIS_BYTES) {
    return Response.json(
      {
        error:
          "This original is too large for face detection. Preserve it unchanged and create a smaller private working scan.",
      },
      { status: 413 },
    );
  }

  await getDb()
    .update(archiveImages)
    .set({ photoAnalysisStatus: "processing" })
    .where(eq(archiveImages.id, image.id));

  try {
    const analysis = await analyzePhotoWithGemini({
      apiKey,
      model,
      image: Buffer.from(sourceBytes),
      mimeType: image.originalType,
    });
    if (!analysis) {
      throw new Error("Gemini did not return a valid face-observation record.");
    }

    const analyzedAt = new Date().toISOString();
    const db = getDb();
    db.transaction(transaction => {
      transaction
        .update(archiveImages)
        .set({
          photoAnalysis: JSON.stringify(analysis),
          photoAnalysisModel: model,
          photoAnalysisStatus: "ready",
          photoAnalyzedAt: analyzedAt,
        })
        .where(eq(archiveImages.id, image.id))
        .run();
      transaction
        .insert(archiveEvents)
        .values({
          id: crypto.randomUUID(),
          imageId: image.id,
          eventType: "photo-analysis:completed",
          actor: user.email,
          detail: JSON.stringify({
            model,
            faceCount: analysis.faceCount,
            reviewRequired: true,
          }),
        })
        .run();
    });

    return Response.json({
      analysis: analysis satisfies PhotoAnalysis,
      model,
      analyzedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Photo analysis failed.";
    await recordFailure(image.id, user.email, message);
    return Response.json({ error: message }, { status: 502 });
  }
}