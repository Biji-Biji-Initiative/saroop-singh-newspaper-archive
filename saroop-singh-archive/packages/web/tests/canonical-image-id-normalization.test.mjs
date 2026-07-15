import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(join(root, file), "utf8");

test("normalizes imported image identifiers atomically across every internal relationship", () => {
  const normalization = read("lib/normalize-canonical-image-ids.ts");
  const route = read("app/api/studio/migrations/normalize-image-ids/route.ts");
  assert.match(normalization, /PRAGMA defer_foreign_keys = ON/);
  assert.match(normalization, /\.set\(\{ id: canonicalId \}\)/);
  for (const table of [
    "restorationRuns",
    "archiveEvents",
    "contributionBatchItems",
    "memorySubmissions",
    "publicIdentityTags",
    "publicIdentityTagEvents",
  ]) {
    assert.match(normalization, new RegExp(`\\.update\\(${table}\\)`));
  }
  assert.match(normalization, /identifier:normalized/);
  assert.match(route, /requireArchiveAdmin/);
  assert.match(route, /hasTrustedArchiveOrigin/);
});
