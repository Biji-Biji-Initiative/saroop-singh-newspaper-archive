import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(join(root, file), "utf8");

test("family uploads are guided, bounded, and clearly consented", () => {
  const form = read("app/contribute/contribution-form.tsx");

  assert.match(form, /Drop family photographs here or choose files/);
  assert.match(form, /Step 2 of 4/);
  assert.match(form, /Step 3 of 4 · Your choice/);
  assert.match(form, /Step 4 of 4 · Who is contributing/);
  assert.match(form, /onDrop=/);
  assert.match(form, /selected\.slice\(0, 12\)/);
  assert.match(form, /allowAiStudy, setAllowAiStudy/);
  assert.match(form, /every result is labelled with its model and prompt record/);
});

test("generation review features one image with a labelled source-and-study carousel", () => {
  const dialog = read("components/generation-review-dialog.tsx");
  const studio = read("app/studio/studio.tsx");

  assert.match(dialog, /Choose what to feature/);
  assert.match(dialog, /aria-label="Source and AI generations"/);
  assert.match(dialog, /Compare to source/);
  assert.match(dialog, /Model/);
  assert.match(dialog, /Prompt set/);
  assert.match(dialog, /Read the exact prompt and family notes/);
  assert.match(studio, /GenerationReviewDialog/);
  assert.match(studio, /privateProvenance/);
  assert.match(studio, /Open this study in the visual review workspace/);
});

test("public provenance identifies AI studies without exposing private prompts", () => {
  const loader = read("lib/public-gallery.ts");
  const gallery = read("app/gallery/page.tsx");

  assert.match(loader, /provider: run\.provider/);
  assert.match(loader, /model: run\.model/);
  assert.match(loader, /promptVersion: run\.promptVersion/);
  assert.doesNotMatch(loader, /prompt:\s*run\.prompt/);
  assert.match(gallery, /aria-label="Source and approved AI studies"/);
  assert.match(gallery, /Compare this study to the source/);
  assert.match(gallery, /AI study provenance/);
  assert.match(gallery, /Exact prompts remain in the private preservation record/);
});
