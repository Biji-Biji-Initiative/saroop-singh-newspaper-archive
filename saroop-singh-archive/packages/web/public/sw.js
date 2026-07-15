const CACHE = "saroop-archive-premiere-v4";
const CORE = [
  "/",
  "/story",
  "/family-day",
  "/mysteries",
  "/about",
  "/manifest.webmanifest",
];
const PUBLIC_PAGES = new Set(CORE.filter((path) => !path.includes(".")));
const PRIVATE_PREFIXES = [
  "/api/",
  "/studio",
  "/memory-receipt",
  "/contribution-receipt",
  "/contribute",
  "/remember",
  "/signin-with-chatgpt",
  "/signout-with-chatgpt",
  "/callback",
];
const STATIC_ASSET = /\.(?:avif|css|gif|ico|jpe?g|js|png|svg|webp|woff2?)$/i;
const MAX_ENTRIES = 180;

self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  ),
);

self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  ),
);

async function remember(request, response) {
  if (
    !response.ok ||
    response.redirected ||
    /(?:private|no-store)/i.test(response.headers.get("cache-control") || "")
  )
    return response;
  const cache = await caches.open(CACHE);
  await cache.put(request, response.clone());
  const keys = await cache.keys();
  if (keys.length > MAX_ENTRIES)
    await Promise.all(keys.slice(0, keys.length - MAX_ENTRIES).map((key) => cache.delete(key)));
  return response;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== location.origin ||
    PRIVATE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
  )
    return;

  const cacheablePage =
    event.request.mode === "navigate" && PUBLIC_PAGES.has(url.pathname);
  const cacheableAsset =
    (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/assets/") || STATIC_ASSET.test(url.pathname)) &&
    !url.search;
  if (!cacheablePage && !cacheableAsset) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => remember(event.request, response))
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") return caches.match("/");
        return Response.error();
      }),
  );
});
