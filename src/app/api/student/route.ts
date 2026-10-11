import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getSessionOrDemo,
  sessionCookie,
  DEMO_STUDENT_ID,
} from "@/lib/auth/session";
import {
  getStudentRecord,
  updateStudentProfile,
  resolveStudentId,
} from "@/lib/aws/dynamodb";
import {
  getLocalStudentRecord,
  putLocalStudentRecord,
} from "@/lib/local/store";
import { LANGUAGE_COOKIE, resolveLanguage } from "@/lib/i18n";
import type {
  LearningGoal,
  StudentRecord,
  SupportedLanguage,
  TeachingStyle,
} from "@/types/student-record";

const VALID_GOALS: LearningGoal[] = ["scratch", "foundations", "interview"];
const VALID_STYLES: TeachingStyle[] = [
  "simple",
  "socratic",
  "visual",
  "interview",
];

export async function GET() {
  let session;
  try {
    session = await getSessionOrDemo(
      (await cookies()).get(sessionCookie)?.value,
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LANGUAGE_COOKIE)?.value;
  const studentId =
    session.email === "student_001@bodh.demo"
      ? DEMO_STUDENT_ID
      : resolveStudentId(session.email);

  const record =
    (await getStudentRecord(studentId)) ??
    (await getLocalStudentRecord(studentId));

  const language = resolveLanguage(null, record?.language, cookieLang);

  const canonical: StudentRecord = record ?? {
    studentId,
    name: session.name,
    email: session.email,
    language,
    preferredStyle: "simple",
    topics: {},
    weakTopics: [],
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({
    ...canonical,
    id: canonical.studentId,
  });
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

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    language?: string;
    preferredStyle?: string;
    goal?: string;
  };

  const studentId =
    session.email === "student_001@bodh.demo"
      ? DEMO_STUDENT_ID
      : resolveStudentId(session.email);

  const nextLanguage: SupportedLanguage | undefined =
    body.language === "hi"
      ? "hi"
      : body.language === "en"
        ? "en"
        : undefined;

  const nextStyle: TeachingStyle | undefined = VALID_STYLES.includes(
    body.preferredStyle as TeachingStyle,
  )
    ? (body.preferredStyle as TeachingStyle)
    : undefined;

  const nextGoal: LearningGoal | undefined = VALID_GOALS.includes(
    body.goal as LearningGoal,
  )
    ? (body.goal as LearningGoal)
    : undefined;

  const updatedRecord = await updateStudentProfile(studentId, {
    name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : session.name,
    email: session.email,
    language: nextLanguage,
    preferredStyle: nextStyle,
    goal: nextGoal,
  });

  await putLocalStudentRecord(updatedRecord).catch(() => {});

  const response = NextResponse.json({
    ...updatedRecord,
    id: updatedRecord.studentId,
  });

  if (nextLanguage) {
    response.cookies.set(LANGUAGE_COOKIE, nextLanguage, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}
