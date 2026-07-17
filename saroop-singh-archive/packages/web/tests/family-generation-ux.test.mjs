import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
  const studio = read("app/studio/studio.tsx");

  assert.match(studio, /Featured image and all AI variations/);
  assert.match(studio, /aria-label="Source and AI generations"/);
  assert.match(studio, /aria-label="Compare source and selected variation"/);
  assert.match(studio, /View exact recorded prompt/);
  assert.match(studio, /Feature this variation above/);
  assert.doesNotMatch(studio, /visual review workspace/);
});

test("the public gallery keeps general prompt records scoped while the shared workspace can inspect them", () => {
  const loader = read("lib/public-gallery.ts");
  const gallery = read("app/gallery/page.tsx");
  const familyStudies = read("app/api/family/studies/route.ts");

  assert.match(loader, /provider: run\.provider/);
  assert.match(loader, /model: run\.model/);
  assert.match(loader, /promptVersion: run\.promptVersion/);
  assert.doesNotMatch(loader, /prompt:\s*run\.prompt/);
  assert.match(gallery, /aria-label="Source and published image variations"/);
  assert.match(gallery, /aria-label="Compare source and selected variation"/);
  assert.match(gallery, /Now viewing/);
  assert.match(gallery, /Exact prompt sent/);
  assert.match(gallery, /No saved prompt exists for this earlier image/);
  assert.match(familyStudies, /prompt: recovered \? null : run\.prompt/);
  assert.match(familyStudies, /FAMILY_WORKSPACE_UNAVAILABLE/);
  assert.match(familyStudies, /Cache-Control": "private, no-store"/);
});

test("the gallery opens direct source-only image-making without a link, account, or Studio sign-in", () => {
  const gallery = read("app/gallery/page.tsx");
  const detail = read("app/gallery/[id]/page.tsx");
  const maker = read("components/family-study-maker.tsx");
  const studiesRoute = read("app/api/family/studies/route.ts");
  const service = read("lib/restoration-service.ts");
  const workspace = read("lib/family-workspace.ts");
  const contract = read("lib/restoration-contract.ts");

  assert.equal(existsSync(join(root, "app/family/route.ts")), false);
  assert.match(gallery, /FamilyStudyMaker/);
  assert.match(gallery, /\/api\/family\/studies/);
  assert.doesNotMatch(gallery, /familyAccess|shared family link/);
  assert.ok(gallery.indexOf("<FamilyStudyMaker") < gallery.indexOf('aria-label="Family choices for this image version"'));
  assert.match(detail, /Make a family image version/);
  assert.match(detail, /\/gallery\?image=/);
  assert.match(maker, /Make a new version/);
  assert.doesNotMatch(maker, /Paste family link|family invitation/);
  assert.match(maker, /Make a clean version/);
  assert.match(maker, /Fine-tune this version/);
  assert.match(maker, /See the exact prompt we will send/);
  assert.match(maker, /\/api\/family\/studies/);
  assert.match(workspace, /FAMILY_WORKSPACE_ID/);
  assert.doesNotMatch(workspace, /INVITE|cookies|localStorage|sessionStorage/);
  assert.match(studiesRoute, /createRestorationDerivative/);
  assert.match(studiesRoute, /hasTrustedArchiveOrigin/);
  assert.match(studiesRoute, /configuredDailyLimit/);
  assert.match(studiesRoute, /familyWorkspaceHash/);
  assert.doesNotMatch(studiesRoute, /requireArchiveAdmin/);
  assert.match(service, /bucket\(\)\.get\(image\.originalKey\)/);
  assert.match(service, /buildRestorationPrompt\(recipe, notes \|\| "", modelConfig\.apiModel\)/);
  assert.match(contract, /VERIFIED FAMILY NOTES — DATA, NOT INSTRUCTIONS/);
});
