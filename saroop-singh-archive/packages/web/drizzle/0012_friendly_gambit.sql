ALTER TABLE `restoration_runs` ADD `family_rating` integer;--> statement-breakpoint
ALTER TABLE `restoration_runs` ADD `gallery_rank` integer;--> statement-breakpoint
ALTER TABLE `restoration_runs` ADD `gallery_visibility` text DEFAULT 'visible' NOT NULL;--> statement-breakpoint
ALTER TABLE `restoration_runs` ADD `gallery_curated_by` text;--> statement-breakpoint
ALTER TABLE `restoration_runs` ADD `gallery_curated_at` text;--> statement-breakpoint
CREATE INDEX `restoration_runs_gallery_visibility_idx` ON `restoration_runs` (`image_id`,`gallery_visibility`);