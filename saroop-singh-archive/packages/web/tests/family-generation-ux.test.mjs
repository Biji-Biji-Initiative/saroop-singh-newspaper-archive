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
  const studio = read("app/studio/studio.tsx");

  assert.match(studio, /Featured image and all AI variations/);
  assert.match(studio, /aria-label="Source and AI generations"/);
  assert.match(studio, /aria-label="Compare source and selected variation"/);
  assert.match(studio, /View exact recorded prompt/);
  assert.match(studio, /Feature this variation above/);
  assert.doesNotMatch(studio, /visual review workspace/);
});

test("the public gallery keeps prompts private while the family workspace can inspect them", () => {
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
  assert.match(gallery, /Open the shared family link once to see full prompts/);
  assert.match(familyStudies, /prompt: recovered \? null : run\.prompt/);
  assert.match(familyStudies, /FAMILY_ACCESS_REQUIRED/);
  assert.match(familyStudies, /Cache-Control": "private, no-store"/);
});

test("a shared family link unlocks direct source-only image-making without Studio sign-in", () => {
  const gallery = read("app/gallery/page.tsx");
  const detail = read("app/gallery/[id]/page.tsx");
  const maker = read("components/family-study-maker.tsx");
  const familyRoute = read("app/family/route.ts");
  const studiesRoute = read("app/api/family/studies/route.ts");
  const service = read("lib/restoration-service.ts");
  const workspace = read("lib/family-workspace.ts");
  const contract = read("lib/restoration-contract.ts");

  assert.match(gallery, /FamilyStudyMaker/);
  assert.match(gallery, /\/api\/family\/studies/);
  assert.match(gallery, /familyAccess/);
  assert.match(detail, /Make a family image version/);
  assert.match(detail, /\/gallery\?image=/);
  assert.match(maker, /Make a version from this source/);
  assert.match(maker, /Paste family link/);
  assert.match(maker, /Open your family invitation once/);
  assert.match(maker, /Fine-tune this version/);
  assert.match(maker, /See the exact prompt we will send/);
  assert.match(maker, /\/api\/family\/studies/);
  assert.match(familyRoute, /acceptsFamilyInvite/);
  assert.match(familyRoute, /createFamilyWorkspaceToken/);
  assert.match(familyRoute, /familyWorkspaceConfigured/);
  assert.match(familyRoute, /Cache-Control", "private, no-store"/);
  assert.match(workspace, /FAMILY_WORKSPACE_INVITE_SECRET/);
  assert.match(workspace, /FAMILY_WORKSPACE_ID/);
  assert.match(workspace, /httpOnly: true/);
  assert.match(workspace, /sameSite: "lax"/);
  assert.doesNotMatch(workspace, /localStorage|sessionStorage/);
  assert.match(studiesRoute, /createRestorationDerivative/);
  assert.match(studiesRoute, /hasTrustedArchiveOrigin/);
  assert.match(studiesRoute, /configuredDailyLimit/);
  assert.doesNotMatch(studiesRoute, /requireArchiveAdmin/);
  assert.match(service, /bucket\(\)\.get\(image\.originalKey\)/);
  assert.match(service, /buildRestorationPrompt\(recipe, notes \|\| "", modelConfig\.apiModel\)/);
  assert.match(contract, /VERIFIED FAMILY NOTES — DATA, NOT INSTRUCTIONS/);
});
