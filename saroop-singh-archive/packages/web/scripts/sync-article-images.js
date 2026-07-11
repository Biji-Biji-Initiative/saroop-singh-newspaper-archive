#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const archiveRoot = path.resolve(__dirname, '../../..');
const articlesDirectory = path.join(archiveRoot, 'content/articles/published');
const sourceImagesDirectory = path.join(
  archiveRoot,
  'content/articles/originals/clippings/saroop-singh'
);
const destinationImagesDirectory = path.join(__dirname, '../public/images');
const imagePathPrefix = '/images/';
const allowedImageExtensions = new Set(['.avif', '.jpeg', '.jpg', '.png', '.webp']);

function articleFileNames() {
  return fs
    .readdirSync(articlesDirectory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name !== 'README.md' &&
        path.extname(entry.name).toLowerCase() === '.md'
    )
    .map((entry) => entry.name)
    .sort();
}

function sourceImageNames() {
  return new Set(
    fs
      .readdirSync(sourceImagesDirectory, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name !== 'README.md' &&
          allowedImageExtensions.has(path.extname(entry.name).toLowerCase())
      )
      .map((entry) => entry.name)
  );
}

function imageFrontmatterValue(articleFileName) {
  const articlePath = path.join(articlesDirectory, articleFileName);
  const contents = fs.readFileSync(articlePath, 'utf8');
  const frontmatter = contents.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

  if (!frontmatter) {
    throw new Error(`${articleFileName}: missing YAML frontmatter`);
  }

  const imageLine = frontmatter[1].match(/^image:\s*(.*?)\s*$/m);
  if (!imageLine) {
    return null;
  }

  const value = imageLine[1];
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function imageNameForArticle(articleFileName) {
  const image = imageFrontmatterValue(articleFileName);

  if (image === null || image === '') {
    return null;
  }

  const imagePath = image.trim();
  if (!imagePath) {
    return null;
  }

  if (!imagePath.startsWith(imagePathPrefix)) {
    throw new Error(
      `${articleFileName}: image must reference ${imagePathPrefix}, received ${JSON.stringify(image)}`
    );
  }

  const imageName = imagePath.slice(imagePathPrefix.length);
  if (
    !imageName ||
    imageName !== path.posix.basename(imageName) ||
    imageName.includes('\\') ||
    !allowedImageExtensions.has(path.extname(imageName).toLowerCase())
  ) {
    throw new Error(
      `${articleFileName}: image must be a supported filename directly below ${imagePathPrefix}`
    );
  }

  return imageName;
}

function referencedImageNames() {
  const sourceImages = sourceImageNames();
  const references = new Set();

  for (const articleFileName of articleFileNames()) {
    const imageName = imageNameForArticle(articleFileName);
    if (!imageName) {
      continue;
    }

    if (!sourceImages.has(imageName)) {
      throw new Error(
        `${articleFileName}: image ${JSON.stringify(`${imagePathPrefix}${imageName}`)} does not exist in ${sourceImagesDirectory}`
      );
    }

    references.add(imageName);
  }

  return [...references].sort();
}

function replaceGeneratedImages(imageNames) {
  const temporaryDirectory = `${destinationImagesDirectory}.tmp-${process.pid}`;

  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  fs.mkdirSync(temporaryDirectory, { recursive: true });

  try {
    for (const imageName of imageNames) {
      fs.copyFileSync(
        path.join(sourceImagesDirectory, imageName),
        path.join(temporaryDirectory, imageName)
      );
    }

    fs.rmSync(destinationImagesDirectory, { recursive: true, force: true });
    fs.renameSync(temporaryDirectory, destinationImagesDirectory);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function main() {
  const imageNames = referencedImageNames();
  replaceGeneratedImages(imageNames);
  console.log(
    `Copied ${imageNames.length} referenced article scans for ${articleFileNames().length} published articles.`
  );
}

try {
  main();
} catch (error) {
  console.error(`Article image sync failed: ${error.message}`);
  process.exitCode = 1;
}
