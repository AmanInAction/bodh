import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSession, sessionCookie } from "@/lib/auth/session";
import { getRoadmap } from "@/lib/learning/roadmap";
import { getAIRecommendations } from "@/lib/learning/recommendation";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = await readSession(
    cookieStore.get(sessionCookie)?.value,
  );

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const language = url.searchParams.get("language") === "hi" ? "hi" : "en";

  const roadmap = await getRoadmap(session.email);
  const recommendations = await getAIRecommendations(roadmap, language);

  return NextResponse.json({
    recommendations,
    roadmap,
  });
}
