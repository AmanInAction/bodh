import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, sessionCookie } from "@/lib/auth/session";
import { consumeVerificationCode } from "@/lib/auth/store";
import { validateEmail } from "@/lib/auth/validation";
import {
  getStudentRecord,
  recordLogin,
  updateStudentProfile,
} from "@/lib/aws/dynamodb";
import {
  getLocalStudentRecord,
  putLocalStudentRecord,
} from "@/lib/local/store";
import { LANGUAGE_COOKIE, resolveLanguage } from "@/lib/i18n";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    code?: string;
    language?: string;
  };
  const validation = await validateEmail(body.email ?? "");
  const code = body.code?.trim() ?? "";

  if (!validation.valid || !validation.normalizedEmail) {
    return NextResponse.json(
      { error: validation.error ?? "Invalid email address." },
      { status: 400 },
    );
  }

  const email = validation.normalizedEmail;
  if (!(await consumeVerificationCode(email, code))) {
    return NextResponse.json(
      { error: "Invalid or expired verification code." },
      { status: 401 },
    );
  }

  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LANGUAGE_COOKIE)?.value;

  // Check if the student already has a persisted language preference
  const existingRecord =
    (await getStudentRecord(email)) ?? (await getLocalStudentRecord(email));

  // If the student already has a canonical record, preserve their saved language
  // unless an explicit language override was sent; otherwise initialize from cookie.
  const resolvedLang = existingRecord?.language
    ? resolveLanguage(body.language, existingRecord.language, cookieLang)
    : resolveLanguage(body.language, cookieLang);

  // Record login in DynamoDB / canonical StudentRecord (non-blocking if DB is unavailable)
  await recordLogin({ studentId: email, language: resolvedLang }).catch((err) =>
    console.warn("[verify] recordLogin failed:", err),
  );

  const syncedRecord = await updateStudentProfile(email, {
    email,
    language: resolvedLang,
  }).catch(() => null);

  if (syncedRecord) {
    await putLocalStudentRecord(syncedRecord).catch(() => {});
  }

  const name = existingRecord?.name ?? syncedRecord?.name ?? email.split("@")[0];
  const token = await createSession({ email, name });
  const response = NextResponse.json({
    ok: true,
    email,
    isNewUser: !existingRecord,
    language: resolvedLang,
  });

  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  // Sync cookie with the student's canonical language preference on login
  response.cookies.set(LANGUAGE_COOKIE, resolvedLang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}
