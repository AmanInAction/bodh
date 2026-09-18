import { invokeBedrockText } from "@/lib/aws/bedrock";
import { PROMPTS } from "@/lib/ai/prompts";

export type TeachingStyle = "simple" | "socratic" | "visual" | "interview";

export type TeachingResult = {
  style: TeachingStyle;
  explanation: string;      // Teacher agent output
  followUp: string;         // Evaluator agent: one clarifying question
  recommendedStyle: TeachingStyle;
  nextSkill: string;
  confidence: number;       // 0-100
  provider: "bedrock" | "local";
};

// ── Local fallbacks ────────────────────────────────────────────────────────────

function localExplanation(topic: string, style: TeachingStyle, language: "en" | "hi"): string {
  const styleNote =
    style === "socratic"
      ? language === "hi" ? "सवाल पूछकर:" : "By asking:"
      : style === "visual"
        ? language === "hi" ? "चित्र से:" : "Visually:"
        : style === "interview"
          ? language === "hi" ? "इंटरव्यू में:" : "Interview-style:"
          : language === "hi" ? "सरल तरीके से:" : "Simply put:";

  return language === "hi"
    ? `${styleNote} ${topic} एक डेटा संरचना है जो जानकारी को व्यवस्थित रखती है और कुशल एक्सेस की सुविधा देती है।`
    : `${styleNote} ${topic} is a data structure that organises information for efficient access and manipulation.`;
}

function localFollowUp(topic: string, language: "en" | "hi"): string {
  return language === "hi"
    ? `${topic} का उपयोग कब करना उचित होगा और कब नहीं?`
    : `When would you choose ${topic} over an alternative, and when would you not?`;
}

// ── Main multi-agent pipeline ─────────────────────────────────────────────────

export async function runTeachingTeam(input: {
  topic: string;
  question: string;
  style?: TeachingStyle;
  language?: "en" | "hi";
}): Promise<TeachingResult> {
  const style = input.style ?? "simple";
  const language = input.language ?? "en";
  const isLocal =
    !process.env.AWS_REGION || !process.env.BEDROCK_MODEL_ID && !process.env.AWS_REGION;

  // ── Agent 1: Teacher ─────────────────────────────────────────────────────
  let explanation: string;
  try {
    explanation = await invokeBedrockText(
      PROMPTS.teacherSystem(style, language),
      `Topic: ${input.topic}\nLearner question / context: ${input.question}`,
      { maxTokens: 300, temperature: 0.5 },
    );
  } catch {
    explanation = localExplanation(input.topic, style, language);
  }

  // ── Agent 2: Evaluator ────────────────────────────────────────────────────
  let followUp: string;
  try {
    followUp = await invokeBedrockText(
      PROMPTS.evaluatorSystem(language),
      `Topic: ${input.topic}\nTeacher explanation:\n${explanation}`,
      { maxTokens: 150, temperature: 0.3 },
    );
  } catch {
    followUp = localFollowUp(input.topic, language);
  }

  // ── Agent 3: Assessor ─────────────────────────────────────────────────────
  let recommendedStyle: TeachingStyle = "simple";
  let nextSkill = input.topic;
  let confidence = 60;

  try {
    const raw = await invokeBedrockText(
      PROMPTS.assessorSystem(language),
      `Topic: ${input.topic}\nTeacher:\n${explanation}\nEvaluator:\n${followUp}`,
      { maxTokens: 200, temperature: 0.2 },
    );
    const jsonStr = raw.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr) as {
      recommendedStyle: TeachingStyle;
      nextSkill: string;
      confidence: number;
    };
    if (parsed.recommendedStyle) recommendedStyle = parsed.recommendedStyle;
    if (parsed.nextSkill) nextSkill = parsed.nextSkill;
    if (typeof parsed.confidence === "number") confidence = parsed.confidence;
  } catch {
    // Use defaults above
  }

  return {
    style,
    explanation,
    followUp,
    recommendedStyle,
    nextSkill,
    confidence,
    provider: isLocal ? "local" : "bedrock",
  };
}
