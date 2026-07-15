import { getPublicGalleryRecord } from "@/lib/public-gallery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = await getPublicGalleryRecord(id);
  if (!record) return Response.json({ error: "Collection record not found." }, { status: 404 });
  if (!record.hasIiifManifest || !record.original.width || !record.original.height) {
    return Response.json({ error: "This collection record is missing required image dimensions." }, { status: 409 });
  }

  const origin = new URL(request.url).origin;
  const manifestId = `${origin}/api/iiif/${id}/manifest`;
  const canvasId = `${manifestId}/canvas/1`;
  return Response.json(
    {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      id: manifestId,
      type: "Manifest",
      label: { en: [record.title] },
      summary: { en: [record.description] },
      requiredStatement: {
        label: { en: ["Rights and provenance"] },
        value: { en: [record.rights] },
      },
      homepage: [{ id: `${origin}/gallery/${id}`, type: "Text", label: { en: ["Collection record"] }, format: "text/html" }],
      seeAlso: [{ id: `${origin}/api/archive/manifest`, type: "Dataset", label: { en: ["Archive manifest and checksums"] }, format: "application/json" }],
      items: [{
        id: canvasId,
        type: "Canvas",
        height: record.original.height,
        width: record.original.width,
        items: [{
          id: `${canvasId}/page`,
          type: "AnnotationPage",
          items: [{
            id: `${canvasId}/page/painting`,
            type: "Annotation",
            motivation: "painting",
            body: {
              id: new URL(record.originalImageUrl, origin).href,
              type: "Image",
              format: record.original.mimeType,
              height: record.original.height,
              width: record.original.width,
            },
            target: canvasId,
          }],
        }],
      }],
    },
    {
      headers: {
        "content-type": "application/ld+json; charset=utf-8",
        "cache-control": "public, max-age=86400",
        "access-control-allow-origin": "*",
      },
    },
  );
}
