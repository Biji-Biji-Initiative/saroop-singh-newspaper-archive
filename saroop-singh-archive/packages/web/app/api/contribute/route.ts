import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { archiveEvents, archiveImages } from "@/db/schema";
import { bucket, detectSafeRaster, FAMILY_AI_CONSENT_VERSION, readSafeRasterDimensions, sha256Hex } from "@/lib/archive-server";

export const runtime = "edge";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 27 * 1024 * 1024) return Response.json({ error: "This upload request is too large." }, { status: 413 });
  const form = await request.formData();
  if (String(form.get("website") || "")) return Response.json({ received: true }, { status: 202 });
  if (form.get("consent") !== "yes") return Response.json({ error: "Please confirm that the archive may privately review this material." }, { status: 400 });
  const contributorName = String(form.get("contributorName") || "").trim().slice(0, 120);
  if (!contributorName) return Response.json({ error: "Please tell us your name." }, { status: 400 });
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose a photograph." }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return Response.json({ error: "Each photograph must be 25 MB or smaller." }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectSafeRaster(bytes);
  if (!detected) return Response.json({ error: "Please use a genuine JPEG, PNG, or WebP photograph." }, { status: 415 });
  const dimensions = readSafeRasterDimensions(bytes);
  if (!dimensions) return Response.json({ error: "This image is truncated or its dimensions cannot be verified safely." }, { status: 415 });
  if (dimensions.width * dimensions.height > 100_000_000) return Response.json({ error: "This image has too many pixels to process safely. Please export a copy below 100 megapixels." }, { status: 413 });

  const forwarded = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const submissionSourceHash = await sha256Hex(new TextEncoder().encode(`${day}:${forwarded}`));
  const [{ value: submittedToday }] = await getDb().select({ value: count() }).from(archiveImages).where(and(eq(archiveImages.submissionSourceHash, submissionSourceHash), gte(archiveImages.createdAt, `${day} 00:00:00`)));
  if (submittedToday >= 60) return Response.json({ error: "This network has reached today’s contribution safety limit. Please contact the archive if your family event needs a larger batch." }, { status: 429 });

  const title = String(form.get("title") || file.name.replace(/\.[^.]+$/, "") || "Family photograph").trim().slice(0, 180);
  const story = String(form.get("story") || "").trim().slice(0, 5000);
  const people = String(form.get("people") || "").trim().slice(0, 500);
  const estimatedDate = String(form.get("estimatedDate") || "").trim().slice(0, 100) || null;
  const relationship = String(form.get("relationship") || "").trim().slice(0, 160);
  const contact = String(form.get("contact") || "").trim().slice(0, 240);
  const aiConsentGranted = form.get("aiProcessingConsent") === "yes";
  const requestedPreference = String(form.get("restorationPreference") || "clean-preserve");
  const restorationPreference = aiConsentGranted && new Set(["clean-preserve", "repair-damage", "explore-colour"]).has(requestedPreference) ? requestedPreference : "original-only";
  const consentRecordedAt = new Date().toISOString();
  const originalSha256 = await sha256Hex(bytes);
  const duplicate = await getDb().select({ id: archiveImages.id }).from(archiveImages).where(eq(archiveImages.originalSha256, originalSha256)).limit(1);
  if (duplicate[0]) {
    await getDb().insert(archiveEvents).values({ id: crypto.randomUUID(), imageId: duplicate[0].id, eventType: "contribution:duplicate-file-context-received", actor: contributorName, detail: JSON.stringify({ title, story, people, estimatedDate, relationship, contact, aiProcessingConsent: aiConsentGranted ? "granted" : "declined", aiConsentWordingVersion: FAMILY_AI_CONSENT_VERSION, restorationPreference, receivedAt: consentRecordedAt }) });
    return Response.json({ received: true, id: duplicate[0].id, duplicate: true }, { status: 200 });
  }

  const id = crypto.randomUUID();
  const originalKey = `originals/sha256/${originalSha256}.${detected.extension}`;
  await bucket().put(originalKey, bytes, { onlyIf: { etagDoesNotMatch: "*" }, httpMetadata: { contentType: detected.type }, customMetadata: { originalName: file.name, source: "public-family-contribution", sha256: originalSha256 } });
  await getDb().insert(archiveImages).values({ id, title, description: story, people, estimatedDate, tags: "[]", rights: "Family contribution — private review required", originalKey, originalName: file.name, originalType: detected.type, originalBytes: bytes.byteLength, originalSha256, status: "submitted", createdBy: "public-family-contribution", contributorName, contributorRelationship: relationship, contributorContact: contact, restorationPreference, aiProcessingConsent: aiConsentGranted ? "granted" : "declined", aiProcessingConsentWordingVersion: FAMILY_AI_CONSENT_VERSION, aiProcessingConsentRecordedAt: consentRecordedAt, submissionSourceHash });
  await getDb().insert(archiveEvents).values({ id: crypto.randomUUID(), imageId: id, eventType: "contribution:received", actor: contributorName, detail: JSON.stringify({ sha256: originalSha256, bytes: bytes.byteLength, relationship, aiProcessingConsent: aiConsentGranted ? "granted" : "declined", aiConsentWordingVersion: FAMILY_AI_CONSENT_VERSION }) });
  return Response.json({ received: true, id }, { status: 201 });
}
