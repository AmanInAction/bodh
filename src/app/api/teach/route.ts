import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  runTeachingTeam,
  type TeachingStyle,
} from "@/lib/agentcore/teaching";
import {
  generateTargetedRetestQuestion,
  toPublicQuestions,
  createQuizSessionToken,
} from "@/lib/ai/quiz";
import {
  DEMO_STUDENT_ID,
  getSessionOrDemo,
  sessionCookie,
} from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/aws/dynamodb";

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

    const topicSlug =
      typeof body.topicSlug === "string" && body.topicSlug.trim()
        ? body.topicSlug.trim()
        : topic.toLowerCase().replace(/\s+/g, "-");

    const question =
      typeof body.question === "string" ? body.question.trim() : "";

    const language: "en" | "hi" = body.language === "hi" ? "hi" : "en";
    const style = safeStyle(body.style);
    const weakConcepts: string[] = Array.isArray(body.weakConcepts)
      ? body.weakConcepts.map(String)
      : typeof body.weakConcept === "string" && body.weakConcept.trim()
        ? [body.weakConcept.trim()]
        : [];

    if (!topic || !question) {
      return NextResponse.json(
        { error: "Topic and question are required." },
        { status: 400 },
      );
    }

    // Load student context if available to personalize explanation
    let studentRecord = null;
    try {
      const session = await getSessionOrDemo(
        (await cookies()).get(sessionCookie)?.value,
      );
      const studentId =
        session.email === "student_001@bodh.demo"
          ? DEMO_STUDENT_ID
          : session.email;
      studentRecord = await getStudentRecord(studentId);
    } catch {
      /* optional context */
    }

    const topicPerf = studentRecord?.topics?.[topicSlug];
    const effectiveWeakConcepts =
      weakConcepts.length > 0
        ? weakConcepts
        : topicPerf?.weakConcepts ?? topicPerf?.missedConcepts ?? [];

    const result = await runTeachingTeam(
      question,
      topic,
      style,
      language,
      {
        weakConcepts: effectiveWeakConcepts,
        assessment: topicPerf?.lastAssessment,
        goal: studentRecord?.goal,
        score: topicPerf?.lastScore ?? topicPerf?.score,
      },
    );

    // Also provide a fresh targeted check question so the learner can verify understanding right after reading the explanation
    const targetConcept =
      effectiveWeakConcepts[0] ?? result.targetedConcept ?? "core concept";
    const retestQ = await generateTargetedRetestQuestion(
      topicSlug,
      targetConcept,
      language,
      result.explanation,
    );
    const quizToken = await createQuizSessionToken(topicSlug, language, [
      retestQ,
    ]);

    return NextResponse.json({
      ...result,
      followUpQuestion: {
        question: toPublicQuestions([retestQ])[0],
        quizToken,
      },
    });
  } catch (error) {
    console.error("[teach]", error);

    return NextResponse.json(
      { error: "Unable to generate teaching response right now." },
      { status: 500 },
    );
  }
}
