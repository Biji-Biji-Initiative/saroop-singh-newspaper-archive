ALTER TABLE `archive_images` ADD `ai_processing_consent` text DEFAULT 'not-recorded' NOT NULL;--> statement-breakpoint
ALTER TABLE `archive_images` ADD `ai_processing_consent_wording_version` text;--> statement-breakpoint
ALTER TABLE `archive_images` ADD `ai_processing_consent_recorded_at` text;