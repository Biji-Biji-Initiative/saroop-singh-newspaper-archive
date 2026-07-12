CREATE TABLE `archive_events` (
	`id` text PRIMARY KEY NOT NULL,
	`image_id` text NOT NULL,
	`event_type` text NOT NULL,
	`actor` text NOT NULL,
	`detail` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`image_id`) REFERENCES `archive_images`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `archive_events_image_idx` ON `archive_events` (`image_id`);--> statement-breakpoint
CREATE INDEX `archive_events_created_idx` ON `archive_events` (`created_at`);