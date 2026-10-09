import { invokeBedrockText } from "@/lib/aws/bedrock";
import { PROMPTS } from "@/lib/ai/prompts";

export type QuizFeedback = {
  strengths: string[];
  weaknesses: string[];
  nextStep: string;
  confidence: number;
};

const localFeedback = (
  score: number,
  missedConcepts?: string[],
  language: "en" | "hi" = "en",
): QuizFeedback => {
  if (language === "hi") {
    return {
      strengths:
        score >= 60
          ? ["अवधारणा पर अच्छी पकड़", "सटीक तर्क"]
          : ["सभी प्रश्नों का प्रयास किया"],
      weaknesses: missedConcepts?.length
        ? missedConcepts
        : score < 60
          ? ["मुख्य अवधारणा पर थोड़ा और अभ्यास ज़रूरी है"]
          : [],
      nextStep:
        score >= 80
          ? "एक नया उदाहरण आज़माएं या अगले विषय पर बढ़ें।"
          : score >= 60
            ? "एक कमजोर बिंदु को दोबारा समझें, फिर नए प्रश्न हल करें।"
            : "पाठ नोट दोबारा पढ़ें और एक उदाहरण को हाथ से ट्रेस करके देखें।",
      confidence: score,
    };
  }

  return {
    strengths:
      score >= 60
        ? ["Good conceptual grasp", "Consistent reasoning"]
        : ["Attempted all questions"],
    weaknesses: missedConcepts?.length
      ? missedConcepts
      : score < 60
        ? ["Core concept needs more practice"]
        : [],
    nextStep:
      score >= 80
        ? "Try a harder variant or move to the next topic."
        : score >= 60
          ? "Review one weak point, then retry with a fresh example."
          : "Re-read the article and trace one example by hand before retrying.",
    confidence: score,
  };
};

export async function generateFeedback(
  topic: string,
  score: number,
  correct: number,
  total: number,
  language: "en" | "hi",
  missedConcepts?: string[],
): Promise<QuizFeedback> {
  try {
    const raw = await invokeBedrockText(
      PROMPTS.feedbackSystem(language),
      PROMPTS.feedbackUser(topic, score, correct, total, language, missedConcepts),
      { maxTokens: 400, temperature: 0.3 },
    );
    const jsonStr = raw.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr) as QuizFeedback;
    if (parsed.nextStep && Array.isArray(parsed.strengths)) return parsed;
    return localFeedback(score, missedConcepts, language);
  } catch (error) {
    console.error("[feedback] Failed to generate AI feedback via Bedrock, using fallback:", error);
    return localFeedback(score, missedConcepts, language);
  }
}

