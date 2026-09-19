import Link from "next/link";
import { topics } from "@/config/topics";

// Status indicators matching spec §4.3
const STATUS_ICONS: Record<string, string> = {
  arrays: "🟢",
  "linked-list": "🟢",
  stacks: "🟡",
  queues: "🟡",
  "binary-search": "🟡",
  recursion: "🔒",
};

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "#34d399",
  Intermediate: "#a78bfa",
  Advanced: "#f472b6",
};

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string }>;
}) {
  const { language = "en" } = await searchParams;
  const isHindi = language === "hi";

  return (
    <main className="site-shell">
      <nav className="nav">
        <Link className="brand" href="/">
          bodh<span>.</span>
        </Link>
        <div>
          <Link href="/dashboard">Dashboard</Link>
          <Link href={`/learn?language=${language === "hi" ? "en" : "hi"}`}>
            {language === "hi" ? "Switch to English" : "हिन्दी में पढ़ें"}
          </Link>
        </div>
      </nav>

      <section className="library-header">
        <span className="eyebrow">
          {isHindi ? "डीएसए यात्रा" : "Your DSA Journey"}
        </span>
        <h1>
          {isHindi ? "अपना विषय चुनें।" : "Follow your curiosity."}
        </h1>
        <p>
          {isHindi
            ? "छोटे-छोटे पाठ, दृश्य सोच, और एक धैर्यवान AI शिक्षक।"
            : "Short lessons, visual thinking, and a patient AI coach."}
        </p>
      </section>

      {/* ── Roadmap Journey ─────────────────────────────────────────── */}
      <section className="section">
        <div className="roadmap-list">
          {topics.map((topic, index) => {
            const icon = STATUS_ICONS[topic.slug] ?? "🔒";
            const levelColor = LEVEL_COLORS[topic.level] ?? "#a78bfa";
            return (
              <div key={topic.slug} className="roadmap-item">
                <div className="roadmap-track">
                  <span className="roadmap-icon">{icon}</span>
                  {index < topics.length - 1 && (
                    <div className="roadmap-connector" />
                  )}
                </div>
                <Link
                  className="roadmap-card"
                  href={`/learn/${topic.slug}?language=${language}`}
                >
                  <div className="roadmap-card-header">
                    <span
                      className="roadmap-level-badge"
                      style={{ background: `${levelColor}22`, color: levelColor }}
                    >
                      {topic.level}
                    </span>
                    <span className="roadmap-lessons">
                      {topic.lessons} lessons
                    </span>
                  </div>
                  <strong className="roadmap-title">{topic.title}</strong>
                  <p className="roadmap-desc">{topic.description}</p>
                  <div className="roadmap-actions">
                    <span>📖 Learn</span>
                    <span>🧠 Mind Map</span>
                    <span>📝 Quiz</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
