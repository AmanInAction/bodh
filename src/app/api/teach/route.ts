import { NextResponse } from "next/server";
import {
  runTeachingTeam,
  type TeachingStyle,
} from "@/lib/agentcore/teaching";

const VALID_STYLES: TeachingStyle[] = [
  "simple",
  "socratic",
  "visual",
  "interview",
];

function safeStyle(value: unknown): TeachingStyle {
  return VALID_STYLES.includes(value as TeachingStyle)
    ? (value as TeachingStyle)
    : "simple";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const topic =
      typeof body.topic === "string" ? body.topic.trim() : "";

    const question =
      typeof body.question === "string" ? body.question.trim() : "";

    const language = body.language === "hi" ? "hi" : "en";
    const style = safeStyle(body.style);

    if (!topic || !question) {
      return NextResponse.json(
        { error: "Topic and question are required." },
        { status: 400 },
      );
    }

    const result = await runTeachingTeam(
      question,
      topic,
      style,
      language,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[teach]", error);

    return NextResponse.json(
      { error: "Unable to generate teaching response right now." },
      { status: 500 },
    );
  }
}
