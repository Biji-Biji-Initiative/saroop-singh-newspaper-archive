const fallbackOrigin =
  "https://saroop-singh-archive.lifeofgurpreet.chatgpt.site";

const configuredOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim();

export const SITE_ORIGIN = (
  configuredOrigin && /^https?:\/\//i.test(configuredOrigin)
    ? configuredOrigin
    : fallbackOrigin
).replace(/\/+$/, "");

export function absoluteSiteUrl(path = "/") {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}
