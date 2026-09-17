import { NextResponse } from "next/server";
import { analyzeQuiz } from "@/lib/ai/analysis";
export async function POST(request: Request) {
  const { answers = [] } = await request.json();
  return NextResponse.json(analyzeQuiz(answers, [0]));
}
