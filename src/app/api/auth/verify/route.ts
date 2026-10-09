import { NextResponse } from "next/server";
import { createSession, sessionCookie } from "@/lib/auth/session";
import { consumeVerificationCode } from "@/lib/auth/store";
import {
  getStudentRecord,
  updateStudentProfile,
  recordLogin,
} from "@/lib/aws/dynamodb";
import { LANGUAGE_COOKIE } from "@/lib/i18n";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    code?: string;
    name?: string;
    language?: "en" | "hi";
  };

  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();

  // ── Validate OTP ────────────────────────────────────────────────────────────
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

  // ── Determine: new user or returning? ───────────────────────────────────────
  const studentId = email; // studentId === email for this app
  const existingRecord = await getStudentRecord(studentId);
  const isNewUser = !existingRecord;

  const name = body.name?.trim() || existingRecord?.name || email.split("@")[0];
  const language = body.language ?? existingRecord?.language ?? "en";

  if (isNewUser) {
    // ── Signup: initialize canonical StudentRecord ───────────────────────────
    await updateStudentProfile(studentId, {
      name,
      email,
      language,
      preferredStyle: "simple",
    });
  }

  // ── Always write login event to DynamoDB (new + returning) ──────────────────
  await recordLogin({ studentId, language });

  // ── Issue session JWT and set language cookie ───────────────────────────────
  const token = await createSession({ email, name });
  const response = NextResponse.json({ ok: true, isNewUser });
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  response.cookies.set(LANGUAGE_COOKIE, language, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
  return response;
}

