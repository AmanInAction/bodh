import Link from "next/link";
import { cookies } from "next/headers";
import { getSessionOrDemo, sessionCookie } from "@/lib/auth/session";
import { getTopicScores } from "@/lib/learning/scores";
import { notFound } from "next/navigation";
import { getTopic } from "@/lib/learning/topics";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ExplainDifferently } from "@/components/learning/ExplainDifferently";

const TOPIC_TITLE_HI: Record<string, string> = {
  arrays: "ऐरे",
  "linked-list": "लिंक्ड लिस्ट",
  stacks: "स्टैक",
  queues: "क्यू",
  "binary-search": "बाइनरी सर्च",
  recursion: "रिकर्शन",
};

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ language?: string }>;
}) {
  const { topic: slug } = await params;
  const { language = "en" } = await searchParams;
  const topic = getTopic(slug);
  if (!topic) notFound();
  const session = await getSessionOrDemo((await cookies()).get(sessionCookie)?.value);
  const mastery = (await getTopicScores(session))[slug] ?? 0;

  const isHindi = language === "hi";
  const topicTitleHi = TOPIC_TITLE_HI[slug] ?? topic.title;

  return (
    <main className="site-shell">
      <nav className="nav">
        <Link className="brand" href="/">
          bodh<span>.</span>
        </Link>
        <Link href={`/learn?language=${language}`}>All topics</Link>
      </nav>

      {/* ── Topic Hero ─────────────────────────────────────────────── */}
      <section className={`topic-hero topic-${topic.color}`}>
        <span className="eyebrow">{topic.level} path</span>
        <h1>{isHindi ? topicTitleHi : topic.title}</h1>
        <p>{topic.description}</p>
        <div className="topic-summary">
          <span>{topic.lessons} lessons</span>
          <span>{mastery}% mastered</span>
        </div>
        <ProgressBar value={mastery} />
      </section>

      {/* ── 3-Action Buttons (Spec §4.4) ──────────────────────────── */}
      <section className="section" style={{ paddingTop: "32px" }}>
        <div className="section-heading">
          <div>
            <span className="eyebrow">{isHindi ? "आज क्या करना है?" : "What would you like to do?"}</span>
            <h2>{isHindi ? "अपना रास्ता चुनें" : "Choose your path"}</h2>
          </div>
        </div>
        <div className="topic-actions-grid">
          <Link
            className="topic-action-card"
            href={`/learn/${slug}/article?language=${language}`}
          >
            <span className="topic-action-icon">📖</span>
            <strong>{isHindi ? "पढ़ें" : "Learn"}</strong>
            <p>{isHindi ? "लेख और AI व्याख्या पढ़ें" : "Read the article & AI explanation"}</p>
          </Link>
          <Link
            className="topic-action-card"
            href={`/learn/${slug}/mindmap?language=${language}`}
          >
            <span className="topic-action-icon">🧠</span>
            <strong>{isHindi ? "माइंड मैप" : "Mind Map"}</strong>
            <p>{isHindi ? "अवधारणा को दृश्य रूप में देखें" : "See the concept visually"}</p>
          </Link>
          <Link
            className="topic-action-card"
            href={`/learn/${slug}/quiz?language=${language}`}
          >
            <span className="topic-action-icon">📝</span>
            <strong>{isHindi ? "अभ्यास करें" : "Practice"}</strong>
            <p>{isHindi ? "5-प्रश्न क्विज़ लें" : "Take a 5-question quiz"}</p>
          </Link>
        </div>
      </section>

      {/* ── Explain Differently ───────────────────────────────────── */}
      <section className="section" style={{ paddingTop: "8px" }}>
        <ExplainDifferently topic={topic.title} language={language} />
      </section>
    </main>
  );
}
