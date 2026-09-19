import { topics } from "@/config/topics";
import type { TopicProgress } from "@/types/progress";
import { getRoadmapFromDB, putRoadmapToDB } from "@/lib/aws/dynamodb";
import type { TeachingStyle } from "@/lib/agentcore/teaching";

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
    item.mastery = Math.max(item.mastery, score);
    item.attempts = (item.attempts ?? 0) + 1;
    item.completedLessons = Math.min(item.totalLessons, item.completedLessons + 1);
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

export function getNextTopic(currentSlug: string) {
  const index = topics.findIndex((t) => t.slug === currentSlug);
  return topics[(index + 1) % topics.length];
}
