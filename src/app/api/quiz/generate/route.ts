import { NextResponse } from "next/server";
import { generateQuiz } from "@/lib/ai/quiz";
<<<<<<< HEAD
import { getTopic } from "@/config/topics";
export async function POST(request: Request) {
  const { topic = "arrays", language = "en" } = await request.json();
  if (!getTopic(topic))
    return NextResponse.json({ error: "Unknown topic." }, { status: 404 });
=======
export async function POST(request: Request) {
  const { topic = "arrays", language = "en" } = await request.json();
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a
  const questions = await generateQuiz(topic, language === "hi" ? "hi" : "en");
  return NextResponse.json(questions);
}
