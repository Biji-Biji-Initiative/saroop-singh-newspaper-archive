import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const articleDirectory = join(root, "content", "articles", "published");
const publicDirectory = join(root, "public");
const legacyArticleDirectory = resolve(
  root,
  "..",
  "..",
  "content",
  "articles",
  "published",
);
const errors = [];
const safeArticleFilename = /^(?:\d{4}-\d{2}-\d{2}|unknown-date)_[a-z0-9][a-z0-9-]*_[a-z0-9][a-z0-9-]*\.md$/;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value) {
  if (!isoDate.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

function fail(message) {
  errors.push(message);
}

function validateString(value, field, filename, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${filename}: ${field} is required.`);
    return;
  }
  if (typeof value !== "string" || !value.trim()) {
    fail(`${filename}: ${field} must be a non-empty string.`);
  }
}

function validateStringArray(value, field, filename) {
  if (value === undefined || value === null) return;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    fail(`${filename}: ${field} must be a list of non-empty strings.`);
  }
}

if (existsSync(legacyArticleDirectory)) {
  fail(
    `Duplicate legacy article corpus found at ${legacyArticleDirectory}. Use ${articleDirectory} as the only published source.`,
  );
}

if (!existsSync(articleDirectory) || !statSync(articleDirectory).isDirectory()) {
  fail(`Canonical article corpus is missing: ${articleDirectory}`);
}

const articles = new Map();
if (errors.length === 0) {
  const filenames = readdirSync(articleDirectory)
    .filter((filename) => filename.endsWith(".md") && filename !== "README.md")
    .sort();

  if (filenames.length === 0) fail("Canonical article corpus has no Markdown records.");

  for (const filename of filenames) {
    if (!safeArticleFilename.test(filename)) {
      fail(`${filename}: use YYYY-MM-DD_publication_safe-slug.md or unknown-date_publication_safe-slug.md.`);
      continue;
    }

    const source = readFileSync(join(articleDirectory, filename), "utf8");
    const frontmatter = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!frontmatter) {
      fail(`${filename}: missing YAML frontmatter.`);
      continue;
    }

    let metadata;
    try {
      metadata = YAML.parse(frontmatter[1]);
    } catch (error) {
      fail(`${filename}: invalid YAML frontmatter (${error.message}).`);
      continue;
    }
    if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") {
      fail(`${filename}: frontmatter must be a YAML mapping.`);
      continue;
    }
    if (!source.slice(frontmatter[0].length).trim()) {
      fail(`${filename}: article body is empty.`);
    }

    validateString(metadata.title, "title", filename, { required: true });
    for (const field of ["date_text", "source", "publication", "location", "status", "canonical_of", "withdrawn_reason"]) {
      validateString(metadata[field], field, filename);
    }
    for (const field of ["people", "tags", "events", "categories"]) {
      validateStringArray(metadata[field], field, filename);
    }
    if (metadata.date !== undefined && metadata.date !== "unknown") {
      if (typeof metadata.date !== "string" || !isValidIsoDate(metadata.date)) {
        fail(`${filename}: date must be YYYY-MM-DD or "unknown".`);
      }
    }
    if (metadata.status !== undefined && metadata.status !== "withdrawn") {
      fail(`${filename}: status must be "withdrawn" when supplied.`);
    }

    validateString(metadata.image, "image", filename, { required: true });
    if (typeof metadata.image === "string" && metadata.image.startsWith("/")) {
      const imagePath = resolve(publicDirectory, `.${metadata.image}`);
      if (!imagePath.startsWith(`${publicDirectory}${sep}`) || !existsSync(imagePath) || !statSync(imagePath).isFile()) {
        fail(`${filename}: image does not resolve to a public file: ${metadata.image}`);
      }
    } else if (metadata.image) {
      fail(`${filename}: image must be an absolute site path.`);
    }

    const slug = filename.replace(/\.md$/, "");
    if (articles.has(slug)) fail(`${filename}: duplicate article slug ${slug}.`);
    articles.set(slug, { filename, metadata });
  }
}

for (const { filename, metadata } of articles.values()) {
  if (metadata.status === "withdrawn" && !metadata.canonical_of) {
    fail(`${filename}: a withdrawn record must name canonical_of.`);
  }
  if (metadata.status === "withdrawn" && !metadata.withdrawn_reason) {
    fail(`${filename}: a withdrawn record must explain withdrawn_reason.`);
  }
  if (metadata.canonical_of) {
    const canonical = articles.get(metadata.canonical_of);
    if (!canonical) {
      fail(`${filename}: canonical_of does not reference a known article: ${metadata.canonical_of}`);
    } else if (canonical.metadata.status === "withdrawn") {
      fail(`${filename}: canonical_of must reference an active article: ${metadata.canonical_of}`);
    }
  }
}

if (errors.length) {
  console.error("Published article validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const digest = createHash("sha256")
    .update(
      [...articles.values()]
        .map(({ filename }) => `${filename}\0${createHash("sha256").update(readFileSync(join(articleDirectory, filename))).digest("hex")}`)
        .join("\n"),
    )
    .digest("hex");
  console.log(`Validated ${articles.size} published articles from the canonical corpus (SHA-256 ${digest}).`);
}
