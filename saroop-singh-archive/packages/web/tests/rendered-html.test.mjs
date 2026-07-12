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
        NEXT_PUBLIC_SITE_ORIGIN: origin,
        ARCHIVE_PUBLIC_ORIGIN: origin,
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
  assert.match(sitemapText, /\/gallery\//);
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

test("persists private family workflows behind signed Studio and AI consent gates", async () => {
  const login = new FormData();
  login.set("email", "archive-test@example.com");
  login.set("password", "test-only-password-that-is-not-secret");
  login.set("returnTo", "/studio");
  const loginResponse = await fetch(`${origin}/api/studio/session`, {
    method: "POST",
    headers: { origin },
    body: login,
    redirect: "manual",
  });
  assert.equal(loginResponse.status, 303);
  const setCookie = loginResponse.headers.get("set-cookie") || "";
  assert.match(setCookie, /saroop_archive_admin=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);

  const contribution = new FormData();
  contribution.set(
    "file",
    new Blob([tinyPng()], { type: "image/png" }),
    "family-memory.png",
  );
  contribution.set("contributorName", "Archive Test Family");
  contribution.set("relationship", "test relative");
  contribution.set("contact", "private@example.com");
  contribution.set("title", "Private integration photograph");
  contribution.set("people", "People awaiting identification");
  contribution.set("story", "A private workflow test record.");
  contribution.set("consent", "yes");
  const contributionResponse = await fetch(`${origin}/api/contribute`, {
    method: "POST",
    headers: { origin },
    body: contribution,
  });
  assert.equal(contributionResponse.status, 201);
  const contributionResult = await contributionResponse.json();
  assert.ok(contributionResult.id);

  const automationHeaders = {
    authorization:
      "Bearer test-only-automation-token-with-more-than-16-characters",
  };
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
    { method: "POST", headers: { ...automationHeaders, origin } },
  );
  assert.equal(blockedAnalysis.status, 409);

  const acceptResponse = await fetch(
    `${origin}/api/studio/images/${image.id}`,
    {
      method: "PATCH",
      headers: {
        ...automationHeaders,
        origin,
        "content-type": "application/json",
      },
      body: JSON.stringify({ status: "private" }),
    },
  );
  assert.equal(acceptResponse.status, 200);

  const stillConsentBlocked = await fetch(
    `${origin}/api/studio/images/${image.id}/analyze`,
    { method: "POST", headers: { ...automationHeaders, origin } },
  );
  assert.equal(stillConsentBlocked.status, 409);

  const memory = new FormData();
  memory.set("kind", "identify");
  memory.set("subjectId", "gemini-saroop-singh-running1");
  memory.set("anchorX", "0.5");
  memory.set("anchorY", "0.5");
  memory.set("claimantName", "Private Test Claimant");
  memory.set("proposedName", "Family Name Under Review");
  memory.set("certainty", "unsure");
  memory.set("attribution", "private");
  memory.set("consent", "yes");
  const memoryResponse = await fetch(`${origin}/api/memories`, {
    method: "POST",
    headers: { origin },
    body: memory,
  });
  assert.equal(memoryResponse.status, 201);
  const memoryResult = await memoryResponse.json();
  const receiptToken = memoryResult.receiptUrl.split("/").at(-1);
  const receiptResponse = await fetch(
    `${origin}/api/memories/${receiptToken}`,
  );
  assert.equal(receiptResponse.status, 200);
  const receiptText = await receiptResponse.text();
  assert.doesNotMatch(receiptText, /Private Test Claimant|Family Name Under Review/);
  assert.match(receiptText, /submitted/);
});
