import { NextResponse } from "next/server";
import { getLessonContent } from "@/lib/learning/content";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("topic") ?? "arrays";
  const language = url.searchParams.get("language") === "hi" ? "hi" : "en";
  const article = await getLessonContent(slug, language);
  return NextResponse.json(article);
}
