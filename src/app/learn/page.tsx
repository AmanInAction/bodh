import Link from "next/link";
import { topics } from "@/config/topics";
import { TopicCard } from "@/components/learning/TopicCard";
export default function LearnPage() {
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
            <TopicCard key={topic.slug} topic={topic} />
          ))}
        </div>
      </section>
    </main>
  );
}
