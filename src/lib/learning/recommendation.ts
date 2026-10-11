import { topics } from "@/config/topics";
import { invokeBedrockText } from "@/lib/aws/bedrock";
import { PROMPTS } from "@/lib/ai/prompts";
import { getTopicTitle, type SupportedLanguage } from "@/lib/i18n";
import type { TopicProgress } from "@/types/progress";

export type Recommendation = {
  topicSlug: string;
  title: string;
  reason: string;
};

export function getRecommendations(
  roadmap: TopicProgress[],
  language: SupportedLanguage = "en",
): Recommendation[] {
  const isHindi = language === "hi";
  const sorted = [...roadmap].sort((a, b) => a.mastery - b.mastery);
  return sorted.slice(0, 3).map((item) => {
    const topicTitle = getTopicTitle(item.topicSlug, language);
    return {
      topicSlug: item.topicSlug,
      title: topicTitle,
      reason:
        item.attempts === 0
          ? isHindi
            ? "इस अवधारणा को शुरू करने के लिए एक शांत, उदाहरण-आधारित पाठ पढ़ें।"
            : "Start with a calm introduction and a worked example."
          : isHindi
            ? `आपकी वर्तमान समझ ${item.mastery}% है — एक छोटा अभ्यास सत्र इसे और मजबूत करेगा।`
            : `Revisit this topic to raise mastery from ${item.mastery}%.`,
    };
  });
}

export async function generateSmartRecommendations(
  roadmap: TopicProgress[],
  language: SupportedLanguage = "en",
): Promise<Recommendation[]> {
  try {
    const raw = await invokeBedrockText(
      PROMPTS.recommendationSystem(language),
      PROMPTS.recommendationUser(roadmap, language),
      { maxTokens: 400, temperature: 0.3 },
    );

    if (raw.startsWith("[local]")) {
      return getRecommendations(roadmap, language);
    }

    const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr) as Array<{
      topicSlug: string;
      reason: string;
    }>;

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 3).map((item) => {
        const topic = topics.find((t) => t.slug === item.topicSlug);
        return {
          topicSlug: item.topicSlug,
          title: getTopicTitle(item.topicSlug, language) || topic?.title || item.topicSlug,
          reason: item.reason,
        };
      });
    }
  } catch (error) {
    console.error("[recommendation] AI generation failed, using fallback:", error);
  }

  return getRecommendations(roadmap, language);
}
