import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { memorySubmissions } from "@/db/schema";
import { bucket, detectSafeAudio, detectSafeRaster, readSafeRasterDimensions, sha256Hex } from "@/lib/archive-server";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";
import {
  configuredDailyLimit,
  dailyRequestSourceHash,
} from "@/lib/request-source";

export const runtime = "nodejs";
const kinds = new Set(["identify", "story", "correction", "photograph", "reverse", "voice"]);
const certainties = new Set(["know", "told", "think", "unsure"]);
const attributions = new Set(["named", "anonymous", "private"]);

export async function POST(request: Request) {
  if (!hasTrustedArchiveOrigin(request)) {
    return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 53 * 1024 * 1024) return Response.json({ error: "This upload request is too large." }, { status: 413 });
  const form = await request.formData();
  if (String(form.get("website") || "")) return Response.json({ received: true }, { status: 202 });
  if (form.get("consent") !== "yes") return Response.json({ error: "Please confirm private preservation and review." }, { status: 400 });
  const kind = String(form.get("kind") || ""); if (!kinds.has(kind)) return Response.json({ error: "Choose a memory-room action." }, { status: 400 });
  const claimantName = String(form.get("claimantName") || "").trim().slice(0, 120); if (!claimantName) return Response.json({ error: "Please tell us your name." }, { status: 400 });
  const day = new Date().toISOString().slice(0, 10);
  const submissionSourceHash = dailyRequestSourceHash(request, "memory");
  const [[{ value: submittedToday }], [{ value: totalSubmittedToday }]] =
    await Promise.all([
      getDb()
        .select({ value: count() })
        .from(memorySubmissions)
        .where(
          and(
            eq(memorySubmissions.submissionSourceHash, submissionSourceHash),
            gte(memorySubmissions.createdAt, `${day} 00:00:00`),
          ),
        ),
      getDb()
        .select({ value: count() })
        .from(memorySubmissions)
        .where(gte(memorySubmissions.createdAt, `${day} 00:00:00`)),
    ]);
  if (submittedToday >= 100) {
    return Response.json(
      {
        error:
          "This network has reached today’s memory safety limit. Please contact the archive if your family event is still in progress.",
      },
      { status: 429 },
    );
  }
  const globalLimit = configuredDailyLimit(
    "MEMORY_DAILY_GLOBAL_LIMIT",
    1_000,
    10_000,
  );
  if (totalSubmittedToday >= globalLimit) {
    return Response.json(
      {
        error:
          "The archive has reached today’s safe memory limit. Please try again tomorrow or contact the archive owner.",
      },
      { status: 429 },
    );
  }

  const id = crypto.randomUUID(); const receiptToken = `${crypto.randomUUID()}${crypto.randomUUID().replaceAll("-", "")}`; const receiptTokenHash = await sha256Hex(new TextEncoder().encode(receiptToken));
  let asset: { key: string; name: string; type: string; bytes: number; sha256: string } | null = null;
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 50 * 1024 * 1024) return Response.json({ error: "Files must be 50 MB or smaller." }, { status: 413 });
    const bytes = new Uint8Array(await file.arrayBuffer()); const detected = kind === "voice" ? detectSafeAudio(bytes) : detectSafeRaster(bytes);
    if (!detected) return Response.json({ error: kind === "voice" ? "Use a genuine MP3, M4A, WAV, OGG or WebM recording." : "Use a genuine JPEG, PNG or WebP photograph." }, { status: 415 });
    if (kind !== "voice") { const dimensions = readSafeRasterDimensions(bytes); if (!dimensions) return Response.json({ error: "The photograph is truncated or its dimensions cannot be verified safely." }, { status: 415 }); if (dimensions.width * dimensions.height > 100_000_000) return Response.json({ error: "The photograph exceeds the 100-megapixel safe-processing limit." }, { status: 413 }); }
    const sha = await sha256Hex(bytes); const key = `memory-originals/sha256/${sha}.${detected.extension}`;
    await bucket().put(key, bytes, { onlyIf: { etagDoesNotMatch: "*" }, httpMetadata: { contentType: detected.type }, customMetadata: { originalName: file.name, sha256: sha, kind } });
    asset = { key, name: file.name, type: detected.type, bytes: bytes.byteLength, sha256: sha };
  }
  if (["photograph", "reverse", "voice"].includes(kind) && !asset) return Response.json({ error: "Please attach the photograph or recording." }, { status: 400 });
  const rawAnchorX = String(form.get("anchorX") || "").trim();
  const rawAnchorY = String(form.get("anchorY") || "").trim();
  if (Boolean(rawAnchorX) !== Boolean(rawAnchorY)) return Response.json({ error: "Identification coordinates must include both axes." }, { status: 400 });
  const normalizedAnchorX = rawAnchorX ? Number(rawAnchorX) : null;
  const normalizedAnchorY = rawAnchorY ? Number(rawAnchorY) : null;
  if (
    (normalizedAnchorX !== null && (!Number.isFinite(normalizedAnchorX) || normalizedAnchorX < 0 || normalizedAnchorX > 1)) ||
    (normalizedAnchorY !== null && (!Number.isFinite(normalizedAnchorY) || normalizedAnchorY < 0 || normalizedAnchorY > 1))
  ) return Response.json({ error: "Identification coordinates fall outside the photograph." }, { status: 400 });
  const subjectId = String(form.get("subjectId") || "").trim().slice(0, 180) || null;
  const anchorX = normalizedAnchorX === null ? null : Math.round(normalizedAnchorX * 10000);
  const anchorY = normalizedAnchorY === null ? null : Math.round(normalizedAnchorY * 10000);
  const proposedName = String(form.get("proposedName") || "").trim().slice(0, 180);
  const positionDescription = String(form.get("positionDescription") || "").trim().slice(0, 300);
  if (kind === "identify" && !subjectId) return Response.json({ error: "Choose the photograph you are identifying." }, { status: 400 });
  if (kind === "identify" && !proposedName) return Response.json({ error: "Tell us the person’s name or nickname." }, { status: 400 });
  if (kind === "identify" && (anchorX === null || anchorY === null) && !positionDescription) return Response.json({ error: "Tap the person or describe where they are in the photograph." }, { status: 400 });
  const requestedCertainty = String(form.get("certainty") || "unsure");
  const certainty = certainties.has(requestedCertainty) ? requestedCertainty : "unsure";
  const requestedAttribution = String(form.get("attribution") || "named");
  const attribution = attributions.has(requestedAttribution) ? requestedAttribution : "named";
  const submittedStory = String(form.get("story") || "").slice(0, 8000);
  const story = positionDescription ? `${submittedStory}${submittedStory ? "\n\n" : ""}Position in photograph: ${positionDescription}`.slice(0, 8000) : submittedStory;
  await getDb().insert(memorySubmissions).values({ id, kind, subjectId, anchorX, anchorY, claimantName, claimantRelationship: String(form.get("relationship") || "").slice(0, 160), claimantContact: String(form.get("contact") || "").slice(0, 240), proposedName, certainty, story, howKnown: String(form.get("howKnown") || "").slice(0, 1000), assetKey: asset?.key, assetName: asset?.name, assetType: asset?.type, assetBytes: asset?.bytes, assetSha256: asset?.sha256, consentScope: "private-review", attribution, status: "submitted", receiptTokenHash, submissionSourceHash });
  return Response.json({ received: true, id, receiptUrl: `/memory-receipt/${receiptToken}` }, { status: 201 });
}
