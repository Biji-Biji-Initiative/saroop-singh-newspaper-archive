import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import net from "node:net";
import test, { after, before } from "node:test";

let archiveDataDir;
let productionServer;
let origin;
const publicOrigin = "https://archive.example.test";
let serverOutput = "";

async function availablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close(error => (error || !port ? reject(error || new Error("No test port")) : resolve(port)));
    });
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return;
    } catch {
      // The production server is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Next production server did not become ready.\n${serverOutput}`);
}

before(async () => {
  const port = await availablePort();
  archiveDataDir = await mkdtemp(join(tmpdir(), "saroop-rendered-test-"));
  origin = `http://127.0.0.1:${port}`;
  productionServer = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: new URL("..", import.meta.url),
      env: {
        ...process.env,
        NODE_ENV: "production",
        ARCHIVE_DATA_DIR: archiveDataDir,
        NEXT_PUBLIC_SITE_ORIGIN: publicOrigin,
        ARCHIVE_PUBLIC_ORIGIN: publicOrigin,
        ARCHIVE_ADMIN_EMAILS: "archive-test@example.com",
        ARCHIVE_ADMIN_PASSWORD: "test-only-password-that-is-not-secret",
        ADMIN_API_TOKEN: "test-only-automation-token-with-more-than-16-characters",
        ARCHIVE_SESSION_SECRET: "test-only-session-secret-with-more-than-32-characters",
        GEMINI_API_KEY: "",
        OPENAI_API_KEY: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  productionServer.stdout.on("data", chunk => { serverOutput += chunk; });
  productionServer.stderr.on("data", chunk => { serverOutput += chunk; });
  await waitForServer();
});

after(async () => {
  productionServer?.kill("SIGTERM");
  await rm(archiveDataDir, { recursive: true, force: true });
});

test("renders the archive homepage from the production Next server", async () => {
  const response = await fetch(`${origin}/`, {
    headers: { accept: "text/html" },
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>[^<]*Saroop Singh Archive/i);
  assert.match(html, /Family-led digital archive/i);
  assert.doesNotMatch(html, /Restore Photos|AI Photo Restoration/i);

  const stylesheetUrls = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map(match => match[0])
    .filter(tag => /\brel="stylesheet"/i.test(tag))
    .map(tag => tag.match(/\bhref="([^"]+)"/i)?.[1])
    .filter(href => typeof href === "string")
    .map(href => new URL(href, origin));
  assert.ok(stylesheetUrls.length > 0, "homepage must link its generated stylesheets");

  const stylesheetResponses = await Promise.all(stylesheetUrls.map(url => fetch(url)));
  for (const stylesheetResponse of stylesheetResponses) {
    assert.equal(stylesheetResponse.status, 200);
    assert.match(stylesheetResponse.headers.get("content-type") ?? "", /^text\/css\b/i);
  }
  const css = (await Promise.all(stylesheetResponses.map(item => item.text()))).join("\n");
  const htmlOpeningTag = html.match(/<html\b[^>]*>/i)?.[0] ?? "";
  const bodyOpeningTag = html.match(/<body\b[^>]*>/i)?.[0] ?? "";

  for (const variable of ["font-geist-sans", "font-geist-mono", "font-archive-serif"]) {
    const variableClass = css.match(
      new RegExp(`\\.([A-Za-z0-9_-]+)\\s*\\{\\s*--${variable}:`),
    )?.[1];
    assert.ok(variableClass, `built CSS must expose --${variable}`);
    assert.ok(
      htmlOpeningTag.includes(variableClass),
      `--${variable} must be scoped on html so :root theme variables can resolve`,
    );
    assert.ok(
      !bodyOpeningTag.includes(variableClass),
      `--${variable} must not be scoped below the :root Tailwind theme`,
    );
  }
  assert.match(css, /--font-sans:\s*var\(--font-geist-sans\)/);
  assert.match(css, /--font-serif:\s*var\(--font-archive-serif\)/);
  assert.match(css, /--font-mono:\s*var\(--font-geist-mono\)/);
});

test("serves public discovery metadata from the production Next server", async () => {
  const robots = await fetch(`${origin}/robots.txt`);
  assert.equal(robots.status, 200);
  const robotsText = await robots.text();
  assert.match(robotsText, /Sitemap: .*\/sitemap\.xml/);
  assert.match(robotsText, /Disallow: \/studio/);

  const sitemap = await fetch(`${origin}/sitemap.xml`);
  assert.equal(sitemap.status, 200);
  const sitemapText = await sitemap.text();
  assert.match(sitemapText, /\/articles\//);
  assert.match(sitemapText, /<loc>https:\/\/archive\.example\.test\/gallery<\/loc>/);
  assert.match(sitemapText, /\/people\/saroop-singh/);

  const manifest = await fetch(`${origin}/manifest.webmanifest`);
  assert.equal(manifest.status, 200);
  assert.match(await manifest.text(), /Saroop Singh Archive/);
});

function tinyPng(width = 12, height = 9) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13);
  bytes.set(new TextEncoder().encode("IHDR"), 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

function contributionForm({
  receiptToken,
  uploadToken,
  clientItemId,
  bytes = tinyPng(),
  filename = "family-memory.png",
}) {
  const form = new FormData();
  form.set("file", new Blob([bytes], { type: "image/png" }), filename);
  form.set("contributorName", "Archive Test Family");
  form.set("relationship", "test relative");
  form.set("contact", "private@example.com");
  form.set("title", "Private integration photograph");
  form.set("people", "People awaiting identification");
  form.set("story", "A private workflow test record.");
  form.set("consent", "yes");
  form.set("receiptToken", receiptToken);
  form.set("uploadToken", uploadToken);
  form.set("clientItemId", clientItemId);
  return form;
}

test("persists private family workflows behind signed Studio and AI consent gates", async () => {
  const login = new FormData();
  login.set("email", "archive-test@example.com");
  login.set("password", "test-only-password-that-is-not-secret");
  login.set("returnTo", "/studio");
  const loginResponse = await fetch(`${origin}/api/studio/session`, {
    method: "POST",
    headers: { origin: publicOrigin },
    body: login,
    redirect: "manual",
  });
  assert.equal(loginResponse.status, 303);
  assert.equal(loginResponse.headers.get("location"), `${publicOrigin}/studio`);
  const setCookie = loginResponse.headers.get("set-cookie") || "";
  assert.match(setCookie, /saroop_archive_admin=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);

  const logoutResponse = await fetch(
    `${origin}/api/studio/session/logout?return_to=%2F`,
    { redirect: "manual" },
  );
  assert.equal(logoutResponse.status, 303);
  assert.equal(logoutResponse.headers.get("location"), `${publicOrigin}/`);

  const contributionReceiptToken = `receipt-${"a".repeat(64)}`;
  const contributionUploadToken = `upload-${"b".repeat(64)}`;
  const firstClientItemId = "00000000-0000-4000-8000-000000000001";
  const secondClientItemId = "00000000-0000-4000-8000-000000000002";
  const contributionResponse = await fetch(`${origin}/api/contribute`, {
    method: "POST",
    headers: { origin: publicOrigin },
    body: contributionForm({
      receiptToken: contributionReceiptToken,
      uploadToken: contributionUploadToken,
      clientItemId: firstClientItemId,
    }),
  });
  assert.equal(contributionResponse.status, 201);
  assert.equal(contributionResponse.headers.get("cache-control"), "private, no-store");
  const contributionResult = await contributionResponse.json();
  assert.ok(contributionResult.id);
  assert.equal(
    contributionResult.receiptUrl,
    `/contribution-receipt/${contributionReceiptToken}`,
  );

  const secondContributionResponse = await fetch(`${origin}/api/contribute`, {
    method: "POST",
    headers: { origin: publicOrigin },
    body: contributionForm({
      receiptToken: contributionReceiptToken,
      uploadToken: contributionUploadToken,
      clientItemId: secondClientItemId,
      bytes: tinyPng(13, 9),
      filename: "second-family-memory.png",
    }),
  });
  assert.equal(secondContributionResponse.status, 201);
  const secondContributionResult = await secondContributionResponse.json();
  assert.notEqual(secondContributionResult.id, contributionResult.id);

  const retryResponse = await fetch(`${origin}/api/contribute`, {
    method: "POST",
    headers: { origin: publicOrigin },
    body: contributionForm({
      receiptToken: contributionReceiptToken,
      uploadToken: contributionUploadToken,
      clientItemId: firstClientItemId,
    }),
  });
  assert.equal(retryResponse.status, 200);
  const retryResult = await retryResponse.json();
  assert.equal(retryResult.id, contributionResult.id);
  assert.equal(retryResult.receiptUrl, contributionResult.receiptUrl);

  const conflictingRetryResponse = await fetch(`${origin}/api/contribute`, {
    method: "POST",
    headers: { origin: publicOrigin },
    body: contributionForm({
      receiptToken: contributionReceiptToken,
      uploadToken: contributionUploadToken,
      clientItemId: firstClientItemId,
      bytes: tinyPng(14, 9),
    }),
  });
  assert.equal(conflictingRetryResponse.status, 409);

  const wrongUploadTokenResponse = await fetch(`${origin}/api/contribute`, {
    method: "POST",
    headers: { origin: publicOrigin },
    body: contributionForm({
      receiptToken: contributionReceiptToken,
      uploadToken: `upload-${"c".repeat(64)}`,
      clientItemId: "00000000-0000-4000-8000-000000000003",
      bytes: tinyPng(15, 9),
    }),
  });
  assert.equal(wrongUploadTokenResponse.status, 403);

  const sharedCapabilityToken = `session-${"c".repeat(64)}`;
  const sharedCapabilityResponse = await fetch(`${origin}/api/contribute`, {
    method: "POST",
    headers: { origin: publicOrigin },
    body: contributionForm({
      receiptToken: sharedCapabilityToken,
      uploadToken: sharedCapabilityToken,
      clientItemId: "00000000-0000-4000-8000-000000000003",
      bytes: tinyPng(16, 9),
    }),
  });
  assert.equal(sharedCapabilityResponse.status, 400);

  const contributionReceiptResponse = await fetch(
    `${origin}/api/contributions/${contributionReceiptToken}`,
  );
  assert.equal(contributionReceiptResponse.status, 200);
  assert.equal(
    contributionReceiptResponse.headers.get("cache-control"),
    "private, no-store",
  );
  const contributionReceipt = await contributionReceiptResponse.json();
  assert.equal(contributionReceipt.receivedCount, 2);
  assert.equal(contributionReceipt.duplicateCount, 0);
  assert.equal(contributionReceipt.pendingReviewCount, 2);
  assert.equal(contributionReceipt.status, "submitted");
  assert.match(contributionReceipt.createdAt, /^\d{4}-\d{2}-\d{2}/);
  const contributionReceiptText = JSON.stringify(contributionReceipt);
  assert.doesNotMatch(
    contributionReceiptText,
    /Archive Test Family|private@example\.com|People awaiting identification|originals\/sha256|imageId|originalSha256/,
  );
  assert.doesNotMatch(contributionReceiptText, new RegExp(contributionResult.id));
  const contributionReceiptPage = await fetch(
    `${origin}${contributionResult.receiptUrl}`,
    { headers: { accept: "text/html" } },
  );
  assert.equal(contributionReceiptPage.status, 200);
  assert.match(
    await contributionReceiptPage.text(),
    /name="robots" content="noindex, nofollow"/,
  );

  const missingContributionReceipt = await fetch(
    `${origin}/api/contributions/receipt-${"d".repeat(64)}`,
  );
  assert.equal(missingContributionReceipt.status, 404);

  const duplicateReceiptToken = `receipt-${"e".repeat(64)}`;
  const duplicateResponse = await fetch(`${origin}/api/contribute`, {
    method: "POST",
    headers: { origin: publicOrigin },
    body: contributionForm({
      receiptToken: duplicateReceiptToken,
      uploadToken: `upload-${"f".repeat(64)}`,
      clientItemId: "00000000-0000-4000-8000-000000000004",
    }),
  });
  assert.equal(duplicateResponse.status, 200);
  assert.equal((await duplicateResponse.json()).duplicate, true);
  const duplicateReceiptResponse = await fetch(
    `${origin}/api/contributions/${duplicateReceiptToken}`,
  );
  assert.equal(duplicateReceiptResponse.status, 200);
  const duplicateReceipt = await duplicateReceiptResponse.json();
  assert.match(duplicateReceipt.createdAt, /^\d{4}-\d{2}-\d{2}/);
  assert.deepEqual(
    {
      receivedCount: duplicateReceipt.receivedCount,
      duplicateCount: duplicateReceipt.duplicateCount,
      pendingReviewCount: duplicateReceipt.pendingReviewCount,
      status: duplicateReceipt.status,
    },
    {
      receivedCount: 0,
      duplicateCount: 1,
      pendingReviewCount: 0,
      status: "received",
    },
  );

  const automationHeaders = {
    authorization:
      "Bearer test-only-automation-token-with-more-than-16-characters",
  };

  const sourceUpload = new FormData();
  sourceUpload.set(
    "file",
    new Blob([tinyPng(19, 11)], { type: "image/png" }),
    "canonical-test-source.png",
  );
  sourceUpload.set("title", "Canonical public test photograph");
  sourceUpload.set("description", "A canonical-only test record.");
  sourceUpload.set("rights", "Test archive permission");
  const sourceUploadResponse = await fetch(`${origin}/api/studio/images`, {
    method: "POST",
    headers: { ...automationHeaders, origin: publicOrigin },
    body: sourceUpload,
  });
  assert.equal(sourceUploadResponse.status, 201);
  const { id: publishedSourceId } = await sourceUploadResponse.json();
  assert.ok(publishedSourceId);

  const publishSource = await fetch(`${origin}/api/studio/publish`, {
    method: "POST",
    headers: {
      ...automationHeaders,
      origin: publicOrigin,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      imageId: publishedSourceId,
      publish: true,
      publicationConfirmed: true,
    }),
  });
  assert.equal(publishSource.status, 200);

  const studioResponse = await fetch(`${origin}/api/studio/images`, {
    headers: automationHeaders,
  });
  assert.equal(studioResponse.status, 200);
  const studio = await studioResponse.json();
  const image = studio.images.find(item => item.id === contributionResult.id);
  assert.equal(image.status, "submitted");
  assert.equal(image.aiProcessingConsent, "declined");
  assert.equal(image.photoAnalysisStatus, "not-requested");
  assert.equal(image.contributorContact, "private@example.com");

  const publicOriginal = await fetch(`${origin}${image.originalUrl}`);
  assert.equal(publicOriginal.status, 404);
  const privateOriginal = await fetch(`${origin}${image.originalUrl}`, {
    headers: automationHeaders,
  });
  assert.equal(privateOriginal.status, 200);
  assert.equal(privateOriginal.headers.get("content-type"), "image/png");

  const blockedAnalysis = await fetch(
    `${origin}/api/studio/images/${image.id}/analyze`,
    { method: "POST", headers: { ...automationHeaders, origin: publicOrigin } },
  );
  assert.equal(blockedAnalysis.status, 409);

  const acceptResponse = await fetch(
    `${origin}/api/studio/images/${image.id}`,
    {
      method: "PATCH",
      headers: {
        ...automationHeaders,
        origin: publicOrigin,
        "content-type": "application/json",
      },
      body: JSON.stringify({ status: "private" }),
    },
  );
  assert.equal(acceptResponse.status, 200);

  const stillConsentBlocked = await fetch(
    `${origin}/api/studio/images/${image.id}/analyze`,
    { method: "POST", headers: { ...automationHeaders, origin: publicOrigin } },
  );
  assert.equal(stillConsentBlocked.status, 409);

  const memory = new FormData();
  memory.set("kind", "identify");
  memory.set("subjectId", publishedSourceId);
  memory.set("anchorX", "0.5");
  memory.set("anchorY", "0.5");
  memory.set("claimantName", "Private Test Claimant");
  memory.set("proposedName", "Family Name Under Review");
  memory.set("certainty", "unsure");
  memory.set("attribution", "private");
  memory.set("consent", "yes");
  const memoryResponse = await fetch(`${origin}/api/memories`, {
    method: "POST",
    headers: { origin: publicOrigin },
    body: memory,
  });
  assert.equal(memoryResponse.status, 201);
  const memoryResult = await memoryResponse.json();
  const memoryReceiptToken = memoryResult.receiptUrl.split("/").at(-1);
  const memoryReceiptResponse = await fetch(
    `${origin}/api/memories/${memoryReceiptToken}`,
  );
  assert.equal(memoryReceiptResponse.status, 200);
  const memoryReceiptText = await memoryReceiptResponse.text();
  assert.doesNotMatch(memoryReceiptText, /Private Test Claimant|Family Name Under Review/);
  assert.match(memoryReceiptText, /submitted/);

  const prematurePublication = await fetch(
    `${origin}/api/studio/memories/${memoryResult.id}/public-identity`,
    { method: "POST", headers: { ...automationHeaders, origin: publicOrigin } },
  );
  assert.equal(prematurePublication.status, 409);

  const corroborateMemory = await fetch(`${origin}/api/studio/memories`, {
    method: "PATCH",
    headers: {
      ...automationHeaders,
      origin: publicOrigin,
      "content-type": "application/json",
    },
    body: JSON.stringify({ id: memoryResult.id, status: "corroborated" }),
  });
  assert.equal(corroborateMemory.status, 200);

  const publishIdentity = await fetch(
    `${origin}/api/studio/memories/${memoryResult.id}/public-identity`,
    { method: "POST", headers: { ...automationHeaders, origin: publicOrigin } },
  );
  assert.equal(publishIdentity.status, 200);
  const publishedIdentity = await publishIdentity.json();
  assert.equal(publishedIdentity.applied, true);
  assert.equal(publishedIdentity.publicIdentity.name, "Family Name Under Review");

  const repeatedPublication = await fetch(
    `${origin}/api/studio/memories/${memoryResult.id}/public-identity`,
    { method: "POST", headers: { ...automationHeaders, origin: publicOrigin } },
  );
  assert.equal(repeatedPublication.status, 200);
  assert.equal((await repeatedPublication.json()).applied, false);

  const reviewedMemories = await fetch(`${origin}/api/studio/memories`, {
    headers: automationHeaders,
  });
  assert.equal(reviewedMemories.status, 200);
  const reviewedMemory = (await reviewedMemories.json()).memories.find(
    (item) => item.id === memoryResult.id,
  );
  assert.equal(reviewedMemory.status, "approved");
  assert.deepEqual(reviewedMemory.publicIdentity, {
    id: publishedIdentity.publicIdentity.id,
    name: "Family Name Under Review",
    status: "published",
    publishedAt: reviewedMemory.publicIdentity.publishedAt,
    removedAt: null,
  });

  const galleryWithIdentification = await fetch(`${origin}/api/gallery?limit=50`);
  assert.equal(galleryWithIdentification.status, 200);
  const taggedPhoto = (await galleryWithIdentification.json()).items.find(
    (item) => item.id === publishedSourceId,
  );
  assert.ok(taggedPhoto);
  assert.match(taggedPhoto.familyMember, /Family Name Under Review/);
  const taggedDetailPage = await fetch(
    `${origin}/gallery/${publishedSourceId}`,
  );
  assert.equal(taggedDetailPage.status, 200);
  assert.match(await taggedDetailPage.text(), /Family Name Under Review/);

  const preservationExport = await fetch(`${origin}/api/studio/export`, {
    headers: automationHeaders,
  });
  assert.equal(preservationExport.status, 200);
  const preservationSnapshot = await preservationExport.json();
  assert.equal(preservationSnapshot.schemaVersion, 3);
  assert.equal(
    preservationSnapshot.studio.publicIdentityTags.find(
      (identity) => identity.sourceMemoryId === memoryResult.id,
    ).status,
    "published",
  );
  assert.equal(
    preservationSnapshot.studio.publicIdentityTagEvents.find(
      (event) =>
        event.detail.sourceMemoryId === memoryResult.id &&
        event.eventType === "public:published",
    ).actor,
    "archive-test@example.com",
  );

  const protectedReviewState = await fetch(`${origin}/api/studio/memories`, {
    method: "PATCH",
    headers: {
      ...automationHeaders,
      origin: publicOrigin,
      "content-type": "application/json",
    },
    body: JSON.stringify({ id: memoryResult.id, status: "private" }),
  });
  assert.equal(protectedReviewState.status, 409);

  const privateReceiptAfterPublication = await fetch(
    `${origin}/api/memories/${memoryReceiptToken}`,
  );
  assert.equal(privateReceiptAfterPublication.status, 200);
  assert.doesNotMatch(
    await privateReceiptAfterPublication.text(),
    /Private Test Claimant|Family Name Under Review/,
  );

  const removeIdentity = await fetch(
    `${origin}/api/studio/memories/${memoryResult.id}/public-identity`,
    { method: "DELETE", headers: { ...automationHeaders, origin: publicOrigin } },
  );
  assert.equal(removeIdentity.status, 200);
  assert.deepEqual(await removeIdentity.json(), { removed: true });

  const galleryAfterRemoval = await fetch(`${origin}/api/gallery?limit=50`);
  const untaggedPhoto = (await galleryAfterRemoval.json()).items.find(
    (item) => item.id === publishedSourceId,
  );
  assert.ok(untaggedPhoto);
  assert.doesNotMatch(untaggedPhoto.familyMember, /Family Name Under Review/);
  const untaggedDetailPage = await fetch(
    `${origin}/gallery/${publishedSourceId}`,
  );
  assert.equal(untaggedDetailPage.status, 200);
  assert.doesNotMatch(await untaggedDetailPage.text(), /Family Name Under Review/);
  const removalExport = await fetch(`${origin}/api/studio/export`, {
    headers: automationHeaders,
  });
  assert.equal(removalExport.status, 200);
  assert.ok(
    (await removalExport.json()).studio.publicIdentityTagEvents.some(
      (event) =>
        event.detail.sourceMemoryId === memoryResult.id &&
        event.eventType === "public:removed",
    ),
  );
});

test("serializes concurrent contribution receipts without losing a photograph", async () => {
  const request = (form) =>
    fetch(`${origin}/api/contribute`, {
      method: "POST",
      headers: { origin: publicOrigin },
      body: form,
    });

  const batchReceiptToken = `receipt-${"g".repeat(64)}`;
  const batchUploadToken = `upload-${"h".repeat(64)}`;
  const [firstBatchResponse, secondBatchResponse] = await Promise.all([
    request(
      contributionForm({
        receiptToken: batchReceiptToken,
        uploadToken: batchUploadToken,
        clientItemId: "00000000-0000-4000-8000-000000000005",
        bytes: tinyPng(17, 9),
      }),
    ),
    request(
      contributionForm({
        receiptToken: batchReceiptToken,
        uploadToken: batchUploadToken,
        clientItemId: "00000000-0000-4000-8000-000000000006",
        bytes: tinyPng(18, 9),
      }),
    ),
  ]);
  assert.deepEqual(
    [firstBatchResponse.status, secondBatchResponse.status].sort(),
    [201, 201],
  );
  const [firstBatchResult, secondBatchResult] = await Promise.all([
    firstBatchResponse.json(),
    secondBatchResponse.json(),
  ]);
  assert.notEqual(firstBatchResult.id, secondBatchResult.id);
  const sharedBatchReceipt = await fetch(
    `${origin}/api/contributions/${batchReceiptToken}`,
  );
  assert.equal(sharedBatchReceipt.status, 200);
  const sharedBatchSummary = await sharedBatchReceipt.json();
  assert.match(sharedBatchSummary.createdAt, /^\d{4}-\d{2}-\d{2}/);
  assert.deepEqual(
    {
      receivedCount: sharedBatchSummary.receivedCount,
      duplicateCount: sharedBatchSummary.duplicateCount,
      pendingReviewCount: sharedBatchSummary.pendingReviewCount,
      status: sharedBatchSummary.status,
    },
    {
      receivedCount: 2,
      duplicateCount: 0,
      pendingReviewCount: 2,
      status: "submitted",
    },
  );

  const retryReceiptToken = `receipt-${"i".repeat(64)}`;
  const retryUploadToken = `upload-${"j".repeat(64)}`;
  const retryInput = {
    receiptToken: retryReceiptToken,
    uploadToken: retryUploadToken,
    clientItemId: "00000000-0000-4000-8000-000000000007",
    bytes: tinyPng(19, 9),
  };
  const [firstRetryResponse, secondRetryResponse] = await Promise.all([
    request(contributionForm(retryInput)),
    request(contributionForm(retryInput)),
  ]);
  assert.deepEqual(
    [firstRetryResponse.status, secondRetryResponse.status].sort(),
    [200, 201],
  );
  const [firstRetryResult, secondRetryResult] = await Promise.all([
    firstRetryResponse.json(),
    secondRetryResponse.json(),
  ]);
  assert.equal(firstRetryResult.id, secondRetryResult.id);
  const retryReceipt = await fetch(`${origin}/api/contributions/${retryReceiptToken}`);
  assert.equal(retryReceipt.status, 200);
  const retrySummary = await retryReceipt.json();
  assert.equal(retrySummary.receivedCount, 1);
  assert.equal(retrySummary.duplicateCount, 0);
  assert.equal(retrySummary.pendingReviewCount, 1);

  const sharedSource = tinyPng(20, 9);
  const firstSourceReceiptToken = `receipt-${"k".repeat(64)}`;
  const secondSourceReceiptToken = `receipt-${"m".repeat(64)}`;
  const [firstSourceResponse, secondSourceResponse] = await Promise.all([
    request(
      contributionForm({
        receiptToken: firstSourceReceiptToken,
        uploadToken: `upload-${"l".repeat(64)}`,
        clientItemId: "00000000-0000-4000-8000-000000000008",
        bytes: sharedSource,
      }),
    ),
    request(
      contributionForm({
        receiptToken: secondSourceReceiptToken,
        uploadToken: `upload-${"n".repeat(64)}`,
        clientItemId: "00000000-0000-4000-8000-000000000009",
        bytes: sharedSource,
      }),
    ),
  ]);
  assert.deepEqual(
    [firstSourceResponse.status, secondSourceResponse.status].sort(),
    [200, 201],
  );
  const [firstSourceResult, secondSourceResult] = await Promise.all([
    firstSourceResponse.json(),
    secondSourceResponse.json(),
  ]);
  assert.equal(firstSourceResult.id, secondSourceResult.id);
  assert.equal(
    Number(Boolean(firstSourceResult.duplicate)) + Number(Boolean(secondSourceResult.duplicate)),
    1,
  );
  const [firstSourceReceipt, secondSourceReceipt] = await Promise.all([
    fetch(`${origin}/api/contributions/${firstSourceReceiptToken}`).then(response => response.json()),
    fetch(`${origin}/api/contributions/${secondSourceReceiptToken}`).then(response => response.json()),
  ]);
  assert.equal(firstSourceReceipt.receivedCount + secondSourceReceipt.receivedCount, 1);
  assert.equal(firstSourceReceipt.duplicateCount + secondSourceReceipt.duplicateCount, 1);
  assert.equal(firstSourceReceipt.pendingReviewCount + secondSourceReceipt.pendingReviewCount, 1);
});
