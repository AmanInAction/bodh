import { invokeBedrockJSON } from "@/lib/aws/bedrock";
import { PROMPTS } from "@/lib/ai/prompts";
import { getTopicPrerequisites } from "@/lib/learning/content";
import type {
  ConceptEvidence,
  LearningGoal,
  StructuredAssessment,
  TeachingStyle,
} from "@/types/student-record";

export type QuizFeedback = {
  strengths: string[];
  weaknesses: string[];
  weakConcepts: string[];
  misconceptions: string[];
  recommendedAction: "advance" | "practice" | "explain_differently" | "review_prerequisite";
  recommendedStyle: TeachingStyle;
  prerequisiteTopicSlug?: string;
  masteryEvidence: {
    score: number;
    correct: number;
    total: number;
    isRetest?: boolean;
    improvedConcepts?: string[];
  };
  nextStep: string;
  reasoningSummary: string;
  confidence: number;
};

const VALID_ACTIONS = [
  "advance",
  "practice",
  "explain_differently",
  "review_prerequisite",
] as const;

const VALID_STYLES: TeachingStyle[] = [
  "simple",
  "socratic",
  "visual",
  "interview",
];

/**
 * Selects the most appropriate teaching style based on assessment evidence,
 * weak concepts, and the learner's goal/current style (never a blind rotation).
 */
export function selectEvidenceBasedStyle(
  score: number,
  weakConcepts: string[],
  currentStyle?: TeachingStyle,
  goal?: LearningGoal,
): TeachingStyle {
  const joinedWeak = weakConcepts.join(" ").toLowerCase();

  // Spatial/pointer/boundary concepts benefit strongly from visual traces
  if (
    joinedWeak.includes("pointer") ||
    joinedWeak.includes("index") ||
    joinedWeak.includes("boundary") ||
    joinedWeak.includes("mid") ||
    joinedWeak.includes("stack") ||
    joinedWeak.includes("wrap")
  ) {
    if (currentStyle !== "visual") return "visual";
    return "simple";
  }

  // Complexity or trade-off concepts benefit from interview or socratic reasoning
  if (
    joinedWeak.includes("complexity") ||
    joinedWeak.includes("trade-off") ||
    joinedWeak.includes("logarithmic")
  ) {
    if (score >= 60 && currentStyle !== "interview") return "interview";
    if (currentStyle !== "socratic") return "socratic";
  }

  if (score < 50) {
    return currentStyle === "simple" ? "visual" : "simple";
  }

  if (score < 80) {
    if (currentStyle === "visual") return "socratic";
    return "visual";
  }

  // High mastery (score >= 80): challenge with interview or socratic
  if (goal === "interview" || currentStyle !== "interview") {
    return "interview";
  }
  return "socratic";
}

/**
 * Builds deterministic, evidence-based assessment when AI is unavailable or as baseline.
 * Never fabricates misconceptions unless recurring evidence across attempts exists.
 */
export function buildDeterministicAssessment(params: {
  topic: string;
  score: number;
  correct: number;
  total: number;
  language: "en" | "hi";
  missedConcepts?: string[];
  masteredConcepts?: string[];
  previousConceptHistory?: Record<string, ConceptEvidence>;
  prerequisiteScores?: Record<string, number>;
  currentStyle?: TeachingStyle;
  goal?: LearningGoal;
  isRetest?: boolean;
}): QuizFeedback {
  const {
    topic,
    score,
    correct,
    total,
    language,
    missedConcepts = [],
    masteredConcepts = [],
    previousConceptHistory = {},
    prerequisiteScores = {},
    currentStyle,
    goal,
    isRetest,
  } = params;

  const isHindi = language === "hi";

  // Identify recurring misconceptions ONLY when a concept was missed in prior attempts AND missed again
  const recurringConcepts = missedConcepts.filter(
    (c) => (previousConceptHistory[c]?.incorrectCount ?? 0) >= 1,
  );

  // Identify improved concepts (previously missed, now answered accurately)
  const improvedConcepts = masteredConcepts.filter(
    (c) => (previousConceptHistory[c]?.incorrectCount ?? 0) >= 1,
  );

  const misconceptions: string[] = recurringConcepts.map((c) =>
    isHindi
      ? `"${c}" में बार-बार त्रुटि दिख रही है — इसे एक छोटे उदाहरण से कदम-दर-कदम ट्रेस करें।`
      : `Recurring difficulty observed with "${c}" across attempts — trace a concrete 4-element example step by step.`,
  );

  // Check if a prerequisite topic is weak (< 50) when the learner struggles (< 50)
  const prerequisites = getTopicPrerequisites(topic);
  const weakPrerequisite =
    score < 50
      ? prerequisites.find(
          (prereq) =>
            prerequisiteScores[prereq] !== undefined &&
            prerequisiteScores[prereq] > 0 &&
            prerequisiteScores[prereq] < 50,
        )
      : undefined;

  let recommendedAction: QuizFeedback["recommendedAction"];
  if (score >= 80) {
    recommendedAction = "advance";
  } else if (weakPrerequisite) {
    recommendedAction = "review_prerequisite";
  } else if (score < 60 || missedConcepts.length > 0) {
    recommendedAction = "explain_differently";
  } else {
    recommendedAction = "practice";
  }

  const recommendedStyle = selectEvidenceBasedStyle(
    score,
    missedConcepts,
    currentStyle,
    goal,
  );

  const strengths =
    masteredConcepts.length > 0
      ? masteredConcepts.map((c) =>
          isHindi ? `${c} की स्पष्ट समझ` : `Solid grasp of ${c}`,
        )
      : score >= 60
        ? isHindi
          ? ["अवधारणा पर अच्छी पकड़", "सटीक तर्क"]
          : ["Good conceptual grasp", "Consistent reasoning"]
        : isHindi
          ? ["सभी प्रश्नों का प्रयास किया"]
          : ["Completed the check to identify focus areas"];

  const weakConcepts =
    missedConcepts.length > 0
      ? missedConcepts
      : score < 60
        ? [isHindi ? "मूल संचालन और स्थिति ट्रेसिंग" : "core operation trace"]
        : [];

  const nextStep =
    score >= 80
      ? isHindi
        ? "आपकी समझ मजबूत है — अगले विषय पर आगे बढ़ें या इंटरव्यू शैली का अभ्यास करें।"
        : "You've demonstrated strong understanding — advance to the next topic or try an interview challenge."
      : score >= 60
        ? isHindi
          ? `नीचे दी गई लक्षित व्याख्या पढ़ें और "${weakConcepts[0] ?? topic}" पर एक त्वरित जाँच प्रश्न हल करें।`
          : `Review the targeted explanation below and answer the quick follow-up check on "${weakConcepts[0] ?? topic}".`
        : isHindi
          ? `पहले "${weakConcepts[0] ?? topic}" को सरल या विज़ुअल तरीके से समझें, फिर फॉलो-अप प्रश्न से अपनी समझ पक्की करें।`
          : `Use the targeted explanation below to clarify "${weakConcepts[0] ?? topic}", then try the follow-up check question.`;

  const reasoningSummary = isHindi
    ? `${total} में से ${correct} सही उत्तर (${score}%)। ${
        improvedConcepts.length > 0
          ? `सुधार हुआ: ${improvedConcepts.join(", ")}। `
          : ""
      }${
        weakConcepts.length > 0
          ? `ध्यान देने योग्य बिंदु: ${weakConcepts.join(", ")}।`
          : "सभी मुख्य अवधारणाएं स्पष्ट हैं।"
      }`
    : `Answered ${correct} of ${total} correctly (${score}%). ${
        improvedConcepts.length > 0
          ? `Improved on: ${improvedConcepts.join(", ")}. `
          : ""
      }${
        weakConcepts.length > 0
          ? `Focus needed on: ${weakConcepts.join(", ")}.`
          : "All tested concepts demonstrated accurately."
      }`;

  return {
    strengths,
    weaknesses: weakConcepts,
    weakConcepts,
    misconceptions,
    recommendedAction,
    recommendedStyle,
    prerequisiteTopicSlug: weakPrerequisite,
    masteryEvidence: {
      score,
      correct,
      total,
      isRetest,
      improvedConcepts: improvedConcepts.length > 0 ? improvedConcepts : undefined,
    },
    nextStep,
    reasoningSummary,
    // Never let AI confidence override authoritative quiz score accuracy
    confidence: score,
  };
}

// ── Agent 2: Assessment Generator ─────────────────────────────────────────────

export async function generateFeedback(
  topic: string,
  score: number,
  correct: number,
  total: number,
  language: "en" | "hi",
  missedConcepts?: string[],
  extraContext?: {
    masteredConcepts?: string[];
    previousAttempts?: number;
    previousConceptHistory?: Record<string, ConceptEvidence>;
    prerequisiteScores?: Record<string, number>;
    currentStyle?: TeachingStyle;
    goal?: LearningGoal;
    isRetest?: boolean;
  },
): Promise<QuizFeedback> {
  const baseline = buildDeterministicAssessment({
    topic,
    score,
    correct,
    total,
    language,
    missedConcepts,
    masteredConcepts: extraContext?.masteredConcepts,
    previousConceptHistory: extraContext?.previousConceptHistory,
    prerequisiteScores: extraContext?.prerequisiteScores,
    currentStyle: extraContext?.currentStyle,
    goal: extraContext?.goal,
    isRetest: extraContext?.isRetest,
  });

  // Fast-path when student aced the quiz or is retesting a single concept
  if (score === 100 || extraContext?.isRetest) {
    return baseline;
  }

  try {
    const recurringWeakConcepts = (missedConcepts ?? []).filter(
      (c) => (extraContext?.previousConceptHistory?.[c]?.incorrectCount ?? 0) >= 1,
    );

    const aiAssessment = await invokeBedrockJSON<Partial<StructuredAssessment>>(
      PROMPTS.feedbackSystem(language),
      PROMPTS.feedbackUser(topic, score, correct, total, language, missedConcepts, {
        masteredConcepts: extraContext?.masteredConcepts,
        previousAttempts: extraContext?.previousAttempts,
        recurringWeakConcepts,
      }),
      (parsed) => {
        if (!parsed || typeof parsed !== "object") return null;
        return parsed as Partial<StructuredAssessment>;
      },
      { task: "assessment", maxTokens: 450, temperature: 0.3 },
    );

    if (aiAssessment) {
      const strengths =
        Array.isArray(aiAssessment.strengths) && aiAssessment.strengths.length > 0
          ? aiAssessment.strengths.map(String)
          : baseline.strengths;

      const weakConcepts =
        missedConcepts && missedConcepts.length > 0
          ? missedConcepts
          : Array.isArray(aiAssessment.weakConcepts)
            ? aiAssessment.weakConcepts.map(String)
            : baseline.weakConcepts;

      // Guardrail: Do not fabricate misconceptions if the student scored 100% or had no missed concepts
      const misconceptions =
        weakConcepts.length === 0
          ? []
          : recurringWeakConcepts.length > 0 &&
              Array.isArray(aiAssessment.misconceptions) &&
              aiAssessment.misconceptions.length > 0
            ? aiAssessment.misconceptions.map(String)
            : baseline.misconceptions;

      const recommendedAction = VALID_ACTIONS.includes(
        aiAssessment.recommendedAction as typeof VALID_ACTIONS[number],
      )
        ? (aiAssessment.recommendedAction as QuizFeedback["recommendedAction"])
        : baseline.recommendedAction;

      const recommendedStyle = VALID_STYLES.includes(
        aiAssessment.recommendedStyle as TeachingStyle,
      )
        ? (aiAssessment.recommendedStyle as TeachingStyle)
        : baseline.recommendedStyle;

      return {
        strengths,
        weaknesses: weakConcepts,
        weakConcepts,
        misconceptions,
        recommendedAction: score >= 80 ? "advance" : recommendedAction,
        recommendedStyle,
        prerequisiteTopicSlug: baseline.prerequisiteTopicSlug,
        masteryEvidence: baseline.masteryEvidence,
        nextStep:
          typeof aiAssessment.nextStep === "string" && aiAssessment.nextStep.trim()
            ? aiAssessment.nextStep.trim()
            : baseline.nextStep,
        reasoningSummary:
          typeof aiAssessment.reasoningSummary === "string" &&
          aiAssessment.reasoningSummary.trim()
            ? aiAssessment.reasoningSummary.trim()
            : baseline.reasoningSummary,
        // Authoritative grading score governs mastery confidence
        confidence: score,
      };
    }
  } catch (error) {
    console.warn("[assessment] AI assessment fallback to deterministic evidence:", error);
  }

  return baseline;
}
