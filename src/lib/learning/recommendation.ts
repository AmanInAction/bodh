import { invokeBedrockText } from "@/lib/aws/bedrock";
import { PROMPTS } from "@/lib/ai/prompts";
import type { TopicProgress } from "@/types/progress";
import type { LearningGoal } from "@/types/student-record";
import { topics } from "@/config/topics";

export type Recommendation = {
  topicSlug: string;
  reason: string;
};

// Priority sequences according to learning goals
const GOAL_PRIORITIES: Record<LearningGoal, string[]> = {
  scratch: ["arrays", "linked-list", "stacks", "queues", "binary-search", "recursion"],
  foundations: ["arrays", "stacks", "queues", "linked-list", "binary-search", "recursion"],
  interview: ["binary-search", "recursion", "stacks", "arrays", "queues", "linked-list"],
};

export function getRecommendations(
  roadmap: TopicProgress[],
  language: "en" | "hi" = "en",
  goal?: LearningGoal,
  explicitWeakTopics?: string[],
): Recommendation[] {
  const isHindi = language === "hi";
  const activeGoal: LearningGoal =
    goal === "scratch" || goal === "foundations" || goal === "interview"
      ? goal
      : "foundations";

  const priorityOrder = GOAL_PRIORITIES[activeGoal];

  // Map roadmap by slug for fast lookup
  const roadmapMap = new Map<string, TopicProgress>();
  for (const item of roadmap) {
    roadmapMap.set(item.topicSlug, item);
  }

  // 1. Weak topics (score < 60, attempts > 0)
  const weakSlugs = explicitWeakTopics && explicitWeakTopics.length > 0
    ? explicitWeakTopics
    : roadmap
        .filter((item) => item.attempts > 0 && item.mastery < 60)
        .sort((a, b) => a.mastery - b.mastery)
        .map((item) => item.topicSlug);

  const result: Recommendation[] = [];

  // Add weak topics first
  for (const slug of weakSlugs) {
    if (result.length >= 3) break;
    let reason = isHindi
      ? "आगे बढ़ने से पहले मुख्य अवधारणा को दोहराएं।"
      : "Reinforce the core concept before moving on.";

    if (activeGoal === "interview") {
      reason = isHindi
        ? "इंटरव्यू में महत्वपूर्ण: एज केस और जटिलता को दोबारा समझें।"
        : "High-frequency interview topic — resolve weak sub-concepts to prepare for coding rounds.";
    } else if (activeGoal === "scratch") {
      reason = isHindi
        ? "सरल उदाहरण के साथ बुनियादी समझ को फिर से पक्का करें।"
        : "Revisit with a simple example to build steady confidence.";
    } else if (activeGoal === "foundations") {
      reason = isHindi
        ? "डेटा स्ट्रक्चर के आंतरिक मॉडल को स्पष्ट करने के लिए एक बार दोहराएं।"
        : "Solidify the underlying memory and state model before advancing.";
    }

    result.push({ topicSlug: slug, reason });
  }

  // 2. Unattempted topics in goal-specific priority order
  const unattemptedInPriority = priorityOrder.filter((slug) => {
    const item = roadmapMap.get(slug);
    return !item || item.attempts === 0;
  });

  for (const slug of unattemptedInPriority) {
    if (result.length >= 3) break;
    if (result.some((r) => r.topicSlug === slug)) continue;

    let reason = isHindi
      ? "अपने सीखने के सफर को आगे बढ़ाने के लिए एक नया विषय।"
      : "A new topic to keep your learning path moving.";

    if (activeGoal === "interview") {
      reason = isHindi
        ? "समस्या सुलझाने के मुख्य पैटर्न और टाइम कॉम्पलेक्सिटी को समझें।"
        : "Core interview pattern — study the standard approach and trade-offs.";
    } else if (activeGoal === "scratch") {
      reason = isHindi
        ? "सरल और स्वाभाविक तरीके से कदम-दर-कदम सीखने के लिए उपयुक्त।"
        : "Step-by-step introduction designed for beginners starting from scratch.";
    } else if (activeGoal === "foundations") {
      reason = isHindi
        ? "विज़ुअल कॉन्सेप्ट मैप और उदाहरणों के साथ मुख्य संरचना सीखें।"
        : "Connect visual mental models with core data structure mechanics.";
    }

    result.push({ topicSlug: slug, reason });
  }

  // 3. Developing topics (60 <= score < 80) sorted by lowest score
  const developing = roadmap
    .filter((item) => item.attempts > 0 && item.mastery >= 60 && item.mastery < 80)
    .sort((a, b) => a.mastery - b.mastery);

  for (const item of developing) {
    if (result.length >= 3) break;
    if (result.some((r) => r.topicSlug === item.topicSlug)) continue;

    const reason = isHindi
      ? "थोड़ा और अभ्यास इस कौशल को 80%+ मजबूत पकड़ में बदल सकता है।"
      : "A little more practice can turn this into solid mastery (80%+).";

    result.push({ topicSlug: item.topicSlug, reason });
  }

  // Fallback: if still under 3, suggest remaining topics
  for (const t of topics) {
    if (result.length >= 3) break;
    if (!result.some((r) => r.topicSlug === t.slug)) {
      result.push({
        topicSlug: t.slug,
        reason: isHindi
          ? "अपनी समझ को और पक्का करने के लिए इस विषय की समीक्षा करें।"
          : "Review this topic to keep your understanding sharp.",
      });
    }
  }

  return result.slice(0, 3);
}

export async function getAIRecommendations(
  roadmap: TopicProgress[],
  language: "en" | "hi" = "en",
  goal?: LearningGoal,
  explicitWeakTopics?: string[],
): Promise<Recommendation[]> {
  const fallback = getRecommendations(roadmap, language, goal, explicitWeakTopics);

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
