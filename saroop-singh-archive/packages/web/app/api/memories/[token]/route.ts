import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { memorySubmissions } from "@/db/schema";
import { sha256Hex } from "@/lib/archive-server";

export const runtime = "edge";
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; if (token.length < 50 || token.length > 100) return Response.json({ error: "Receipt not found." }, { status: 404 });
  const hash = await sha256Hex(new TextEncoder().encode(token)); const rows = await getDb().select({ kind: memorySubmissions.kind, status: memorySubmissions.status, createdAt: memorySubmissions.createdAt }).from(memorySubmissions).where(eq(memorySubmissions.receiptTokenHash, hash)).limit(1);
  if (!rows[0]) return Response.json({ error: "Receipt not found." }, { status: 404 });
  return Response.json(rows[0], { headers: { "cache-control": "private, no-store" } });
}
