import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  archiveImages,
  contributionBatchItems,
  contributionBatches,
} from "@/db/schema";
import { sha256Hex } from "@/lib/archive-server";

export const runtime = "nodejs";

const opaqueToken = /^[A-Za-z0-9-]{50,100}$/;

function receiptNotFound() {
  return Response.json(
    { error: "Receipt not found." },
    {
      status: 404,
      headers: {
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    },
  );
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!opaqueToken.test(token)) return receiptNotFound();

  const receiptTokenHash = await sha256Hex(new TextEncoder().encode(token));
  const db = getDb();
  const batch = await db
    .select({ id: contributionBatches.id, createdAt: contributionBatches.createdAt })
    .from(contributionBatches)
    .where(eq(contributionBatches.receiptTokenHash, receiptTokenHash))
    .limit(1);
  if (!batch[0]) return receiptNotFound();

  const items = await db
    .select({
      disposition: contributionBatchItems.disposition,
      imageStatus: archiveImages.status,
    })
    .from(contributionBatchItems)
    .innerJoin(
      archiveImages,
      eq(contributionBatchItems.imageId, archiveImages.id),
    )
    .where(eq(contributionBatchItems.batchId, batch[0].id));
  if (!items.length) return receiptNotFound();
  const received = items.filter((item) => item.disposition === "received");
  const receivedCount = received.length;
  const duplicateCount = items.filter(
    (item) => item.disposition === "duplicate",
  ).length;
  const pendingReviewCount = received.filter(
    (item) => item.imageStatus === "submitted",
  ).length;
  const status =
    receivedCount === 0
      ? "received"
      : pendingReviewCount > 0
        ? "submitted"
        : received.every((item) => item.imageStatus === "rejected")
          ? "not-accepted"
          : "reviewed";

  return Response.json(
    {
      createdAt: new Date(`${batch[0].createdAt}Z`).toISOString(),
      receivedCount,
      duplicateCount,
      pendingReviewCount,
      status,
    },
    {
      headers: {
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    },
  );
}
