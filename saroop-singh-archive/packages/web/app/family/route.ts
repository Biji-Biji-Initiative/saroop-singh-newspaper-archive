import { NextRequest, NextResponse } from "next/server";
import { safeRelativeReturnPath } from "@/lib/archive-auth";
import {
  acceptsFamilyInvite,
  createFamilyWorkspaceToken,
  FAMILY_WORKSPACE_COOKIE,
  familyWorkspaceCookieOptions,
  familyWorkspaceConfigured,
} from "@/lib/family-workspace";
import { publicArchiveUrl } from "@/lib/request-origin";

export const runtime = "nodejs";

/**
 * A single shareable family link establishes a long-lived, passwordless family
 * workspace. Its capability never appears in browser storage or in subsequent
 * URLs, and rotating the configured invite immediately stops new entries.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const invite = url.searchParams.get("access") || "";
  if (!familyWorkspaceConfigured() || !acceptsFamilyInvite(invite)) return new Response("Not found", { status: 404 });

  const returnTo = safeRelativeReturnPath(url.searchParams.get("return_to") || "/gallery");
  const response = NextResponse.redirect(publicArchiveUrl(returnTo, request.url), 303);
  response.headers.set("Cache-Control", "private, no-store");
  response.cookies.set(
    FAMILY_WORKSPACE_COOKIE,
    createFamilyWorkspaceToken(),
    familyWorkspaceCookieOptions,
  );
  return response;
}
