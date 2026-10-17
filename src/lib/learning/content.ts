import type {
  Article,
  BlogPost,
} from "@/types/content";
import type { LanguageCode } from "@/config/languages";
import {
  getArticle as s3GetArticle,
  getBlog as s3GetBlog,
  getContent as s3GetContent,
} from "@/lib/aws/s3";
import { getContentIndex, listContentIndices } from "@/lib/aws/dynamodb";

// ── Topic name map ─────────────────────────────────────────────────────────────

const names: Record<string, { en: string; hi: string }> = {
  arrays: { en: "Arrays", hi: "ऐरे (Arrays)" },
  "linked-list": { en: "Linked Lists", hi: "लिंक्ड लिस्ट" },
  stacks: { en: "Stacks", hi: "स्टैक (Stacks)" },
  queues: { en: "Queues", hi: "क्यू (Queues)" },
  "binary-search": { en: "Binary Search", hi: "बाइनरी सर्च" },
  recursion: { en: "Recursion", hi: "रिकर्शन" },
};

export const TOPIC_LEARNING_META: Record<
  string,
  {
    prerequisites: string[];
    objectivesEn: string[];
    objectivesHi: string[];
  }
> = {
  arrays: {
    prerequisites: [],
    objectivesEn: [
      "Understand O(1) index-based random access in contiguous memory",
      "Recognize why inserting or deleting in the middle costs O(n) due to shifting",
      "Identify when fixed-order contiguous storage is the right choice",
    ],
    objectivesHi: [
      "लगातार मेमोरी (contiguous memory) में O(1) इंडेक्स एक्सेस को समझना",
      "बीच में जोड़ने या हटाने पर तत्वों को खिसकाने (shifting) की O(n) लागत पहचानना",
      "यह जानना कि कब ऐरे का उपयोग सबसे उपयुक्त होता है",
    ],
  },
  "linked-list": {
    prerequisites: ["arrays"],
    objectivesEn: [
      "Understand how nodes store values and next pointers in non-contiguous memory",
      "Explain why head insertion is O(1) while arbitrary lookup requires O(n) traversal",
      "Trace pointer reassignment carefully without losing the rest of the chain",
    ],
    objectivesHi: [
      "समझना कि नोड्स डेटा और अगले नोड का पॉइंटर कैसे रखते हैं",
      "यह जानना कि शुरुआत में जोड़ना O(1) क्यों है और खोजने में O(n) क्यों लगता है",
      "चेन को खोए बिना पॉइंटर बदलने के क्रम को सही से ट्रेस करना",
    ],
  },
  stacks: {
    prerequisites: ["arrays"],
    objectivesEn: [
      "Master the Last-In, First-Out (LIFO) ordering rule",
      "Understand O(1) push, pop, and peek operations at the top of the stack",
      "Apply stacks to nested matching, undo history, and function call frames",
    ],
    objectivesHi: [
      "Last-In, First-Out (LIFO) के नियम को स्पष्ट रूप से समझना",
      "स्टैक के शीर्ष पर O(1) push, pop और peek ऑपरेशन्स को समझना",
      "ब्रैकेट मिलान, Undo हिस्ट्री और कॉल स्टैक में इसका उपयोग करना",
    ],
  },
  queues: {
    prerequisites: ["arrays", "linked-list"],
    objectivesEn: [
      "Master the First-In, First-Out (FIFO) ordering rule",
      "Distinguish enqueue at the back from dequeue at the front",
      "Understand how circular buffers or linked pointers avoid O(n) shifting on dequeue",
    ],
    objectivesHi: [
      "First-In, First-Out (FIFO) के नियम को स्पष्ट रूप से समझना",
      "पीछे से जोड़ने (enqueue) और आगे से निकालने (dequeue) के अंतर को समझना",
      "जानना कि बिना O(n) शिफ्टिंग के तेज़ क्यू कैसे काम करती है",
    ],
  },
  "binary-search": {
    prerequisites: ["arrays"],
    objectivesEn: [
      "Verify the sorted-data precondition before applying binary search",
      "Correctly compute mid and narrow the low/high boundaries without infinite loops",
      "Explain why halving the search space each step yields O(log n) time complexity",
    ],
    objectivesHi: [
      "बाइनरी सर्च लगाने से पहले डेटा के क्रमबद्ध (sorted) होने की शर्त जाँचना",
      "बिना अनंत लूप के सही mid निकालना और low/high सीमाओं को छोटा करना",
      "समझना कि हर कदम पर खोज क्षेत्र आधा करने से O(log n) समय क्यों लगता है",
    ],
  },
  recursion: {
    prerequisites: ["stacks"],
    objectivesEn: [
      "Define a clear base case that stops recursive calls from running forever",
      "Ensure every recursive step moves strictly toward the base case with a smaller input",
      "Trace how call frames push onto and unwind from the call stack",
    ],
    objectivesHi: [
      "स्पष्ट बेस केस (base case) तय करना जो रिकर्सिव कॉल को सही समय पर रोके",
      "यह सुनिश्चित करना कि हर कदम छोटे इनपुट के साथ बेस केस की ओर बढ़े",
      "कॉल स्टैक पर फ़ंक्शन कॉल्स के जुड़ने और वापस लौटने के क्रम को ट्रेस करना",
    ],
  },
};

export function getTopicName(slug: string, language: LanguageCode = "en") {
  return names[slug]?.[language] ?? names[slug]?.en ?? slug;
}

export function getTopicLearningObjectives(
  slug: string,
  language: LanguageCode = "en",
): string[] {
  const meta = TOPIC_LEARNING_META[slug];
  if (!meta) {
    return language === "hi"
      ? ["मुख्य अवधारणा और संचालन समझें", "समय जटिलता और उपयोग की स्थितियाँ पहचानें"]
      : ["Understand core structure and operations", "Identify time complexity and practical use cases"];
  }
  return language === "hi" ? meta.objectivesHi : meta.objectivesEn;
}

export function getTopicPrerequisites(slug: string): string[] {
  return TOPIC_LEARNING_META[slug]?.prerequisites ?? [];
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

function loadSeedBlog(slug: string, language: LanguageCode): BlogPost | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const seed = require(`../../../content/seed/blogs/${slug}/${language}.json`) as BlogPost;
    return seed;
  } catch {
    return null;
  }
}

function enrichArticleMetadata(article: Article, slug: string, language: LanguageCode): Article {
  return {
    ...article,
    topicSlug: slug,
    language,
    learningObjectives:
      article.learningObjectives ?? getTopicLearningObjectives(slug, language),
    prerequisites: article.prerequisites ?? getTopicPrerequisites(slug),
  };
}

// ── Article Content (DynamoDB Index -> S3 Key -> S3 Canonical -> Seed Fallback)

export async function getLessonContent(
  slug: string,
  language: LanguageCode = "en",
): Promise<Article> {
  // 1. Resolve via DynamoDB Content Index -> S3 Key
  try {
    const index = await getContentIndex("article", slug, language);
    if (index?.s3Key) {
      const s3Indexed = await s3GetContent<Article>(index.s3Key);
      if (s3Indexed) return enrichArticleMetadata(s3Indexed, slug, language);
    }
  } catch (err) {
    console.warn("[content] DynamoDB index lookup failed for article:", err);
  }

  // 2. Direct S3 lookup
  const s3Article = await s3GetArticle(slug, language);
  if (s3Article) return enrichArticleMetadata(s3Article, slug, language);

  // 3. Try seed JSON
  const seedArticle = loadSeedArticle(slug, language);
  if (seedArticle) return enrichArticleMetadata(seedArticle, slug, language);

  // 4. Generate minimal inline fallback (never crashes)
  const topic = getTopicName(slug, language);
  return enrichArticleMetadata(
    {
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
    },
    slug,
    language,
  );
}

// ── Blog Content (DynamoDB Index -> S3 Key -> S3 Canonical -> Seed Fallback) ──

const KNOWN_BLOG_SLUGS = [
  "why-time-complexity-matters",
  "visualizing-recursion-call-stack",
  "arrays-vs-linked-lists",
];

export async function getBlogPost(
  slug: string,
  language: LanguageCode = "en",
): Promise<BlogPost | null> {
  // 1. Resolve via DynamoDB Content Index
  try {
    const index = await getContentIndex("blog", slug, language);
    if (index?.s3Key) {
      const s3Indexed = await s3GetContent<BlogPost>(index.s3Key);
      if (s3Indexed) return s3Indexed;
    }
  } catch (err) {
    console.warn("[content] DynamoDB index lookup failed for blog:", err);
  }

  // 2. Direct S3 lookup
  const s3Blog = await s3GetBlog(slug, language);
  if (s3Blog) return s3Blog;

  // 3. Seed blog fallback
  const seedBlog = loadSeedBlog(slug, language);
  if (seedBlog) return seedBlog;

  return null;
}

export async function listBlogPosts(
  language: LanguageCode = "en",
): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];
  const seenSlugs = new Set<string>();

  // 1. Discover via DynamoDB Content Index
  try {
    const indices = await listContentIndices("blog", language);
    for (const index of indices) {
      if (!seenSlugs.has(index.slug)) {
        const post = await getBlogPost(index.slug, language);
        if (post) {
          posts.push(post);
          seenSlugs.add(index.slug);
        }
      }
    }
  } catch (err) {
    console.warn("[content] Error listing blogs from index:", err);
  }

  // 2. Fallback to known seed blog list if index empty
  for (const slug of KNOWN_BLOG_SLUGS) {
    if (!seenSlugs.has(slug)) {
      const post = await getBlogPost(slug, language);
      if (post) {
        posts.push(post);
        seenSlugs.add(slug);
      }
    }
  }

  // Sort: featured first, then published date descending
  return posts.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}
