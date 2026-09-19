import { topics } from "@/config/topics";
import type { TopicProgress } from "@/types/progress";
import { getRoadmapFromDB, putRoadmapToDB } from "@/lib/aws/dynamodb";
import { getLocalRoadmap, putLocalRoadmap } from "@/lib/local/store";
import type { TeachingStyle } from "@/lib/agentcore/teaching";

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
  const dbRoadmap = await getRoadmapFromDB(email);
  if (dbRoadmap) return withAllTopics(dbRoadmap);

  // Local file store (used when DynamoDB is not configured).
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

  try { await putRoadmapToDB(email, roadmap); } catch { /* not configured */ }
  try { await putLocalRoadmap(email, roadmap); } catch { /* read-only filesystem */ }

  return roadmap;
}

export function getNextTopic(currentSlug: string) {
  const index = topics.findIndex((t) => t.slug === currentSlug);
  return topics[(index + 1) % topics.length];
}