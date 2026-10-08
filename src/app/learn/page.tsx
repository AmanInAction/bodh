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
import { Navbar } from "@/components/ui/Navbar";

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
      <Navbar
        language={language}
        links={[
          {
            href: `/dashboard?language=${language}`,
            label: strings.nav.dashboard,
            activeMatch: "/dashboard",
          },
          {
            href: `/learn?language=${language}`,
            label: strings.nav.learn,
            activeMatch: "/learn",
          },
          {
            href: `/about?language=${language}`,
            label: strings.nav.about,
            activeMatch: "/about",
          },
        ]}
      />

      <section className="library-header">
        <span className="eyebrow">{strings.learnPage.eyebrow}</span>
        <h1>{strings.learnPage.title}</h1>
        <p>{strings.learnPage.subtitle}</p>
      </section>

      {/* ── Roadmap Journey ─────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="roadmap-list">
          {topics.map((topic, index) => {
            const title = getTopicTitle(topic.slug, language);
            const description = getTopicDescription(topic.slug, language);
            const level = getLevelLabel(topic.level, language);
            const lessonsCount = formatLessons(topic.lessons, language);
            const stepNumber = String(index + 1).padStart(2, "0");

            return (
              <div key={topic.slug} className="roadmap-item">
                <div className="roadmap-track">
                  <span className="roadmap-step-num" aria-hidden="true">
                    {stepNumber}
                  </span>
                  {index < topics.length - 1 && (
                    <div className="roadmap-connector" />
                  )}
                </div>
                <Link
                  className="roadmap-card"
                  href={`/learn/${topic.slug}?language=${language}`}
                >
                  <div className="roadmap-card-header">
                    <div className="roadmap-meta">
                      <span className="eyebrow">{level}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lessonsCount}</span>
                    </div>
                  </div>
                  <strong className="roadmap-title">{title}</strong>
                  <p className="roadmap-desc">{description}</p>
                  <div className="roadmap-actions">
                    <span>{strings.learnPage.learnCard}</span>
                    <span aria-hidden="true">·</span>
                    <span>{strings.learnPage.mindmapCard}</span>
                    <span aria-hidden="true">·</span>
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
