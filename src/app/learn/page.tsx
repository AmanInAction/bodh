import Link from "next/link";
import { cookies } from "next/headers";
import { topics } from "@/config/topics";
import {
  LANGUAGE_COOKIE,
  resolveLanguage,
  getTopicTitle,
  getTopicDescription,
  getLevelLabel,
  formatLessons,
  UI_STRINGS,
} from "@/lib/i18n";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

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
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const language = resolveLanguage(
    resolvedSearchParams.language,
    cookieStore.get(LANGUAGE_COOKIE)?.value,
  );
  const strings = UI_STRINGS[language];

  return (
    <main className="site-shell">
      <nav className="nav">
        <Link className="brand" href={`/?language=${language}`}>
          bodh<span>.</span>
        </Link>
        <div>
          <Link href={`/dashboard?language=${language}`}>
            {strings.nav.dashboard}
          </Link>
          <LanguageToggle currentLanguage={language} />
        </div>
      </nav>

      <section className="library-header">
        <span className="eyebrow">
          {strings.learnPage.eyebrow}
        </span>
        <h1>
          {strings.learnPage.title}
        </h1>
        <p>
          {strings.learnPage.subtitle}
        </p>
      </section>

      {/* ── Roadmap Journey ─────────────────────────────────────────── */}
      <section className="section">
        <div className="roadmap-list">
          {topics.map((topic, index) => {
            const icon = STATUS_ICONS[topic.slug] ?? "🔒";
            const levelColor = LEVEL_COLORS[topic.level] ?? "#a78bfa";
            const title = getTopicTitle(topic.slug, language);
            const description = getTopicDescription(topic.slug, language);
            const level = getLevelLabel(topic.level, language);
            const lessonsCount = formatLessons(topic.lessons, language);

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
                      {level}
                    </span>
                    <span className="roadmap-lessons">
                      {lessonsCount}
                    </span>
                  </div>
                  <strong className="roadmap-title">{title}</strong>
                  <p className="roadmap-desc">{description}</p>
                  <div className="roadmap-actions">
                    <span>{strings.learnPage.learnCard}</span>
                    <span>{strings.learnPage.mindmapCard}</span>
                    <span>{strings.learnPage.quizCard}</span>
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
