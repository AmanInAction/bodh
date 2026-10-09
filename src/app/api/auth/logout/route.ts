import { NextRequest, NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth/session";

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookie, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  });
  return response;
}

/**
 * POST /api/auth/logout
 * Clears the session cookie and returns ok or redirects to the home page.
 */
export async function POST(req: NextRequest) {
  const accept = req.headers.get("accept") ?? "";
  const isHtml = accept.includes("text/html");
  const lang = req.cookies.get("bodh_lang")?.value;
  const redirectUrl = lang ? `/?language=${lang}` : "/";

  const response = isHtml
    ? NextResponse.redirect(new URL(redirectUrl, req.url), 303)
    : NextResponse.json({ ok: true, redirect: redirectUrl });

  return clearSessionCookie(response);
}

/**
 * GET /api/auth/logout
 * Direct navigation fallback: clears session cookie and redirects to the home page.
 */
export async function GET(req: NextRequest) {
  const lang = req.cookies.get("bodh_lang")?.value;
  const redirectUrl = lang ? `/?language=${lang}` : "/";
  const response = NextResponse.redirect(new URL(redirectUrl, req.url), 303);
  return clearSessionCookie(response);
}
