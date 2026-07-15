import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const archiveImages = sqliteTable("archive_images", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  people: text("people").notNull().default(""),
  estimatedDate: text("estimated_date"),
  tags: text("tags").notNull().default("[]"),
  rights: text("rights").notNull().default("Family archive — permission required"),
  originalKey: text("original_key").notNull(),
  originalName: text("original_name").notNull(),
  originalType: text("original_type").notNull(),
  originalBytes: integer("original_bytes").notNull(),
  originalSha256: text("original_sha256"),
  originalWidth: integer("original_width"),
  originalHeight: integer("original_height"),
  sourceProvenance: text("source_provenance").notNull().default("not-recorded"),
  dateConfidence: text("date_confidence").notNull().default("unknown"),
  publishedKey: text("published_key"),
  status: text("status").notNull().default("private"),
  createdBy: text("created_by").notNull(),
  contributorName: text("contributor_name"),
  contributorRelationship: text("contributor_relationship"),
  contributorContact: text("contributor_contact"),
  restorationPreference: text("restoration_preference").notNull().default("clean-preserve"),
  aiProcessingConsent: text("ai_processing_consent").notNull().default("not-recorded"),
  aiProcessingConsentWordingVersion: text("ai_processing_consent_wording_version"),
  aiProcessingConsentRecordedAt: text("ai_processing_consent_recorded_at"),
  submissionSourceHash: text("submission_source_hash"),
  photoAnalysis: text("photo_analysis"),
  photoAnalysisModel: text("photo_analysis_model"),
  photoAnalysisStatus: text("photo_analysis_status").notNull().default("not-requested"),
  photoAnalyzedAt: text("photo_analyzed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  publishedAt: text("published_at"),
}, table => [uniqueIndex("archive_images_sha256_unique").on(table.originalSha256), index("archive_images_status_idx").on(table.status)]);

export const restorationRuns = sqliteTable("restoration_runs", {
  id: text("id").primaryKey(),
  imageId: text("image_id").notNull().references(() => archiveImages.id),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  recipe: text("recipe").notNull(),
  prompt: text("prompt").notNull(),
  outputKey: text("output_key"),
  outputType: text("output_type"),
  outputSha256: text("output_sha256"),
  interventionClass: text("intervention_class").notNull().default("conservation"),
  promptVersion: text("prompt_version").notNull().default("preservation-v1"),
  reviewStatus: text("review_status").notNull().default("unreviewed"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  publishedAt: text("published_at"),
  status: text("status").notNull().default("processing"),
  error: text("error"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [index("restoration_runs_image_idx").on(table.imageId), index("restoration_runs_review_idx").on(table.reviewStatus)]);

export const archiveEvents = sqliteTable("archive_events", {
  id: text("id").primaryKey(),
  imageId: text("image_id").notNull().references(() => archiveImages.id),
  eventType: text("event_type").notNull(),
  actor: text("actor").notNull(),
  detail: text("detail").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [index("archive_events_image_idx").on(table.imageId), index("archive_events_created_idx").on(table.createdAt)]);

export const contributionBatches = sqliteTable("contribution_batches", {
  id: text("id").primaryKey(),
  receiptTokenHash: text("receipt_token_hash").notNull(),
  uploadTokenHash: text("upload_token_hash").notNull(),
  submissionSourceHash: text("submission_source_hash"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [
  uniqueIndex("contribution_batch_receipt_unique").on(table.receiptTokenHash),
  uniqueIndex("contribution_batch_upload_unique").on(table.uploadTokenHash),
]);

export const contributionBatchItems = sqliteTable("contribution_batch_items", {
  id: text("id").primaryKey(),
  batchId: text("batch_id").notNull().references(() => contributionBatches.id),
  clientItemId: text("client_item_id").notNull(),
  imageId: text("image_id").notNull().references(() => archiveImages.id),
  originalSha256: text("original_sha256").notNull(),
  disposition: text("disposition").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [
  uniqueIndex("contribution_batch_client_item_unique").on(table.batchId, table.clientItemId),
  index("contribution_batch_item_batch_idx").on(table.batchId),
]);

export const memorySubmissions = sqliteTable("memory_submissions", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  subjectId: text("subject_id"),
  anchorX: integer("anchor_x"),
  anchorY: integer("anchor_y"),
  claimantName: text("claimant_name").notNull(),
  claimantRelationship: text("claimant_relationship"),
  claimantContact: text("claimant_contact"),
  proposedName: text("proposed_name"),
  certainty: text("certainty").notNull().default("unsure"),
  story: text("story").notNull().default(""),
  howKnown: text("how_known").notNull().default(""),
  assetKey: text("asset_key"),
  assetName: text("asset_name"),
  assetType: text("asset_type"),
  assetBytes: integer("asset_bytes"),
  assetSha256: text("asset_sha256"),
  consentScope: text("consent_scope").notNull().default("private-review"),
  attribution: text("attribution").notNull().default("named"),
  status: text("status").notNull().default("submitted"),
  receiptTokenHash: text("receipt_token_hash").notNull(),
  submissionSourceHash: text("submission_source_hash"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [uniqueIndex("memory_receipt_unique").on(table.receiptTokenHash), index("memory_status_idx").on(table.status), index("memory_subject_idx").on(table.subjectId)]);

export const publicIdentityTags = sqliteTable("public_identity_tags", {
  id: text("id").primaryKey(),
  subjectId: text("subject_id").notNull(),
  sourceMemoryId: text("source_memory_id").notNull().references(() => memorySubmissions.id),
  name: text("name").notNull(),
  anchorX: integer("anchor_x"),
  anchorY: integer("anchor_y"),
  status: text("status").notNull().default("published"),
  publishedBy: text("published_by").notNull(),
  publishedAt: text("published_at").notNull(),
  removedBy: text("removed_by"),
  removedAt: text("removed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [
  uniqueIndex("public_identity_source_unique").on(table.sourceMemoryId),
  index("public_identity_subject_status_idx").on(table.subjectId, table.status),
]);

export const publicIdentityTagEvents = sqliteTable("public_identity_tag_events", {
  id: text("id").primaryKey(),
  identityTagId: text("identity_tag_id").notNull().references(() => publicIdentityTags.id),
  subjectId: text("subject_id").notNull(),
  eventType: text("event_type").notNull(),
  actor: text("actor").notNull(),
  detail: text("detail").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [
  index("public_identity_event_tag_idx").on(table.identityTagId),
  index("public_identity_event_subject_idx").on(table.subjectId),
]);
