import { invokeBedrockText } from "@/lib/aws/bedrock";
import { PROMPTS } from "@/lib/ai/prompts";

export type TeachingStyle =
  | "simple"
  | "socratic"
  | "visual"
  | "interview";

export type TeachingResult = {
  provider: "agentcore" | "bedrock" | "local";
  explanation: string;
  followUp: string;
  recommendedStyle: TeachingStyle;
  confidence: number;
};

const LOCAL_EXPLANATIONS: Record<TeachingStyle, string> = {
  simple:
    "Let's break the concept into one small idea at a time, then connect it to a simple example.",
  socratic:
    "Think about what the data structure needs to do first. What operation should be fastest, and why?",
  visual:
    "Imagine the data as a row of boxes. Each box stores a value, and the way we connect or access those boxes defines the structure.",
  interview:
    "Imagine an interviewer asks you to explain the concept and its time complexity. Start with the core idea, then give one example.",
};

function localResult(
  style: TeachingStyle,
  language: "en" | "hi",
): TeachingResult {
  return {
    provider: "local",
    explanation:
      language === "hi"
        ? "आइए इस concept को छोटे हिस्सों में समझते हैं और फिर एक आसान उदाहरण से जोड़ते हैं।"
        : LOCAL_EXPLANATIONS[style],
    followUp:
      language === "hi"
        ? "अब सोचिए कि इस concept का सबसे महत्वपूर्ण operation कौन सा है और क्यों?"
        : "Which operation matters most for this concept, and why?",
    recommendedStyle: style,
    confidence: 55,
  };
}

async function tryAgentCore(
  topic: string,
  question: string,
  style: TeachingStyle,
  language: "en" | "hi",
): Promise<TeachingResult | null> {
  const url = process.env.AGENTCORE_RUNTIME_URL;

  if (!url) return null;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        task: "teach",
        topic,
        question,
        style,
        language,
      }),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (
      typeof data.explanation !== "string" ||
      typeof data.followUp !== "string"
    ) {
      return null;
    }

    return {
      provider: "agentcore",
      explanation: data.explanation,
      followUp: data.followUp,
      recommendedStyle:
        data.recommendedStyle === "socratic" ||
        data.recommendedStyle === "visual" ||
        data.recommendedStyle === "interview"
          ? data.recommendedStyle
          : style,
      confidence:
        typeof data.confidence === "number" ? data.confidence : 70,
    };
  } catch {
    return null;
  }
}

export async function runTeachingTeam(
  question: string,
  topic: string,
  style: TeachingStyle,
  language: "en" | "hi",
): Promise<TeachingResult> {
  const agentCore = await tryAgentCore(
    topic,
    question,
    style,
    language,
  );

  if (agentCore) return agentCore;

  try {
    const explanation = await invokeBedrockText(
      PROMPTS.teacherSystem(style, language),
      `Topic: ${topic}\nStudent question/context: ${question}`,
      { maxTokens: 450 },
    );

    if (explanation && !explanation.startsWith("[local]")) {
      const followUp = await invokeBedrockText(
        PROMPTS.evaluatorSystem(language),
        explanation,
        { maxTokens: 180 },
      );

      return {
        provider: "bedrock",
        explanation,
        followUp,
        recommendedStyle: style,
        confidence: 75,
      };
    }
  } catch (error) {
    console.error("[teaching] Bedrock fallback:", error);
  }

  return localResult(style, language);
}
