import { NextResponse } from "next/server";
import { getLessonContent } from "@/lib/learning/content";
import { getTopic } from "@/config/topics";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("topic") ?? "arrays";
  if (!getTopic(slug))
    return NextResponse.json({ error: "Unknown topic." }, { status: 404 });
  const language = url.searchParams.get("language") === "hi" ? "hi" : "en";
  const article = await getLessonContent(slug, language);
  return NextResponse.json(article);
}
