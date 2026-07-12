import { and, eq } from "drizzle-orm";
import { requireArchiveAdmin } from "@/lib/archive-auth";
import { getDb } from "@/db";
import { archiveEvents, archiveImages, restorationRuns } from "@/db/schema";
import { FAMILY_AI_CONSENT_VERSION, getImage } from "@/lib/archive-server";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";

const ALLOWED_STATUSES = new Set(["submitted", "private", "rejected"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasTrustedArchiveOrigin(request)) {
    return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  }
  const user = await requireArchiveAdmin("/studio");
  const { id } = await context.params;
  const existing = await getImage(id);
  if (!existing) return Response.json({ error: "Photograph not found." }, { status: 404 });
  const body = await request.json() as Record<string, unknown>;
  const requestedAiConsent = typeof body.aiProcessingConsent === "string" ? body.aiProcessingConsent : null;
  const consentChange = requestedAiConsent === "granted" || requestedAiConsent === "revoked";
  const consentEvidence = typeof body.aiConsentEvidence === "string" ? body.aiConsentEvidence.trim().slice(0, 500) : "";
  if (requestedAiConsent && !consentChange) return Response.json({ error: "Choose a valid AI-consent decision." }, { status: 400 });
  if (consentChange && existing.createdBy !== "public-family-contribution") return Response.json({ error: "Recorded contributor consent applies only to family contributions." }, { status: 409 });
  if (consentChange && consentEvidence.length < 5) return Response.json({ error: "Record how and when the contributor gave or withdrew permission." }, { status: 400 });
  const status = typeof body.status === "string" && ALLOWED_STATUSES.has(body.status) ? body.status : existing.status;
  const consentRecordedAt = consentChange ? new Date().toISOString() : null;
  const revokePublishedStudy = requestedAiConsent === "revoked" && existing.status === "published" && existing.publishedKey && existing.publishedKey !== existing.originalKey;
  const values = {
    title: typeof body.title === "string" ? body.title.trim().slice(0, 180) || existing.title : existing.title,
    description: typeof body.description === "string" ? body.description.trim().slice(0, 5000) : existing.description,
    people: typeof body.people === "string" ? body.people.trim().slice(0, 500) : existing.people,
    estimatedDate: typeof body.estimatedDate === "string" ? body.estimatedDate.trim().slice(0, 100) || null : existing.estimatedDate,
    tags: Array.isArray(body.tags) ? JSON.stringify(body.tags.map(String).map(value => value.trim()).filter(Boolean).slice(0, 30)) : existing.tags,
    rights: typeof body.rights === "string" ? body.rights.trim().slice(0, 300) || existing.rights : existing.rights,
    status,
    ...(consentChange ? {
      aiProcessingConsent: requestedAiConsent,
      aiProcessingConsentWordingVersion: FAMILY_AI_CONSENT_VERSION,
      aiProcessingConsentRecordedAt: consentRecordedAt,
    } : {}),
    ...(revokePublishedStudy ? { publishedKey: existing.originalKey } : {}),
    ...(requestedAiConsent === "revoked"
      ? {
          photoAnalysis: null,
          photoAnalysisModel: null,
          photoAnalysisStatus: "revoked",
          photoAnalyzedAt: null,
        }
      : {}),
  };
  const db = getDb();
  const writeEvent = (transaction: typeof db) =>
    transaction.insert(archiveEvents).values({
      id: crypto.randomUUID(),
      imageId: id,
      eventType: consentChange
        ? `ai-consent:${requestedAiConsent}`
        : status !== existing.status
          ? `status:${existing.status}->${status}`
          : "metadata:updated",
      actor: user.email,
      detail: JSON.stringify(
        consentChange
          ? {
              previous: existing.aiProcessingConsent,
              decision: requestedAiConsent,
              wordingVersion: FAMILY_AI_CONSENT_VERSION,
              evidence: consentEvidence,
              publicStudyRevertedToSource: Boolean(revokePublishedStudy),
            }
          : {
              changedFields: Object.keys(body).filter(key => key !== "status"),
              status,
            },
      ),
    });

  db.transaction(transaction => {
    transaction
      .update(archiveImages)
      .set(values)
      .where(eq(archiveImages.id, id))
      .run();
    if (requestedAiConsent === "revoked") {
      transaction
        .update(restorationRuns)
        .set({ reviewStatus: "revoked", publishedAt: null })
        .where(
          and(
            eq(restorationRuns.imageId, id),
            eq(restorationRuns.reviewStatus, "approved"),
          ),
        )
        .run();
    }
    writeEvent(transaction).run();
  });
  return Response.json({ saved: true, status });
}
