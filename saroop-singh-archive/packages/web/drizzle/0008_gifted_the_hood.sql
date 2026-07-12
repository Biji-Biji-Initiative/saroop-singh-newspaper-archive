CREATE TABLE `contribution_batch_items` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`client_item_id` text NOT NULL,
	`image_id` text NOT NULL,
	`original_sha256` text NOT NULL,
	`disposition` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `contribution_batches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`image_id`) REFERENCES `archive_images`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contribution_batch_client_item_unique` ON `contribution_batch_items` (`batch_id`,`client_item_id`);--> statement-breakpoint
CREATE INDEX `contribution_batch_item_batch_idx` ON `contribution_batch_items` (`batch_id`);--> statement-breakpoint
CREATE TABLE `contribution_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`receipt_token_hash` text NOT NULL,
	`upload_token_hash` text NOT NULL,
	`submission_source_hash` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contribution_batch_receipt_unique` ON `contribution_batches` (`receipt_token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `contribution_batch_upload_unique` ON `contribution_batches` (`upload_token_hash`);