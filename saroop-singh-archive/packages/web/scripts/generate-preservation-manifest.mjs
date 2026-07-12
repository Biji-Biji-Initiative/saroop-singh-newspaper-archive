import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const index = JSON.parse(await readFile(join(root, "data/gallery/index.json"), "utf8"));

async function describe(publicUrl, role, provenanceStatus) {
  const path = join(root, "public", publicUrl.replace(/^\//, ""));
  const bytes = await readFile(path);
  const info = await stat(path);
  const extension = basename(path).split(".").pop()?.toLowerCase();
  const mimeType = extension === "jpg" || extension === "jpeg" ? "image/jpeg" : extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "application/octet-stream";
  return { role, url: publicUrl, filename: basename(path), mimeType, bytes: info.size, sha256: createHash("sha256").update(bytes).digest("hex"), provenanceStatus };
}

const collections = [];
for (const summary of index.items) {
  const record = JSON.parse(await readFile(join(root, `data/gallery/${summary.id}.json`), "utf8"));
  const original = await describe(record.originalImageUrl, "best-available-source", "recovered-legacy-source-scan-screenshot-or-crop");
  const studies = [];
  for (const study of record.restorations || []) {
    studies.push({ id: study.id, type: study.type, ...(await describe(study.url, "legacy-ai-experiment", "speculative-derivative-exact-model-and-prompt-unknown")) });
  }
  collections.push({ id: record.id, title: record.metadata?.title || record.title, assertedDate: record.metadata?.date || record.date, dateConfidence: record.metadata?.dateConfidence || (String(record.metadata?.date || record.date).includes("unverified") ? "unverified" : "unknown"), sourceType: record.metadata?.sourceType || "best-available-digital-source", original, studies });
}

const articleScans = [];
const articleDirectory = join(root, "content/articles/published");
for (const filename of (await readdir(articleDirectory)).filter((name) => name.endsWith(".md") && name !== "README.md")) {
  const markdown = await readFile(join(articleDirectory, filename), "utf8");
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) continue;
  const metadata = YAML.parse(match[1]) || {};
  if (metadata.status === "withdrawn" || !String(metadata.image || "").startsWith("/")) continue;
  articleScans.push({
    slug: filename.replace(/\.md$/, ""),
    title: metadata.title || "Untitled",
    publication: metadata.publication || metadata.source || "Source not visible",
    dateText: metadata.date_text || metadata.date || "Date not visible",
    scan: await describe(metadata.image, "newspaper-access-capture", "best-available-catalogue-source-scan-screenshot-crop-or-placeholder"),
  });
}

const manifest = {
  schemaVersion: 3,
  collection: "Saroop Singh Archive — recovered source corpus",
  fixityAlgorithm: "SHA-256",
  counts: { collections: collections.length, bestAvailableSources: collections.length, legacyAiExperiments: collections.reduce((total, item) => total + item.studies.length, 0), articleScans: articleScans.length },
  totalBytes: collections.reduce((total, item) => total + item.original.bytes + item.studies.reduce((sum, study) => sum + study.bytes, 0), 0) + articleScans.reduce((total, item) => total + item.scan.bytes, 0),
  collections,
  articleScans,
};

const output = join(root, "data/generated/preservation-manifest.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Preservation manifest: ${manifest.counts.bestAvailableSources} source images, ${manifest.counts.legacyAiExperiments} legacy studies, ${manifest.counts.articleScans} article scans, ${manifest.totalBytes} bytes`);
