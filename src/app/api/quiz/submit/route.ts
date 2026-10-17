import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  DEMO_STUDENT_ID,
  getSessionOrDemo,
  sessionCookie,
} from "@/lib/auth/session";
import { generateFeedback } from "@/lib/ai/feedback";
import {
  generateTargetedRetestQuestion,
  gradeQuizSubmission,
  resolveAuthoritativeQuestions,
  toPublicQuestions,
  createQuizSessionToken,
} from "@/lib/ai/quiz";
import { runTeachingTeam, type TeachingStyle } from "@/lib/agentcore/teaching";
import { getNextTopic, recordAssessment } from "@/lib/learning/roadmap";
import { getStudentRecord, updateTopicScore } from "@/lib/aws/dynamodb";
import { getTopicTitle } from "@/lib/i18n";

const VALID_STYLES: TeachingStyle[] = [
  "simple",
  "socratic",
  "visual",
  "interview",
];

function safeStyle(value: unknown, fallback: TeachingStyle = "simple"): TeachingStyle {
  return VALID_STYLES.includes(value as TeachingStyle)
    ? (value as TeachingStyle)
    : fallback;
}

export async function POST(request: Request) {
  try {
    const session = await getSessionOrDemo(
      (await cookies()).get(sessionCookie)?.value,
    );

    const body = await request.json();
    const topicSlug = typeof body.topicSlug === "string" ? body.topicSlug : "";
    const language: "en" | "hi" = body.language === "hi" ? "hi" : "en";
    const isRetest = Boolean(body.isRetest);
    const quizToken =
      typeof body.quizToken === "string" ? body.quizToken : undefined;

    const answers: number[] = Array.isArray(body.answers)
      ? body.answers.map((a: unknown) =>
          Number.isInteger(a) ? Number(a) : -1,
        )
      : [];

    if (!topicSlug) {
      return NextResponse.json(
        { error: "Topic slug is required." },
        { status: 400 },
      );
    }

    // 1. Agent 1: Resolve authoritative questions & grade on the server
    const authoritativeQuestions = await resolveAuthoritativeQuestions(
      topicSlug,
      language,
      quizToken,
      body.questions,
    );

    if (!authoritativeQuestions.length) {
      return NextResponse.json(
        { error: "Quiz questions are required." },
        { status: 400 },
      );
    }
    if (answers.length !== authoritativeQuestions.length) {
      return NextResponse.json(
        { error: "Please answer every question." },
        { status: 400 },
      );
    }

    const grading = gradeQuizSubmission(authoritativeQuestions, answers);
    const {
      score,
      correct,
      total,
      missedConcepts,
      masteredConcepts,
      gradedQuestions,
    } = grading;

    const isDemoUser = session.email === "student_001@bodh.demo";
    const studentId = isDemoUser ? DEMO_STUDENT_ID : session.email;

    const existingRecord = await getStudentRecord(studentId);
    const existingTopicPerf = existingRecord?.topics?.[topicSlug];
    const style = safeStyle(
      body.style,
      existingRecord?.preferredStyle ?? "simple",
    );

    // Build prerequisite score map for Agent 2
    const prerequisiteScores: Record<string, number> = {};
    if (existingRecord?.topics) {
      for (const [k, v] of Object.entries(existingRecord.topics)) {
        prerequisiteScores[k] = v.score;
      }
    }

    // 2. Agent 2: Evidence-based Assessment
    const assessment = await generateFeedback(
      topicSlug,
      score,
      correct,
      total,
      language,
      missedConcepts,
      {
        masteredConcepts,
        previousAttempts: existingTopicPerf?.attempts ?? 0,
        previousConceptHistory: existingTopicPerf?.conceptHistory,
        prerequisiteScores,
        currentStyle: style,
        goal: existingRecord?.goal,
        isRetest,
      },
    );

    // 3. Agent 3: Explain Differently (only triggered in detail when understanding is insufficient < 80% or concepts were missed)
    const needsExplanation = score < 80 || missedConcepts.length > 0;
    let teaching: Awaited<ReturnType<typeof runTeachingTeam>>;
    let followUpQuestion:
      | {
          question: ReturnType<typeof toPublicQuestions>[number];
          quizToken: string;
        }
      | undefined;

    if (needsExplanation) {
      const targetStyle = assessment.recommendedStyle || style;
      teaching = await runTeachingTeam(
        `The learner scored ${score}% (${correct}/${total}) on ${topicSlug}. Missed concepts: ${
          missedConcepts.join(", ") || "core operation"
        }. Explain the missed concept clearly so the student can solve a follow-up check.`,
        topicSlug,
        targetStyle,
        language,
        {
          weakConcepts: missedConcepts,
          assessment,
          goal: existingRecord?.goal,
          score,
        },
      );

      // Prepare a targeted 1-question re-test for the primary weak concept
      const primaryWeakConcept =
        missedConcepts[0] ?? assessment.weakConcepts[0] ?? "core concept";
      const retestQ = await generateTargetedRetestQuestion(
        topicSlug,
        primaryWeakConcept,
        language,
        teaching.explanation,
        authoritativeQuestions.map((q) => q.id),
      );
      const retestToken = await createQuizSessionToken(topicSlug, language, [
        retestQ,
      ]);
      followUpQuestion = {
        question: toPublicQuestions([retestQ])[0],
        quizToken: retestToken,
      };
    } else {
      // High mastery fast-path: concise celebration without unnecessary LLM calls
      teaching = {
        provider: "local",
        explanation:
          language === "hi"
            ? `शानदार काम! आपने ${getTopicTitle(topicSlug, "hi")} के सभी मुख्य बिंदुओं पर मजबूत समझ दिखाई है। आप अगले विषय पर आगे बढ़ने के लिए तैयार हैं।`
            : `Excellent work! You demonstrated strong understanding across the tested concepts in ${getTopicTitle(topicSlug, "en")}. You are ready to advance.`,
        followUp: "",
        recommendedStyle: assessment.recommendedStyle,
        confidence: score,
      };
    }

    // If this is a 1-question targeted re-test after Explain Differently, merge score carefully:
    // A successful re-test boosts topic score modestly (+10 up to 85) if previous score was lower,
    // without pretending a 1-question check equals a full 5-question 100% exam.
    const previousBest = existingTopicPerf?.score ?? 0;
    const effectiveScore = isRetest
      ? score === 100
        ? Math.max(previousBest, Math.min(85, (existingTopicPerf?.lastScore ?? 50) + 20))
        : Math.max(previousBest, existingTopicPerf?.lastScore ?? score)
      : score;

    let updatedRecord = null;
    try {
      updatedRecord = await updateTopicScore({
        studentId,
        language,
        topicSlug,
        score: effectiveScore,
        teachingStyle: teaching.recommendedStyle,
        missedConcepts,
        masteredConcepts,
        assessment,
      });
    } catch (err) {
      console.error("[quiz/submit] updateTopicScore failed:", err);
    }

    let roadmap: Awaited<ReturnType<typeof recordAssessment>> | undefined;
    try {
      roadmap = await recordAssessment(
        session.email,
        topicSlug,
        effectiveScore,
        teaching.recommendedStyle,
      );
    } catch (err) {
      console.error("[quiz/submit] recordAssessment failed:", err);
    }

    // 4. Determine recommended next topic (or prerequisite if Agent 2 flagged one)
    const nextTopicSlug =
      assessment.recommendedAction === "review_prerequisite" &&
      assessment.prerequisiteTopicSlug
        ? assessment.prerequisiteTopicSlug
        : getNextTopic(topicSlug).slug;

    const nextStrategy =
      score >= 80
        ? language === "hi"
          ? "आपकी समझ पक्की है — अगले विषय पर आगे बढ़ें।"
          : "Understanding verified — continue to the next topic."
        : language === "hi"
          ? "नीचे दी गई लक्षित व्याख्या पढ़ें और त्वरित जाँच प्रश्न से अपनी समझ परखें।"
          : "Read the targeted explanation below, then answer the quick follow-up check to verify your understanding.";

    return NextResponse.json({
      score,
      effectiveScore,
      correct,
      total,
      isRetest,
      missedConcepts,
      masteredConcepts,
      gradedQuestions,
      assessment,
      feedback: {
        ...assessment,
        teacher: teaching.explanation,
        followUp: teaching.followUp,
      },
      recommendedStyle: teaching.recommendedStyle,
      followUpQuestion,
      nextStrategy,
      nextTopic: {
        slug: nextTopicSlug,
        title: getTopicTitle(nextTopicSlug, language),
      },
      roadmap,
      weakTopics: updatedRecord?.weakTopics ?? [],
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Authentication required")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[quiz/submit]", error);
    return NextResponse.json(
      { error: "Unable to evaluate the quiz right now." },
      { status: 500 },
    );
  }
}
