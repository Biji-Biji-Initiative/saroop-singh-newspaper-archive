ALTER TABLE `archive_images` ADD `original_width` integer;--> statement-breakpoint
ALTER TABLE `archive_images` ADD `original_height` integer;--> statement-breakpoint
ALTER TABLE `archive_images` ADD `source_provenance` text DEFAULT 'not-recorded' NOT NULL;--> statement-breakpoint
ALTER TABLE `archive_images` ADD `date_confidence` text DEFAULT 'unknown' NOT NULL;