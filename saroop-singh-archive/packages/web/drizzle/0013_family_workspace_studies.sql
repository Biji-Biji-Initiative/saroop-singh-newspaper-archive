ALTER TABLE `restoration_runs` ADD `family_session_hash` text;--> statement-breakpoint
CREATE INDEX `restoration_runs_family_session_idx` ON `restoration_runs` (`family_session_hash`);