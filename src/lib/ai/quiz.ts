import type { QuizQuestion } from "@/types/quiz";
import type { LanguageCode } from "@/config/languages";
import { invokeBedrockText } from "@/lib/aws/bedrock";
import { PROMPTS } from "@/lib/ai/prompts";

// ── Local fallback quiz (used when Bedrock is not configured) ─────────────────

function localFallbackQuiz(
  topic: string,
  language: LanguageCode,
): QuizQuestion[] {
  if (language === "hi") {
    return [
      {
        id: `${topic}-1`,
        prompt: `${topic} का मुख्य उद्देश्य क्या है?`,
        options: [
          "डेटा को व्यवस्थित तरीके से संग्रहीत करना",
          "हर लाइन याद करना",
          "उदाहरण छोड़ देना",
          "अभ्यास न करना",
        ],
        answer: 0,
        explanation: `${topic} का उद्देश्य डेटा को कुशलतापूर्वक संग्रहीत और एक्सेस करना है।`,
      },
      {
        id: `${topic}-2`,
        prompt: "नई समस्या को समझने का पहला कदम क्या है?",
        options: [
          "एक छोटा उदाहरण बनाना",
          "सीधा कठिन कोड लिखना",
          "उत्तर देख लेना",
          "नाम बदलना",
        ],
        answer: 0,
        explanation: "छोटे उदाहरण से सोच साफ होती है।",
      },
      {
        id: `${topic}-3`,
        prompt: "Time complexity क्यों महत्वपूर्ण है?",
        options: [
          "यह बताती है कि एल्गोरिदम कितना समय लेगा",
          "यह कोड को छोटा बनाती है",
          "यह याददाश्त बढ़ाती है",
          "यह कोड चलाती है",
        ],
        answer: 0,
        explanation: "Time complexity से हम जानते हैं कि बड़े inputs पर कोड कितना तेज़ होगा।",
      },
      {
        id: `${topic}-4`,
        prompt: "अच्छा अभ्यास किस पर ध्यान देता है?",
        options: [
          "समझ और पैटर्न पर",
          "सिर्फ गति पर",
          "सिर्फ सिंटैक्स पर",
          "सिर्फ याददाश्त पर",
        ],
        answer: 0,
        explanation: "पैटर्न समझने से आप नई समस्याओं पर भी वही विचार लगा सकते हैं।",
      },
      {
        id: `${topic}-5`,
        prompt: "गलत उत्तर के बाद क्या करना चाहिए?",
        options: [
          "गलती वाले कदम को फिर से देखना",
          "अभ्यास बंद करना",
          "प्रश्न बदलना",
          "अनुमान से चुनना",
        ],
        answer: 0,
        explanation: "गलती की जगह ढूंढने से अगला सीखने का कदम साफ होता है।",
      },
    ];
  }
  return [
    {
      id: `${topic}-1`,
      prompt: `What is the primary purpose of ${topic}?`,
      options: [
        "To store and access data efficiently",
        "To memorize every line of code",
        "To avoid using examples",
        "To skip practice",
      ],
      answer: 0,
      explanation: `${topic} is designed for efficient data storage and retrieval.`,
    },
    {
      id: `${topic}-2`,
      prompt: "What is a useful first step for a new problem?",
      options: [
        "Make a tiny example",
        "Write the hardest code first",
        "Look up the answer",
        "Rename every variable",
      ],
      answer: 0,
      explanation: "A tiny example makes the problem concrete and traceable.",
    },
    {
      id: `${topic}-3`,
      prompt: "Why does time complexity matter?",
      options: [
        "It shows how an algorithm scales with input size",
        "It makes code shorter",
        "It improves memory",
        "It runs the code",
      ],
      answer: 0,
      explanation: "Time complexity lets us predict performance on large inputs.",
    },
    {
      id: `${topic}-4`,
      prompt: "What makes practice effective?",
      options: [
        "Learning the underlying pattern",
        "Only chasing speed",
        "Only memorising syntax",
        "Only guessing",
      ],
      answer: 0,
      explanation: "Patterns transfer to new problems and inputs.",
    },
    {
      id: `${topic}-5`,
      prompt: "What should you do after a wrong answer?",
      options: [
        "Review the step where your reasoning changed",
        "Stop practising",
        "Change the question",
        "Guess again",
      ],
      answer: 0,
      explanation: "Finding the turning point gives you a clear next step.",
    },
  ];
}

// ── Bedrock quiz generator ────────────────────────────────────────────────────

export async function generateQuiz(
  topic: string,
  language: LanguageCode = "en",
): Promise<QuizQuestion[]> {
  try {
    const raw = await invokeBedrockText(
      PROMPTS.quizSystem(language),
      PROMPTS.quizUser(topic, language),
      { maxTokens: 1200, temperature: 0.6 },
    );

    // Strip any markdown fences Bedrock might wrap around JSON
    const jsonStr = raw.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr) as QuizQuestion[];

    // Basic validation — ensure it's an array of 5
    if (Array.isArray(parsed) && parsed.length >= 3) {
      return parsed.slice(0, 5);
    }
    return localFallbackQuiz(topic, language);
  } catch {
    return localFallbackQuiz(topic, language);
  }
}
