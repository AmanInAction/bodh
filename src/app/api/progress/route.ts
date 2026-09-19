import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  DEMO_STUDENT_ID,
  getSessionOrDemo,
  sessionCookie,
} from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/aws/dynamodb";
import { getRoadmap } from "@/lib/learning/roadmap";

export async function GET() {
  const session = await getSessionOrDemo(
    (await cookies()).get(sessionCookie)?.value,
  );

  const isDemoUser = session.email === "student_001@bodh.demo";
  const studentId = isDemoUser ? DEMO_STUDENT_ID : session.email;

  /*
   * Prefer the real StudentRecord when DynamoDB is configured.
   * If it is unavailable, retain the deterministic local roadmap
   * so the demo remains functional without AWS credentials.
   */
  const record = await getStudentRecord(studentId);

  if (record) {
    const entries = Object.values(record.topics);
    const attempted = entries.filter((topic) => topic.attempts > 0);

    const averageMastery =
      attempted.length > 0
        ? Math.round(
            attempted.reduce((sum, topic) => sum + topic.score, 0) /
              attempted.length,
          )
        : 0;

    const lessonsCompleted = attempted.reduce(
      (sum, topic) => sum + topic.attempts,
      0,
    );

    return NextResponse.json({
      streak: 0,
      lessonsCompleted,
      minutesLearned: 0,
      averageMastery,
    });
  }

  const roadmap = await getRoadmap(studentId);
  const attempted = roadmap.filter((item) => item.mastery > 0);

  const averageMastery =
    attempted.length > 0
      ? Math.round(
          attempted.reduce((sum, item) => sum + item.mastery, 0) /
            attempted.length,
        )
      : 0;

  return NextResponse.json({
    streak: 5,
    lessonsCompleted: attempted.length,
    minutesLearned: 276,
    averageMastery,
  });
}
