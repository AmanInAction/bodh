export type ArticleSection = {
  heading: string;
  body: string;
};

export type Article = {
  topicSlug: string;
  language: "en" | "hi";
  title: string;
  lead: string;
  sections: ArticleSection[];
  tryThis: string;
  learningObjectives?: string[];
  prerequisites?: string[];
};

// ── Content Index Architecture (DynamoDB Index <-> S3 Canonical Content) ──────

export type ContentType = "article" | "blog";
export type ContentStatus = "draft" | "published" | "archived";

export type ContentIndex = {
  contentId: string; // e.g. "article:arrays:en", "blog:why-time-complexity-matters:en"
  contentType: ContentType;
  slug: string;
  topicSlug?: string;
  language: "en" | "hi";
  status: ContentStatus;
  s3Key: string;
  title: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  authorId?: string;
  authorName?: string;
  readingTime?: number; // estimated minutes
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

// ── Blog Post Types ───────────────────────────────────────────────────────────

export type BlogCodeSnippet = {
  language: string;
  code: string;
  caption?: string;
};

export type BlogSection = {
  heading?: string;
  body: string;
  callout?: string;
  codeSnippet?: BlogCodeSnippet;
};

export type BlogPost = {
  slug: string;
  language: "en" | "hi";
  title: string;
  excerpt: string;
  lead: string;
  category: string;
  tags: string[];
  authorName: string;
  authorRole?: string;
  publishedAt: string;
  readingTime: number; // in minutes
  featured?: boolean;
  sections: BlogSection[];
  relatedTopics?: string[]; // topic slugs e.g. ["arrays", "linked-list"]
};
