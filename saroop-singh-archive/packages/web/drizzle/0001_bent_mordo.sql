ALTER TABLE `archive_images` ADD `original_sha256` text;--> statement-breakpoint
CREATE UNIQUE INDEX `archive_images_sha256_unique` ON `archive_images` (`original_sha256`);--> statement-breakpoint
CREATE INDEX `archive_images_status_idx` ON `archive_images` (`status`);--> statement-breakpoint
ALTER TABLE `restoration_runs` ADD `output_sha256` text;--> statement-breakpoint
ALTER TABLE `restoration_runs` ADD `intervention_class` text DEFAULT 'conservation' NOT NULL;--> statement-breakpoint
ALTER TABLE `restoration_runs` ADD `prompt_version` text DEFAULT 'preservation-v1' NOT NULL;--> statement-breakpoint
ALTER TABLE `restoration_runs` ADD `review_status` text DEFAULT 'unreviewed' NOT NULL;--> statement-breakpoint
ALTER TABLE `restoration_runs` ADD `reviewed_by` text;--> statement-breakpoint
ALTER TABLE `restoration_runs` ADD `reviewed_at` text;--> statement-breakpoint
ALTER TABLE `restoration_runs` ADD `published_at` text;--> statement-breakpoint
CREATE INDEX `restoration_runs_image_idx` ON `restoration_runs` (`image_id`);--> statement-breakpoint
CREATE INDEX `restoration_runs_review_idx` ON `restoration_runs` (`review_status`);