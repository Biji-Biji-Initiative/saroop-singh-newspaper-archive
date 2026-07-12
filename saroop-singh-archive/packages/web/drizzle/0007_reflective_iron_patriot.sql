ALTER TABLE `archive_images` ADD `photo_analysis` text;--> statement-breakpoint
ALTER TABLE `archive_images` ADD `photo_analysis_model` text;--> statement-breakpoint
ALTER TABLE `archive_images` ADD `photo_analysis_status` text DEFAULT 'not-requested' NOT NULL;--> statement-breakpoint
ALTER TABLE `archive_images` ADD `photo_analyzed_at` text;