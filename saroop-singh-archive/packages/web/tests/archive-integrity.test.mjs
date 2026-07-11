import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import YAML from 'yaml';

const root = new URL('..', import.meta.url).pathname;
const articleDir = join(root, 'content/articles/published');
const articleFiles = readdirSync(articleDir).filter(file => file.endsWith('.md') && file !== 'README.md');

function frontmatter(file) {
  const source = readFileSync(join(articleDir, file), 'utf8');
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  assert.ok(match, `${file} must contain YAML frontmatter`);
  return YAML.parse(match[1]);
}

test('retains the recovered catalogue while excluding withdrawn errors from publication', () => {
  assert.equal(articleFiles.length, 38);
  assert.equal(new Set(articleFiles).size, articleFiles.length);
  const active = articleFiles.filter(file => frontmatter(file).status !== 'withdrawn');
  assert.equal(active.length, 36);
  assert.equal(frontmatter('1957-07-15_straits-times_sikh-runners-state-record-half-mile.md').status, 'withdrawn');
});

test('every article has a title and a resolvable scan or explicit placeholder', () => {
  for (const file of articleFiles) {
    const data = frontmatter(file);
    assert.ok(data.title?.trim(), `${file} is missing a title`);
    assert.ok(data.image?.startsWith('/'), `${file} is missing an absolute image path`);
    assert.ok(existsSync(join(root, 'public', data.image)), `${file} references missing media: ${data.image}`);
  }
});

test('gallery catalogue contains seven real collections and resolvable thumbnails', () => {
  const index = JSON.parse(readFileSync(join(root, 'data/gallery/index.json'), 'utf8'));
  assert.equal(index.items.length, 7);
  for (const item of index.items) {
    assert.ok(item.id && item.title && item.thumbnailUrl);
    assert.ok(existsSync(join(root, 'public', item.thumbnailUrl)), `${item.id} references missing thumbnail`);
  }
});

test('public UI contains no fake links or alert-driven actions', () => {
  const sourceFiles = [
    'app/page.tsx',
    'app/gallery/page.tsx',
    'components/layout/header.tsx',
    'components/layout/footer.tsx',
    'components/mobile/mobilenav.tsx',
  ];
  const source = sourceFiles.map(file => readFileSync(join(root, file), 'utf8')).join('\n');
  assert.doesNotMatch(source, /href=["']#["']/);
  assert.doesNotMatch(source, /alert\s*\(/);
  assert.doesNotMatch(source, /\/restore["']/);
});

test('mobile navigation and filters use coordinated, non-duplicated overlays', () => {
  const navigation = readFileSync(join(root, 'components/mobile/mobilenav.tsx'), 'utf8');
  const filters = readFileSync(join(root, 'components/composite/filterablegrid.tsx'), 'utf8');
  assert.match(navigation, /createPortal/);
  assert.match(navigation, /z-\[101\]/);
  assert.match(navigation, /archive:overlay-open/);
  assert.match(filters, /createPortal/);
  assert.match(filters, /isMobile \? 'hidden' : 'block'/);
  assert.equal((filters.match(/id="mobile-filter-drawer"/g) || []).length, 1);
});

test('preservation manifest verifies every source image, legacy study and article scan with SHA-256', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'data/generated/preservation-manifest.json'), 'utf8'));
  assert.equal(manifest.counts.bestAvailableSources, 7);
  assert.equal(manifest.counts.legacyAiExperiments, 36);
  assert.equal(manifest.counts.articleScans, 36);
  for (const collection of manifest.collections) {
    assert.match(collection.original.sha256, /^[a-f0-9]{64}$/);
    assert.ok(existsSync(join(root, 'public', collection.original.url)));
    for (const study of collection.studies) assert.match(study.sha256, /^[a-f0-9]{64}$/);
  }
  for (const article of manifest.articleScans) assert.match(article.scan.sha256, /^[a-f0-9]{64}$/);
});

test('public contribution intake rejects unsafe formats and never auto-publishes', () => {
  const route = readFileSync(join(root, 'app/api/contribute/route.ts'), 'utf8');
  assert.match(route, /detectSafeRaster/);
  assert.match(route, /status: "submitted"/);
  assert.doesNotMatch(route, /status: "published"/);
});

test('owner review is audited and exports preservation records', () => {
  const schema = readFileSync(join(root, 'db/schema.ts'), 'utf8');
  const review = readFileSync(join(root, 'app/api/studio/images/[id]/route.ts'), 'utf8');
  const archiveExport = readFileSync(join(root, 'app/api/studio/export/route.ts'), 'utf8');
  assert.match(schema, /archive_events/);
  assert.match(review, /metadata:updated/);
  assert.match(review, /status:/);
  assert.match(archiveExport, /auditEvents/);
  assert.match(archiveExport, /legacyCorpus/);
});

test('modal surfaces trap focus and restore it when closed', () => {
  const hook = readFileSync(join(root, 'hooks/useModalFocus.ts'), 'utf8');
  assert.match(hook, /event\.key !== "Tab"/);
  assert.match(hook, /previouslyFocused/);
  assert.match(hook, /closeRef\.current/);
});

test('living-history pages preserve evidence boundaries', () => {
  const people = readFileSync(join(root, 'app/people/page.tsx'), 'utf8');
  const profile = readFileSync(join(root, 'app/people/[slug]/page.tsx'), 'utf8');
  const timeline = readFileSync(join(root, 'app/timeline/page.tsx'), 'utf8');
  const chapters = readFileSync(join(root, 'data/knowledge/chapters.ts'), 'utf8');
  assert.match(people, /No family tree has been invented/);
  assert.match(profile, /Family relationships remain open research/);
  assert.match(profile, /\/gallery-images\/saroop-singh-running2\.png/);
  assert.doesNotMatch(timeline, /fetch\(['"]\/api\/articles/);
  assert.doesNotMatch(timeline, /article\.slug\.startsWith\("1957-"\)/);
  assert.match(timeline, /miscatalogued as 1957 has been withdrawn/);
  assert.match(timeline, /article\.slug\.includes\("olympic-games"\)/);
  assert.doesNotMatch(chapters, /1957-/);
  assert.doesNotMatch(chapters, /olympic-games/);
});

test('article dates fall back to the catalogue filename', () => {
  const loader = readFileSync(join(root, 'lib/articles.ts'), 'utf8');
  assert.match(loader, /fileName\.match\(\/\^\(\\d\{4\}\)-\(\\d\{2\}\)-\(\\d\{2\}\)\//);
  assert.match(loader, /fileDate \? `\$\{fileDate\[1\]\}-\$\{fileDate\[2\]\}-\$\{fileDate\[3\]\}`/);
});

test('public discovery and keyboard access are first-class', () => {
  const layout = readFileSync(join(root, 'app/layout.tsx'), 'utf8');
  const styles = readFileSync(join(root, 'app/globals.css'), 'utf8');
  const robots = readFileSync(join(root, 'app/robots.ts'), 'utf8');
  const sitemap = readFileSync(join(root, 'app/sitemap.ts'), 'utf8');
  assert.match(layout, /href="#main-content"/);
  assert.equal((layout.match(/<main/g) || []).length, 0, 'root layout must not nest main landmarks');
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(robots, /\/studio/);
  assert.match(sitemap, /getAllArticles/);
  assert.match(sitemap, /getLegacyCollections/);
  assert.doesNotMatch(layout, /og-image\.jpg/);
});

test('family upload selection is bounded before transmission', () => {
  const form = readFileSync(join(root, 'app/contribute/contribution-form.tsx'), 'utf8');
  assert.match(form, /selected\.slice\(0, 12\)/);
  assert.match(form, /25 \* 1024 \* 1024/);
  assert.match(form, /aria-busy=\{busy\}/);
  assert.match(form, /role="alert"/);
});

test('legacy biography no longer outruns the reviewed evidence', () => {
  const about = readFileSync(join(root, 'app/about/page.tsx'), 'utf8');
  assert.doesNotMatch(about, /Active 1936-1957|Transitions to sports administration|Mentors younger athletes|benchmark for future generations/);
  assert.match(about, /What remains unknown/);
  assert.match(about, /later hockey reports/i);
});

test('gallery curation leads with originals and marks unknowns', () => {
  const curation = readFileSync(join(root, 'lib/gallery-curation.ts'), 'utf8');
  assert.doesNotMatch(curation, /restoration-1\.png/);
  assert.match(curation, /People not yet identified/);
  assert.match(curation, /newspaper crop captioned as M\. Thomas and Saroop Singh/i);
  assert.match(curation, /19 July 1937/);
  assert.match(curation, /relationship to the formal group photograph.*under review/i);
});

test('family memories are private claims with consent and receipt isolation', () => {
  const schema = readFileSync(join(root, 'db/schema.ts'), 'utf8');
  const intake = readFileSync(join(root, 'app/api/memories/route.ts'), 'utf8');
  const receipt = readFileSync(join(root, 'app/api/memories/[token]/route.ts'), 'utf8');
  assert.match(schema, /memory_submissions/);
  assert.match(schema, /receipt_token_hash/);
  assert.match(intake, /detectSafeAudio/);
  assert.match(intake, /status.*submitted|default\("submitted"\)/);
  assert.match(intake, /private-review/);
  assert.doesNotMatch(receipt, /claimantName|claimantContact|story/);
});

test('guided story keeps evidence and uncertainty visible', () => {
  const story = readFileSync(join(root, 'app/story/page.tsx'), 'utf8');
  assert.match(story, /Show me the evidence/);
  assert.match(story, /Two direct reports give 2:06 4\/5/);
  assert.match(story, /Source crop · 19 July 1937/);
  assert.match(story, /Memory Room/);
});

test('museum interoperability and offline premiere protect public-only content', () => {
  const iiif = readFileSync(join(root, 'app/api/iiif/[id]/manifest/route.ts'), 'utf8');
  const worker = readFileSync(join(root, 'public/sw.js'), 'utf8');
  assert.match(iiif, /iiif\.io\/api\/presentation\/3\/context\.json/);
  assert.match(iiif, /Preservation manifest and checksums/);
  assert.match(worker, /\/story/);
  assert.match(worker, /"\/api\/"/);
  assert.match(worker, /"\/memory-receipt"/);
  assert.match(worker, /private\|no-store/);
});

test('family launch surfaces share safely without exposing private memory content', () => {
  const stats = readFileSync(join(root, 'app/api/memories/stats/route.ts'), 'utf8');
  const receipt = readFileSync(join(root, 'app/memory-receipt/[token]/receipt-status.tsx'), 'utf8');
  const share = readFileSync(join(root, 'components/share-family.tsx'), 'utf8');
  const storyControls = readFileSync(join(root, 'app/story/story-controls.tsx'), 'utf8');
  assert.doesNotMatch(stats, /claimantName|claimantContact|proposedName|story:/);
  assert.match(stats, /groupBy\(memorySubmissions\.kind\)/);
  assert.match(receipt, /\/api\/memories\/\$\{token\}/);
  assert.match(share, /navigator\.share/);
  assert.match(share, /wa\.me/);
  assert.match(storyControls, /story-mode/);
});

test('one comparison instrument covers legacy, modal, and fresh restoration studies', () => {
  const compare = readFileSync(join(root, 'components/restoration-compare.tsx'), 'utf8');
  const modal = readFileSync(join(root, 'app/gallery/page.tsx'), 'utf8');
  const studio = readFileSync(join(root, 'app/studio/studio.tsx'), 'utf8');
  assert.match(compare, /type="range"/);
  assert.match(compare, /sourceLabel = "Source"/);
  assert.match(compare, />Split<|>Split\s*</);
  assert.match(compare, />Study<|>Study\s*</);
  assert.match(compare, /requestFullscreen/);
  assert.match(modal, /<RestorationCompare/);
  assert.match(studio, /<RestorationCompare/);
});

test('restoration presents three family intents and keeps engine choice advanced', () => {
  const studio = readFileSync(join(root, 'app/studio/studio.tsx'), 'utf8');
  const contribute = readFileSync(join(root, 'app/contribute/contribution-form.tsx'), 'utf8');
  assert.match(studio, /Clean & preserve/);
  assert.match(studio, /Repair damage/);
  assert.match(studio, /Explore colour/);
  assert.match(studio, /Advanced engine choice/);
  assert.match(contribute, /name="restorationPreference"/);
  assert.match(contribute, /name="aiProcessingConsent"/);
  assert.match(contribute, /Optional: allow a private AI restoration study/);
  assert.match(contribute, /Preserve only selected/);
});

test('current image-model contract is versioned and preservation constrained', () => {
  const server = readFileSync(join(root, 'lib/archive-server.ts'), 'utf8');
  const route = readFileSync(join(root, 'app/api/studio/restore/route.ts'), 'utf8');
  assert.match(server, /gpt-image-2-2026-04-21/);
  assert.match(server, /preservation-v5-2026-07/);
  assert.match(server, /50 \* 1024 \* 1024/);
  assert.match(server, /LOCKED INVARIANTS/);
  assert.match(server, /A visibly unresolved area is better than a convincing invention/);
  assert.match(route, /form\.set\("input_fidelity", "high"\)/);
  assert.match(route, /form\.set\("quality", "high"\)/);
  assert.match(route, /form\.set\("size", "auto"\)/);
  assert.match(route, /form\.set\("background", "opaque"\)/);
});
