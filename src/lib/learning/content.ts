import type { Article, Mindmap } from "@/types/content";
import type { LanguageCode } from "@/config/languages";
import { getArticle as s3GetArticle, getMindmap as s3GetMindmap, putMindmap } from "@/lib/aws/s3";
import { invokeBedrockText } from "@/lib/aws/bedrock";
import { PROMPTS } from "@/lib/ai/prompts";

// ── Topic name map ─────────────────────────────────────────────────────────────

const names: Record<string, { en: string; hi: string }> = {
  arrays: { en: "Arrays", hi: "ऐरे" },
  "linked-list": { en: "Linked Lists", hi: "लिंक्ड लिस्ट" },
  stacks: { en: "Stacks", hi: "स्टैक" },
  queues: { en: "Queues", hi: "क्यू" },
  "binary-search": { en: "Binary Search", hi: "बाइनरी सर्च" },
  recursion: { en: "Recursion", hi: "रिकर्शन" },
};

export function getTopicName(slug: string, language: LanguageCode = "en") {
  return names[slug]?.[language] ?? names[slug]?.en ?? slug;
}

// ── Seed content (used when S3 is not configured) ─────────────────────────────
// Loaded lazily via require() so it's tree-shaken in production.

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

// ── Mindmap (S3 first, generate via Bedrock, cache to S3) ─────────────────────

export async function getOrGenerateMindmap(slug: string): Promise<Mindmap> {
  // 1. Try S3 cache
  const cached = await s3GetMindmap(slug);
  if (cached) return cached;

  // 2. Generate via Bedrock
  let mindmap: Mindmap;
  try {
    const raw = await invokeBedrockText(
      PROMPTS.mindmapSystem(),
      PROMPTS.mindmapUser(slug),
      { maxTokens: 600, temperature: 0.4 },
    );
    const jsonStr = raw.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
    mindmap = JSON.parse(jsonStr) as Mindmap;
    mindmap.topicSlug = slug; // ensure correct slug
    // 3. Cache to S3 asynchronously (don't block render)
    putMindmap(mindmap).catch((err) => {
      console.warn("[content] Failed to cache mindmap to S3:", err);
    });
  } catch (error) {
    console.error("[content] Bedrock mindmap generation failed, using fallback:", error);
    // Minimal fallback mindmap
    mindmap = {
      topicSlug: slug,
      nodes: [
        { id: "root", label: slug, level: 0 },
        { id: "ops", label: "Operations", level: 1 },
        { id: "tc", label: "Time Complexity", level: 1 },
        { id: "uc", label: "Use Cases", level: 1 },
      ],
      edges: [
        { from: "root", to: "ops" },
        { from: "root", to: "tc" },
        { from: "root", to: "uc" },
      ],
    };
  }
  return mindmap;
}
