import { NextResponse } from "next/server";
import { getLessonContent, getOrGenerateMindmap } from "@/lib/learning/content";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic") ?? "arrays";
  const language = searchParams.get("language") === "hi" ? "hi" : "en";

  const [article, mindmap] = await Promise.all([
    getLessonContent(topic, language),
    getOrGenerateMindmap(topic, language),
  ]);

  return NextResponse.json({ article, mindmap });
}
