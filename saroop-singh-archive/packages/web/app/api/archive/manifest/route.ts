import { listPublicGalleryRecords } from "@/lib/public-gallery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const records = await listPublicGalleryRecords();
  const manifest = {
    schemaVersion: 2,
    collection: "Saroop Singh Archive",
    generatedAt: new Date().toISOString(),
    fixityAlgorithm: "SHA-256",
    counts: {
      publishedPhotographs: records.length,
      publishedComparisonVariations: records.reduce((total, record) => total + record.studies.length, 0),
    },
    photographs: records.map(record => ({
      id: record.id,
      title: record.title,
      assertedDate: record.date || "Date unknown",
      dateConfidence: record.dateConfidence,
      sourceProvenance: record.sourceProvenance,
      original: {
        url: record.originalImageUrl,
        filename: record.original.filename,
        mimeType: record.original.mimeType,
        bytes: record.original.bytes,
        sha256: record.original.sha256,
        width: record.original.width,
        height: record.original.height,
      },
      variations: record.studies,
    })),
  };
  return Response.json(manifest, {
    headers: {
      "cache-control": "public, max-age=3600",
      "content-disposition": "attachment; filename=\"saroop-singh-archive-manifest.json\"",
      "x-content-type-options": "nosniff",
    },
  });
}
