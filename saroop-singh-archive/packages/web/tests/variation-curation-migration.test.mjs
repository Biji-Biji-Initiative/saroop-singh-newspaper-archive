import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import Database from "better-sqlite3";

const root = new URL("..", import.meta.url).pathname;
const migration = readFileSync(
  join(root, "drizzle/0012_friendly_gambit.sql"),
  "utf8",
);

test("variation curation adds a durable visible-by-default ranking surface", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE restoration_runs (
      id text primary key,
      image_id text not null,
      created_at text not null
    );
  `);

  db.exec(migration);
  db.prepare(
    "INSERT INTO restoration_runs (id, image_id, created_at) VALUES (?, ?, ?)",
  ).run("study-a", "image-a", "2026-07-16T10:00:00.000Z");

  assert.deepEqual(
    db.prepare(
      "SELECT family_rating, gallery_rank, gallery_visibility, gallery_curated_by, gallery_curated_at FROM restoration_runs WHERE id = ?",
    ).get("study-a"),
    {
      family_rating: null,
      gallery_rank: null,
      gallery_visibility: "visible",
      gallery_curated_by: null,
      gallery_curated_at: null,
    },
  );
  assert.equal(
    db.prepare("SELECT 1 AS found FROM sqlite_master WHERE type = 'index' AND name = ?").get("restoration_runs_gallery_visibility_idx").found,
    1,
  );
});
