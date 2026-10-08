import type { Topic } from "@/types/topic";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  getTopicTitle,
  getTopicDescription,
  getLevelLabel,
  formatLessons,
} from "@/lib/i18n";

export function TopicCard({
  topic,
  mastery,
  language = "en",
}: {
  topic: Topic;
  mastery?: number;
  language?: "en" | "hi";
}) {
  const title = getTopicTitle(topic.slug, language);
  const description = getTopicDescription(topic.slug, language);
  const level = getLevelLabel(topic.level, language);
  const lessons = formatLessons(topic.lessons, language);

  return (
    <div className={`topic-card topic-${topic.color}`}>
      <div className="topic-card-top">
        <span className="eyebrow">{level}</span>
        {mastery !== undefined ? (
          <span className="tabular-nums">{mastery}%</span>
        ) : (
          <span>{lessons}</span>
        )}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="topic-card-bottom">
        {mastery !== undefined ? (
          <>
            <ProgressBar value={mastery} size="sm" />
            <span>{lessons}</span>
          </>
        ) : (
          <>
            <span>{language === "hi" ? "अवधारणा और अभ्यास" : "Concept & practice"}</span>
            <span aria-hidden="true">→</span>
          </>
        )}
      </div>
    </div>
  );
}
