import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSession, sessionCookie } from "@/lib/auth/session";
import { generateFeedback } from "@/lib/ai/feedback";
import { runTeachingTeam, type TeachingStyle } from "@/lib/agentcore/teaching";
import { getNextTopic, recordAssessment } from "@/lib/learning/roadmap";
import type { QuizQuestion } from "@/types/quiz";

const VALID_STYLES: TeachingStyle[] = [
  "simple",
  "socratic",
  "visual",
  "interview",
];

function safeStyle(value: unknown): TeachingStyle {
  return VALID_STYLES.includes(value as TeachingStyle)
    ? (value as TeachingStyle)
    : "simple";
}

function normalizeQuestions(value: unknown): QuizQuestion[] {
  if (!Array.isArray(value)) return [];

  return value.filter((question): question is QuizQuestion => {
    if (!question || typeof question !== "object") return false;

    const q = question as QuizQuestion;

    return (
      typeof q.id === "string" &&
      typeof q.prompt === "string" &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.options.every((option) => typeof option === "string") &&
      Number.isInteger(q.answer) &&
      q.answer >= 0 &&
      q.answer < 4
    );
  });
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await readSession(
      cookieStore.get(sessionCookie)?.value,
    );

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const topicSlug =
      typeof body.topicSlug === "string" ? body.topicSlug : "";

    const language = body.language === "hi" ? "hi" : "en";
    const style = safeStyle(body.style);

    const answers = Array.isArray(body.answers)
      ? body.answers.map((answer: unknown) =>
          Number.isInteger(answer) ? Number(answer) : -1,
        )
      : [];

    const questions = normalizeQuestions(body.questions);

    if (!topicSlug || !questions.length) {
      return NextResponse.json(
        { error: "Quiz questions are required." },
        { status: 400 },
      );
    }

    if (answers.length !== questions.length) {
      return NextResponse.json(
        { error: "Please answer every question." },
        { status: 400 },
      );
    }

    const correct = questions.reduce((count, question, index) => {
      return count + (answers[index] === question.answer ? 1 : 0);
    }, 0);

    const total = questions.length;
    const score = Math.round((correct / total) * 100);

    const feedback = await generateFeedback(
      topicSlug,
      score,
      correct,
      total,
      language,
    );

    const teaching = await runTeachingTeam(
      `The student scored ${score}% (${correct}/${total}) on ${topicSlug}.`,
      topicSlug,
      style,
      language,
    );

    const roadmap = await recordAssessment(
      session.email,
      topicSlug,
      score,
      teaching.recommendedStyle,
    );

    const nextTopic = getNextTopic(topicSlug);

    return NextResponse.json({
      score,
      correct,
      total,
      feedback: {
        ...feedback,
        teacher: teaching.explanation,
        followUp: teaching.followUp,
      },
      recommendedStyle: teaching.recommendedStyle,
      nextStrategy:
        score < 50
          ? "Review the core concept and try another short practice set."
          : score < 80
            ? "Review the weak areas and practise one more example."
            : "Move forward and revisit this topic later for spaced practice.",
      nextTopic,
      roadmap,
    });
  } catch (error) {
    console.error("[quiz/submit]", error);

    return NextResponse.json(
      { error: "Unable to evaluate the quiz right now." },
      { status: 500 },
    );
  }
}
