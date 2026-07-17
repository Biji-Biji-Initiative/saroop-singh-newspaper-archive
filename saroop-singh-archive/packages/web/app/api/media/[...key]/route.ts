import { and, eq, inArray, isNotNull, or } from "drizzle-orm";
import { bucket } from "@/lib/archive-server";
import { getDb } from "@/db";
import { archiveImages, restorationRuns } from "@/db/schema";
import { getArchiveUser } from "@/lib/archive-auth";
import { getFamilyWorkspace } from "@/lib/family-workspace";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params;
  const objectKey = key.join("/");
  const db = getDb();
  const [image] = await db
    .select()
    .from(archiveImages)
    .where(
      or(
        eq(archiveImages.originalKey, objectKey),
        eq(archiveImages.publishedKey, objectKey),
      ),
    )
    .limit(1);
  const [publishedStudy] = await db
    .select({ id: restorationRuns.id })
    .from(restorationRuns)
    .innerJoin(archiveImages, eq(restorationRuns.imageId, archiveImages.id))
    .where(
      and(
        eq(restorationRuns.outputKey, objectKey),
        eq(restorationRuns.status, "ready"),
        inArray(restorationRuns.reviewStatus, ["approved", "recovered-historical"]),
        eq(restorationRuns.galleryVisibility, "visible"),
        isNotNull(restorationRuns.publishedAt),
        eq(archiveImages.status, "published"),
        isNotNull(archiveImages.publishedAt),
      ),
    )
    .limit(1);
  const isPublished = Boolean(
    publishedStudy ||
      (image?.status === "published" &&
        image.originalKey === objectKey),
  );
  const familyWorkspace = isPublished ? null : getFamilyWorkspace();
  const [workspaceStudy] = familyWorkspace
    ? await db
      .select({ id: restorationRuns.id })
      .from(restorationRuns)
      .where(
        and(
          eq(restorationRuns.outputKey, objectKey),
          eq(restorationRuns.status, "ready"),
          eq(restorationRuns.familyWorkspaceHash, familyWorkspace.hash),
        ),
      )
      .limit(1)
    : [];
  const isWorkspaceStudy = Boolean(workspaceStudy);
  if (!isPublished && !isWorkspaceStudy) {
    const user = await getArchiveUser();
    if (!user) return new Response("Not found", { status: 404 });
  }
  const object = await bucket().get(objectKey);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", (isPublished || isWorkspaceStudy) ? "public, max-age=0, must-revalidate" : "private, no-store");
  headers.set("x-content-type-options", "nosniff");
  if (!isPublished && !isWorkspaceStudy) headers.set("content-disposition", `attachment; filename="${(image?.originalName || "archive-original").replace(/["\\\r\n]/g, "-")}"`);
  return new Response(await object.arrayBuffer(), { headers });
}
