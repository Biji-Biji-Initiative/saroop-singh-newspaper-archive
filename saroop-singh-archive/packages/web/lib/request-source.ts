import "server-only";

import { createHash } from "node:crypto";

function normalizedAddress(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map(value => value.trim())
    .filter(Boolean)
    .at(-1);
  const candidate = realIp || cloudflareIp || forwarded || "unknown";
  return /^[0-9a-f:.]{2,64}$/i.test(candidate) ? candidate.toLowerCase() : "unknown";
}

export function dailyRequestSourceHash(
  request: Request,
  purpose: "contribution" | "memory" | "login",
): string {
  const day = new Date().toISOString().slice(0, 10);
  const pepper =
    process.env.ARCHIVE_SOURCE_HASH_SECRET?.trim() ||
    process.env.ARCHIVE_SESSION_SECRET?.trim() ||
    "local-development";
  return createHash("sha256")
    .update(`${purpose}:${day}:${normalizedAddress(request)}:${pepper}`)
    .digest("hex");
}

export function configuredDailyLimit(
  environmentName: string,
  fallback: number,
  maximum: number,
): number {
  const configured = Number(process.env[environmentName]);
  return Number.isSafeInteger(configured) &&
    configured > 0 &&
    configured <= maximum
    ? configured
    : fallback;
}