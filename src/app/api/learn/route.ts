import { NextResponse } from "next/server";
import { getLessonContent } from "@/lib/learning/content";
<<<<<<< HEAD
import { getTopic } from "@/config/topics";
=======
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("topic") ?? "arrays";
<<<<<<< HEAD
  if (!getTopic(slug))
    return NextResponse.json({ error: "Unknown topic." }, { status: 404 });
=======
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a
  const language = url.searchParams.get("language") === "hi" ? "hi" : "en";
  const article = await getLessonContent(slug, language);
  return NextResponse.json(article);
}
