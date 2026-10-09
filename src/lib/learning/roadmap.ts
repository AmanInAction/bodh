import { topics } from "@/config/topics";
import type { ProgressSummary, TopicProgress } from "@/types/progress";
import { getRoadmapFromDB, putRoadmapToDB, getStudentRecord } from "@/lib/aws/dynamodb";
import { getLocalRoadmap, putLocalRoadmap } from "@/lib/local/store";
import type { TeachingStyle } from "@/lib/agentcore/teaching";

export type TopicStatus = "not_started" | "needs_practice" | "in_progress" | "mastered";

/**
 * Calculates a meaningful topic status according to documented scoring rules:
 * - not_started: 0 attempts / unattempted
 * - needs_practice: attempts > 0 and score < 60 (below weak-topic threshold)
 * - in_progress: attempts > 0 and 60 <= score < 80
 * - mastered: score >= 80 (solid grasp of core concept)
 */
export function getTopicStatus(score: number, attempts: number): TopicStatus {
  if (attempts === 0) return "not_started";
  if (score >= 80) return "mastered";
  if (score >= 60) return "in_progress";
  return "needs_practice";
}

/**
 * Summarizes a student's roadmap into high-level dashboard metrics.
 */
export function summarizeRoadmap(roadmapList: TopicProgress[]): ProgressSummary {
  const attempted = roadmapList.filter((r) => r.attempts > 0);
  const lessonsCompleted = roadmapList.reduce((sum, r) => sum + r.completedLessons, 0);
  const minutesLearned = lessonsCompleted * 10;
  const averageMastery =
    attempted.length > 0
      ? Math.round(
          attempted.reduce((sum, r) => sum + r.mastery, 0) / attempted.length,
        )
      : 0;

  const hasDatedAssessments = roadmapList.some((r) => Boolean(r.lastAttemptAt));
  const streak = hasDatedAssessments ? 1 : 0;

  return {
    streak,
    lessonsCompleted,
    minutesLearned,
    averageMastery,
  };
}

function defaultRoadmap(): TopicProgress[] {
  return topics.map((topic) => ({
    topicSlug: topic.slug,
    completedLessons: 0,
    totalLessons: topic.lessons,
    mastery: 0,
    attempts: 0,
  }));
}

// Make sure every current topic exists in a stored roadmap.
function withAllTopics(stored: TopicProgress[]): TopicProgress[] {
  const defaults = defaultRoadmap();
  return defaults.map((d) => stored.find((s) => s.topicSlug === d.topicSlug) ?? d);
}

export async function getRoadmap(email: string): Promise<TopicProgress[]> {
  // 1. Prefer canonical StudentRecord if present
  try {
    const record = await getStudentRecord(email);
    if (record && Object.keys(record.topics).length > 0) {
      return topics.map((t) => {
        const perf = record.topics[t.slug];
        return {
          topicSlug: t.slug,
          completedLessons: perf?.attempts ? Math.min(t.lessons, perf.attempts) : 0,
          totalLessons: t.lessons,
          mastery: perf?.score ?? 0,
          attempts: perf?.attempts ?? 0,
          lastAttemptAt: perf?.lastAttemptAt,
          teachingStyle: perf?.teachingStyle,
        };
      });
    }
  } catch (err) {
    console.warn("[roadmap] Error reading canonical record in getRoadmap:", err);
  }

  // 2. Fallback to roadmap DynamoDB table
  const dbRoadmap = await getRoadmapFromDB(email);
  if (dbRoadmap) return withAllTopics(dbRoadmap);

  // 3. Fallback to local store (used when DynamoDB is not configured)
  const local = await getLocalRoadmap(email).catch(() => null);
  if (local) return withAllTopics(local);

  return defaultRoadmap();
}

export async function recordAssessment(
  email: string,
  topicSlug: string,
  score: number,
  style?: TeachingStyle,
): Promise<TopicProgress[]> {
  const roadmap = await getRoadmap(email);
  const item = roadmap.find((r) => r.topicSlug === topicSlug);

  if (item) {
    item.mastery = Math.max(item.mastery, score);
    item.attempts = (item.attempts ?? 0) + 1;
    item.completedLessons = Math.min(item.totalLessons, item.completedLessons + 1);
    item.lastAttemptAt = new Date().toISOString();
    if (style) item.teachingStyle = style;
  }

  try {
    await putRoadmapToDB(email, roadmap);
  } catch (error) {
    console.warn("[roadmap] Failed to persist roadmap to DynamoDB:", error);
  }
  try {
    await putLocalRoadmap(email, roadmap);
  } catch {
    /* read-only filesystem */
  }

  return roadmap;
}

export function getNextTopic(currentSlug: string) {
  const index = topics.findIndex((t) => t.slug === currentSlug);
  return topics[(index + 1) % topics.length];
}