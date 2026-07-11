CREATE TABLE `archive_images` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`people` text DEFAULT '' NOT NULL,
	`estimated_date` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`rights` text DEFAULT 'Family archive — permission required' NOT NULL,
	`original_key` text NOT NULL,
	`original_name` text NOT NULL,
	`original_type` text NOT NULL,
	`original_bytes` integer NOT NULL,
	`published_key` text,
	`status` text DEFAULT 'private' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`published_at` text
);
--> statement-breakpoint
CREATE TABLE `restoration_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`image_id` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`recipe` text NOT NULL,
	`prompt` text NOT NULL,
	`output_key` text,
	`output_type` text,
	`status` text DEFAULT 'processing' NOT NULL,
	`error` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`image_id`) REFERENCES `archive_images`(`id`) ON UPDATE no action ON DELETE no action
);
