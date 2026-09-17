import { NextResponse } from "next/server";
import { generateQuiz } from "@/lib/ai/quiz";
export async function POST(request: Request) {
  const { topic = "arrays" } = await request.json();
  return NextResponse.json(generateQuiz(topic));
}
