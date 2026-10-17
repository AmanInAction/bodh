import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getSessionOrDemo,
  sessionCookie,
  DEMO_STUDENT_ID,
} from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/aws/dynamodb";
import { generateSmartRecommendations } from "@/lib/learning/recommendation";
import { getRoadmap } from "@/lib/learning/roadmap";
import { LANGUAGE_COOKIE, resolveLanguage } from "@/lib/i18n";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let session;
  try {
    session = await getSessionOrDemo(
      (await cookies()).get(sessionCookie)?.value,
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const studentId =
    session.email === "student_001@bodh.demo" ? DEMO_STUDENT_ID : session.email;
  const record = await getStudentRecord(studentId);
  const language = resolveLanguage(
    searchParams.get("language"),
    cookieStore.get(LANGUAGE_COOKIE)?.value,
    record?.language,
  );

  const roadmap = await getRoadmap(session.email);
  return NextResponse.json(
    await generateSmartRecommendations(
      roadmap,
      language,
      record?.goal,
      record?.weakTopics,
    ),
  );
}
