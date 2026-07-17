ALTER TABLE `restoration_runs` RENAME COLUMN "family_session_hash" TO "family_workspace_hash";--> statement-breakpoint
DROP INDEX `restoration_runs_family_session_idx`;--> statement-breakpoint
CREATE INDEX `restoration_runs_family_workspace_idx` ON `restoration_runs` (`family_workspace_hash`);