import { NextResponse } from "next/server";
import { getStudentRecord } from "@/lib/aws/dynamodb";
import { getRoadmap } from "@/lib/learning/roadmap";
import { getRecommendations } from "@/lib/learning/recommendation";
import { DEMO_STUDENT_ID } from "@/lib/auth/session";
import { topics } from "@/config/topics";
import type { TopicProgress } from "@/types/progress";

// POST /api/student/[id]/recommendation
// Returns personalised next-lesson recommendations for a student.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Build roadmap from StudentRecord when available
  const record = await getStudentRecord(id);

  let roadmap: TopicProgress[];

  if (record) {
    roadmap = topics.map((t) => ({
      topicSlug: t.slug,
      completedLessons: record.topics[t.slug]?.attempts ?? 0,
      totalLessons: t.lessons,
      mastery: record.topics[t.slug]?.score ?? 0,
      attempts: record.topics[t.slug]?.attempts ?? 0,
    }));
  } else {
    // Fallback: roadmap table
    const email = id === DEMO_STUDENT_ID ? "student_001@bodh.demo" : id;
    roadmap = await getRoadmap(email);
  }

  const recommendations = getRecommendations(roadmap);
  return NextResponse.json(recommendations);
}
