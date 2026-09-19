import { topics } from "@/config/topics";
import type { TopicProgress } from "@/types/progress";
import { getRoadmapFromDB, putRoadmapToDB } from "@/lib/aws/dynamodb";
import type { TeachingStyle } from "@/lib/agentcore/teaching";
<<<<<<< HEAD
import type { ProgressSummary } from "@/types/progress";
=======
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a

// ── In-memory fallback (used when DynamoDB is not configured) ─────────────────

const inMemory = new Map<string, TopicProgress[]>();

function defaultRoadmap(): TopicProgress[] {
  return topics.map((topic) => ({
    topicSlug: topic.slug,
    completedLessons: 0,
    totalLessons: topic.lessons,
    mastery: 0,
    attempts: 0,
  }));
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function getRoadmap(email: string): Promise<TopicProgress[]> {
  // Try DynamoDB first
  const dbRoadmap = await getRoadmapFromDB(email);
  if (dbRoadmap) return dbRoadmap;

  // In-memory fallback
  if (!inMemory.has(email)) inMemory.set(email, defaultRoadmap());
  return inMemory.get(email)!;
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
<<<<<<< HEAD
    const wasUnattempted = item.attempts === 0;
    item.mastery = Math.max(item.mastery, score);
    item.attempts = (item.attempts ?? 0) + 1;
    if (wasUnattempted) {
      item.completedLessons = Math.min(
        item.totalLessons,
        item.completedLessons + 1,
      );
    }
=======
    item.mastery = Math.max(item.mastery, score);
    item.attempts = (item.attempts ?? 0) + 1;
    item.completedLessons = Math.min(item.totalLessons, item.completedLessons + 1);
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a
    item.lastAttemptAt = new Date().toISOString();
    if (style) item.teachingStyle = style;
  }

  // Persist
  try {
    await putRoadmapToDB(email, roadmap);
  } catch {
    inMemory.set(email, roadmap);
  }

  return roadmap;
}

<<<<<<< HEAD
export function summarizeRoadmap(roadmap: TopicProgress[]): ProgressSummary {
  const attempted = roadmap.filter((item) => item.attempts > 0);
  const dates = new Set(
    roadmap.flatMap((item) =>
      item.lastAttemptAt ? [item.lastAttemptAt.slice(0, 10)] : [],
    ),
  );
  let streak = 0;
  const cursor = new Date();
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return {
    streak,
    lessonsCompleted: roadmap.reduce(
      (sum, item) => sum + item.completedLessons,
      0,
    ),
    minutesLearned: roadmap.reduce(
      (sum, item) => sum + item.completedLessons * 10,
      0,
    ),
    averageMastery: attempted.length
      ? Math.round(
          attempted.reduce((sum, item) => sum + item.mastery, 0) /
            attempted.length,
        )
      : 0,
  };
}

=======
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a
export function getNextTopic(currentSlug: string) {
  const index = topics.findIndex((t) => t.slug === currentSlug);
  return topics[(index + 1) % topics.length];
}
