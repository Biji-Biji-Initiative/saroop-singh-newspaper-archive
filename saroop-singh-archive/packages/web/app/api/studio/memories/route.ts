import { desc, eq, inArray } from "drizzle-orm";
import { requireArchiveAdmin } from "@/lib/archive-auth";
import { getDb } from "@/db";
import { memorySubmissions, publicIdentityTags } from "@/db/schema";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";

export async function GET(request: Request) {
  await requireArchiveAdmin("/studio/memories");
  const url = new URL(request.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "100", 10) || 100));
  const db = getDb();
  const rows = await db
    .select()
    .from(memorySubmissions)
    .orderBy(desc(memorySubmissions.createdAt))
    .limit(limit + 1)
    .offset((page - 1) * limit);
  const hasNextPage = rows.length > limit;
  const memories = rows.slice(0, limit);
  const identities = memories.length
    ? await db
        .select()
        .from(publicIdentityTags)
        .where(
          inArray(
            publicIdentityTags.sourceMemoryId,
            memories.map((memory) => memory.id),
          ),
        )
    : [];
  const identitiesByMemory = new Map(
    identities.map((identity) => [identity.sourceMemoryId, identity]),
  );
  return Response.json({
    memories: memories.map((item) => {
      const identity = identitiesByMemory.get(item.id);
      return {
        ...item,
        receiptTokenHash: undefined,
        submissionSourceHash: undefined,
        assetUrl: item.assetKey ? `/api/media/${item.assetKey}` : null,
        publicIdentity: identity
          ? {
              id: identity.id,
              name: identity.name,
              status: identity.status,
              publishedAt: identity.publishedAt,
              removedAt: identity.removedAt,
            }
          : null,
      };
    }),
    page,
    limit,
    hasNextPage,
  });
}

export async function PATCH(request: Request) {
  if (!hasTrustedArchiveOrigin(request)) {
    return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  }
  const user = await requireArchiveAdmin("/studio/memories");
  const body = (await request.json()) as { id?: string; status?: string };
  const allowed = new Set([
    "submitted",
    "clarify",
    "corroborated",
    "conflicting",
    "approved",
    "private",
    "rejected",
    "withdrawn",
  ]);
  if (!body.id || !body.status || !allowed.has(body.status)) {
    return Response.json({ error: "Invalid review decision." }, { status: 400 });
  }

  const db = getDb();
  const [publicIdentity] = await db
    .select({ status: publicIdentityTags.status })
    .from(publicIdentityTags)
    .where(eq(publicIdentityTags.sourceMemoryId, body.id))
    .limit(1);
  if (publicIdentity?.status === "published" && body.status !== "approved") {
    return Response.json(
      { error: "Remove the public name before changing this claim's review state." },
      { status: 409 },
    );
  }

  const updated = await db
    .update(memorySubmissions)
    .set({
      status: body.status,
      reviewedBy: user.email,
      reviewedAt: new Date().toISOString(),
    })
    .where(eq(memorySubmissions.id, body.id))
    .returning({ id: memorySubmissions.id });
  if (!updated[0]) return Response.json({ error: "Memory not found." }, { status: 404 });
  return Response.json({ saved: true });
}
