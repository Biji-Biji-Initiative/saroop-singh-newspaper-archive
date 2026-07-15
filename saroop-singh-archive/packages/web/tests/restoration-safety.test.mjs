import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import ts from "typescript";

const root = new URL("..", import.meta.url).pathname;

function loadPureArchiveHelpers() {
  const source = readFileSync(join(root, "lib/archive-server.ts"), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
    .replace(/^import .*;\s*$/gm, "")
    .replace(/\bexport\s+/g, "");
  return new Function(
    `${javascript}\nreturn { readSafeRasterDimensions, validateRestorationAspectRatio, MAX_RESTORATION_ASPECT_RATIO_DRIFT };`,
  )();
}

const { readSafeRasterDimensions, validateRestorationAspectRatio, MAX_RESTORATION_ASPECT_RATIO_DRIFT } = loadPureArchiveHelpers();

function png(width, height) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13);
  bytes.set(new TextEncoder().encode("IHDR"), 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

function jpeg(width, height) {
  const bytes = new Uint8Array(29);
  bytes.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08]);
  const view = new DataView(bytes.buffer);
  view.setUint16(13, height);
  view.setUint16(15, width);
  bytes.set([0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00, 0xff, 0xd9], 17);
  return bytes;
}

function webp(width, height) {
  const bytes = new Uint8Array(30);
  bytes.set(new TextEncoder().encode("RIFF"), 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(4, 22, true);
  bytes.set(new TextEncoder().encode("WEBPVP8X"), 8);
  view.setUint32(16, 10, true);
  const widthMinusOne = width - 1;
  const heightMinusOne = height - 1;
  bytes.set([widthMinusOne & 0xff, (widthMinusOne >> 8) & 0xff, (widthMinusOne >> 16) & 0xff], 24);
  bytes.set([heightMinusOne & 0xff, (heightMinusOne >> 8) & 0xff, (heightMinusOne >> 16) & 0xff], 27);
  return bytes;
}

test("reads bounded JPEG, PNG, and WebP dimensions", () => {
  assert.deepEqual(readSafeRasterDimensions(png(1600, 1200)), { width: 1600, height: 1200 });
  assert.deepEqual(readSafeRasterDimensions(jpeg(900, 1200)), { width: 900, height: 1200 });
  assert.deepEqual(readSafeRasterDimensions(webp(2048, 1365)), { width: 2048, height: 1365 });
  assert.equal(readSafeRasterDimensions(png(0, 1200)), null);
  assert.equal(readSafeRasterDimensions(new Uint8Array([0xff, 0xd8, 0xff])), null);
  const truncatedWebp = webp(800, 600).slice(0, 29);
  assert.equal(readSafeRasterDimensions(truncatedWebp), null);
});

test("rejects restoration outputs with material crop or aspect drift", () => {
  const accepted = validateRestorationAspectRatio(jpeg(1600, 1200), png(1024, 768));
  assert.equal(accepted.drift, 0);
  assert.throws(
    () => validateRestorationAspectRatio(jpeg(1600, 1200), png(1024, 1024)),
    /changed the source aspect ratio materially/,
  );
  assert.equal(MAX_RESTORATION_ASPECT_RATIO_DRIFT, 0.02);
});

test("family restorations require recorded affirmative consent and Gemini is stateless", () => {
  const schema = readFileSync(join(root, "db/schema.ts"), "utf8");
  const migration = readFileSync(join(root, "drizzle/0006_lowly_mac_gargan.sql"), "utf8");
  const route = readFileSync(join(root, "app/api/studio/restore/route.ts"), "utf8");
  for (const field of ["aiProcessingConsent", "aiProcessingConsentWordingVersion", "aiProcessingConsentRecordedAt"]) {
    assert.match(schema, new RegExp(field));
  }
  assert.match(migration, /ai_processing_consent.*not-recorded/);
  assert.match(route, /createdBy === "public-family-contribution"/);
  assert.match(route, /aiProcessingConsent !== "granted"/);
  assert.ok(route.indexOf("aiProcessingConsent") < route.indexOf("api.openai.com"));
  assert.match(route, /store: false/);
  assert.match(route, /validateRestorationAspectRatio\(sourceBytes, output\)/);
});
