import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { Article, BlogPost, Mindmap } from "@/types/content";
import { getAwsCredentials, getEnv } from "@/config/env";

const BUCKET = getEnv("AWS_S3_BUCKET") || "";
const REGION = getEnv("AWS_REGION");
const client = REGION
  ? new S3Client({ region: REGION, credentials: getAwsCredentials() })
  : null;

const memoryS3Store = new Map<string, unknown>();

export async function getContent<T>(key: string): Promise<T | null> {
  return s3Get<T>(key);
}

export async function putContent<T>(key: string, data: T): Promise<void> {
  return s3Put(key, data);
}

async function s3Get<T>(key: string): Promise<T | null> {
  if (!client || !BUCKET) {
    return (memoryS3Store.get(key) as T) ?? null;
  }
  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const res = await client.send(cmd);
    const body = await res.Body?.transformToString();
    if (!body) return null;
    const parsed = JSON.parse(body) as T;
    memoryS3Store.set(key, parsed);
    return parsed;
  } catch (error: unknown) {
    const s3Error = error as { name?: string };
    if (s3Error?.name === "NoSuchKey" || s3Error?.name === "NotFound") {
      return (memoryS3Store.get(key) as T) ?? null;
    }
    console.error(`[s3] Error getting key ${key}:`, error);
    return (memoryS3Store.get(key) as T) ?? null;
  }
}

async function s3Put(key: string, data: unknown): Promise<void> {
  memoryS3Store.set(key, data);
  if (!client || !BUCKET) {
    return;
  }
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: JSON.stringify(data),
        ContentType: "application/json",
      }),
    );
  } catch (error) {
    console.error(`[s3] Error putting key ${key}:`, error);
  }
}

// ── Articles ──────────────────────────────────────────────────────────────────

export async function getArticle(
  topicSlug: string,
  language: "en" | "hi",
): Promise<Article | null> {
  return s3Get<Article>(`articles/${topicSlug}/${language}.json`);
}

export async function putArticle(article: Article): Promise<void> {
  await s3Put(
    `articles/${article.topicSlug}/${article.language}.json`,
    article,
  );
}

// ── Blogs (blogs/<slug>/<language>.json) ──────────────────────────────────────

export async function getBlog(
  slug: string,
  language: "en" | "hi" = "en",
): Promise<BlogPost | null> {
  return s3Get<BlogPost>(`blogs/${slug}/${language}.json`);
}

export async function putBlog(blog: BlogPost): Promise<void> {
  await s3Put(`blogs/${blog.slug}/${blog.language}.json`, blog);
}

// ── Mindmaps (Language-Keyed: mindmaps/<topic>/<language>.json) ───────────────

export async function getMindmap(
  topicSlug: string,
  language: "en" | "hi" = "en",
): Promise<Mindmap | null> {
  return s3Get<Mindmap>(`mindmaps/${topicSlug}/${language}.json`);
}

export async function putMindmap(
  mindmap: Mindmap,
  language?: "en" | "hi",
): Promise<void> {
  const resolvedLang = language ?? mindmap.language ?? "en";
  await s3Put(`mindmaps/${mindmap.topicSlug}/${resolvedLang}.json`, {
    ...mindmap,
    language: resolvedLang,
  });
}

