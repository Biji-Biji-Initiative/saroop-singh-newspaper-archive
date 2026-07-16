-- These canonical objects were already publicly presented by the former
-- gallery. Preserve that fact without inventing modern provider or prompt
-- provenance: public comparison uses a distinct recovered-historical state.
UPDATE `restoration_runs`
SET
  `review_status` = 'recovered-historical',
  `published_at` = COALESCE(`published_at`, CURRENT_TIMESTAMP)
WHERE
  `provider` = 'historical-import'
  AND `model` = 'not-recorded'
  AND `status` = 'ready'
  AND `output_key` IS NOT NULL
  AND `review_status` = 'unreviewed';
--> statement-breakpoint
INSERT INTO `archive_events` (`id`, `image_id`, `event_type`, `actor`, `detail`, `created_at`)
SELECT
  'canonical-recovered-historical-public/v1:' || `id`,
  `image_id`,
  'restoration:recovered-historical-published',
  'canonical-archive-migration',
  json_object(
    'schema', 'canonical-recovered-historical-public/v1',
    'provenance', 'Older AI workflow; exact provider, model and prompt were not retained.',
    'presentation', 'Visible only as a labelled comparison variation; not a curator-approved modern restoration.'
  ),
  CURRENT_TIMESTAMP
FROM `restoration_runs`
WHERE
  `provider` = 'historical-import'
  AND `model` = 'not-recorded'
  AND `status` = 'ready'
  AND `output_key` IS NOT NULL
  AND `review_status` = 'recovered-historical'
  AND NOT EXISTS (
    SELECT 1
    FROM `archive_events`
    WHERE `archive_events`.`id` = 'canonical-recovered-historical-public/v1:' || `restoration_runs`.`id`
  );
