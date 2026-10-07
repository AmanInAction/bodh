import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { Article, Mindmap } from "@/types/content";
import { getAwsCredentials, getEnv } from "@/config/env";

const BUCKET = getEnv("AWS_S3_BUCKET") || "";
const REGION = getEnv("AWS_REGION");
const client = REGION
  ? new S3Client({ region: REGION, credentials: getAwsCredentials() })
  : null;

const memoryS3Store = new Map<string, unknown>();

async function s3Get<T>(key: string): Promise<T | null> {
  if (!client || !BUCKET) {
    return (memoryS3Store.get(key) as T) ?? null;
  }
  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const res = await client.send(cmd);
    const body = await res.Body?.transformToString();
    return body ? (JSON.parse(body) as T) : null;
  } catch (error: unknown) {
    const s3Error = error as { name?: string };
    if (s3Error?.name === "NoSuchKey" || s3Error?.name === "NotFound") {
      return null;
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

// ── Mindmaps ──────────────────────────────────────────────────────────────────

export async function getMindmap(topicSlug: string): Promise<Mindmap | null> {
  return s3Get<Mindmap>(`mindmaps/${topicSlug}.json`);
}

export async function putMindmap(mindmap: Mindmap): Promise<void> {
  await s3Put(`mindmaps/${mindmap.topicSlug}.json`, mindmap);
}
