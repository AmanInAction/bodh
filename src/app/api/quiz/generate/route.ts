import { NextResponse } from "next/server";
import { generateQuiz } from "@/lib/ai/quiz";
import { getTopic } from "@/config/topics";
export async function POST(request: Request) {
  const { topic = "arrays", language = "en" } = await request.json();
  if (!getTopic(topic))
    return NextResponse.json({ error: "Unknown topic." }, { status: 404 });
  const questions = await generateQuiz(topic, language === "hi" ? "hi" : "en");
  return NextResponse.json(questions);
}
