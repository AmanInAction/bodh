import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth/session";

/**
 * POST /api/auth/logout
 * Clears the session cookie and redirects to the home page.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,   // expire immediately
    path: "/",
  });
  return response;
}
