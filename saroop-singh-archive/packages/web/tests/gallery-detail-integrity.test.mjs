import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(join(root, file), "utf8");

test("published database photographs use their original as the public authority", () => {
  const loader = read("lib/public-gallery.ts");
  assert.match(loader, /eq\(archiveImages\.status, "published"\)/);
  assert.match(loader, /originalImageUrl: mediaUrl\(image\.originalKey\)/);
  assert.doesNotMatch(loader, /originalImageUrl: mediaUrl\(image\.publishedKey/);
});

test("only the approved, published derivative is exposed for comparison", () => {
  const loader = read("lib/public-gallery.ts");
  assert.match(loader, /outputKey === image\.publishedKey/);
  assert.match(loader, /eq\(restorationRuns\.reviewStatus, "approved"\)/);
  assert.match(loader, /isNotNull\(restorationRuns\.publishedAt\)/);
  assert.match(loader, /Approved restoration study/);
});

test("gallery details support reviewed canonical database records", () => {
  const page = read("app/gallery/[id]/page.tsx");
  assert.match(page, /getPublicGalleryRecord/);
  assert.doesNotMatch(page, /data\/gallery|gallery-images/);
  assert.match(page, /if \(!collection\) notFound\(\)/);
  assert.match(page, /collection\.hasIiifManifest/);
});
