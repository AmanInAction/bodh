import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessons, getTopic } from "@/lib/learning/topics";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ExplainDifferently } from "@/components/learning/ExplainDifferently";
export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic: slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();
  const lessons = getLessons(slug);
  return (
    <main className="site-shell">
      <nav className="nav">
        <Link className="brand" href="/">
          bodh<span>.</span>
        </Link>
        <Link href="/learn">All topics</Link>
      </nav>
      <section className={`topic-hero topic-${topic.color}`}>
        <span className="eyebrow">{topic.level} path</span>
        <h1>{topic.title}</h1>
        <p>{topic.description}</p>
        <div className="topic-summary">
          <span>{topic.lessons} lessons</span>
          <span>{topic.mastery}% mastered</span>
        </div>
        <ProgressBar value={topic.mastery} />
      </section>
      <section className="lesson-layout">
        <div>
          <span className="eyebrow">Your path</span>
          {lessons.map((lesson, index) => (
            <Link
              className="lesson-row"
              href={`/learn/${slug}/article`}
              key={lesson.slug}
            >
              <span className="lesson-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <strong>{lesson.title}</strong>
                <small>{lesson.summary}</small>
              </span>
              <small>{lesson.duration}</small>
            </Link>
          ))}
        </div>
        <ExplainDifferently topic={topic.title} />
      </section>
    </main>
  );
}
