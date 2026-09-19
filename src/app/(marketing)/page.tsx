import Link from "next/link";
import { topics } from "@/config/topics";
import { TopicCard } from "@/components/learning/TopicCard";

const FEATURES = [
  {
    icon: "🌐",
    title: "Regional Languages",
    body: "Learn in Hindi or English — not a translation, a full bilingual experience.",
  },
  {
    icon: "🤖",
    title: "Adaptive AI Teacher",
    body: "Four teaching styles: Simple, Socratic, Visual, and Interview-ready.",
  },
  {
    icon: "📊",
    title: "Concept-level Diagnosis",
    body: "Wrong answers map to specific weak concepts, not just a score.",
  },
  {
    icon: "🗺️",
    title: "Visual Mind Maps",
    body: "See the full structure of each topic at a glance before diving in.",
  },
];

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

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <div>
          <span className="eyebrow">AI-powered DSA education in your language</span>
          <h1>
            Learn DSA <em>in your language.</em>
          </h1>
          <p>
            Learn &bull; Practice &bull; Improve — in{" "}
            <strong>Hindi</strong> or <strong>English</strong>. Not just
            translated content — adaptive teaching that changes based on how
            you learn.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link className="button button-primary" href="/onboarding">
              Start Learning →
            </Link>
            <Link
              className="button"
              href="/learn/binary-search/quiz?language=hi"
            >
              Try a Hindi quiz
            </Link>
          </div>
        </div>
        <div className="hero-orbit">
          <div className="orbit-card orbit-main">
            सीखें
            <br />
            <strong>समझें</strong>
          </div>
          <div className="orbit-card orbit-small">
            Learn
            <br />
            <strong>Improve</strong>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Why bodh.</span>
            <h2>More than a translation.</h2>
          </div>
        </div>
        <div className="topic-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <span style={{ fontSize: "2rem" }}>{f.icon}</span>
              <h3 style={{ margin: "8px 0 4px" }}>{f.title}</h3>
              <p style={{ margin: 0, opacity: 0.75, fontSize: "0.9rem" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Topic Library ─────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">The library</span>
            <h2>Six core DSA topics.</h2>
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

      {/* ── Demo CTA ──────────────────────────────────────────────────── */}
      <section className="section" style={{ textAlign: "center", paddingBottom: "80px" }}>
        <span className="eyebrow">Demo flow</span>
        <h2>See the full loop in action.</h2>
        <p style={{ maxWidth: "520px", margin: "0 auto 24px", opacity: 0.75 }}>
          Choose Hindi → Pick Binary Search → Read the article → Take the quiz →
          Get an AI diagnosis → See your recommended next lesson.
        </p>
        <Link className="button button-primary" href="/learn/binary-search/article?language=hi">
          Run the demo →
        </Link>
      </section>
    </main>
  );
}
