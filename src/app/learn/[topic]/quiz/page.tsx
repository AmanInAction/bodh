import Link from "next/link";
import { cookies } from "next/headers";
import { generateQuiz } from "@/lib/ai/quiz";
import { QuizSession } from "@/components/quiz/QuizSession";
import { LANGUAGE_COOKIE, resolveLanguage, UI_STRINGS } from "@/lib/i18n";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ language?: string }>;
}) {
  const { topic } = await params;
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const selectedLanguage = resolveLanguage(
    resolvedSearchParams.language,
    cookieStore.get(LANGUAGE_COOKIE)?.value,
  );
  const strings = UI_STRINGS[selectedLanguage];
  const questions = await generateQuiz(topic, selectedLanguage);

  return (
    <main className="site-shell quiz-page">
      <nav className="nav">
        <Link className="brand" href={`/?language=${selectedLanguage}`}>
          bodh<span>.</span>
        </Link>
        <Link href={`/learn/${topic}?language=${selectedLanguage}`}>
          {strings.nav.exitPractice}
        </Link>
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
