import type { TopicProgress } from "@/types/progress";
import type { Recommendation } from "@/types/ai";
import { topics } from "@/config/topics";

/**
 * Generates personalised recommendations from the student's roadmap.
 * Priority order:
 *  1. Topics started but mastery < 50% (needs reinforcement)
 *  2. Topics not yet started (next in sequence)
 *  3. Topics with mastery < 80% (could improve)
 */
export function getRecommendations(roadmap: TopicProgress[]): Recommendation[] {
  const progressMap = new Map(roadmap.map((p) => [p.topicSlug, p]));

  const recommendations: Recommendation[] = [];

  // 1. Reinforcement: started but low mastery
  for (const topic of topics) {
    const p = progressMap.get(topic.slug);
    if (p && p.attempts > 0 && p.mastery < 50) {
      recommendations.push({
        title: topic.title,
        reason:
          p.mastery < 30
            ? `You scored ${p.mastery}% — a quick review will make a big difference.`
            : `You're at ${p.mastery}% mastery. One more practice session should do it.`,
        href: `/learn/${topic.slug}`,
      });
    }
  }

  // 2. Next unstarted topic
  for (const topic of topics) {
    const p = progressMap.get(topic.slug);
    if (!p || p.attempts === 0) {
      recommendations.push({
        title: topic.title,
        reason: "You haven't tried this topic yet — it's the natural next step.",
        href: `/learn/${topic.slug}`,
      });
      break; // only one unstarted at a time
    }
  }

  // 3. Could-improve
  for (const topic of topics) {
    const p = progressMap.get(topic.slug);
    if (p && p.mastery >= 50 && p.mastery < 80) {
      recommendations.push({
        title: topic.title,
        reason: `You're at ${p.mastery}% — push to 80% and you'll feel solid.`,
        href: `/learn/${topic.slug}`,
      });
    }
  }

  return recommendations.slice(0, 3);
}
