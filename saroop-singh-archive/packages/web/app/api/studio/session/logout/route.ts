import { NextRequest, NextResponse } from "next/server";
import {
  ARCHIVE_SESSION_COOKIE,
  safeRelativeReturnPath,
} from "@/lib/archive-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const returnTo = safeRelativeReturnPath(
    request.nextUrl.searchParams.get("return_to") || "/",
  );
  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  response.cookies.set(ARCHIVE_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  response.headers.set("cache-control", "private, no-store");
  return response;
}