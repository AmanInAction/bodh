import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSession, sessionCookie } from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/aws/dynamodb";
import { getLocalStudentRecord } from "@/lib/local/store";
import { LANGUAGE_COOKIE, resolveLanguage } from "@/lib/i18n";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  const session = await readSession(token);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const record =
    (await getStudentRecord(session.email)) ??
    (await getLocalStudentRecord(session.email));
  const language = resolveLanguage(
    null,
    record?.language,
    cookieStore.get(LANGUAGE_COOKIE)?.value,
  );

  return NextResponse.json({
    authenticated: true,
    session,
    language,
  });
}
