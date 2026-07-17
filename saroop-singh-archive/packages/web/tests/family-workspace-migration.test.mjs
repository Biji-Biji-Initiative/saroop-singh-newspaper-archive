import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import Database from "better-sqlite3";

const root = new URL("..", import.meta.url).pathname;
const migration = readFileSync(join(root, "drizzle/0013_family_workspace_studies.sql"), "utf8");

test("family workspace studies add an isolated shared-workspace lookup without rewriting old runs", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE restoration_runs (
      id text primary key,
      image_id text not null,
      created_at text not null
    );
    INSERT INTO restoration_runs (id, image_id, created_at) VALUES ('earlier-study', 'image-a', '2026-07-17T00:00:00.000Z');
  `);

  db.exec(migration);

  assert.deepEqual(
    db.prepare("SELECT id, family_session_hash FROM restoration_runs WHERE id = 'earlier-study'").get(),
    { id: "earlier-study", family_session_hash: null },
  );
  assert.equal(
    db.prepare("SELECT 1 AS found FROM sqlite_master WHERE type = 'index' AND name = ?").get("restoration_runs_family_session_idx").found,
    1,
  );
});
