import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

type FamilySessionPayload = {
  issuedAt: number;
  expiresAt: number;
  nonce: string;
};

export type FamilyWorkspace = {
  sessionHash: string;
};

export const FAMILY_WORKSPACE_COOKIE = "saroop_family_workspace";
const FAMILY_SESSION_TTL_SECONDS = 120 * 24 * 60 * 60;

function familyInviteSecret(): string | null {
  const configured = process.env.FAMILY_WORKSPACE_INVITE_SECRET?.trim() || "";
  return configured.length >= 32 ? configured : null;
}

function familyWorkspaceId(): string | null {
  const configured = process.env.FAMILY_WORKSPACE_ID?.trim() || "";
  return configured.length >= 32 ? configured : null;
}

function constantTimeMatch(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`family-workspace/v1:${payload}`)
    .digest("base64url");
}

function parsePayload(value: string): FamilySessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<FamilySessionPayload>;
    if (
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.expiresAt !== "number" ||
      typeof parsed.nonce !== "string"
    ) {
      return null;
    }
    return parsed as FamilySessionPayload;
  } catch {
    return null;
  }
}

function validSessionToken(token: string): boolean {
  const secret = familyInviteSecret();
  const [encoded, suppliedSignature, extra] = token.split(".");
  if (!secret || !encoded || !suppliedSignature || extra) return false;
  if (!constantTimeMatch(suppliedSignature, sign(encoded, secret))) return false;
  const payload = parsePayload(encoded);
  const now = Math.floor(Date.now() / 1000);
  return Boolean(
    payload &&
      payload.issuedAt <= now + 60 &&
      payload.expiresAt > now &&
      payload.expiresAt - payload.issuedAt <= FAMILY_SESSION_TTL_SECONDS,
  );
}

export function familyWorkspaceConfigured(): boolean {
  return familyInviteSecret() !== null && familyWorkspaceId() !== null;
}

export function acceptsFamilyInvite(invite: string): boolean {
  const secret = familyInviteSecret();
  return Boolean(secret && invite && constantTimeMatch(invite, secret));
}

export function createFamilyWorkspaceToken(): string {
  const secret = familyInviteSecret();
  if (!secret) throw new Error("FAMILY_WORKSPACE_INVITE_SECRET must contain at least 32 characters.");
  const now = Math.floor(Date.now() / 1000);
  const encoded = Buffer.from(JSON.stringify({
    issuedAt: now,
    expiresAt: now + FAMILY_SESSION_TTL_SECONDS,
    nonce: randomBytes(24).toString("base64url"),
  }), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

export const familyWorkspaceCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: FAMILY_SESSION_TTL_SECONDS,
};

export async function getFamilyWorkspace(): Promise<FamilyWorkspace | null> {
  const token = (await cookies()).get(FAMILY_WORKSPACE_COOKIE)?.value;
  if (!token || !validSessionToken(token)) return null;
  // The signed cookie proves that a browser used the private family link. The
  // stable workspace identity makes the family workspace shared across
  // browsers and survives a rotation of the separate invite secret.
  const workspaceId = familyWorkspaceId();
  if (!workspaceId) return null;
  return { sessionHash: createHash("sha256").update(`family-workspace/v1:${workspaceId}`).digest("hex") };
}
