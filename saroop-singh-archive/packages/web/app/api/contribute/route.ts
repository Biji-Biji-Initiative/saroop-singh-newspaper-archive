import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { archiveEvents, archiveImages, contributionBatchItems, contributionBatches } from "@/db/schema";
import { bucket, detectSafeRaster, FAMILY_AI_CONSENT_VERSION, readSafeRasterDimensions, sha256Hex } from "@/lib/archive-server";
import { hasTrustedArchiveOrigin } from "@/lib/request-origin";
import {
  configuredDailyLimit,
  dailyRequestSourceHash,
} from "@/lib/request-source";

export const runtime = "nodejs";

const contributionIntakeEnabled = () =>
  !["false", "0", "off"].includes(
    process.env.CONTRIBUTIONS_ENABLED?.trim().toLowerCase() || "",
  );
const opaqueToken = /^[A-Za-z0-9-]{50,100}$/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function receiptUrl(token: string) {
  return `/contribution-receipt/${token}`;
}

export async function POST(request: Request) {
  if (!hasTrustedArchiveOrigin(request)) {
    return Response.json({ error: "Untrusted request origin." }, { status: 403 });
  }
  if (!contributionIntakeEnabled()) {
    return Response.json(
      { error: "Family photograph intake is temporarily closed." },
      { status: 503, headers: { "cache-control": "private, no-store" } },
    );
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 27 * 1024 * 1024) return Response.json({ error: "This upload request is too large." }, { status: 413 });
  const form = await request.formData();
  if (String(form.get("website") || "")) return Response.json({ received: true }, { status: 202 });
  if (form.get("consent") !== "yes") return Response.json({ error: "Please confirm that the archive may privately review this material." }, { status: 400 });
  const contributorName = String(form.get("contributorName") || "").trim().slice(0, 120);
  if (!contributorName) return Response.json({ error: "Please tell us your name." }, { status: 400 });
  const receiptToken = String(form.get("receiptToken") || "").trim();
  const uploadToken = String(form.get("uploadToken") || "").trim();
  const clientItemId = String(form.get("clientItemId") || "").trim();
  if (
    !opaqueToken.test(receiptToken) ||
    !opaqueToken.test(uploadToken) ||
    receiptToken === uploadToken ||
    !uuid.test(clientItemId)
  ) {
    return Response.json({ error: "Start a new private contribution session and try again." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose a photograph." }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return Response.json({ error: "Each photograph must be 25 MB or smaller." }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectSafeRaster(bytes);
  if (!detected) return Response.json({ error: "Please use a genuine JPEG, PNG, or WebP photograph." }, { status: 415 });
  const dimensions = readSafeRasterDimensions(bytes);
  if (!dimensions) return Response.json({ error: "This image is truncated or its dimensions cannot be verified safely." }, { status: 415 });
  if (dimensions.width * dimensions.height > 100_000_000) return Response.json({ error: "This image has too many pixels to process safely. Please export a copy below 100 megapixels." }, { status: 413 });

  const originalSha256 = await sha256Hex(bytes);
  const receiptTokenHash = await sha256Hex(new TextEncoder().encode(receiptToken));
  const uploadTokenHash = await sha256Hex(new TextEncoder().encode(uploadToken));
  const db = getDb();
  let batch = (
    await db
      .select({
        id: contributionBatches.id,
        uploadTokenHash: contributionBatches.uploadTokenHash,
      })
      .from(contributionBatches)
      .where(eq(contributionBatches.receiptTokenHash, receiptTokenHash))
      .limit(1)
  )[0];
  if (batch && batch.uploadTokenHash !== uploadTokenHash) {
    return Response.json(
      { error: "This private receipt link cannot be used to upload photographs." },
      { status: 403 },
    );
  }
  const findExistingItem = async (batchId: string) =>
    (
      await db
        .select({
          imageId: contributionBatchItems.imageId,
          originalSha256: contributionBatchItems.originalSha256,
          disposition: contributionBatchItems.disposition,
        })
        .from(contributionBatchItems)
        .where(
          and(
            eq(contributionBatchItems.batchId, batchId),
            eq(contributionBatchItems.clientItemId, clientItemId),
          ),
        )
        .limit(1)
    )[0];
  const existingItem = batch && await findExistingItem(batch.id);
  if (existingItem) {
    if (existingItem.originalSha256 !== originalSha256) {
      return Response.json(
        { error: "This upload retry belongs to a different photograph." },
        { status: 409 },
      );
    }
    return Response.json(
      {
        received: true,
        id: existingItem.imageId,
        duplicate: existingItem.disposition === "duplicate",
        receiptUrl: receiptUrl(receiptToken),
      },
      { status: 200, headers: { "cache-control": "private, no-store" } },
    );
  }

  const day = new Date().toISOString().slice(0, 10);
  const submissionSourceHash = dailyRequestSourceHash(request, "contribution");
  const [[{ value: submittedToday }], [{ value: totalSubmittedToday }]] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(contributionBatchItems)
        .innerJoin(
          contributionBatches,
          eq(contributionBatchItems.batchId, contributionBatches.id),
        )
        .where(
          and(
            eq(contributionBatches.submissionSourceHash, submissionSourceHash),
            gte(contributionBatchItems.createdAt, day + " 00:00:00"),
          ),
        ),
      db
        .select({ value: count() })
        .from(archiveImages)
        .where(gte(archiveImages.createdAt, day + " 00:00:00")),
    ]);
  if (submittedToday >= 60) {
    return Response.json(
      {
        error:
          "This network has reached today’s contribution safety limit. Please contact the archive if your family event needs a larger batch.",
      },
      { status: 429 },
    );
  }
  const globalLimit = configuredDailyLimit(
    "CONTRIBUTION_DAILY_GLOBAL_LIMIT",
    500,
    5_000,
  );
  if (totalSubmittedToday >= globalLimit) {
    return Response.json(
      {
        error:
          "The archive has reached today’s safe storage limit. Please try again tomorrow or contact the archive owner.",
      },
      { status: 429 },
    );
  }

  if (!batch) {
    db.transaction(transaction => {
      transaction
        .insert(contributionBatches)
        .values({
          id: crypto.randomUUID(),
          receiptTokenHash,
          uploadTokenHash,
          submissionSourceHash,
        })
        .onConflictDoNothing()
        .run();
    });
    batch = (
      await db
        .select({
          id: contributionBatches.id,
          uploadTokenHash: contributionBatches.uploadTokenHash,
        })
        .from(contributionBatches)
        .where(eq(contributionBatches.receiptTokenHash, receiptTokenHash))
        .limit(1)
    )[0];
    if (!batch) {
      return Response.json(
        { error: "Start a new private contribution session and try again." },
        { status: 409 },
      );
    }
    if (batch.uploadTokenHash !== uploadTokenHash) {
      return Response.json(
        { error: "This private receipt link cannot be used to upload photographs." },
        { status: 403 },
      );
    }
    const racedItem = await findExistingItem(batch.id);
    if (racedItem) {
      if (racedItem.originalSha256 !== originalSha256) {
        return Response.json(
          { error: "This upload retry belongs to a different photograph." },
          { status: 409 },
        );
      }
      return Response.json(
        {
          received: true,
          id: racedItem.imageId,
          duplicate: racedItem.disposition === "duplicate",
          receiptUrl: receiptUrl(receiptToken),
        },
        { status: 200, headers: { "cache-control": "private, no-store" } },
      );
    }
  }

  const title = String(form.get("title") || file.name.replace(/\.[^.]+$/, "") || "Family photograph").trim().slice(0, 180);
  const story = String(form.get("story") || "").trim().slice(0, 5000);
  const people = String(form.get("people") || "").trim().slice(0, 500);
  const estimatedDate = String(form.get("estimatedDate") || "").trim().slice(0, 100) || null;
  const relationship = String(form.get("relationship") || "").trim().slice(0, 160);
  const contact = String(form.get("contact") || "").trim().slice(0, 240);
  const aiConsentGranted = form.get("aiProcessingConsent") === "yes";
  const requestedPreference = String(form.get("restorationPreference") || "clean-preserve");
  const restorationPreference = aiConsentGranted && new Set(["clean-preserve", "repair-damage", "explore-colour"]).has(requestedPreference) ? requestedPreference : "original-only";
  const consentRecordedAt = new Date().toISOString();
  const batchId = batch!.id;
  const batchItem = (imageId: string, disposition: "received" | "duplicate") => ({
    id: crypto.randomUUID(),
    batchId,
    clientItemId,
    imageId,
    originalSha256,
    disposition,
  });
  const duplicateEvent = (imageId: string) => ({
    id: crypto.randomUUID(),
    imageId,
    eventType: "contribution:duplicate-file-context-received",
    actor: contributorName,
    detail: JSON.stringify({
      title,
      story,
      people,
      estimatedDate,
      relationship,
      contact,
      aiProcessingConsent: aiConsentGranted ? "granted" : "declined",
      aiConsentWordingVersion: FAMILY_AI_CONSENT_VERSION,
      restorationPreference,
      receivedAt: consentRecordedAt,
    }),
  });
  const duplicate = await db
    .select({ id: archiveImages.id })
    .from(archiveImages)
    .where(eq(archiveImages.originalSha256, originalSha256))
    .limit(1);
  if (duplicate[0]) {
    const added = db.transaction(transaction => {
      const result = transaction
        .insert(contributionBatchItems)
        .values(batchItem(duplicate[0].id, "duplicate"))
        .onConflictDoNothing()
        .run();
      if (result.changes) {
        transaction.insert(archiveEvents).values(duplicateEvent(duplicate[0].id)).run();
      }
      return result.changes > 0;
    });
    if (!added) {
      const racedItem = await findExistingItem(batchId);
      if (!racedItem || racedItem.originalSha256 !== originalSha256) {
        return Response.json(
          { error: "This upload retry belongs to a different photograph." },
          { status: 409 },
        );
      }
      return Response.json(
        {
          received: true,
          id: racedItem.imageId,
          duplicate: racedItem.disposition === "duplicate",
          receiptUrl: receiptUrl(receiptToken),
        },
        { status: 200, headers: { "cache-control": "private, no-store" } },
      );
    }
    return Response.json(
      {
        received: true,
        id: duplicate[0].id,
        duplicate: true,
        receiptUrl: receiptUrl(receiptToken),
      },
      { status: 200, headers: { "cache-control": "private, no-store" } },
    );
  }

  const id = crypto.randomUUID();
  const originalKey = "originals/sha256/" + originalSha256 + "." + detected.extension;
  const stored = await bucket().put(originalKey, bytes, {
    onlyIf: { etagDoesNotMatch: "*" },
    httpMetadata: { contentType: detected.type },
    customMetadata: {
      originalName: file.name,
      source: "public-family-contribution",
      sha256: originalSha256,
    },
  });
  const deleteUnreferencedOriginal = async () => {
    if (!stored) return;
    const referenced = await db
      .select({ id: archiveImages.id })
      .from(archiveImages)
      .where(eq(archiveImages.originalSha256, originalSha256))
      .limit(1);
    if (!referenced[0]) await bucket().delete(originalKey);
  };
  try {
    const persisted = db.transaction(transaction => {
      const imageInserted = transaction
        .insert(archiveImages)
        .values({
          id,
          title,
          description: story,
          people,
          estimatedDate,
          tags: "[]",
          rights: "Family contribution — private review required",
          originalKey,
          originalName: file.name,
          originalType: detected.type,
          originalBytes: bytes.byteLength,
          originalSha256,
          originalWidth: dimensions.width,
          originalHeight: dimensions.height,
          sourceProvenance: "family-contribution",
          status: "submitted",
          createdBy: "public-family-contribution",
          contributorName,
          contributorRelationship: relationship,
          contributorContact: contact,
          restorationPreference,
          aiProcessingConsent: aiConsentGranted ? "granted" : "declined",
          aiProcessingConsentWordingVersion: FAMILY_AI_CONSENT_VERSION,
          aiProcessingConsentRecordedAt: consentRecordedAt,
          submissionSourceHash,
        })
        .onConflictDoNothing()
        .run().changes > 0;
      const imageId = imageInserted
        ? id
        : transaction
            .select({ id: archiveImages.id })
            .from(archiveImages)
            .where(eq(archiveImages.originalSha256, originalSha256))
            .get()?.id;
      if (!imageId) throw new Error("The archived source could not be located.");
      const disposition = imageInserted ? "received" : "duplicate";
      const itemAdded = transaction
        .insert(contributionBatchItems)
        .values(batchItem(imageId, disposition))
        .onConflictDoNothing()
        .run().changes > 0;
      if (!itemAdded) {
        if (imageInserted) {
          transaction.delete(archiveImages).where(eq(archiveImages.id, id)).run();
        }
        return { imageId, disposition, itemAdded: false };
      }
      transaction
        .insert(archiveEvents)
        .values(
          imageInserted
            ? {
                id: crypto.randomUUID(),
                imageId,
                eventType: "contribution:received",
                actor: contributorName,
                detail: JSON.stringify({
                  sha256: originalSha256,
                  bytes: bytes.byteLength,
                  relationship,
                  aiProcessingConsent: aiConsentGranted ? "granted" : "declined",
                  aiConsentWordingVersion: FAMILY_AI_CONSENT_VERSION,
                }),
              }
            : duplicateEvent(imageId),
        )
        .run();
      return { imageId, disposition, itemAdded: true };
    });
    if (!persisted.itemAdded) {
      await deleteUnreferencedOriginal();
      const racedItem = await findExistingItem(batchId);
      if (!racedItem || racedItem.originalSha256 !== originalSha256) {
        return Response.json(
          { error: "This upload retry belongs to a different photograph." },
          { status: 409 },
        );
      }
      return Response.json(
        {
          received: true,
          id: racedItem.imageId,
          duplicate: racedItem.disposition === "duplicate",
          receiptUrl: receiptUrl(receiptToken),
        },
        { status: 200, headers: { "cache-control": "private, no-store" } },
      );
    }
    return Response.json(
      {
        received: true,
        id: persisted.imageId,
        duplicate: persisted.disposition === "duplicate",
        receiptUrl: receiptUrl(receiptToken),
      },
      {
        status: persisted.disposition === "received" ? 201 : 200,
        headers: { "cache-control": "private, no-store" },
      },
    );
  } catch (error) {
    await deleteUnreferencedOriginal();
    throw error;
  }
}
