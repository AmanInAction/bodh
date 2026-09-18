import { NextResponse } from "next/server";
import { createSession, sessionCookie } from "@/lib/auth/session";
import { consumeVerificationCode } from "@/lib/auth/store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    code?: string;
    name?: string;
  };
  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();
  if (
    !email ||
    !code ||
    !/^\d{6}$/.test(code) ||
    !(await consumeVerificationCode(email, code))
  ) {
    return NextResponse.json(
      { error: "That code is invalid or expired." },
      { status: 401 },
    );
  }
  const token = await createSession({
    email,
    name: body.name?.trim() || email.split("@")[0],
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
