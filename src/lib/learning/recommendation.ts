import { topics } from "@/config/topics";
import { invokeBedrockJSON } from "@/lib/aws/bedrock";
import { PROMPTS } from "@/lib/ai/prompts";
import { getTopicTitle, type SupportedLanguage } from "@/lib/i18n";
import { getTopicPrerequisites } from "@/lib/learning/content";
import type { TopicProgress } from "@/types/progress";
import type { LearningGoal } from "@/types/student-record";

export type Recommendation = {
  topicSlug: string;
  title: string;
  reason: string;
  href?: string;
};

const GOAL_TOPIC_PRIORITY: Record<LearningGoal, string[]> = {
  scratch: [
    "arrays",
    "linked-list",
    "stacks",
    "queues",
    "binary-search",
    "recursion",
  ],
  foundations: [
    "arrays",
    "stacks",
    "queues",
    "linked-list",
    "binary-search",
    "recursion",
  ],
  interview: [
    "binary-search",
    "recursion",
    "stacks",
    "arrays",
    "linked-list",
    "queues",
  ],
};

function buildGoalStartReason(
  slug: string,
  language: SupportedLanguage,
  goal?: LearningGoal,
): string {
  const isHindi = language === "hi";
  if (goal === "interview") {
    return isHindi
      ? "इंटरव्यू तैयारी के लिए मुख्य पैटर्न — समय जटिलता और एज केस पर अपनी पकड़ मजबूत करें।"
      : "Core interview pattern — build fluency with time complexity and boundary edge cases.";
  }
  if (goal === "scratch") {
    return isHindi
      ? "शुरुआत से सीखने के लिए आदर्श कदम — सरल उदाहरणों के साथ बुनियादी समझ बनाएं।"
      : "Ideal next step when starting from scratch — build intuition with plain-language examples.";
  }
  if (goal === "foundations") {
    return isHindi
      ? "मजबूत बुनियाद के लिए आवश्यक — मेमोरी मॉडल और मुख्य ऑपरेशन्स को गहराई से समझें।"
      : "Essential for strong foundations — connect visual mental models with core operations.";
  }
  return isHindi
    ? "इस अवधारणा को शुरू करने के लिए एक शांत, उदाहरण-आधारित पाठ पढ़ें।"
    : "Start with a calm introduction and a worked example.";
}

export function getRecommendations(
  roadmap: TopicProgress[],
  language: SupportedLanguage = "en",
  goal?: LearningGoal,
  weakTopics?: string[],
): Recommendation[] {
  const isHindi = language === "hi";
  const priorityOrder = goal
    ? GOAL_TOPIC_PRIORITY[goal] ?? GOAL_TOPIC_PRIORITY.scratch
    : GOAL_TOPIC_PRIORITY.scratch;

  const bySlug = new Map(roadmap.map((r) => [r.topicSlug, r]));
  const recommendations: Recommendation[] = [];
  const added = new Set<string>();

  const pushRec = (slug: string, reason: string) => {
    if (added.has(slug) || recommendations.length >= 3) return;
    added.add(slug);
    recommendations.push({
      topicSlug: slug,
      title: getTopicTitle(slug, language),
      reason,
      href: `/learn/${slug}?language=${language}`,
    });
  };

  // 1. Explicit weak topics (< 60%) take top priority
  const weakList =
    weakTopics && weakTopics.length > 0
      ? weakTopics
      : roadmap
          .filter((r) => r.attempts > 0 && r.mastery < 60)
          .sort((a, b) => a.mastery - b.mastery)
          .map((r) => r.topicSlug);

  for (const weakSlug of weakList) {
    const item = bySlug.get(weakSlug);
    const mastery = item?.mastery ?? 0;

    // Check if a prerequisite is also weak and needs reinforcement first
    const prereqs = getTopicPrerequisites(weakSlug);
    const weakPrereq = prereqs.find((p) => {
      const pItem = bySlug.get(p);
      return pItem && pItem.attempts > 0 && pItem.mastery < 50;
    });

    if (weakPrereq && !added.has(weakPrereq)) {
      const prereqTitle = getTopicTitle(weakPrereq, language);
      const targetTitle = getTopicTitle(weakSlug, language);
      pushRec(
        weakPrereq,
        isHindi
          ? `${targetTitle} को आसान बनाने के लिए पहले इसकी आधारभूत अवधारणा (${prereqTitle}) को मजबूत करें।`
          : `Reinforce prerequisite ${prereqTitle} first to make ${targetTitle} much easier.`,
      );
    }

    pushRec(
      weakSlug,
      isHindi
        ? `आपकी वर्तमान समझ ${mastery}% है — लक्षित व्याख्या और अभ्यास से इसे 60% के पार ले जाएं।`
        : `You're at ${mastery}% understanding — review with a targeted explanation and retry the practice check.`,
    );
  }

  // 2. Topics in progress (60 <= mastery < 80) to push to mastery
  const inProgress = roadmap
    .filter((r) => r.attempts > 0 && r.mastery >= 60 && r.mastery < 80)
    .sort((a, b) => a.mastery - b.mastery);

  for (const item of inProgress) {
    pushRec(
      item.topicSlug,
      isHindi
        ? `आपकी समझ ${item.mastery}% है — एक छोटा अभ्यास सत्र इसे 80%+ मजबूत पकड़ में बदल देगा।`
        : `Revisit this topic to raise mastery from ${item.mastery}% to full mastery (80%+).`,
    );
  }

  // 3. Unattempted topics ordered by the learner's active goal
  for (const slug of priorityOrder) {
    const item = bySlug.get(slug);
    if (item && item.attempts === 0) {
      pushRec(slug, buildGoalStartReason(slug, language, goal));
    }
  }

  // 4. Any remaining topics in roadmap order
  for (const item of [...roadmap].sort((a, b) => a.mastery - b.mastery)) {
    pushRec(
      item.topicSlug,
      item.attempts === 0
        ? buildGoalStartReason(item.topicSlug, language, goal)
        : isHindi
          ? `अपनी ${item.mastery}% समझ को बनाए रखने के लिए एक त्वरित अभ्यास करें।`
          : `Revisit this topic to sharpen your ${item.mastery}% understanding.`,
    );
  }

  return recommendations;
}

export async function generateSmartRecommendations(
  roadmap: TopicProgress[],
  language: SupportedLanguage = "en",
  goal?: LearningGoal,
  weakTopics?: string[],
): Promise<Recommendation[]> {
  const baseline = getRecommendations(roadmap, language, goal, weakTopics);

  try {
    const parsed = await invokeBedrockJSON<
      Array<{ topicSlug: string; reason: string }>
    >(
      PROMPTS.recommendationSystem(language),
      PROMPTS.recommendationUser(roadmap, language, goal, weakTopics),
      (data) => (Array.isArray(data) && data.length > 0 ? (data as Array<{ topicSlug: string; reason: string }>) : null),
      { task: "recommendation", maxTokens: 400, temperature: 0.3 },
    );

    if (parsed && parsed.length > 0) {
      return parsed.slice(0, 3).map((item) => {
        const topic = topics.find((t) => t.slug === item.topicSlug);
        return {
          topicSlug: item.topicSlug,
          title:
            getTopicTitle(item.topicSlug, language) ||
            topic?.title ||
            item.topicSlug,
          reason: item.reason,
          href: `/learn/${item.topicSlug}?language=${language}`,
        };
      });
    }
  } catch (error) {
    console.warn("[recommendation] AI generation fallback to goal-aware rules:", error);
  }

  return baseline;
}
