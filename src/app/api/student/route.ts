import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionOrDemo, sessionCookie, DEMO_STUDENT_ID } from "@/lib/auth/session";
import { getStudentRecord, updateStudentProfile } from "@/lib/aws/dynamodb";
import { LANGUAGE_COOKIE } from "@/lib/i18n";
import type { LearningGoal, SupportedLanguage, TeachingStyle } from "@/types/student-record";

export async function GET() {
  let session;
  try {
    session = await getSessionOrDemo(
      (await cookies()).get(sessionCookie)?.value,
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isDemo = session.email === "student_001@bodh.demo";
  const studentId = isDemo ? DEMO_STUDENT_ID : session.email;
  let record = await getStudentRecord(studentId);

  if (!record) {
    record = await updateStudentProfile(studentId, {
      name: session.name,
      email: session.email,
      language: "en",
      preferredStyle: "simple",
    });
  }

  return NextResponse.json(record);
}

export async function POST(request: Request) {
  let session;
  try {
    session = await getSessionOrDemo(
      (await cookies()).get(sessionCookie)?.value,
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates = (await request.json()) as {
    name?: string;
    language?: SupportedLanguage;
    preferredStyle?: TeachingStyle;
    goal?: LearningGoal;
  };

  const isDemo = session.email === "student_001@bodh.demo";
  const studentId = isDemo ? DEMO_STUDENT_ID : session.email;

  const updatedRecord = await updateStudentProfile(studentId, {
    name: updates.name,
    email: session.email,
    language: updates.language,
    preferredStyle: updates.preferredStyle,
    goal: updates.goal,
  });

  const response = NextResponse.json(updatedRecord, { status: 200 });

  if (updates.language) {
    response.cookies.set(LANGUAGE_COOKIE, updates.language, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
