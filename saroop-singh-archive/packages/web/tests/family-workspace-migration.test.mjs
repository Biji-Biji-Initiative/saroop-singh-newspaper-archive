import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import Database from "better-sqlite3";

const root = new URL("..", import.meta.url).pathname;
const introductionMigration = readFileSync(join(root, "drizzle/0013_family_workspace_studies.sql"), "utf8");
const renameMigration = readFileSync(join(root, "drizzle/0014_spooky_moonstone.sql"), "utf8");

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

  db.exec(introductionMigration);

  assert.deepEqual(
    db.prepare("SELECT id, family_session_hash FROM restoration_runs WHERE id = 'earlier-study'").get(),
    { id: "earlier-study", family_session_hash: null },
  );
  assert.equal(
    db.prepare("SELECT 1 AS found FROM sqlite_master WHERE type = 'index' AND name = ?").get("restoration_runs_family_session_idx").found,
    1,
  );
});

test("the direct shared-workspace migration preserves every existing study while removing session terminology", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE restoration_runs (
      id text primary key,
      image_id text not null,
      created_at text not null
    );
    INSERT INTO restoration_runs (id, image_id, created_at) VALUES ('earlier-study', 'image-a', '2026-07-17T00:00:00.000Z');
  `);
  db.exec(introductionMigration);
  db.prepare("UPDATE restoration_runs SET family_session_hash = ? WHERE id = 'earlier-study'").run("stable-family-workspace");

  db.exec(renameMigration);

  assert.deepEqual(
    db.prepare("SELECT id, family_workspace_hash FROM restoration_runs WHERE id = 'earlier-study'").get(),
    { id: "earlier-study", family_workspace_hash: "stable-family-workspace" },
  );
  assert.equal(
    db.prepare("SELECT 1 AS found FROM sqlite_master WHERE type = 'index' AND name = ?").get("restoration_runs_family_workspace_idx").found,
    1,
  );
  assert.equal(
    db.prepare("SELECT 1 AS found FROM pragma_table_info('restoration_runs') WHERE name = 'family_session_hash'").get(),
    undefined,
  );
});
