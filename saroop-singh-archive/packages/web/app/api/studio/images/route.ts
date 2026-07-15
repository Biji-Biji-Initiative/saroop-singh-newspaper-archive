import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { archiveEvents, archiveImages, restorationRuns } from "@/db/schema";
import { bucket, detectSafeRaster, readSafeRasterDimensions, sha256Hex } from "@/lib/archive-server";
import { requireArchiveAdmin } from "@/lib/archive-auth";
import preservationManifest from "@/data/generated/preservation-manifest.json";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";

function parsedPhotoAnalysis(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export async function GET() {
  await requireArchiveAdmin("/studio");
  const images = await getDb().select().from(archiveImages).orderBy(desc(archiveImages.createdAt)).limit(100);
  const runs = await getDb().select().from(restorationRuns).orderBy(desc(restorationRuns.createdAt)).limit(300);
  const stored = images.map(image => ({
    ...image,
    photoAnalysis: parsedPhotoAnalysis(image.photoAnalysis),
    readOnlyLegacy: false,
    tags: JSON.parse(image.tags),
    originalUrl: `/api/media/${encodeURIComponent(image.originalKey)}`,
    publishedUrl: image.publishedKey
      ? `/api/media/${encodeURIComponent(image.publishedKey)}`
      : null,
    runs: runs
      .filter(run => run.imageId === image.id)
      .map(run => ({
        ...run,
        outputUrl: run.outputKey
          ? `/api/media/${encodeURIComponent(run.outputKey)}`
          : null,
      })),
  }));
  const legacy = preservationManifest.collections.map(collection => ({ id: `legacy:${collection.id}`, title: collection.title, description: "Recovered legacy collection. Exact AI model and prompt provenance for its historical studies is unavailable.", people: "", estimatedDate: collection.assertedDate, tags: ["Recovered legacy collection"], status: "published", originalName: collection.original.filename, originalType: collection.original.mimeType, originalBytes: collection.original.bytes, originalSha256: collection.original.sha256, originalUrl: collection.original.url, publishedUrl: collection.original.url, readOnlyLegacy: true, createdAt: null, runs: collection.studies.map(study => ({ id: study.id, model: "Legacy AI — exact model unknown", recipe: study.type, prompt: "Exact legacy prompt unavailable.", status: "legacy", outputUrl: study.url })) }));
  return Response.json({ images: [...stored, ...legacy] });
}

export async function POST(request: Request) {
  if (!hasTrustedArchiveOrigin(request)) {
    return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  }
  const user = await requireArchiveAdmin("/studio");
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 53 * 1024 * 1024) return Response.json({ error: "This upload request is too large." }, { status: 413 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose an image to upload." }, { status: 400 });
  if (file.size > 50 * 1024 * 1024) return Response.json({ error: "Images must be 50 MB or smaller." }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectSafeRaster(bytes);
  if (!detected) return Response.json({ error: "Use a genuine JPEG, PNG, or WebP file. SVG and unverified image formats are not accepted." }, { status: 415 });
  const dimensions = readSafeRasterDimensions(bytes);
  if (!dimensions) return Response.json({ error: "The image is truncated or its dimensions cannot be verified safely." }, { status: 415 });
  if (dimensions.width * dimensions.height > 100_000_000) return Response.json({ error: "The image exceeds the 100-megapixel safe-processing limit. Preserve the master separately and upload a display scan." }, { status: 413 });
  const originalSha256 = await sha256Hex(bytes);
  const duplicate = await getDb().select({ id: archiveImages.id, title: archiveImages.title }).from(archiveImages).where(eq(archiveImages.originalSha256, originalSha256)).limit(1);
  if (duplicate[0]) return Response.json({ error: `This exact original is already preserved as “${duplicate[0].title}”.`, existingId: duplicate[0].id }, { status: 409 });
  const id = crypto.randomUUID();
  const originalKey = `originals/sha256/${originalSha256}.${detected.extension}`;
  await bucket().put(originalKey, bytes, { onlyIf: { etagDoesNotMatch: "*" }, httpMetadata: { contentType: detected.type }, customMetadata: { originalName: file.name, uploadedBy: user.email, sha256: originalSha256 } });
  const title = String(form.get("title") || file.name.replace(/\.[^.]+$/, "") || "Untitled photograph").trim();
  const tags = String(form.get("tags") || "").split(",").map(value => value.trim()).filter(Boolean);
  await getDb().insert(archiveImages).values({ id, title, description: String(form.get("description") || "").trim(), people: String(form.get("people") || "").trim(), estimatedDate: String(form.get("estimatedDate") || "").trim() || null, tags: JSON.stringify(tags), rights: String(form.get("rights") || "Family archive — permission required").trim(), originalKey, originalName: file.name, originalType: detected.type, originalBytes: bytes.byteLength, originalSha256, originalWidth: dimensions.width, originalHeight: dimensions.height, sourceProvenance: "owner-studio-ingest", createdBy: user.email });
  await getDb().insert(archiveEvents).values({ id: crypto.randomUUID(), imageId: id, eventType: "original:ingested", actor: user.email, detail: JSON.stringify({ sha256: originalSha256, bytes: bytes.byteLength, source: "owner-studio" }) });
  return Response.json({ id }, { status: 201 });
}
