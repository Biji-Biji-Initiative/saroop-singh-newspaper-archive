import { requireArchiveAdmin } from "@/lib/archive-auth";
import { normalizeCanonicalImageIds } from "@/lib/normalize-canonical-image-ids";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasTrustedArchiveOrigin(request)) {
    return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  }
  const user = await requireArchiveAdmin("/studio");
  const normalizations = await normalizeCanonicalImageIds(user.email);
  return Response.json({ normalized: normalizations.length });
}
