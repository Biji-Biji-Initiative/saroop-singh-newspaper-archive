CREATE TABLE `memory_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`subject_id` text,
	`anchor_x` integer,
	`anchor_y` integer,
	`claimant_name` text NOT NULL,
	`claimant_relationship` text,
	`claimant_contact` text,
	`proposed_name` text,
	`certainty` text DEFAULT 'unsure' NOT NULL,
	`story` text DEFAULT '' NOT NULL,
	`how_known` text DEFAULT '' NOT NULL,
	`asset_key` text,
	`asset_name` text,
	`asset_type` text,
	`asset_bytes` integer,
	`asset_sha256` text,
	`consent_scope` text DEFAULT 'private-review' NOT NULL,
	`attribution` text DEFAULT 'named' NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`receipt_token_hash` text NOT NULL,
	`submission_source_hash` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memory_receipt_unique` ON `memory_submissions` (`receipt_token_hash`);--> statement-breakpoint
CREATE INDEX `memory_status_idx` ON `memory_submissions` (`status`);--> statement-breakpoint
CREATE INDEX `memory_subject_idx` ON `memory_submissions` (`subject_id`);