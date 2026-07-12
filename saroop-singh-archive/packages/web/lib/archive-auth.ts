import "server-only";

import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export type ArchiveUser = {
  displayName: string;
  email: string;
  fullName: string | null;
};

type SessionPayload = {
  email: string;
  fullName: string | null;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
};

export const ARCHIVE_SESSION_COOKIE = "saroop_archive_admin";
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const SIGN_IN_PATH = "/studio/login";
const SIGN_OUT_PATH = "/api/studio/session/logout";

function allowedAdminEmails(): string[] {
  return (process.env.ARCHIVE_ADMIN_EMAILS || "")
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
}

function sessionSecret(): string | null {
  const configured = process.env.ARCHIVE_SESSION_SECRET?.trim() || "";
  return configured.length >= 32 ? configured : null;
}

function configuredPassword(): string | null {
  const configured =
    process.env.ARCHIVE_ADMIN_PASSWORD?.trim() ||
    process.env.ADMIN_API_TOKEN?.trim() ||
    "";
  return configured.length >= 16 ? configured : null;
}

function constantTimeMatch(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encoded: string): SessionPayload | null {
  try {
    const value = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<SessionPayload>;
    if (
      typeof value.email !== "string" ||
      (value.fullName !== null && typeof value.fullName !== "string") ||
      typeof value.issuedAt !== "number" ||
      typeof value.expiresAt !== "number" ||
      typeof value.nonce !== "string"
    ) {
      return null;
    }
    return value as SessionPayload;
  } catch {
    return null;
  }
}

export function createArchiveSessionToken(user: ArchiveUser): string {
  const secret = sessionSecret();
  if (!secret) {
    throw new Error(
      "ARCHIVE_SESSION_SECRET must contain at least 32 characters.",
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const encoded = encodePayload({
    email: user.email.toLowerCase(),
    fullName: user.fullName,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_SECONDS,
    nonce: randomBytes(16).toString("base64url"),
  });
  return `${encoded}.${sign(encoded, secret)}`;
}

export const archiveSessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

function verifySessionToken(token: string): ArchiveUser | null {
  const secret = sessionSecret();
  const [encoded, suppliedSignature, extra] = token.split(".");
  if (!secret || !encoded || !suppliedSignature || extra) return null;
  if (!constantTimeMatch(suppliedSignature, sign(encoded, secret))) return null;

  const payload = decodePayload(encoded);
  const now = Math.floor(Date.now() / 1000);
  if (
    !payload ||
    payload.issuedAt > now + 60 ||
    payload.expiresAt <= now ||
    payload.expiresAt - payload.issuedAt > SESSION_TTL_SECONDS
  ) {
    return null;
  }

  const email = payload.email.toLowerCase();
  if (!allowedAdminEmails().includes(email)) return null;
  return {
    displayName: payload.fullName || email,
    email,
    fullName: payload.fullName,
  };
}

function bearerUser(authorization: string | null): ArchiveUser | null {
  const token = /^Bearer ([^\s]+)$/.exec(authorization || "")?.[1] || "";
  const configured = process.env.ADMIN_API_TOKEN?.trim() || "";
  const email = allowedAdminEmails()[0];
  if (
    !token ||
    configured.length < 16 ||
    !email ||
    !constantTimeMatch(token, configured)
  ) {
    return null;
  }
  return { displayName: email, email, fullName: null };
}

export async function getArchiveUser(): Promise<ArchiveUser | null> {
  const requestHeaders = await headers();
  const automation = bearerUser(requestHeaders.get("authorization"));
  if (automation) return automation;

  const cookieStore = await cookies();
  const token = cookieStore.get(ARCHIVE_SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

export function archiveAuthConfigured(): boolean {
  return (
    allowedAdminEmails().length > 0 &&
    sessionSecret() !== null &&
    configuredPassword() !== null
  );
}

export function authenticateArchiveAdmin(
  emailValue: string,
  passwordValue: string,
): ArchiveUser | null {
  const email = emailValue.trim().toLowerCase();
  const password = configuredPassword();
  if (
    !email ||
    !password ||
    !allowedAdminEmails().includes(email) ||
    !constantTimeMatch(passwordValue, password)
  ) {
    return null;
  }
  return { displayName: email, email, fullName: null };
}

export async function requireArchiveAdmin(
  returnTo: string,
): Promise<ArchiveUser> {
  const user = await getArchiveUser();
  if (user) return user;
  redirect(archiveSignInPath(returnTo));
}

export function archiveSignInPath(returnTo: string): string {
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function archiveSignOutPath(returnTo = "/"): string {
  return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  try {
    const url = new URL(value, "https://archive.local");
    if (url.origin !== "https://archive.local") return "/";
    if (
      url.pathname === SIGN_IN_PATH ||
      url.pathname.startsWith("/api/studio/session")
    ) {
      return "/";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
