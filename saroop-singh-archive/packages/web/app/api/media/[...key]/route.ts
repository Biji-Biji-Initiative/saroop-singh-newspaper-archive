import { eq, or } from "drizzle-orm";
import { bucket } from "@/lib/archive-server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { archiveImages } from "@/db/schema";

export const runtime = "edge";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params;
  const objectKey = key.join("/");
  const [image] = await getDb()
    .select()
    .from(archiveImages)
    .where(
      or(
        eq(archiveImages.originalKey, objectKey),
        eq(archiveImages.publishedKey, objectKey),
      ),
    )
    .limit(1);
  const isPublished = image?.status === "published" && (image.publishedKey === objectKey || image.originalKey === objectKey);
  if (!isPublished) {
    const user = await getChatGPTUser();
    const allowed = (process.env.ARCHIVE_ADMIN_EMAILS || "gurpreet@mereka.io").split(",").map(v => v.trim().toLowerCase());
    if (!user || !allowed.includes(user.email.toLowerCase())) return new Response("Not found", { status: 404 });
  }
  const object = await bucket().get(objectKey);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", isPublished ? "public, max-age=0, must-revalidate" : "private, no-store");
  headers.set("x-content-type-options", "nosniff");
  if (!isPublished) headers.set("content-disposition", `attachment; filename="${(image?.originalName || "archive-original").replace(/["\\\r\n]/g, "-")}"`);
  return new Response(object.body, { headers });
}
