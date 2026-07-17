import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import YAML from "yaml";

const root = new URL("..", import.meta.url).pathname;
const read = (file) => readFileSync(join(root, file), "utf8");

test("media authorization resolves the complete object key instead of assuming a UUID path segment", () => {
  const route = read("app/api/media/[...key]/route.ts");

  assert.match(route, /const objectKey = key\.join\("\/"\)/);
  assert.match(route, /eq\(archiveImages\.originalKey, objectKey\)/);
  assert.match(route, /eq\(archiveImages\.publishedKey, objectKey\)/);
  assert.match(route, /image\?\.status === "published" &&\s*image\.originalKey === objectKey/);
  assert.match(route, /eq\(restorationRuns\.outputKey, objectKey\)/);
  assert.match(route, /\["approved", "recovered-historical"\]/);
  assert.doesNotMatch(route, /\bkey\s*\[\s*1\s*\]/);
  assert.doesNotMatch(route, /\bgetImage\s*\(/);
});

test("photograph browse cards stay compact and keep previews legible", () => {
  const gallery = read("app/gallery/page.tsx");

  assert.match(gallery, /sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4/);
  assert.match(gallery, /aspect-\[4\/3\]/);
  assert.match(gallery, /object-cover/);
});

test("gallery viewer gives details a stable rail and opens a selected variation in split comparison", () => {
  const gallery = read("app/gallery/page.tsx");

  assert.match(gallery, /lg:grid-cols-\[minmax\(0,1fr\)_minmax\(29rem,34rem\)\]/);
  assert.match(gallery, /function defaultViewerAsset\(item: GalleryItem\)/);
  assert.match(gallery, /const initialAsset = defaultViewerAsset\(item\)/);
  assert.match(gallery, /setShowComparison\(initialAsset\.kind === 'generation'\)/);
  assert.match(gallery, /setShowComparison\(asset\.kind === 'generation'\)/);
  assert.match(gallery, /aria-label="Compare source and selected variation"/);
  assert.match(gallery, /aria-label="Show selected variation only"/);
  assert.match(gallery, /<Columns2 className="h-5 w-5"/);
  assert.doesNotMatch(gallery, /Back to featured variation|Open split slider/);
});

test("gallery keeps direct family image-making beside the compared variation", () => {
  const gallery = read("app/gallery/page.tsx");
  const maker = read("components/family-study-maker.tsx");
  const familyCuration = read("app/api/family/studies/[id]/route.ts");

  assert.match(gallery, /FamilyStudyMaker/);
  assert.match(maker, /Make a new version/);
  assert.match(maker, /Using \{selectedModel\.label\}\. The original remains untouched/);
  assert.match(maker, /useState<RestorationModel>\("gpt-image-2"\)/);
  assert.match(familyCuration, /restoration:family-curation-updated/);
  assert.match(familyCuration, /family-workspace/);
});

test("family curation persists a rating, gallery rank, and visibility without exposing hidden variants", () => {
  const schema = read("db/schema.ts");
  const curation = read("app/api/studio/runs/[id]/curation/route.ts");
  const gallery = read("lib/public-gallery.ts");
  const media = read("app/api/media/[...key]/route.ts");
  const studio = read("app/studio/studio.tsx");

  assert.match(schema, /familyRating: integer\("family_rating"\)/);
  assert.match(schema, /galleryRank: integer\("gallery_rank"\)/);
  assert.match(schema, /galleryVisibility: text\("gallery_visibility"\)\.notNull\(\)\.default\("visible"\)/);
  assert.match(curation, /requireArchiveAdmin\("\/studio"\)/);
  assert.match(curation, /hasTrustedArchiveOrigin/);
  assert.match(curation, /restoration:family-curation-updated/);
  assert.match(curation, /galleryVisibility: nextVisibility/);
  assert.match(gallery, /eq\(restorationRuns\.galleryVisibility, "visible"\)/);
  assert.match(media, /eq\(restorationRuns\.galleryVisibility, "visible"\)/);
  assert.match(studio, /Private family curation/);
  assert.match(studio, /Hide from public gallery/);
  assert.match(studio, /Family rating/);
});

test("stories only attach a photograph the contributor explicitly chose", () => {
  const room = read("app/remember/memory-room.tsx");
  const start = room.indexOf("const shouldAttachSubject");
  const end = room.indexOf("if (anchor)", start);
  assert.ok(start >= 0 && end > start, "subject attachment guard must exist in submit()");
  const attachment = room.slice(start, end);
  const galleryStart = room.indexOf("const acceptGallery");
  const galleryEnd = room.indexOf("const requestGallery", galleryStart);
  assert.ok(galleryStart >= 0 && galleryEnd > galleryStart, "gallery selection must be explicit");
  const gallerySelection = room.slice(galleryStart, galleryEnd);

  assert.match(
    attachment,
    /\["identify", "correction"\]\.includes\(kind\)\s*\|\|\s*Boolean\(initialSubject\)\s*\|\|\s*\(kind === "story" && Boolean\(subject\)\)/,
  );
  assert.match(
    attachment,
    /if \(shouldAttachSubject && subject\) form\.set\("subjectId", subject\.id\)/,
  );
  assert.match(
    attachment,
    /else if \(shouldAttachSubject && initialSubject\)\s*form\.set\("subjectId", initialSubject\)/,
  );
  assert.match(attachment, /kind === "reverse" && reverseSubjectId/);
  assert.doesNotMatch(attachment, /\["identify", "story", "correction"\]/);
  assert.doesNotMatch(gallerySelection, /loaded\[0\]/);
  assert.equal(
    (room.match(/form\.set\("subjectId"/g) || []).length,
    3,
    "subject assignment is limited to required record actions, an explicit story link, and an explicit reverse-scan link",
  );
});

test("memory room gallery remains inside its narrow-screen grid column", () => {
  const room = read("app/remember/memory-room.tsx");

  assert.match(
    room,
    /lg:grid-cols-\[minmax\(0,1\.05fr\)_minmax\(0,\.95fr\)\]/,
  );
  assert.equal(
    (room.match(/<div className="min-w-0">/g) || []).length >= 2,
    true,
    "both form columns must be allowed to shrink",
  );
  assert.match(room, /mt-4 flex min-w-0 gap-3 overflow-x-auto pb-3/);
  assert.match(room, /text-sm leading-6 text-neutral-600/);
});

test("photo-bound Memory Room actions explain why submission is disabled", () => {
  const room = read("app/remember/memory-room.tsx");

  assert.match(
    room,
    /const subjectRequired =\s*\["identify", "correction"\]\.includes\(kind\) && !hasSubject/,
  );
  assert.match(room, /id="memory-subject-required"/);
  assert.match(room, /role="status"/);
  assert.match(
    room,
    /aria-describedby=\{subjectRequired \? "memory-subject-required" : undefined\}/,
  );
  assert.match(room, /subjectRequired \|\|/);
});

test("identifications require a subject, a name, and either an anchor or position description", () => {
  const room = read("app/remember/memory-room.tsx");
  const route = read("app/api/memories/route.ts");

  assert.match(room, /name="positionDescription"/);
  assert.match(
    room,
    /kind === "identify" && !anchor && !positionDescription\.trim\(\)/,
  );
  assert.match(route, /normalizedAnchorX < 0 \|\| normalizedAnchorX > 1/);
  assert.match(route, /normalizedAnchorY < 0 \|\| normalizedAnchorY > 1/);
  assert.match(route, /kind === "identify" && !subjectId/);
  assert.match(route, /kind === "correction" && !subjectId/);
  assert.match(route, /kind === "identify" && !proposedName/);
  assert.match(
    route,
    /kind === "identify" && \(anchorX === null \|\| anchorY === null\) && !positionDescription/,
  );
  assert.match(route, /Position in photograph: \$\{positionDescription\}/);
  assert.match(route, /\["story", "correction"\]\.includes\(kind\) && !submittedStory\.trim\(\)/);
});

test("each contributed photograph carries its own metadata and AI remains opt-in", () => {
  const form = read("app/contribute/contribution-form.tsx");
  const route = read("app/api/contribute/route.ts");

  assert.match(form, /const \[allowAiStudy, setAllowAiStudy\] = useState\(false\)/);
  assert.match(form, /const \[fileMetadata, setFileMetadata\]/);
  assert.match(form, /type ContributionFile = \{[\s\S]*?id: string;[\s\S]*?file: File;/);
  assert.match(form, /const \{ file, id: clientItemId \} = item/);
  assert.match(form, /const metadata = fileMetadata\[clientItemId\]/);
  assert.match(form, /form\.set\("clientItemId", clientItemId\)/);
  assert.doesNotMatch(form, /fileKey/);
  assert.match(form, /name="aiProcessingConsent"/);
  assert.match(form, /checked=\{allowAiStudy\}/);
  assert.match(route, /const aiConsentGranted = form\.get\("aiProcessingConsent"\) === "yes"/);
  assert.match(
    route,
    /const restorationPreference = aiConsentGranted &&[\s\S]*?\? requestedPreference : "original-only"/,
  );
  assert.match(route, /aiProcessingConsent: aiConsentGranted \? "granted" : "declined"/);
});

test("memory totals exclude rejected and withdrawn claims and fail explicitly", () => {
  const route = read("app/api/memories/stats/route.ts");
  const display = read("app/premiere/premiere-stats.tsx");

  assert.match(
    route,
    /notInArray\(memorySubmissions\.status, \["rejected", "withdrawn"\]\)/,
  );
  assert.match(route, /status: 503/);
  assert.match(route, /Contribution totals are temporarily unavailable/);
  assert.match(display, /const \[stats, setStats\] = useState<Stats>\(\)/);
  assert.match(display, /if \(!response\.ok\) throw new Error/);
  assert.match(display, /item\.value \?\? "—"/);
  assert.match(display, /no zeroes have been invented/);
  assert.doesNotMatch(display, /useState<Stats>\(\{[\s\S]*?total:\s*0/);
});

test("photograph viewers fit complete images and keep mobile details independently scrollable", () => {
  const gallery = read("app/gallery/page.tsx");
  const dialog = read("components/ui/dialog.tsx");

  assert.match(gallery, /grid-rows-\[minmax\(20rem,56dvh\)_minmax\(0,1fr\)\]/);
  assert.match(gallery, /object-contain p-2 sm:p-4/);
  assert.match(gallery, /Fit to screen · complete source/);
  assert.match(gallery, /min-h-0 min-w-0 overflow-y-auto overscroll-contain/);
  assert.match(gallery, /safe-area-inset-top/);
  assert.match(gallery, /safe-area-inset-right/);
  assert.match(gallery, /safe-area-inset-bottom/);
  assert.match(dialog, /max-h-\[calc\(100dvh-1rem\)\]/);
  assert.match(dialog, /overflow-y-auto overscroll-contain/);
});

test("the fabricated 1957 record stays withdrawn and redirects to its 1937 canonical source", () => {
  const articlePath =
    "content/articles/published/1957-07-15_straits-times_sikh-runners-state-record-half-mile.md";
  const article = read(articlePath);
  const frontmatterMatch = article.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  assert.ok(frontmatterMatch, "withdrawn record must keep an auditable frontmatter note");
  const frontmatter = YAML.parse(frontmatterMatch[1]);
  const page = read("app/articles/[slug]/page.tsx");
  const loader = read("lib/articles.ts");

  assert.equal(frontmatter.status, "withdrawn");
  assert.equal(frontmatter.people.length, 0);
  assert.match(frontmatter.source, /19 July 1937/);
  assert.match(frontmatter.withdrawn_reason, /unsupported/);
  assert.equal(frontmatter.canonical_of, "1937-07-19_straits-times_selangor-athletic-championships-full-page");
  assert.doesNotMatch(article, /His time was 2 min/);
  assert.match(loader, /\['withdrawn', 'source-unavailable'\]\.includes\(parseArticleFile\(fileContents\)\.data\.status\)/);
  assert.match(page, /const canonicalSlug = getWithdrawnCanonicalSlug\(slug\)/);
  assert.match(page, /if \(canonicalSlug\) permanentRedirect\(`\/articles\/\$\{canonicalSlug\}`\)/);
  assert.match(loader, /data\.status === 'withdrawn' && typeof data\.canonical_of === 'string'/);
  assert.ok(
    page.indexOf("getWithdrawnCanonicalSlug(slug)") < page.indexOf("getArticleBySlug(slug); if (!article) notFound()"),
    "the redirect must run before the withdrawn record reaches notFound()",
  );
});
