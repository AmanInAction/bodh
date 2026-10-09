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
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { readSession, DEMO_SESSION, sessionCookie, DEMO_STUDENT_ID } from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/aws/dynamodb";
import { getTopicStatus, type TopicStatus } from "@/lib/learning/roadmap";

const STATUS_VARIANT: Record<TopicStatus, BadgeVariant> = {
  not_started: "neutral",
  needs_practice: "warning",
  in_progress: "info",
  mastered: "success",
};

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  const userSession = await readSession(token);
  const session = userSession ?? DEMO_SESSION;
  const studentId = session.email === "student_001@bodh.demo" ? DEMO_STUDENT_ID : session.email;
  const record = await getStudentRecord(studentId);

  const language = resolveLanguage(
    resolvedSearchParams.language,
    cookieStore.get(LANGUAGE_COOKIE)?.value,
    record?.language,
  );
  const strings = UI_STRINGS[language];

  // Map progress per topic
  const topicProgress = topics.map((topic) => {
    const perf = record?.topics[topic.slug];
    const score = perf?.score ?? 0;
    const attempts = perf?.attempts ?? 0;
    const status = getTopicStatus(score, attempts);
    return {
      slug: topic.slug,
      score,
      attempts,
      status,
    };
  });

  const attemptedTopics = topicProgress.filter((t) => t.attempts > 0);
  const masteredCount = topicProgress.filter((t) => t.status === "mastered").length;
  const averageMastery =
    attemptedTopics.length > 0
      ? Math.round(
          attemptedTopics.reduce((sum, t) => sum + t.score, 0) /
            attemptedTopics.length,
        )
      : 0;

  const goalKey = record?.goal ?? "foundations";
  const goalLabel =
    goalKey === "scratch"
      ? strings.learnPage.goalScratch
      : goalKey === "interview"
      ? strings.learnPage.goalInterview
      : strings.learnPage.goalFoundations;

  function getStatusLabel(status: TopicStatus): string {
    switch (status) {
      case "mastered":
        return strings.learnPage.mastered;
      case "in_progress":
        return strings.learnPage.inProgress;
      case "needs_practice":
        return strings.learnPage.needsPractice;
      default:
        return strings.learnPage.notStarted;
    }
  }

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
            href: `/blogs?language=${language}`,
            label: strings.nav.blogs,
            activeMatch: "/blogs",
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

        {/* ── Real Student Journey Summary Banner ──────────────────── */}
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem 1.25rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg, 12px)",
            display: "flex",
            flexWrap: "wrap",
            gap: "1.25rem",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                {strings.learnPage.activeGoalLabel}
              </span>
              <strong style={{ fontSize: "0.9375rem", color: "var(--text)" }}>{goalLabel}</strong>
            </div>
            <div style={{ width: "1px", height: "24px", background: "var(--border)" }} aria-hidden="true" />
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                {strings.learnPage.overallProgress}
              </span>
              <strong style={{ fontSize: "0.9375rem", color: "var(--text)" }}>
                {strings.learnPage.topicsMastered(masteredCount, topics.length)}
              </strong>
            </div>
          </div>

          <div style={{ minWidth: "160px", maxWidth: "220px", width: "100%" }}>
            <ProgressBar value={averageMastery} showValue label={strings.learnPage.overallProgress} size="sm" />
          </div>
        </div>
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
            const prog = topicProgress[index];
            const status = prog.status;
            const statusLabel = getStatusLabel(status);
            const variant = STATUS_VARIANT[status];

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
                    <Badge variant={variant}>
                      {statusLabel}
                    </Badge>
                  </div>
                  <strong className="roadmap-title">{title}</strong>
                  <p className="roadmap-desc">{description}</p>

                  {prog.attempts > 0 && (
                    <div style={{ marginTop: "0.75rem", marginBottom: "0.5rem" }}>
                      <ProgressBar
                        value={prog.score}
                        showValue
                        size="sm"
                        variant={prog.score >= 80 ? "success" : prog.score >= 60 ? "primary" : "warning"}
                      />
                    </div>
                  )}

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
