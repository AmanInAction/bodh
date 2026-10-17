import { invokeBedrockJSON, invokeBedrockText } from "@/lib/aws/bedrock";
import { PROMPTS } from "@/lib/ai/prompts";
import { selectEvidenceBasedStyle } from "@/lib/ai/feedback";
import type { LearningGoal, StructuredAssessment } from "@/types/student-record";

export type TeachingStyle = "simple" | "socratic" | "visual" | "interview";

export type TeachingResult = {
  provider: "agentcore" | "bedrock" | "local";
  explanation: string;
  followUp: string;
  recommendedStyle: TeachingStyle;
  confidence: number;
  targetedConcept?: string;
};

// ─── Smart local explanations ────────────────────────────────────────────────
const TOPIC_CONCEPTS: Record<string, { en: string; hi: string }> = {
  arrays: {
    en: "a contiguous block of memory where each element lives at a fixed index (0 to n-1), giving O(1) random access by index while middle insertions require O(n) shifting",
    hi: "एक लगातार (contiguous) मेमोरी ब्लॉक जहाँ प्रत्येक तत्व एक निश्चित इंडेक्स (0 से n-1) पर होता है, जो O(1) इंडेक्स एक्सेस देता है जबकि बीच में जोड़ने पर O(n) शिफ्टिंग लगती है",
  },
  array: {
    en: "a contiguous block of memory where each element lives at a fixed index, giving O(1) random access",
    hi: "एक सन्निहित मेमोरी ब्लॉक जहाँ प्रत्येक element एक निश्चित index पर होता है, जो O(1) random access देता है",
  },
  "linked-list": {
    en: "a chain of nodes where each node holds data and a pointer to the next node, making head insertions O(1) while arbitrary index lookups require O(n) pointer traversal",
    hi: "नोड्स की एक श्रृंखला जहाँ प्रत्येक नोड डेटा और अगले नोड का pointer रखता है — शुरुआत में जोड़ना O(1) लेकिन खोजना O(n) होता है",
  },
  stacks: {
    en: "a Last-In-First-Out (LIFO) structure — like a stack of plates — supporting O(1) push, pop, and peek at the top",
    hi: "एक Last-In-First-Out (LIFO) संरचना — जैसे प्लेटों का ढेर — शीर्ष पर O(1) push, pop और peek के साथ",
  },
  stack: {
    en: "a Last-In-First-Out (LIFO) structure — like a stack of plates — supporting O(1) push and pop",
    hi: "एक Last-In-First-Out (LIFO) संरचना — जैसे प्लेटों का ढेर — O(1) push और pop के साथ",
  },
  queues: {
    en: "a First-In-First-Out (FIFO) structure — like a ticket-counter queue — with O(1) enqueue at the rear and dequeue from the front",
    hi: "एक First-In-First-Out (FIFO) संरचना — जैसे टिकट काउंटर पर लाइन — पीछे से O(1) enqueue और आगे से dequeue के साथ",
  },
  queue: {
    en: "a First-In-First-Out (FIFO) structure — like a ticket-counter queue — with O(1) enqueue and dequeue",
    hi: "एक First-In-First-Out (FIFO) संरचना — जैसे टिकट काउंटर पर लाइन — O(1) enqueue और dequeue के साथ",
  },
  "binary-search": {
    en: "a divide-and-conquer search on a sorted array that checks the middle element and halves the search space each step, achieving O(log n) time",
    hi: "क्रमबद्ध (sorted) ऐरे पर divide-and-conquer खोज जो बीच के तत्व को जाँचकर हर कदम पर खोज क्षेत्र आधा करती है — O(log n) समय में",
  },
  recursion: {
    en: "a technique where a function calls itself on a strictly smaller subproblem until it hits a base case, using the LIFO call stack to unwind results",
    hi: "एक तकनीक जहाँ फ़ंक्शन छोटे उप-सवाल (subproblem) के साथ खुद को कॉल करता है जब तक base case न आ जाए, और Call Stack के माध्यम से उत्तर लौटाता है",
  },
};

const CONCEPT_SPECIFIC_GUIDANCE: Record<
  string,
  { en: Record<TeachingStyle, string>; hi: Record<TeachingStyle, string> }
> = {
  "index access": {
    en: {
      simple:
        "Think of an array like numbered lockers in a school corridor. Because every locker has the exact same width and sits right next to the previous one, you can walk straight to Locker #4 without opening Lockers #0, #1, #2, or #3.",
      socratic:
        "1. If the first element starts at address 1000 and each integer takes 4 bytes, where does index 1 live?\n2. Where does index k live?\n3. Notice how that formula uses only multiplication and addition — does the number of steps grow if the array has 10,000 items?",
      visual:
        "Memory Trace:\nIndex:   [ 0 ]   [ 1 ]   [ 2 ]   [ 3 ]\nAddress: 1000    1004    1008    1012\n\nFormula: address(i) = base + (i × size) = 1000 + (3 × 4) = 1012.\nOne direct jump → O(1) time.",
      interview:
        "In interviews, emphasize that O(1) random access relies on contiguous allocation and homogeneous element size. Trade-off: maintaining contiguity makes arbitrary insertions/deletions O(n) due to shifting.",
    },
    hi: {
      simple:
        "Array को स्कूल के गलियारे में लगे नंबर वाले लॉकर्स की तरह समझें। हर लॉकर बराबर आकार का है और बिल्कुल साथ सटा हुआ है, इसलिए आप लॉकर 0, 1, 2 खोले बिना सीधे लॉकर #4 पर पहुँच सकते हैं।",
      socratic:
        "1. यदि पहला तत्व मेमोरी पता 1000 पर है और हर संख्या 4 बाइट लेती है, तो index 1 कहाँ होगा?\n2. index k कहाँ होगा?\n3. क्या इस सीधे जोड़-गुणा के सूत्र में तत्वों की संख्या बढ़ने से अधिक कदम लगेंगे?",
      visual:
        "मेमोरी चित्र:\nIndex:   [ 0 ]   [ 1 ]   [ 2 ]   [ 3 ]\nAddress: 1000    1004    1008    1012\n\nसूत्र: address(i) = 1000 + (3 × 4) = 1012.\nसीधी छलांग → O(1) समय।",
      interview:
        "इंटरव्यू में स्पष्ट करें कि O(1) इंडेक्स एक्सेस लगातार (contiguous) मेमोरी आवंटन के कारण संभव है। इसका ट्रेड-ऑफ यह है कि बीच में तत्व जोड़ने या हटाने में O(n) शिफ्टिंग लगती है।",
    },
  },
  "mid calculation": {
    en: {
      simple:
        "To find the middle between low and high, instead of adding them together (which can overflow on huge arrays), start at low and step halfway toward high: low + Math.floor((high - low) / 2).",
      socratic:
        "1. Suppose low = 1,500,000,000 and high = 1,800,000,000 in a 32-bit signed integer (max ~2.14 billion).\n2. What happens when you compute (low + high) first?\n3. What is (high - low) instead, and why does adding half of that to low stay safe?",
      visual:
        "Range Trace:\n[ low = 2 ] -------- distance = (8 - 2) = 6 -------- [ high = 8 ]\nHalf distance = 6 / 2 = 3\nmid = low + 3 = 5\n\n[ 2 ] [ 3 ] [ 4 ] [ 5 (mid) ] [ 6 ] [ 7 ] [ 8 ]",
      interview:
        "Always write `const mid = low + Math.floor((high - low) / 2)`. It is mathematically identical to `Math.floor((low + high) / 2)` for non-negative bounds while eliminating 32-bit signed integer overflow bugs.",
    },
    hi: {
      simple:
        "low और high के बीच का मध्य (mid) निकालने के लिए दोनों को सीधे जोड़ने के बजाय, low से शुरू करें और high तक की आधी दूरी जोड़ें: low + Math.floor((high - low) / 2)।",
      socratic:
        "1. मान लीजिए low और high दोनों बहुत बड़ी संख्याएं हैं (जैसे 1.5 अरब और 1.8 अरब)।\n2. यदि आप पहले (low + high) जोड़ेंगे तो 32-bit integer सीमा (2.14 अरब) का क्या होगा?\n3. इसके बजाय पहले (high - low) घटाने से संख्या सीमा के भीतर कैसे रहती है?",
      visual:
        "दूरी ट्रेस:\n[ low = 2 ] -------- अंतर = (8 - 2) = 6 -------- [ high = 8 ]\nआधी दूरी = 6 / 2 = 3\nmid = low + 3 = 5\n\n[ 2 ] [ 3 ] [ 4 ] [ 5 (mid) ] [ 6 ] [ 7 ] [ 8 ]",
      interview:
        "इंटरव्यू में हमेशा `mid = low + Math.floor((high - low) / 2)` लिखें। यह बड़े इंडेक्स पर होने वाले integer overflow बग को पूरी तरह रोकता है।",
    },
  },
};

const HINDI_TOPIC_ALIASES: Record<string, string> = {
  "ऐरे": "arrays",
  "लिंक्ड": "linked-list",
  "स्टैक": "stacks",
  "क्यू": "queues",
  "बाइनरी": "binary-search",
  "रिकर्शन": "recursion",
};

function normalizeTopicSlug(topic: string): string {
  const normalized = topic.toLowerCase().trim();
  for (const [hiName, enKey] of Object.entries(HINDI_TOPIC_ALIASES)) {
    if (normalized.includes(hiName)) {
      return enKey;
    }
  }
  return normalized.replace(/\s+/g, "-");
}

function getTopicConcept(topic: string, lang: "en" | "hi"): string {
  const slug = normalizeTopicSlug(topic);
  const entry =
    TOPIC_CONCEPTS[slug] ??
    Object.entries(TOPIC_CONCEPTS).find(
      ([k]) => slug.includes(k) || k.includes(slug),
    )?.[1];
  if (entry) return entry[lang];
  return lang === "hi"
    ? `एक महत्वपूर्ण DSA अवधारणा जो डेटा को कुशलतापूर्वक संग्रहीत और प्रोसेस करने का तरीका देती है`
    : `an important DSA concept that provides an efficient way to organize and process data`;
}

function buildExplanation(
  topic: string,
  style: TeachingStyle,
  concept: string,
  lang: "en" | "hi",
  weakConcept?: string,
): string {
  const normalizedWeak = weakConcept?.toLowerCase().trim() ?? "";
  const specific =
    CONCEPT_SPECIFIC_GUIDANCE[normalizedWeak]?.[lang]?.[style];
  if (specific) {
    return specific;
  }

  const focusLineEn = weakConcept
    ? `\n\n**Focusing on "${weakConcept}":** Trace how this specific rule behaves on a 3-element example before generalizing.`
    : "";
  const focusLineHi = weakConcept
    ? `\n\n**"${weakConcept}" पर विशेष ध्यान:** बड़े कोड से पहले 3 तत्वों के छोटे उदाहरण पर इस नियम को कदम-दर-कदम चलाकर देखें।`
    : "";

  if (lang === "hi") {
    switch (style) {
      case "simple":
        return `**${topic}** को सरल भाषा में समझें:\n\nयह ${concept}।${focusLineHi}\n\n**मुख्य अंतर्दृष्टि:** ${topic} का हर नियम एक खास ऑपरेशन को तेज़ और सुरक्षित बनाने के लिए बना है। इसे रोज़मर्रा की एक छोटी सूची पर सोचकर देखें।`;
      case "socratic":
        return `**${topic}** को इन सवालों से खुद खोजें:\n\n1. यदि आपके पास केवल 3 तत्व हों, तो ${weakConcept || topic} में पहला कदम क्या होगा?\n2. यह ${concept} — इससे कौन-सा ऑपरेशन सबसे तेज़ हो जाता है?\n3. यदि हम इस नियम को तोड़ दें, तो किस स्थिति (edge case) में उत्तर गलत हो जाएगा?`;
      case "visual":
        return `**${topic}** का मानसिक और शाब्दिक चित्रण:\n\nकल्पना करें: ${concept}।\n\nमेमोरी ट्रेस:\n[ इनपुट स्थिति ] ──(ऑपरेशन: ${weakConcept || "step 1"})──▶ [ अपडेटेड स्थिति ]\n\nहर बॉक्स में मान और तीर (→) से क्रम को कागज़ पर बनाकर देखें — चित्र साफ होते ही कोड स्पष्ट हो जाता है।`;
      case "interview":
        return `**${topic}** — इंटरव्यू और तकनीकी दृष्टिकोण:\n\n• **मुख्य सिद्धांत:** ${concept}।\n• **ध्यान देने योग्य बिंदु (${weakConcept || "boundary case"}):** खाली इनपुट, 1 तत्व और अंतिम सीमा (boundary) की हमेशा जाँच करें।\n• **Trade-off:** समय जटिलता (Time Complexity) और मेमोरी उपयोग की तुलना करके अपना चुनाव समझाएं।`;
    }
  }

  switch (style) {
    case "simple":
      return `**${topic}** in plain terms:\n\nIt is ${concept}.${focusLineEn}\n\n**The key insight:** every rule in ${topic} exists to make a specific operation fast and predictable. Picture how it works on just 3 items first.`;
    case "socratic":
      return `Let's reason through **${topic}** step by step:\n\n1. If you only had 3 elements in front of you, what would happen first during ${weakConcept || topic}?\n2. Given that it is ${concept}, which operation becomes effortless?\n3. What boundary condition would break if we skipped that invariant?`;
    case "visual":
      return `**${topic}** — step-by-step mental model:\n\nPicture this in memory: ${concept}.\n\nState Trace:\n[ Before: State A ] ──(apply ${weakConcept || "core step"})──▶ [ After: State B ]\n\nSketch 4 boxes on paper and label the active index or pointer before and after a single operation.`;
    case "interview":
      return `**${topic}** — technical & interview breakdown:\n\n• **Core mechanism:** ${concept}.\n• **Critical edge case (${weakConcept || "boundaries"}):** Always verify empty inputs, single-element inputs, and boundary indices.\n• **Trade-off:** State the exact Big-O time and space complexity and why this structure beats alternatives for the workload.`;
  }
}

function buildFollowUp(
  topic: string,
  style: TeachingStyle,
  lang: "en" | "hi",
  weakConcept?: string,
): string {
  const target = weakConcept ? `"${weakConcept}" in ${topic}` : topic;
  const targetHi = weakConcept ? `${topic} में "${weakConcept}"` : topic;

  if (lang === "hi") {
    switch (style) {
      case "simple":
        return `अब एक छोटे उदाहरण पर सोचें: यदि केवल 3 तत्व हों, तो ${targetHi} कैसे काम करेगा?`;
      case "socratic":
        return `ऊपर दिए गए पहले सवाल का उत्तर अपने शब्दों में क्या होगा जब इनपुट का आकार 1 हो?`;
      case "visual":
        return `यदि आप 4 तत्वों के साथ ${targetHi} का चित्र बनाएं, तो पहले कदम के बाद कौन-सा इंडेक्स या पॉइंटर बदलेगा?`;
      case "interview":
        return `इंटरव्यू फॉलो-अप: ${targetHi} में कौन-सा edge case सबसे पहले जाँचना चाहिए और इसकी time complexity क्या होगी?`;
    }
  }

  switch (style) {
    case "simple":
      return `Quick check: if you trace ${target} on a tiny 3-element example, what happens on the very first step?`;
    case "socratic":
      return `How would you answer the first question above when the input has only 1 element?`;
    case "visual":
      return `In a 4-element diagram of ${target}, which exact index or pointer changes after the first operation?`;
    case "interview":
      return `Interview follow-up: what is the first boundary edge case you would guard against for ${target}, and what is the time complexity?`;
  }
}

function localResult(
  topic: string,
  style: TeachingStyle,
  language: "en" | "hi",
  weakConcept?: string,
  score?: number,
  goal?: LearningGoal,
): TeachingResult {
  const concept = getTopicConcept(topic, language);
  const recommendedStyle = selectEvidenceBasedStyle(
    score ?? 65,
    weakConcept ? [weakConcept] : [],
    style,
    goal,
  );
  return {
    provider: "local",
    explanation: buildExplanation(topic, style, concept, language, weakConcept),
    followUp: buildFollowUp(topic, style, language, weakConcept),
    recommendedStyle,
    confidence: score ?? 80,
    targetedConcept: weakConcept,
  };
}

// ─── Agent 3: Explain Differently & Teaching Orchestration ───────────────────
export async function runTeachingTeam(
  question: string,
  topic: string,
  style: TeachingStyle,
  language: "en" | "hi",
  context?: {
    weakConcepts?: string[];
    assessment?: Partial<StructuredAssessment>;
    goal?: LearningGoal;
    score?: number;
  },
): Promise<TeachingResult> {
  const primaryWeakConcept =
    context?.weakConcepts?.[0] ?? context?.assessment?.weakConcepts?.[0];
  const score =
    context?.score ?? context?.assessment?.masteryEvidence?.score;

  const evidenceRecommendedStyle = selectEvidenceBasedStyle(
    score ?? 65,
    context?.weakConcepts ?? context?.assessment?.weakConcepts ?? [],
    style,
    context?.goal,
  );

  // Try AWS Bedrock with structured teacher + evaluator + assessor orchestration
  try {
    const contextDetails = [
      `Topic: ${topic}`,
      `Student question/context: ${question}`,
      primaryWeakConcept ? `Target weak concept to clarify: ${primaryWeakConcept}` : "",
      context?.goal ? `Learner goal: ${context.goal}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const explanation = await invokeBedrockText(
      PROMPTS.teacherSystem(style, language),
      contextDetails,
      { task: "teaching", maxTokens: 450, temperature: 0.4 },
    );

    if (explanation && !explanation.startsWith("[local]")) {
      const [followUpRaw, assessorData] = await Promise.all([
        invokeBedrockText(PROMPTS.evaluatorSystem(language), explanation, {
          task: "teaching",
          maxTokens: 160,
          temperature: 0.3,
        }).catch(() => ""),
        invokeBedrockJSON<{
          recommendedStyle?: TeachingStyle;
          confidence?: number;
        }>(
          PROMPTS.assessorSystem(language),
          `Topic: ${topic}\nCurrent style: ${style}\nWeak concept: ${primaryWeakConcept || "general"}\nExplanation given: ${explanation.slice(0, 240)}`,
          (parsed) =>
            parsed && typeof parsed === "object"
              ? (parsed as { recommendedStyle?: TeachingStyle; confidence?: number })
              : null,
          { task: "assessment", maxTokens: 150, temperature: 0.2 },
        ).catch(() => null),
      ]);

      const validStyles: TeachingStyle[] = [
        "simple",
        "socratic",
        "visual",
        "interview",
      ];
      const aiStyle =
        assessorData?.recommendedStyle &&
        validStyles.includes(assessorData.recommendedStyle) &&
        assessorData.recommendedStyle !== style
          ? assessorData.recommendedStyle
          : evidenceRecommendedStyle;

      return {
        provider: "bedrock",
        explanation: explanation.trim(),
        followUp:
          followUpRaw && !followUpRaw.startsWith("[local]")
            ? followUpRaw.trim()
            : buildFollowUp(topic, style, language, primaryWeakConcept),
        recommendedStyle: aiStyle,
        confidence:
          score !== undefined
            ? score
            : typeof assessorData?.confidence === "number"
              ? assessorData.confidence
              : 80,
        targetedConcept: primaryWeakConcept,
      };
    }
  } catch (error) {
    console.warn("[teaching] Bedrock fallback to local deterministic teacher:", error);
  }

  return localResult(
    topic,
    style,
    language,
    primaryWeakConcept,
    score,
    context?.goal,
  );
}
