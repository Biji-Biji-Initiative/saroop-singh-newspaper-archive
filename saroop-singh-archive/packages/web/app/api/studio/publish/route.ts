import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { archiveEvents, archiveImages, restorationRuns } from "@/db/schema";
import { requireArchiveAdmin } from "@/lib/archive-auth";
import { getImage, getRun } from "@/lib/archive-server";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  if (!hasTrustedArchiveOrigin(request)) {
    return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  }
  const user = await requireArchiveAdmin("/studio");
  const { imageId, runId, publish, publicationConfirmed, comparisonConfirmed } = await request.json() as { imageId?: string; runId?: string; publish?: boolean; publicationConfirmed?: boolean; comparisonConfirmed?: boolean };
  if (typeof publish !== "boolean") return Response.json({ error: "Choose an explicit publish or withdraw action." }, { status: 400 });
  const image = imageId ? await getImage(imageId) : null;
  if (!image) return Response.json({ error: "Photograph not found." }, { status: 404 });
  if (!publish) {
    if (image.status !== "published") return Response.json({ error: "Only a published photograph can be withdrawn." }, { status: 409 });
    await getDb().update(archiveImages).set({ status: "private", publishedKey: null, publishedAt: null }).where(eq(archiveImages.id, image.id));
    await getDb().insert(archiveEvents).values({ id: crypto.randomUUID(), imageId: image.id, eventType: "publication:withdrawn", actor: user.email, detail: "{}" });
    return Response.json({ status: "private" });
  }
  if (image.status === "submitted" || image.status === "rejected") {
    return Response.json(
      { error: "Accept this contribution into private review and confirm its record before publication." },
      { status: 409 },
    );
  }
  if (publicationConfirmed !== true) return Response.json({ error: "Confirm publication permission and the public metadata check." }, { status: 409 });
  const run = runId ? await getRun(runId) : null;
  if (runId && (!run || run.imageId !== image.id || run.status !== "ready" || !run.outputKey)) return Response.json({ error: "That restoration is not ready or does not belong to this original." }, { status: 409 });
  if (run && comparisonConfirmed !== true) return Response.json({ error: "Confirm the human source-to-study comparison before publishing this restoration." }, { status: 409 });
  const publishedKey = run?.outputKey || image.originalKey;
  if (run) await getDb().update(restorationRuns).set({ reviewStatus: "approved", reviewedBy: user.email, reviewedAt: new Date().toISOString(), publishedAt: new Date().toISOString() }).where(eq(restorationRuns.id, run.id));
  await getDb().update(archiveImages).set({ status: "published", publishedKey, publishedAt: new Date().toISOString() }).where(eq(archiveImages.id, image.id));
  await getDb().insert(archiveEvents).values({ id: crypto.randomUUID(), imageId: image.id, eventType: run ? "restoration:approved-and-published" : "original:published", actor: user.email, detail: JSON.stringify({ runId: run?.id || null, publishedKey, publicationConfirmed: true, comparisonConfirmed: run ? true : null, rightsStatement: image.rights }) });
  return Response.json({ status: "published" });
}
