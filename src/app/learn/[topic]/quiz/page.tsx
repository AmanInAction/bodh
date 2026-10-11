import { cookies } from "next/headers";
import { generateQuiz } from "@/lib/ai/quiz";
import { QuizSession } from "@/components/quiz/QuizSession";
import { Navbar } from "@/components/ui/Navbar";
import {
  readSession,
  DEMO_SESSION,
  sessionCookie,
  DEMO_STUDENT_ID,
} from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/aws/dynamodb";
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
  const token = cookieStore.get(sessionCookie)?.value;
  const userSession = await readSession(token);
  const session = userSession ?? DEMO_SESSION;
  const studentId =
    session.email === "student_001@bodh.demo" ? DEMO_STUDENT_ID : session.email;
  const record = await getStudentRecord(studentId);

  const selectedLanguage = resolveLanguage(
    resolvedSearchParams.language,
    cookieStore.get(LANGUAGE_COOKIE)?.value,
    record?.language,
  );
  const strings = UI_STRINGS[selectedLanguage];
  const questions = await generateQuiz(topic, selectedLanguage);

  return (
    <main className="site-shell quiz-page">
      <Navbar
        language={selectedLanguage}
        backHref={`/learn/${topic}?language=${selectedLanguage}`}
        backLabel={strings.nav.exitPractice}
      />
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
