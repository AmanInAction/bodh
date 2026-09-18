import Link from "next/link";
import { topics } from "@/config/topics";
import { TopicCard } from "@/components/learning/TopicCard";

export default function MarketingPage() {
  return (
    <main className="site-shell">
      <nav className="nav">
        <strong className="brand">
          bodh<span>.</span>
        </strong>
        <div>
          <Link href="/about">About</Link>
          <Link href="/auth">Sign in</Link>
          <Link className="nav-cta" href="/onboarding">
            Start learning
          </Link>
        </div>
      </nav>
      <section className="hero">
        <div>
          <span className="eyebrow">A calmer way to learn code</span>
          <h1>
            Make difficult ideas feel <em>graspable.</em>
          </h1>
          <p>
            Personalized lessons, visual thinking, and a patient AI coach for
            the moments when a concept almost makes sense.
          </p>
          <Link className="button button-primary" href="/onboarding">
            Find your starting point <span>→</span>
          </Link>
        </div>
        <div className="hero-orbit">
          <div className="orbit-card orbit-main">
            think
            <br />
            <strong>clearly</strong>
          </div>
          <div className="orbit-card orbit-small">
            practice
            <br />
            <strong>gently</strong>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">The library</span>
            <h2>Pick a thread to pull.</h2>
          </div>
          <Link className="text-link" href="/learn">
            View all topics →
          </Link>
        </div>
        <div className="topic-grid">
          {topics.slice(0, 3).map((topic) => (
            <TopicCard key={topic.slug} topic={topic} />
          ))}
        </div>
      </section>
    </main>
  );
}
