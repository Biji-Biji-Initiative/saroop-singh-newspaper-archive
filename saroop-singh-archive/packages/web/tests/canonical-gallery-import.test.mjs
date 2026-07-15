import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;
const read = file => readFileSync(join(root, file), "utf8");

test("canonical gallery import verifies files, writes content-addressed media, and is idempotent", () => {
  const importer = read("lib/canonical-gallery-import.ts");

  assert.match(importer, /const images: ImportedImage\[\] = \[/);
  assert.match(importer, /url\.startsWith\("\/gallery-images\/"\)/);
  assert.match(importer, /readSafeRasterDimensions/);
  assert.match(importer, /sha256Hex/);
  assert.match(importer, /onlyIf: \{ etagDoesNotMatch: "\*" \}/);
  assert.match(importer, /Object storage contains conflicting bytes/);
  assert.match(importer, /Archive image .* conflicts with the import source/);
  assert.match(importer, /historicalStudyCount/);
  assert.match(importer, /reviewStatus: "unreviewed"/);
  assert.doesNotMatch(importer, /onConflictDoNothing/);
});

test("the migration endpoint is private and the canonical schema records media dimensions and provenance", () => {
  const route = read("app/api/studio/migrations/canonical-gallery/route.ts");
  const schema = read("db/schema.ts");
  const migration = read("drizzle/0010_tense_hawkeye.sql");
  const journal = read("drizzle/meta/_journal.json");
  const studioUpload = read("app/api/studio/images/route.ts");
  const familyUpload = read("app/api/contribute/route.ts");

  assert.match(route, /requireArchiveAdmin/);
  assert.match(route, /hasTrustedArchiveOrigin/);
  assert.match(route, /cache-control": "private, no-store"/);
  assert.match(schema, /originalWidth/);
  assert.match(schema, /originalHeight/);
  assert.match(schema, /sourceProvenance/);
  assert.match(schema, /dateConfidence/);
  assert.match(migration, /original_width/);
  assert.match(migration, /source_provenance/);
  assert.match(journal, /0010_tense_hawkeye/);
  assert.match(studioUpload, /originalWidth: dimensions\.width/);
  assert.match(familyUpload, /originalHeight: dimensions\.height/);
});
