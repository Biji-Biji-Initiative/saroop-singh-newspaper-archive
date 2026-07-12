import { desc, eq } from "drizzle-orm";
import { requireArchiveAdmin } from "@/lib/archive-auth";
import { getDb } from "@/db";
import { memorySubmissions } from "@/db/schema";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";

export async function GET(request: Request) { await requireArchiveAdmin("/studio/memories"); const url = new URL(request.url); const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1); const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "100", 10) || 100)); const rows = await getDb().select().from(memorySubmissions).orderBy(desc(memorySubmissions.createdAt)).limit(limit + 1).offset((page - 1) * limit); const hasNextPage = rows.length > limit; const memories = rows.slice(0, limit); return Response.json({ memories: memories.map(item => ({ ...item, receiptTokenHash: undefined, submissionSourceHash: undefined, assetUrl: item.assetKey ? `/api/media/${item.assetKey}` : null })), page, limit, hasNextPage }); }
export async function PATCH(request: Request) {
  if (!hasTrustedArchiveOrigin(request)) return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  const user = await requireArchiveAdmin("/studio/memories");
  const body = await request.json() as { id?: string; status?: string };
  const allowed = new Set(["submitted", "clarify", "corroborated", "conflicting", "approved", "private", "rejected", "withdrawn"]);
  if (!body.id || !body.status || !allowed.has(body.status)) return Response.json({ error: "Invalid review decision." }, { status: 400 });
  const updated = await getDb().update(memorySubmissions).set({ status: body.status, reviewedBy: user.email, reviewedAt: new Date().toISOString() }).where(eq(memorySubmissions.id, body.id)).returning({ id: memorySubmissions.id });
  if (!updated[0]) return Response.json({ error: "Memory not found." }, { status: 404 });
  return Response.json({ saved: true });
}
