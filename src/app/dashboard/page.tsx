import Link from "next/link";
import { topics } from "@/config/topics";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { TopicProgress } from "@/components/dashboard/TopicProgress";
import { WeaknessCard } from "@/components/dashboard/WeaknessCard";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { getRecommendations } from "@/lib/learning/recommendation";
import { cookies } from "next/headers";
import { readSession, sessionCookie } from "@/lib/auth/session";
import { getRoadmap } from "@/lib/learning/roadmap";
import { LogoutButton } from "@/components/ui/LogoutButton";
export default async function DashboardPage() {
  const session = await readSession(
    (await cookies()).get(sessionCookie)?.value,
  );
  const roadmap = await getRoadmap(session?.email ?? "demo@example.com");
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
          <strong>5</strong>
          <span>
            day
            <br />
            streak
          </span>
        </div>
      </section>
      <div className="score-grid">
        <ScoreCard label="Lessons completed" value="18" detail="+3 this week" />
        <ScoreCard label="Time learning" value="4.6h" detail="This month" />
        <ScoreCard
          label="Average mastery"
          value="61%"
          detail="+8% this month"
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
          <WeaknessCard />
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
