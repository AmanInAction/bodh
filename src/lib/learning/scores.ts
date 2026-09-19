import { topics } from "@/config/topics";
import { getStudentRecord } from "@/lib/aws/dynamodb";
import { getRoadmap } from "@/lib/learning/roadmap";
import { DEMO_STUDENT_ID, type Session } from "@/lib/auth/session";

export async function getTopicScores(session: Session): Promise<Record<string, number>> {
  const isDemo = session.email === "student_001@bodh.demo";
  const record = await getStudentRecord(isDemo ? DEMO_STUDENT_ID : session.email);
  if (record) {
    return Object.fromEntries(topics.map((t) => [t.slug, record.topics[t.slug]?.score ?? 0]));
  }
  const roadmap = await getRoadmap(session.email);
  return Object.fromEntries(
    topics.map((t) => [t.slug, roadmap.find((r) => r.topicSlug === t.slug)?.mastery ?? 0]),
  );
}