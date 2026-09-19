import Link from "next/link";
import { generateQuiz } from "@/lib/ai/quiz";
import { QuizSession } from "@/components/quiz/QuizSession";
import { getTopic } from "@/config/topics";
import { notFound } from "next/navigation";
export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ language?: string }>;
}) {
  const { topic } = await params;
  if (!getTopic(topic)) notFound();
  const { language = "en" } = await searchParams;
  const selectedLanguage = language === "hi" ? "hi" : "en";
  const questions = await generateQuiz(topic, selectedLanguage);
  return (
    <main className="site-shell quiz-page">
      <nav className="nav">
        <Link className="brand" href="/">
          bodh<span>.</span>
        </Link>
        <Link href={`/learn/${topic}`}>Exit practice</Link>
      </nav>
      <div className="quiz-wrap">
        <QuizSession
          topic={topic}
          language={selectedLanguage}
          questions={questions}
        />
      </div>
    </main>
  );
}
