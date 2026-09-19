import Link from "next/link";
import { topics } from "@/config/topics";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { TopicProgress } from "@/components/dashboard/TopicProgress";
import { WeaknessCard } from "@/components/dashboard/WeaknessCard";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { getRecommendations } from "@/lib/learning/recommendation";
import { cookies } from "next/headers";
import { readSession, sessionCookie } from "@/lib/auth/session";
import { getRoadmap, summarizeRoadmap } from "@/lib/learning/roadmap";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { redirect } from "next/navigation";
export default async function DashboardPage() {
  const session = await readSession(
    (await cookies()).get(sessionCookie)?.value,
  );
  if (!session) redirect("/auth");
  const roadmap = await getRoadmap(session?.email ?? "demo@example.com");
  const summary = summarizeRoadmap(roadmap);
  const weakest = roadmap
    .filter((item) => item.attempts > 0)
    .sort((a, b) => a.mastery - b.mastery)[0];
  const weakestTopic = weakest
    ? topics.find((topic) => topic.slug === weakest.topicSlug)
    : null;
  return (
    <main className="site-shell">
      <nav className="nav">
        <Link className="brand" href="/">
          bodh<span>.</span>
        </Link>
        <div>
          <Link href="/learn">Learn</Link>
          <span className="avatar">A</span>
          <LogoutButton />
        </div>
      </nav>
      <section className="dashboard-header">
        <div>
          <span className="eyebrow">Your learning space</span>
          <h1>Good morning, {session?.name ?? "Anika"}.</h1>
          <p>Keep the thread going. You are building something durable.</p>
        </div>
        <div className="streak">
          <strong>{summary.streak}</strong>
          <span>
            day
            <br />
            streak
          </span>
        </div>
      </section>
      <div className="score-grid">
        <ScoreCard
          label="Lessons completed"
          value={String(summary.lessonsCompleted)}
          detail="Across your topics"
        />
        <ScoreCard
          label="Time learning"
          value={`${(summary.minutesLearned / 60).toFixed(1)}h`}
          detail="Estimated learning time"
        />
        <ScoreCard
          label="Average mastery"
          value={`${summary.averageMastery}%`}
          detail="Across attempted topics"
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
          {topics.slice(0, 4).map((topic) => (
            <TopicProgress
              key={topic.slug}
              title={topic.title}
              value={
                roadmap.find((item) => item.topicSlug === topic.slug)
                  ?.mastery ?? topic.mastery
              }
            />
          ))}
        </div>
        <div className="dashboard-side">
          <WeaknessCard
            title={weakestTopic?.title ?? "Start a topic"}
            reason={
              weakest
                ? `Your current mastery is ${weakest.mastery}%. A short review can strengthen this topic.`
                : "Try your first practice quiz to build a personalised focus area."
            }
          />
          {getRecommendations(roadmap).map((recommendation) => (
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
