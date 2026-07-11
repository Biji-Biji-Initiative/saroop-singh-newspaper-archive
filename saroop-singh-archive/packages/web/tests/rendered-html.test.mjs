import assert from "node:assert/strict";
import test from "node:test";

async function productionWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  return (await import(workerUrl.href)).default;
}

const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const context = { waitUntil() {}, passThroughOnException() {} };

test("renders the archive homepage from the production worker", async () => {
  const worker = await productionWorker();

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    env,
    context,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>[^<]*Saroop Singh Archive/i);
  assert.match(html, /Family-led digital archive/i);
  assert.doesNotMatch(html, /Restore Photos|AI Photo Restoration/i);
});

test("serves public discovery metadata from the production worker", async () => {
  const worker = await productionWorker();
  const robots = await worker.fetch(new Request("http://localhost/robots.txt"), env, context);
  assert.equal(robots.status, 200);
  const robotsText = await robots.text();
  assert.match(robotsText, /Sitemap: .*\/sitemap\.xml/);
  assert.match(robotsText, /Disallow: \/studio/);

  const sitemap = await worker.fetch(new Request("http://localhost/sitemap.xml"), env, context);
  assert.equal(sitemap.status, 200);
  const sitemapText = await sitemap.text();
  assert.match(sitemapText, /\/articles\//);
  assert.match(sitemapText, /\/gallery\//);
  assert.match(sitemapText, /\/people\/saroop-singh/);

  const manifest = await worker.fetch(new Request("http://localhost/manifest.webmanifest"), env, context);
  assert.equal(manifest.status, 200);
  assert.match(await manifest.text(), /Saroop Singh Archive/);
});
