import { requireArchiveAdmin } from "@/lib/archive-auth";
import { importCanonicalGallery } from "@/lib/canonical-gallery-import";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasTrustedArchiveOrigin(request)) {
    return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  }
  const user = await requireArchiveAdmin("/studio");
  const result = await importCanonicalGallery();
  return Response.json(
    { migratedBy: user.email, ...result },
    { headers: { "cache-control": "private, no-store", "x-content-type-options": "nosniff" } },
  );
}
