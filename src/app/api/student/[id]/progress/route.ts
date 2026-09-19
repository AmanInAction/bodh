import { NextResponse } from "next/server";
import { getStudentRecord } from "@/lib/aws/dynamodb";
import { topics } from "@/config/topics";
import { getRoadmap } from "@/lib/learning/roadmap";
import { DEMO_STUDENT_ID } from "@/lib/auth/session";

// GET /api/student/[id]/progress
// Returns per-topic scores, weakTopics, and overall mastery for a student.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Try StudentRecord table first (fine-grained per-topic score/attempts)
  const record = await getStudentRecord(id);

  if (record) {
    const allTopicScores = topics.map((t) => ({
      slug: t.slug,
      title: t.title,
      score: record.topics[t.slug]?.score ?? 0,
      attempts: record.topics[t.slug]?.attempts ?? 0,
    }));
    const attempted = allTopicScores.filter((t) => t.attempts > 0);
    const overallMastery =
      attempted.length > 0
        ? Math.round(
            attempted.reduce((sum, t) => sum + t.score, 0) / attempted.length,
          )
        : 0;

    return NextResponse.json({
      studentId: id,
      language: record.language,
      topics: allTopicScores,
      weakTopics: record.weakTopics,
      overallMastery,
    });
  }

  // Fallback: use roadmap table
  const email =
    id === DEMO_STUDENT_ID ? "student_001@bodh.demo" : id;
  const roadmap = await getRoadmap(email);
  const allTopicScores = topics.map((t) => {
    const p = roadmap.find((r) => r.topicSlug === t.slug);
    return {
      slug: t.slug,
      title: t.title,
      score: p?.mastery ?? 0,
      attempts: p?.attempts ?? 0,
    };
  });
  const attempted = allTopicScores.filter((t) => t.attempts > 0);
  const overallMastery =
    attempted.length > 0
      ? Math.round(
          attempted.reduce((sum, t) => sum + t.score, 0) / attempted.length,
        )
      : 0;
  const weakTopics = allTopicScores
    .filter((t) => t.attempts > 0 && t.score < 60)
    .sort((a, b) => a.score - b.score)
    .map((t) => t.slug);

  return NextResponse.json({
    studentId: id,
    language: "en",
    topics: allTopicScores,
    weakTopics,
    overallMastery,
  });
}
