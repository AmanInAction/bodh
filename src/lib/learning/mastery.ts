import type { TopicProgress } from "@/types/progress";

export function calculateMastery(progress: TopicProgress) {
  if (!progress.totalLessons) return 0;
  return Math.round((progress.completedLessons / progress.totalLessons) * 100);
}
