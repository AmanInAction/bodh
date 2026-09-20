import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionOrDemo, sessionCookie, DEMO_STUDENT_ID } from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/aws/dynamodb";
import { getRoadmap } from "@/lib/learning/roadmap";

export async function GET() {
  let session;
  try {
    session = await getSessionOrDemo(
      (await cookies()).get(sessionCookie)?.value,
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isDemoUser = session.email === "student_001@bodh.demo";
  const studentId = isDemoUser ? DEMO_STUDENT_ID : session.email;

  // Try StudentRecord first
  const record = await getStudentRecord(studentId);
  if (record) {
    const entries = Object.values(record.topics);
    const attempted = entries.filter((t) => t.attempts > 0);
    const averageMastery =
      attempted.length > 0
        ? Math.round(attempted.reduce((s, t) => s + t.score, 0) / attempted.length)
        : 0;
    const lessonsCompleted = entries.reduce((s, t) => s + (t.attempts ?? 0), 0);

    return NextResponse.json({
      streak: record.loginCount ?? 1,
      lessonsCompleted,
      minutesLearned: lessonsCompleted * 8, // approx 8 min per lesson
      averageMastery,
    });
  }

  // Fallback: roadmap table
  const roadmap = await getRoadmap(session.email);
  const attempted = roadmap.filter((r) => r.attempts > 0);
  const averageMastery =
    attempted.length > 0
      ? Math.round(attempted.reduce((s, r) => s + r.mastery, 0) / attempted.length)
      : 0;
  const lessonsCompleted = roadmap.reduce((s, r) => s + r.completedLessons, 0);

  return NextResponse.json({
    streak: 1,
    lessonsCompleted,
    minutesLearned: lessonsCompleted * 8,
    averageMastery,
  });
}
