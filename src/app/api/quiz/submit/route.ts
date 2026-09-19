import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  DEMO_STUDENT_ID,
  getSessionOrDemo,
  sessionCookie,
} from "@/lib/auth/session";
import { generateFeedback } from "@/lib/ai/feedback";
import { runTeachingTeam, type TeachingStyle } from "@/lib/agentcore/teaching";
import { getNextTopic, recordAssessment } from "@/lib/learning/roadmap";
import { updateTopicScore } from "@/lib/aws/dynamodb";
import type { QuizQuestion } from "@/types/quiz";

const VALID_STYLES: TeachingStyle[] = ["simple", "socratic", "visual", "interview"];

function safeStyle(value: unknown): TeachingStyle {
  return VALID_STYLES.includes(value as TeachingStyle)
    ? (value as TeachingStyle)
    : "simple";
}

function normalizeQuestions(value: unknown): QuizQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.filter((question): question is QuizQuestion => {
    if (!question || typeof question !== "object") return false;
    const q = question as QuizQuestion;
    return (
      typeof q.id === "string" &&
      typeof q.prompt === "string" &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.options.every((option) => typeof option === "string") &&
      Number.isInteger(q.answer) &&
      q.answer >= 0 &&
      q.answer < 4
    );
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSessionOrDemo(
      (await cookies()).get(sessionCookie)?.value,
    );

    const body = await request.json();
    const topicSlug = typeof body.topicSlug === "string" ? body.topicSlug : "";
    const language: "en" | "hi" = body.language === "hi" ? "hi" : "en";
    const style = safeStyle(body.style);
    const answers: number[] = Array.isArray(body.answers)
      ? body.answers.map((a: unknown) => (Number.isInteger(a) ? Number(a) : -1))
      : [];
    const questions = normalizeQuestions(body.questions);

    if (!topicSlug || !questions.length) {
      return NextResponse.json({ error: "Quiz questions are required." }, { status: 400 });
    }
    if (answers.length !== questions.length) {
      return NextResponse.json({ error: "Please answer every question." }, { status: 400 });
    }

    const correct = questions.reduce(
      (n, q, i) => n + (answers[i] === q.answer ? 1 : 0),
      0,
    );
    const total = questions.length;
    const score = Math.round((correct / total) * 100);

    const missedConcepts = questions
      .filter((q, i) => answers[i] !== q.answer && q.concept)
      .map((q) => q.concept);

    const isDemoUser = session.email === "student_001@bodh.demo";
    const studentId = isDemoUser ? DEMO_STUDENT_ID : session.email;

    const [feedback, teaching] = await Promise.all([
      generateFeedback(topicSlug, score, correct, total, language, missedConcepts),
      runTeachingTeam(
        `The learner scored ${score}% (${correct}/${total}). Missed concepts: ${
          missedConcepts.join(", ") || "none"
        }. Provide brief, kind feedback and one concrete next practice step.`,
        topicSlug,
        style,
        language,
      ),
    ]);

    try {
      await updateTopicScore({ studentId, language, topicSlug, score });
    } catch (err) {
      console.warn("[quiz/submit] updateTopicScore failed (non-fatal):", err);
    }
    let roadmap: Awaited<ReturnType<typeof recordAssessment>> | undefined;
    try {
      roadmap = await recordAssessment(
        session.email,
        topicSlug,
        score,
        teaching.recommendedStyle,
      );
    } catch (err) {
      console.warn("[quiz/submit] recordAssessment failed (non-fatal):", err);
    }

    const nextTopic = getNextTopic(topicSlug);
    const nextStrategy =
      score >= 80
        ? language === "hi"
          ? "एक नया उदाहरण आज़माएं और गति बढ़ाएं।"
          : "Build speed with one new example."
        : language === "hi"
          ? "एक छोटे उदाहरण के साथ फिर से समझें, फिर कोशिश करें।"
          : "Review with a smaller example, then try again.";

    return NextResponse.json({
      score,
      correct,
      total,
      missedConcepts,
      feedback: {
        ...feedback,
        teacher: teaching.explanation,
        followUp: teaching.followUp,
      },
      recommendedStyle: teaching.recommendedStyle,
      nextStrategy,
      nextTopic: { slug: nextTopic.slug, title: nextTopic.title },
      roadmap,
    });
  } catch (error) {
    console.error("[quiz/submit]", error);
    return NextResponse.json(
      { error: "Unable to evaluate the quiz right now." },
      { status: 500 },
    );
  }
}
