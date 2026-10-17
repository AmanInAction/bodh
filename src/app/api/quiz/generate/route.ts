import { NextResponse } from "next/server";
import {
  generateQuiz,
  toPublicQuestions,
  createQuizSessionToken,
} from "@/lib/ai/quiz";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const topic = typeof body.topic === "string" ? body.topic : "arrays";
  const language: "en" | "hi" = body.language === "hi" ? "hi" : "en";
  const weakConcepts = Array.isArray(body.weakConcepts)
    ? body.weakConcepts.map(String)
    : undefined;

  const questions = await generateQuiz(topic, language, { weakConcepts });
  const quizToken = await createQuizSessionToken(topic, language, questions);
  const publicQuestions = toPublicQuestions(questions);

  return NextResponse.json({
    questions: publicQuestions,
    quizToken,
  });
}
