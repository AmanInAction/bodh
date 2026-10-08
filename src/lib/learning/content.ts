import type { Article, Mindmap, MindmapEdge, MindmapNode } from "@/types/content";
import type { LanguageCode } from "@/config/languages";
import {
  getArticle as s3GetArticle,
  getMindmap as s3GetMindmap,
  putMindmap,
} from "@/lib/aws/s3";
import { invokeBedrockText } from "@/lib/aws/bedrock";
import { PROMPTS } from "@/lib/ai/prompts";

// ── Topic name map ─────────────────────────────────────────────────────────────

const names: Record<string, { en: string; hi: string }> = {
  arrays: { en: "Arrays", hi: "ऐरे (Arrays)" },
  "linked-list": { en: "Linked Lists", hi: "लिंक्ड लिस्ट" },
  stacks: { en: "Stacks", hi: "स्टैक (Stacks)" },
  queues: { en: "Queues", hi: "क्यू (Queues)" },
  "binary-search": { en: "Binary Search", hi: "बाइनरी सर्च" },
  recursion: { en: "Recursion", hi: "रिकर्शन" },
};

export function getTopicName(slug: string, language: LanguageCode = "en") {
  return names[slug]?.[language] ?? names[slug]?.en ?? slug;
}

// ── Seed content (used when S3 is not configured) ─────────────────────────────

function loadSeedArticle(slug: string, language: LanguageCode): Article | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const seed = require(`../../../content/seed/${slug}/${language}.json`) as Article;
    return seed;
  } catch {
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function getLessonContent(
  slug: string,
  language: LanguageCode = "en",
): Promise<Article> {
  // 1. Try S3
  const s3Article = await s3GetArticle(slug, language);
  if (s3Article) return s3Article;

  // 2. Try seed JSON
  const seedArticle = loadSeedArticle(slug, language);
  if (seedArticle) return seedArticle;

  // 3. Generate minimal inline fallback (never crashes)
  const topic = getTopicName(slug, language);
  return {
    topicSlug: slug,
    language,
    title: language === "hi" ? `${topic} को समझना` : `Understanding ${topic}`,
    lead:
      language === "hi"
        ? `${topic} कोड लिखने से पहले समस्या को साफ़ तरीके से देखने में मदद करते हैं।`
        : `${topic} becomes easier when you picture the problem before writing code.`,
    sections: [
      {
        heading: language === "hi" ? "पहले आकार समझें" : "Start with the shape",
        body:
          language === "hi"
            ? `${topic} में जानकारी कैसे रखी जाती है और कौन-सा काम सबसे ज़्यादा करना है।`
            : `Ask how information is arranged inside ${topic} and which operation should be fastest.`,
      },
    ],
    tryThis:
      language === "hi"
        ? `${topic} को रोज़मर्रा की किसी चीज़ से किसी दोस्त को समझाएं।`
        : `Explain ${topic} to a friend using one everyday object and no code.`,
  };
}

// ── Bilingual Fallback Mindmap Builder ─────────────────────────────────────────

const TOPIC_MINDMAP_LEAVES: Record<
  string,
  { en: [string, string, string, string]; hi: [string, string, string, string] }
> = {
  arrays: {
    en: ["O(1) Index Lookup", "Contiguous Memory", "O(n) Middle Insert", "Fixed Slot Order"],
    hi: ["O(1) इंडेक्स एक्सेस", "लगातार मेमोरी", "O(n) बीच में जोड़ना", "निश्चित क्रम"],
  },
  "linked-list": {
    en: ["Node + Next Pointer", "O(1) Head Insert", "O(n) Search Traversal", "Dynamic Memory"],
    hi: ["नोड + पॉइंटर", "O(1) तेज़ जोड़ना", "O(n) क्रम से खोजना", "लचीली मेमोरी"],
  },
  stacks: {
    en: ["LIFO Order", "O(1) Push & Pop", "Peek Top Item", "Undo & Call Stack"],
    hi: ["LIFO क्रम", "O(1) Push और Pop", "ऊपरी तत्व देखें", "Undo और Call Stack"],
  },
  queues: {
    en: ["FIFO Order", "Enqueue at Back", "Dequeue from Front", "BFS & Scheduling"],
    hi: ["FIFO क्रम", "पीछे से Enqueue", "आगे से Dequeue", "BFS और शेड्यूलिंग"],
  },
  "binary-search": {
    en: ["Requires Sorted Data", "Check Middle Element", "Halve Search Space", "O(log n) Time"],
    hi: ["क्रमबद्ध डेटा ज़रूरी", "बीच का तत्व जाँचें", "आधा क्षेत्र हटाएं", "O(log n) समय"],
  },
  recursion: {
    en: ["Base Case Stops", "Smaller Subproblem", "Call Stack Unwinds", "Tree & Divide Steps"],
    hi: ["Base Case रोकता है", "छोटा उप-सवाल", "Call Stack वापसी", "कदम-दर-कदम हल"],
  },
};

function buildBilingualFallbackMindmap(
  slug: string,
  language: LanguageCode,
): Mindmap {
  const seed = loadSeedArticle(slug, language);
  const rootLabel = getTopicName(slug, language);
  const leaves =
    TOPIC_MINDMAP_LEAVES[slug]?.[language] ??
    (language === "hi"
      ? ["मुख्य नियम", "तेज़ ऑपरेशन", "समय जटिलता", "व्यावहारिक उपयोग"]
      : ["Core Rule", "Key Operations", "Time Complexity", "Real Use Cases"]);

  const nodes: MindmapNode[] = [{ id: "root", label: rootLabel, level: 0 }];
  const edges: MindmapEdge[] = [];

  const section1Heading =
    seed?.sections?.[0]?.heading ??
    (language === "hi" ? "मुख्य विचार" : "Core Idea");
  const section2Heading =
    seed?.sections?.[1]?.heading ??
    (language === "hi" ? "उपयोग और नियम" : "Trade-offs & Use");
  const practiceHeading =
    language === "hi" ? "अभ्यास (Try This)" : "Practice Step";

  const branches = [
    { id: "b1", label: section1Heading, leaves: [leaves[0], leaves[1]] },
    { id: "b2", label: section2Heading, leaves: [leaves[2], leaves[3]] },
    {
      id: "b3",
      label: practiceHeading,
      leaves: [
        language === "hi" ? "उदाहरण ट्रेस करें" : "Trace an Example",
      ],
    },
  ];

  branches.forEach((branch) => {
    nodes.push({ id: branch.id, label: branch.label, level: 1 });
    edges.push({ from: "root", to: branch.id });
    branch.leaves.forEach((leafLabel, idx) => {
      const leafId = `${branch.id}-l${idx}`;
      nodes.push({ id: leafId, label: leafLabel, level: 2 });
      edges.push({ from: branch.id, to: leafId });
    });
  });

  return {
    topicSlug: slug,
    language,
    nodes,
    edges,
  };
}

// ── Mindmap (Language-Aware S3 Cache → AI Generation → Bilingual Fallback) ─────

export async function getOrGenerateMindmap(
  slug: string,
  language: LanguageCode = "en",
): Promise<Mindmap> {
  // 1. Try language-specific S3 / memory cache (`mindmaps/<slug>/<language>.json`)
  const cached = await s3GetMindmap(slug, language);
  if (cached && Array.isArray(cached.nodes) && cached.nodes.length > 0) {
    return { ...cached, topicSlug: slug, language };
  }

  // 2. Generate via AI (when configured)
  let mindmap: Mindmap;
  try {
    const raw = await invokeBedrockText(
      PROMPTS.mindmapSystem(language),
      PROMPTS.mindmapUser(slug, language),
      { maxTokens: 600, temperature: 0.4 },
    );
    if (raw && !raw.startsWith("[local]")) {
      const jsonStr = raw.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(jsonStr) as Mindmap;
      if (Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
        mindmap = {
          ...parsed,
          topicSlug: slug,
          language,
        };
      } else {
        mindmap = buildBilingualFallbackMindmap(slug, language);
      }
    } else {
      mindmap = buildBilingualFallbackMindmap(slug, language);
    }
  } catch (error) {
    console.error("[content] Mindmap generation fallback used:", error);
    mindmap = buildBilingualFallbackMindmap(slug, language);
  }

  // 3. Cache under language-specific key `mindmaps/<slug>/<language>.json`
  putMindmap(mindmap, language).catch((err) => {
    console.warn("[content] Failed to cache mindmap to S3:", err);
  });

  return mindmap;
}
