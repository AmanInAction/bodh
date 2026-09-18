import Link from "next/link";
import { topics } from "@/config/topics";
import { TopicCard } from "@/components/learning/TopicCard";
export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string }>;
}) {
  const { language = "en" } = await searchParams;
  return (
    <main className="site-shell">
      <nav className="nav">
        <Link className="brand" href="/">
          bodh<span>.</span>
        </Link>
        <div>
          <Link href="/dashboard">Dashboard</Link>
          <Link className="nav-cta" href="/onboarding">
            Profile
          </Link>
        </div>
      </nav>
      <section className="library-header">
        <span className="eyebrow">Learning library</span>
        <h1>Follow your curiosity.</h1>
        <p>
          Short, visual lessons for the concepts that make everything else
          easier.
        </p>
      </section>
      <section className="section">
        <div className="topic-grid">
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/learn/${topic.slug}?language=${language}`}
            >
              <TopicCard topic={topic} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
