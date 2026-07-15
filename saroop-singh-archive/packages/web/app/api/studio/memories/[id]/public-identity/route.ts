import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  archiveImages,
  memorySubmissions,
  publicIdentityTagEvents,
  publicIdentityTags,
} from "@/db/schema";
import { requireArchiveAdmin } from "@/lib/archive-auth";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";

const eligibleReviewStates = new Set(["corroborated", "approved"]);

async function isPublishedArchiveSubject(subjectId: string): Promise<boolean> {
  const image = await getDb()
    .select({ id: archiveImages.id })
    .from(archiveImages)
    .where(
      and(
        eq(archiveImages.id, subjectId),
        eq(archiveImages.status, "published"),
      ),
    )
    .limit(1);
  return Boolean(image[0]);
}

async function loadEligibleMemory(id: string) {
  const [memory] = await getDb()
    .select()
    .from(memorySubmissions)
    .where(eq(memorySubmissions.id, id))
    .limit(1);
  if (!memory) return { error: Response.json({ error: "Memory not found." }, { status: 404 }) };
  if (
    memory.kind !== "identify" ||
    !memory.subjectId ||
    !memory.proposedName ||
    !eligibleReviewStates.has(memory.status)
  ) {
    return {
      error: Response.json(
        { error: "Corroborate this complete identification before making it public." },
        { status: 409 },
      ),
    };
  }
  if (!(await isPublishedArchiveSubject(memory.subjectId))) {
    return {
      error: Response.json(
        { error: "The linked photograph is not publicly published." },
        { status: 409 },
      ),
    };
  }
  return { memory };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasTrustedArchiveOrigin(request)) {
    return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  }
  const user = await requireArchiveAdmin("/studio/memories");
  const { id } = await context.params;
  const result = await loadEligibleMemory(id);
  if ("error" in result) return result.error;
  const { memory } = result;
  const now = new Date().toISOString();
  const db = getDb();

  const applied = db.transaction((transaction) => {
    const existing = transaction
      .select()
      .from(publicIdentityTags)
      .where(eq(publicIdentityTags.sourceMemoryId, memory.id))
      .get();
    if (existing?.status === "published") return { tag: existing, changed: false };

    const tag = existing
      ? (() => {
          transaction
            .update(publicIdentityTags)
            .set({
              status: "published",
              name: memory.proposedName!,
              anchorX: memory.anchorX,
              anchorY: memory.anchorY,
              publishedBy: user.email,
              publishedAt: now,
            })
            .where(eq(publicIdentityTags.id, existing.id))
            .run();
          return { ...existing, status: "published", name: memory.proposedName! };
        })()
      : (() => {
          const created = {
            id: crypto.randomUUID(),
            subjectId: memory.subjectId!,
            sourceMemoryId: memory.id,
            name: memory.proposedName!,
            anchorX: memory.anchorX,
            anchorY: memory.anchorY,
            status: "published",
            publishedBy: user.email,
            publishedAt: now,
          };
          transaction.insert(publicIdentityTags).values(created).run();
          return created;
        })();

    transaction
      .update(memorySubmissions)
      .set({ status: "approved", reviewedBy: user.email, reviewedAt: now })
      .where(eq(memorySubmissions.id, memory.id))
      .run();
    transaction
      .insert(publicIdentityTagEvents)
      .values({
        id: crypto.randomUUID(),
        identityTagId: tag.id,
        subjectId: memory.subjectId!,
        eventType: "public:published",
        actor: user.email,
        detail: JSON.stringify({ sourceMemoryId: memory.id, name: memory.proposedName }),
      })
      .run();
    return { tag, changed: true };
  });

  return Response.json({
    applied: applied.changed,
    publicIdentity: {
      id: applied.tag.id,
      name: applied.tag.name,
      status: applied.tag.status,
    },
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasTrustedArchiveOrigin(request)) {
    return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  }
  const user = await requireArchiveAdmin("/studio/memories");
  const { id } = await context.params;
  const db = getDb();
  const memory = db
    .select()
    .from(memorySubmissions)
    .where(eq(memorySubmissions.id, id))
    .get();
  if (!memory) return Response.json({ error: "Memory not found." }, { status: 404 });

  const removed = db.transaction((transaction) => {
    const tag = transaction
      .select()
      .from(publicIdentityTags)
      .where(
        and(
          eq(publicIdentityTags.sourceMemoryId, memory.id),
          eq(publicIdentityTags.status, "published"),
        ),
      )
      .get();
    if (!tag) return null;
    const now = new Date().toISOString();
    transaction
      .update(publicIdentityTags)
      .set({ status: "removed", removedBy: user.email, removedAt: now })
      .where(eq(publicIdentityTags.id, tag.id))
      .run();
    transaction
      .update(memorySubmissions)
      .set({ status: "corroborated", reviewedBy: user.email, reviewedAt: now })
      .where(eq(memorySubmissions.id, memory.id))
      .run();
    transaction
      .insert(publicIdentityTagEvents)
      .values({
        id: crypto.randomUUID(),
        identityTagId: tag.id,
        subjectId: tag.subjectId,
        eventType: "public:removed",
        actor: user.email,
        detail: JSON.stringify({ sourceMemoryId: memory.id, name: tag.name }),
      })
      .run();
    return tag;
  });
  if (!removed) {
    return Response.json({ error: "This identification is not public." }, { status: 409 });
  }
  return Response.json({ removed: true });
}
