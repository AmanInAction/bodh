import Link from "next/link";
import { topics } from "@/config/topics";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { TopicProgress } from "@/components/dashboard/TopicProgress";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { getRecommendations } from "@/lib/learning/recommendation";
import { cookies } from "next/headers";
import { getSessionOrDemo, sessionCookie, DEMO_STUDENT_ID } from "@/lib/auth/session";
import { getRoadmap } from "@/lib/learning/roadmap";
import { getStudentRecord } from "@/lib/aws/dynamodb";
import { LogoutButton } from "@/components/ui/LogoutButton";

export default async function DashboardPage() {
  const session = await getSessionOrDemo(
    (await cookies()).get(sessionCookie)?.value,
  );

  const isDemoUser = session.email === "student_001@bodh.demo";
  const studentId = isDemoUser ? DEMO_STUDENT_ID : session.email;

  // Prefer the fine-grained StudentRecord for per-topic scores
  const record = await getStudentRecord(studentId);
  const roadmap = await getRoadmap(session.email);

  // Build topic score map
  const topicScoreMap = new Map<string, number>();
  if (record) {
    for (const [slug, perf] of Object.entries(record.topics)) {
      topicScoreMap.set(slug, perf.score);
    }
  } else {
    for (const item of roadmap) {
      topicScoreMap.set(item.topicSlug, item.mastery);
    }
  }

  // Overall metrics
  const attempted = topics.filter((t) => (topicScoreMap.get(t.slug) ?? 0) > 0);
  const averageMastery =
    attempted.length > 0
      ? Math.round(
          attempted.reduce((s, t) => s + (topicScoreMap.get(t.slug) ?? 0), 0) /
            attempted.length,
        )
      : 0;
  const lessonsCompleted = record
    ? Object.values(record.topics).reduce((s, t) => s + (t.attempts ?? 0), 0)
    : roadmap.reduce((s, r) => s + r.completedLessons, 0);
  const loginStreak = record?.loginCount ?? 1;

  // Weak topics
  const weakTopics = record
    ? record.weakTopics
    : roadmap
        .filter((r) => r.attempts > 0 && r.mastery < 60)
        .sort((a, b) => a.mastery - b.mastery)
        .map((r) => r.topicSlug);

  const weakestSlug = weakTopics[0];
  const weakestTopic = topics.find((t) => t.slug === weakestSlug);

  const recommendations = getRecommendations(roadmap);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <main className="site-shell">
      <nav className="nav">
        <Link className="brand" href="/">
          bodh<span>.</span>
        </Link>
        <div>
          <Link href="/learn">Learn</Link>
          <span className="avatar">{session.name[0].toUpperCase()}</span>
          <LogoutButton />
        </div>
      </nav>
      <section className="dashboard-header">
        <div>
          <span className="eyebrow">Your learning space</span>
          <h1>{greeting}, {session.name}.</h1>
          <p>Keep the thread going. You are building something durable.</p>
        </div>
        <div className="streak">
          <strong>{loginStreak}</strong>
          <span>
            session
            <br />
            {loginStreak === 1 ? "start" : "streak"}
          </span>
        </div>
      </section>
      <div className="score-grid">
        <ScoreCard
          label="Lessons completed"
          value={String(lessonsCompleted)}
          detail="Total quiz attempts"
        />
        <ScoreCard
          label="Time learning"
          value={`${Math.round(lessonsCompleted * 0.13 * 10) / 10}h`}
          detail="Estimated"
        />
        <ScoreCard
          label="Average mastery"
          value={`${averageMastery}%`}
          detail={attempted.length > 0 ? `Across ${attempted.length} topic${attempted.length !== 1 ? "s" : ""}` : "No quizzes yet"}
        />
      </div>
      <section className="dashboard-columns">
        <div className="dashboard-panel">
          <div className="section-heading">
            <h2>Your progress</h2>
            <Link className="text-link" href="/learn">
              See library →
            </Link>
          </div>
          {topics.map((topic) => (
            <TopicProgress
              key={topic.slug}
              title={topic.title}
              value={topicScoreMap.get(topic.slug) ?? 0}
            />
          ))}
        </div>
        <div className="dashboard-side">
          {weakestTopic && (
            <div className="card focus-card">
              <span className="eyebrow">Focus area</span>
              <h3>{weakestTopic.title}</h3>
              <p>
                {topicScoreMap.get(weakestSlug!) === 0
                  ? "You haven't tried this topic yet — it's your next frontier."
                  : `You're at ${topicScoreMap.get(weakestSlug!)}% mastery. One focused session will make a real difference.`}
              </p>
              <Link
                className="button button-primary"
                href={`/learn/${weakestTopic.slug}`}
              >
                Start lesson →
              </Link>
            </div>
          )}
          {!weakestTopic && (
            <div className="card focus-card">
              <span className="eyebrow">Focus area</span>
              <h3>Arrays</h3>
              <p>Start your journey — take your first quiz to see personalised recommendations.</p>
              <Link className="button button-primary" href="/learn/arrays/quiz">
                Start lesson →
              </Link>
            </div>
          )}
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.title}
              recommendation={recommendation}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
