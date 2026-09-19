import { NextResponse } from "next/server";
import { generateFeedback } from "@/lib/ai/feedback";
import { runTeachingTeam, type TeachingStyle } from "@/lib/agentcore/teaching";
import { getNextTopic, recordAssessment } from "@/lib/learning/roadmap";
import { updateTopicScore } from "@/lib/aws/dynamodb";
import { cookies } from "next/headers";
import { getSessionOrDemo, sessionCookie, DEMO_STUDENT_ID } from "@/lib/auth/session";
import type { QuizQuestion } from "@/types/quiz";

export async function POST(request: Request) {
  const session = await getSessionOrDemo(
    (await cookies()).get(sessionCookie)?.value,
  );

  const {
    topicSlug = "arrays",
    answers = [],
    language = "en",
    style = "simple",
    // The client sends the original questions it received so scoring is deterministic
    questions: clientQuestions = [],
  } = await request.json();

  const lang: "en" | "hi" = language === "hi" ? "hi" : "en";
  const safeStyle = (["simple", "socratic", "visual", "interview"].includes(style)
    ? style
    : "simple") as TeachingStyle;

  // ── Score answers against the questions the student actually saw ──────────
  const questions: QuizQuestion[] = clientQuestions;
  const correct = answers.filter(
    (ans: number, i: number) => ans === questions[i]?.answer,
  ).length;
  const total = questions.length || 5;
  const score = Math.round((correct / (total || 1)) * 100);

  // ── Extract missed concepts from wrong answers ─────────────────────────────
  const missedConcepts: string[] = answers
    .map((ans: number, i: number) => {
      if (ans !== questions[i]?.answer && questions[i]?.concept) {
        return questions[i].concept;
      }
      return null;
    })
    .filter(Boolean) as string[];

  // ── Determine studentId (email prefix or demo) ────────────────────────────
  const isDemoUser = session.email === "student_001@bodh.demo";
  const studentId = isDemoUser ? DEMO_STUDENT_ID : session.email;

  // ── Run AI feedback + teaching team in parallel ───────────────────────────
  const [feedback, team] = await Promise.all([
    generateFeedback(topicSlug, score, correct, total, lang, missedConcepts),
    runTeachingTeam({
      topic: topicSlug,
      question: `The learner scored ${score}% (${correct}/${total}). Missed concepts: ${missedConcepts.join(", ") || "none"}. Provide brief, kind feedback and one concrete next practice step.`,
      style: safeStyle,
      language: lang,
    }),
  ]);

  // ── Persist to DynamoDB (StudentRecord schema) ────────────────────────────
  // Wrapped in try/catch — a DynamoDB failure must never kill the quiz result.
  try {
    await updateTopicScore({
      studentId,
      language: lang,
      topicSlug,
      score,
    });
  } catch (dbErr) {
    console.warn("[quiz/submit] updateTopicScore failed (non-fatal):", dbErr);
  }

  // ── Also persist to roadmap (for recommendations / dashboard) ─────────────
  try {
    await recordAssessment(session.email, topicSlug, score, safeStyle);
  } catch (roadmapErr) {
    console.warn("[quiz/submit] recordAssessment failed (non-fatal):", roadmapErr);
  }

  const nextTopic = getNextTopic(topicSlug);
  const nextStrategy =
    score >= 80
      ? lang === "hi"
        ? "एक नया उदाहरण आज़माएं और गति बढ़ाएं।"
        : "Build speed with one new example."
      : lang === "hi"
        ? "एक छोटे उदाहरण के साथ फिर से समझें, फिर कोशिश करें।"
        : "Review with a smaller example, then try again.";

  return NextResponse.json({
    score,
    correct,
    total,
    missedConcepts,
    feedback: {
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      nextStep: feedback.nextStep,
      confidence: feedback.confidence,
      teacher: team.explanation,
      followUp: team.followUp,
    },
    recommendedStyle: team.recommendedStyle,
    nextStrategy,
    nextTopic: { slug: nextTopic.slug, title: nextTopic.title },
  });
}
