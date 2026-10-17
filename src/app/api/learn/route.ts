import { NextResponse } from "next/server";
import { getLessonContent } from "@/lib/learning/content";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic") ?? "arrays";
  const language = searchParams.get("language") === "hi" ? "hi" : "en";

  const article = await getLessonContent(topic, language);

  return NextResponse.json({ article });
}
