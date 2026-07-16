import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import Database from "better-sqlite3";

const root = new URL("..", import.meta.url).pathname;
const migration = readFileSync(
  join(root, "drizzle/0011_recovered_historical_variations.sql"),
  "utf8",
);

test("publishes recovered variations without publishing private modern runs", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE restoration_runs (
      id text primary key,
      image_id text not null,
      provider text not null,
      model text not null,
      status text not null,
      output_key text,
      review_status text not null,
      published_at text,
      created_at text not null
    );
    CREATE TABLE archive_events (
      id text primary key,
      image_id text not null,
      event_type text not null,
      actor text not null,
      detail text not null,
      created_at text not null
    );
  `);
  const insertRun = db.prepare(`
    INSERT INTO restoration_runs
      (id, image_id, provider, model, status, output_key, review_status, published_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertRun.run("recovered-null-date", "image-a", "historical-import", "not-recorded", "ready", "historical-studies/a.png", "unreviewed", null, "2025-08-31T11:03:23.291Z");
  insertRun.run("recovered-existing-date", "image-b", "historical-import", "not-recorded", "ready", "historical-studies/b.png", "unreviewed", "2025-09-01T00:00:00.000Z", "2025-08-31T11:03:23.291Z");
  insertRun.run("private-modern", "image-c", "openai", "gpt-image-2-2026-04-21", "ready", "restorations/private.png", "unreviewed", null, "2026-07-16T00:00:00.000Z");

  db.exec(migration);

  const rows = db.prepare(`SELECT id, review_status, published_at FROM restoration_runs ORDER BY id`).all();
  assert.deepEqual(rows[0], { id: "private-modern", review_status: "unreviewed", published_at: null });
  assert.deepEqual(rows[1], { id: "recovered-existing-date", review_status: "recovered-historical", published_at: "2025-09-01T00:00:00.000Z" });
  assert.equal(rows[2].id, "recovered-null-date");
  assert.equal(rows[2].review_status, "recovered-historical");
  assert.match(rows[2].published_at, /^\d{4}-\d{2}-\d{2} /);

  const events = db.prepare(`SELECT image_id, event_type, actor, detail FROM archive_events ORDER BY image_id`).all();
  assert.deepEqual(events.map(event => ({ ...event, detail: JSON.parse(event.detail) })), [
    {
      image_id: "image-a",
      event_type: "restoration:recovered-historical-published",
      actor: "canonical-archive-migration",
      detail: {
        schema: "canonical-recovered-historical-public/v1",
        provenance: "Older AI workflow; exact provider, model and prompt were not retained.",
        presentation: "Visible only as a labelled comparison variation; not a curator-approved modern restoration.",
      },
    },
    {
      image_id: "image-b",
      event_type: "restoration:recovered-historical-published",
      actor: "canonical-archive-migration",
      detail: {
        schema: "canonical-recovered-historical-public/v1",
        provenance: "Older AI workflow; exact provider, model and prompt were not retained.",
        presentation: "Visible only as a labelled comparison variation; not a curator-approved modern restoration.",
      },
    },
  ]);
});
