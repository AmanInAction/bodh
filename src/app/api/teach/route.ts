import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSession, sessionCookie } from "@/lib/auth/session";
import { runTeachingTeam, type TeachingStyle } from "@/lib/agentcore/teaching";

const styles = new Set<TeachingStyle>([
  "simple",
  "socratic",
  "visual",
  "interview",
]);

export async function POST(request: Request) {
  const session = await readSession(
    (await cookies()).get(sessionCookie)?.value,
  );
  if (!session)
    return NextResponse.json(
      { error: "Sign in to start a teaching session." },
      { status: 401 },
    );
  const body = (await request.json()) as {
    topic?: string;
    question?: string;
    style?: TeachingStyle;
    language?: string;
  };
  if (!body.topic || !body.question)
    return NextResponse.json(
      { error: "topic and question are required." },
      { status: 400 },
    );
  const style = body.style && styles.has(body.style) ? body.style : "simple";
  const language = body.language === "hi" ? "hi" : "en";
  return NextResponse.json(
    await runTeachingTeam({
      topic: body.topic,
      question: body.question,
      style,
      language,
    }),
  );
}
