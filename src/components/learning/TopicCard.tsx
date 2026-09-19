import type { Topic } from "@/types/topic";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function TopicCard({ topic, mastery }: { topic: Topic; mastery?: number }) {
  return (
    <div className={`topic-card topic-${topic.color}`}>
      <div className="topic-card-top">
        <span className="eyebrow">{topic.level}</span>
        {mastery !== undefined && <span>{mastery}%</span>}
      </div>
      <h3>{topic.title}</h3>
      <p>{topic.description}</p>
      <div className="topic-card-bottom">
        {mastery !== undefined && <ProgressBar value={mastery} />}
        <span>{topic.lessons} lessons</span>
      </div>
    </div>
  );
}