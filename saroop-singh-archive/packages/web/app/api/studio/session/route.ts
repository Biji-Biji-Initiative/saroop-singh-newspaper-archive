import { NextRequest, NextResponse } from "next/server";
import {
  ARCHIVE_SESSION_COOKIE,
  archiveAuthConfigured,
  archiveSessionCookieOptions,
  authenticateArchiveAdmin,
  createArchiveSessionToken,
  safeRelativeReturnPath,
} from "@/lib/archive-auth";
import {
  archiveLoginAllowed,
  recordArchiveLogin,
} from "@/lib/login-rate-limit";
import {
  hasTrustedArchiveOrigin,
  publicArchiveUrl,
} from "@/lib/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function loginRedirect(
  request: NextRequest,
  error: string,
  returnTo: string,
): NextResponse {
  const url = publicArchiveUrl("/studio/login", request.url);
  url.searchParams.set("error", error);
  url.searchParams.set("return_to", returnTo);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const returnTo = safeRelativeReturnPath(String(form.get("returnTo") || "/studio"));

  if (!hasTrustedArchiveOrigin(request)) {
    return loginRedirect(request, "origin", returnTo);
  }
  if (!archiveLoginAllowed(request)) {
    return loginRedirect(request, "rate", returnTo);
  }
  if (!archiveAuthConfigured()) {
    return loginRedirect(request, "configuration", returnTo);
  }

  const user = authenticateArchiveAdmin(
    String(form.get("email") || ""),
    String(form.get("password") || ""),
  );
  if (!user) {
    recordArchiveLogin(request, false);
    return loginRedirect(request, "invalid", returnTo);
  }

  recordArchiveLogin(request, true);
  const response = NextResponse.redirect(publicArchiveUrl(returnTo, request.url), 303);
  response.cookies.set(
    ARCHIVE_SESSION_COOKIE,
    createArchiveSessionToken(user),
    archiveSessionCookieOptions,
  );
  response.headers.set("cache-control", "private, no-store");
  return response;
}