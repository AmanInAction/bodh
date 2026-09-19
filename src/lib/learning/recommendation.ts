import { invokeBedrockText } from "@/lib/aws/bedrock";
import { PROMPTS } from "@/lib/ai/prompts";
import type { TopicProgress } from "@/types/progress";
import { topics } from "@/config/topics";

export type Recommendation = {
  topicSlug: string;
  reason: string;
};

export function getRecommendations(
  roadmap: TopicProgress[],
): Recommendation[] {
  const weak = roadmap
    .filter((item) => item.mastery < 50)
    .sort((a, b) => a.mastery - b.mastery);

  const developing = roadmap
    .filter((item) => item.mastery >= 50 && item.mastery < 80)
    .sort((a, b) => a.mastery - b.mastery);

  const untouched = roadmap.filter((item) => item.attempts === 0);

  const result: Recommendation[] = [];

  for (const item of weak) {
    if (!result.some((r) => r.topicSlug === item.topicSlug)) {
      result.push({
        topicSlug: item.topicSlug,
        reason: "Reinforce the core concept before moving on.",
      });
    }
  }

  for (const item of untouched) {
    if (result.length >= 3) break;

    if (!result.some((r) => r.topicSlug === item.topicSlug)) {
      result.push({
        topicSlug: item.topicSlug,
        reason: "A new topic to keep your learning path moving.",
      });
    }
  }

  for (const item of developing) {
    if (result.length >= 3) break;

    if (!result.some((r) => r.topicSlug === item.topicSlug)) {
      result.push({
        topicSlug: item.topicSlug,
        reason: "A little more practice can strengthen this skill.",
      });
    }
  }

  return result.slice(0, 3);
}

export async function getAIRecommendations(
  roadmap: TopicProgress[],
  language: "en" | "hi" = "en",
): Promise<Recommendation[]> {
  const fallback = getRecommendations(roadmap);

  try {
    const raw = await invokeBedrockText(
      PROMPTS.recommendationSystem(language),
      PROMPTS.recommendationUser(
        roadmap.map((item) => ({
          topicSlug: item.topicSlug,
          mastery: item.mastery,
          attempts: item.attempts,
        })),
        language,
      ),
      { maxTokens: 300 },
    );

    if (!raw || raw.startsWith("[local]")) {
      return fallback;
    }

    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return fallback;

    const valid = parsed
      .filter(
        (item): item is Recommendation =>
          item &&
          typeof item === "object" &&
          typeof item.topicSlug === "string" &&
          typeof item.reason === "string" &&
          topics.some((topic) => topic.slug === item.topicSlug),
      )
      .slice(0, 3);

    return valid.length ? valid : fallback;
  } catch (error) {
    console.error("[recommendation] AI fallback:", error);
    return fallback;
  }
}
