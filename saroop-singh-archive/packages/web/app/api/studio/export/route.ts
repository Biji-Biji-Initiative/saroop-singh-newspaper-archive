import { desc } from "drizzle-orm";
import { requireArchiveAdmin } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { archiveEvents, archiveImages, memorySubmissions, restorationRuns } from "@/db/schema";
import preservationManifest from "@/data/generated/preservation-manifest.json";

export async function GET() {
  const user = await requireArchiveAdmin("/studio");
  const [images, runs, events, memories] = await Promise.all([
    getDb().select().from(archiveImages).orderBy(desc(archiveImages.createdAt)),
    getDb().select().from(restorationRuns).orderBy(desc(restorationRuns.createdAt)),
    getDb().select().from(archiveEvents).orderBy(desc(archiveEvents.createdAt)),
    getDb().select().from(memorySubmissions).orderBy(desc(memorySubmissions.createdAt)),
  ]);
  const payload = {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    exportedBy: user.email,
    warning: "Metadata and fixity export. Private media bytes remain in object storage and should be backed up separately.",
    legacyCorpus: preservationManifest,
    studio: {
      images: images.map(image => ({ ...image, tags: JSON.parse(image.tags), privateMediaPath: `/api/media/${image.originalKey}` })),
      restorationRuns: runs,
      auditEvents: events.map(event => ({ ...event, detail: JSON.parse(event.detail) })),
      memorySubmissions: memories.map(memory => ({ ...memory, privateMediaPath: memory.assetKey ? `/api/media/${memory.assetKey}` : null })),
    },
  };
  return Response.json(payload, { headers: { "content-disposition": `attachment; filename="saroop-singh-archive-export-${new Date().toISOString().slice(0, 10)}.json"`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
}
