import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import {
  readSession,
  DEMO_SESSION,
  sessionCookie,
  DEMO_STUDENT_ID,
} from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/aws/dynamodb";
import { getTopicScores } from "@/lib/learning/scores";
import { isDemoAllowed } from "@/config/env";
import { getTopic } from "@/lib/learning/topics";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Navbar } from "@/components/ui/Navbar";
import { ExplainDifferently } from "@/components/learning/ExplainDifferently";
import {
  LANGUAGE_COOKIE,
  resolveLanguage,
  getTopicTitle,
  getTopicDescription,
  getLevelLabel,
  formatLessons,
  formatMastery,
  UI_STRINGS,
} from "@/lib/i18n";

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ language?: string }>;
}) {
  const { topic: slug } = await params;
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const topic = getTopic(slug);
  if (!topic) notFound();

  const token = cookieStore.get(sessionCookie)?.value;
  const userSession = await readSession(token);

  if (!userSession) {
    const allowDemo = isDemoAllowed();
    if (!allowDemo) {
      redirect("/auth");
    }
  }

  const session = userSession ?? DEMO_SESSION;
  const studentId =
    session.email === "student_001@bodh.demo" ? DEMO_STUDENT_ID : session.email;
  const record = await getStudentRecord(studentId);
  const language = resolveLanguage(
    resolvedSearchParams.language,
    cookieStore.get(LANGUAGE_COOKIE)?.value,
    record?.language,
  );
  const mastery = (await getTopicScores(session))[slug] ?? 0;
  const topicPerf = record?.topics?.[slug];

  const strings = UI_STRINGS[language];
  const title = getTopicTitle(slug, language);
  const description = getTopicDescription(slug, language);
  const level = getLevelLabel(topic.level, language);

  return (
    <main className="site-shell">
      <Navbar
        language={language}
        backHref={`/learn?language=${language}`}
        backLabel={strings.nav.allTopics}
      />

      {/* ── Topic Hero ─────────────────────────────────────────────── */}
      <section className={`topic-hero topic-${topic.color}`}>
        <span className="eyebrow">
          {level} · {strings.topicPage.pathSuffix}
        </span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="topic-summary">
          <span>{formatLessons(topic.lessons, language)}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {formatMastery(mastery, language)}
          </span>
        </div>
        <ProgressBar value={mastery} label={title} />
      </section>

      {/* ── Study Steps (Read Article + Practice Quiz) ─────────────── */}
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{strings.topicPage.actionEyebrow}</span>
            <h2>{strings.topicPage.actionHeading}</h2>
          </div>
        </div>
        <div
          className="topic-actions-grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
        >
          <Link
            className="topic-action-card"
            href={`/learn/${slug}/article?language=${language}`}
          >
            <span className="topic-action-step">
              01 · {language === "hi" ? "पढ़ें" : "Read"}
            </span>
            <strong>{strings.topicPage.learnTitle}</strong>
            <p>{strings.topicPage.learnDesc}</p>
          </Link>
          <Link
            className="topic-action-card"
            href={`/learn/${slug}/quiz?language=${language}`}
          >
            <span className="topic-action-step">
              02 · {language === "hi" ? "अभ्यास" : "Practice"}
            </span>
            <strong>{strings.topicPage.quizTitle}</strong>
            <p>{strings.topicPage.quizDesc}</p>
          </Link>
        </div>
      </section>

      {/* ── Explain Differently (Agent 3) ──────────────────────────── */}
      <section className="section">
        <ExplainDifferently
          topic={title}
          topicSlug={slug}
          weakConcepts={topicPerf?.weakConcepts ?? topicPerf?.missedConcepts}
          language={language}
        />
      </section>
    </main>
  );
}
