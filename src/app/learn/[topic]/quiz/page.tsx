import Link from "next/link";
import { generateQuiz } from "@/lib/ai/quiz";
import { QuizCard } from "@/components/quiz/QuizCard";
import { QuizProgress } from "@/components/quiz/QuizProgress";
export default async function QuizPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const question = generateQuiz(topic)[0];
  return (
    <main className="site-shell quiz-page">
      <nav className="nav">
        <Link className="brand" href="/">
          bodh<span>.</span>
        </Link>
        <Link href={`/learn/${topic}`}>Exit practice</Link>
      </nav>
      <div className="quiz-wrap">
        <QuizProgress current={1} total={1} />
        <QuizCard question={question} />
        <Link className="button button-primary" href="/dashboard">
          Submit answer →
        </Link>
      </div>
    </main>
  );
}
