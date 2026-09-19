import { describe, expect, it } from "vitest";
import { summarizeRoadmap } from "@/lib/learning/roadmap";
import type { TopicProgress } from "@/types/progress";

function roadmap(overrides: Partial<TopicProgress>[] = []): TopicProgress[] {
  return overrides.map((item, index) => ({
    topicSlug: `topic-${index}`,
    completedLessons: 0,
    totalLessons: 4,
    mastery: 0,
    attempts: 0,
    ...item,
  }));
}

describe("summarizeRoadmap", () => {
  it("computes progress from attempted topics", () => {
    const summary = summarizeRoadmap(
      roadmap([
        { completedLessons: 2, mastery: 80, attempts: 1 },
        { completedLessons: 1, mastery: 40, attempts: 2 },
        { completedLessons: 4, mastery: 0, attempts: 0 },
      ]),
    );

    expect(summary.lessonsCompleted).toBe(7);
    expect(summary.minutesLearned).toBe(70);
    expect(summary.averageMastery).toBe(60);
  });

  it("does not invent a streak without dated assessments", () => {
    expect(
      summarizeRoadmap(roadmap([{ attempts: 1, mastery: 50 }])).streak,
    ).toBe(0);
  });
});
