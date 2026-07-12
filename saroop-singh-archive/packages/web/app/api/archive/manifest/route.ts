import manifest from "@/data/generated/preservation-manifest.json";

export async function GET() {
  return Response.json(manifest, {
    headers: {
      "cache-control": "public, max-age=3600",
      "content-disposition": "attachment; filename=\"saroop-singh-preservation-manifest.json\"",
      "x-content-type-options": "nosniff",
    },
  });
}
