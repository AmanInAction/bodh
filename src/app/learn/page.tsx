import Link from "next/link";
import { cookies } from "next/headers";
import { topics } from "@/config/topics";
import {
  readSession,
  DEMO_SESSION,
  sessionCookie,
  DEMO_STUDENT_ID,
} from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/aws/dynamodb";
import { getRoadmap, getTopicStatus } from "@/lib/learning/roadmap";
import { Badge } from "@/components/ui/Badge";
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
import { Navbar } from "@/components/ui/Navbar";

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
  const studentId =
    session.email === "student_001@bodh.demo" ? DEMO_STUDENT_ID : session.email;
  const record = await getStudentRecord(studentId);
  const roadmap = await getRoadmap(session.email);

  const language = resolveLanguage(
    resolvedSearchParams.language,
    cookieStore.get(LANGUAGE_COOKIE)?.value,
    record?.language,
  );
  const strings = UI_STRINGS[language];

  const roadmapMap = new Map(roadmap.map((r) => [r.topicSlug, r]));

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
        userName={userSession?.name}
        showLogout={Boolean(userSession)}
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

            const progress = roadmapMap.get(topic.slug);
            const score = progress?.mastery ?? 0;
            const attempts = progress?.attempts ?? 0;
            const status = getTopicStatus(score, attempts);

            const statusBadge =
              status === "mastered" ? (
                <Badge variant="success">{strings.learnPage.mastered}</Badge>
              ) : status === "in_progress" ? (
                <Badge variant="primary">{strings.learnPage.inProgress}</Badge>
              ) : status === "needs_practice" ? (
                <Badge variant="warning">{strings.learnPage.needsPractice}</Badge>
              ) : (
                <Badge variant="neutral">{strings.learnPage.notStarted}</Badge>
              );

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
                  <div
                    className="roadmap-card-header"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div className="roadmap-meta">
                      <span className="eyebrow">{level}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lessonsCount}</span>
                      {attempts > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            {formatMastery(score, language)}
                          </span>
                        </>
                      )}
                    </div>
                    {statusBadge}
                  </div>
                  <strong className="roadmap-title">{title}</strong>
                  <p className="roadmap-desc">{description}</p>
                  <div className="roadmap-actions">
                    <span>{strings.learnPage.learnCard}</span>
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
