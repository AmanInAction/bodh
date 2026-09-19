import { NextRequest, NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth/session";

/** Routes that require a session. */
const PROTECTED = ["/dashboard", "/learn", "/onboarding"];

/** Routes that should redirect logged-in users to /dashboard. */
const AUTH_ONLY = ["/auth", "/"];

/**
 * Lightweight JWT payload decoder for middleware use only.
 * Does NOT verify the signature — that is done in every API route via readSession.
 * Used solely to determine routing intent (present vs absent cookie).
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(payload);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    // Check expiry
    if (typeof parsed.exp === "number" && parsed.exp * 1000 < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get(sessionCookie)?.value;
  const payload = token ? decodeJwtPayload(token) : null;
  const isLoggedIn = !!payload?.email;

  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthOnly = pathname === "/" || AUTH_ONLY.filter(p => p !== "/").some((p) => pathname.startsWith(p));

  // Logged-in user visiting /auth → send to dashboard
  if (isLoggedIn && isAuthOnly) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Unauthenticated user visiting a protected route → send to /auth
  if (!isLoggedIn && isProtected) {
    const url = new URL("/auth", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all page routes except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
