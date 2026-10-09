import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSession, sessionCookie, DEMO_STUDENT_ID } from "@/lib/auth/session";
import { getRoadmap } from "@/lib/learning/roadmap";
import { getAIRecommendations } from "@/lib/learning/recommendation";
import { getStudentRecord } from "@/lib/aws/dynamodb";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = await readSession(
    cookieStore.get(sessionCookie)?.value,
  );

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const language = url.searchParams.get("language") === "hi" ? "hi" : "en";

  const isDemo = session.email === "student_001@bodh.demo";
  const studentId = isDemo ? DEMO_STUDENT_ID : session.email;
  const record = await getStudentRecord(studentId);

  const roadmap = await getRoadmap(session.email);
  const recommendations = await getAIRecommendations(
    roadmap,
    language,
    record?.goal,
    record?.weakTopics,
  );

  return NextResponse.json({
    recommendations,
    roadmap,
  });
}
