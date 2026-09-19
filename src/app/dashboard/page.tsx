import Link from "next/link";
import { cookies } from "next/headers";

import { topics } from "@/config/topics";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { TopicProgress } from "@/components/dashboard/TopicProgress";
import { WeaknessCard } from "@/components/dashboard/WeaknessCard";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { LogoutButton } from "@/components/ui/LogoutButton";

import { getRecommendations } from "@/lib/learning/recommendation";
import { getRoadmap } from "@/lib/learning/roadmap";
import {
  DEMO_STUDENT_ID,
  getSessionOrDemo,
  sessionCookie,
} from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/aws/dynamodb";

export default async function DashboardPage() {
  const session = await getSessionOrDemo(
    (await cookies()).get(sessionCookie)?.value,
  );

  const isDemoUser = session.email === "student_001@bodh.demo";
  const studentId = isDemoUser ? DEMO_STUDENT_ID : session.email;

  const roadmap = await getRoadmap(studentId);
  const record = await getStudentRecord(studentId);

  const entries = record ? Object.values(record.topics) : [];
  const attempted = entries.filter((topic) => topic.attempts > 0);

  const averageMastery =
    attempted.length > 0
      ? Math.round(
          attempted.reduce((sum, topic) => sum + topic.score, 0) /
            attempted.length,
        )
      : 0;

  const lessonsCompleted =
    record?.topics
      ? Object.values(record.topics).reduce(
          (sum, topic) => sum + topic.attempts,
          0,
        )
      : roadmap.filter((item) => item.mastery > 0).length;

  const minutesLearned = record ? 0 : 276;
  const streak = record ? 0 : 5;

  return (
    <main className="site-shell">
      <nav className="nav">
        <Link className="brand" href="/">
          bodh<span>.</span>
        </Link>

        <div>
          <Link href="/learn">Learn</Link>
          <span className="avatar">
            {session.name.charAt(0).toUpperCase()}
          </span>
          <LogoutButton />
        </div>
      </nav>

      <section className="dashboard-header">
        <div>
          <span className="eyebrow">Your learning space</span>
          <h1>Good morning, {session.name}.</h1>
          <p>
            Keep the thread going. You are building something durable.
          </p>
        </div>

        <div className="streak">
          <strong>{streak}</strong>
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
          value={String(lessonsCompleted)}
          detail="Your learning progress"
        />

        <ScoreCard
          label="Time learning"
          value={`${(minutesLearned / 60).toFixed(1)}h`}
          detail="Total learning time"
        />

        <ScoreCard
          label="Average mastery"
          value={`${averageMastery}%`}
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
                  ?.mastery ?? 0
              }
            />
          ))}
        </div>

        <div className="dashboard-side">
          <WeaknessCard />

          {getRecommendations(roadmap).map((recommendation) => (
            <RecommendationCard
              key={recommendation.topicSlug}
              recommendation={recommendation}
            />
          ))}
        </div>
      </section>
    </main>
  );
}



