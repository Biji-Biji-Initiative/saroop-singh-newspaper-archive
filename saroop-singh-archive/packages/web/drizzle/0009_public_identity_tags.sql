CREATE TABLE `public_identity_tag_events` (
	`id` text PRIMARY KEY NOT NULL,
	`identity_tag_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`event_type` text NOT NULL,
	`actor` text NOT NULL,
	`detail` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`identity_tag_id`) REFERENCES `public_identity_tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `public_identity_event_tag_idx` ON `public_identity_tag_events` (`identity_tag_id`);--> statement-breakpoint
CREATE INDEX `public_identity_event_subject_idx` ON `public_identity_tag_events` (`subject_id`);--> statement-breakpoint
CREATE TABLE `public_identity_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`source_memory_id` text NOT NULL,
	`name` text NOT NULL,
	`anchor_x` integer,
	`anchor_y` integer,
	`status` text DEFAULT 'published' NOT NULL,
	`published_by` text NOT NULL,
	`published_at` text NOT NULL,
	`removed_by` text,
	`removed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`source_memory_id`) REFERENCES `memory_submissions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `public_identity_source_unique` ON `public_identity_tags` (`source_memory_id`);--> statement-breakpoint
CREATE INDEX `public_identity_subject_status_idx` ON `public_identity_tags` (`subject_id`,`status`);