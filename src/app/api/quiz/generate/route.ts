import { NextResponse } from "next/server";
import { generateQuiz } from "@/lib/ai/quiz";
export async function POST(request: Request) {
  const { topic = "arrays", language = "en" } = await request.json();
  const questions = await generateQuiz(topic, language === "hi" ? "hi" : "en");
  return NextResponse.json(questions);
}
