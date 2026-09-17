import Link from "next/link";
import type { Topic } from "@/types/topic";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function TopicCard({ topic }: { topic: Topic }) {
  return (
    <Link
      href={`/learn/${topic.slug}`}
      className={`topic-card topic-${topic.color}`}
    >
      <div className="topic-card-top">
        <span className="eyebrow">{topic.level}</span>
        <span>{topic.mastery}%</span>
      </div>
      <h3>{topic.title}</h3>
      <p>{topic.description}</p>
      <div className="topic-card-bottom">
        <ProgressBar value={topic.mastery} />
        <span>{topic.lessons} lessons</span>
      </div>
    </Link>
  );
}
