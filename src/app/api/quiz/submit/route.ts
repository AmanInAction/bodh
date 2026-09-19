import { NextResponse } from "next/server";
<<<<<<< HEAD
=======
import { generateQuiz } from "@/lib/ai/quiz";
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a
import { generateFeedback } from "@/lib/ai/feedback";
import { runTeachingTeam, type TeachingStyle } from "@/lib/agentcore/teaching";
import { getNextTopic, recordAssessment } from "@/lib/learning/roadmap";
import { cookies } from "next/headers";
import { readSession, sessionCookie } from "@/lib/auth/session";
<<<<<<< HEAD
import { getTopic } from "@/config/topics";
=======
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a

export async function POST(request: Request) {
  const session = await readSession(
    (await cookies()).get(sessionCookie)?.value,
  );
  if (!session)
    return NextResponse.json(
      { error: "Sign in to save your result." },
      { status: 401 },
    );

  const {
    topicSlug = "arrays",
    answers = [],
    language = "en",
    style = "simple",
<<<<<<< HEAD
    questions = [],
  } = await request.json();

  if (
    !Array.isArray(questions) ||
    questions.length === 0 ||
    questions.length > 20
  ) {
    return NextResponse.json(
      { error: "Quiz questions are missing or invalid." },
      { status: 400 },
    );
  }
  if (
    !Array.isArray(answers) ||
    answers.length !== questions.length ||
    questions.some(
      (question) => !question || typeof question.answer !== "number",
    )
  ) {
    return NextResponse.json(
      { error: "Please answer every question." },
      { status: 400 },
    );
  }

  const lang: "en" | "hi" = language === "hi" ? "hi" : "en";
  if (typeof topicSlug !== "string" || !getTopic(topicSlug)) {
    return NextResponse.json({ error: "Unknown topic." }, { status: 404 });
  }
  const safeStyle = (
    ["simple", "socratic", "visual", "interview"].includes(style)
      ? style
      : "simple"
  ) as TeachingStyle;

=======
  } = await request.json();

  const lang: "en" | "hi" = language === "hi" ? "hi" : "en";
  const safeStyle = (["simple", "socratic", "visual", "interview"].includes(style)
    ? style
    : "simple") as TeachingStyle;

  // Regenerate questions server-side to score answers
  const questions = await generateQuiz(topicSlug, lang);
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a
  const correct = answers.filter(
    (ans: number, i: number) => ans === questions[i]?.answer,
  ).length;
  const total = questions.length;
  const score = Math.round((correct / total) * 100);

  // Run AI feedback (parallel with teaching team)
  const [feedback, team] = await Promise.all([
    generateFeedback(topicSlug, score, correct, total, lang),
    runTeachingTeam({
      topic: topicSlug,
      question: `The learner scored ${score}% (${correct}/${total}). Provide brief, kind feedback and one concrete next practice step.`,
      style: safeStyle,
      language: lang,
    }),
  ]);

  // Persist to DynamoDB (roadmap updated with score + style)
  await recordAssessment(session.email, topicSlug, score, safeStyle);

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
