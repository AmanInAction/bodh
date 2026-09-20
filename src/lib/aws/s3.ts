import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { Article, Mindmap } from "@/types/content";

const BUCKET = process.env.aWs_S3_BUCKET ?? "";
const client = process.env.aWs_REGION
  ? new S3Client({ region: process.env.aWs_REGION })
  : null;

async function s3Get<T>(key: string): Promise<T | null> {
  if (!client || !BUCKET) return null;
  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const res = await client.send(cmd);
    const body = await res.Body?.transformToString();
    return body ? (JSON.parse(body) as T) : null;
  } catch {
    return null;
  }
}

async function s3Put(key: string, data: unknown): Promise<void> {
  if (!client || !BUCKET) return;
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    }),
  );
}

// ── Articles ──────────────────────────────────────────────────────────────────

export async function getArticle(
  topicSlug: string,
  language: "en" | "hi",
): Promise<Article | null> {
  return s3Get<Article>(`articles/${topicSlug}/${language}.json`);
}

export async function putArticle(article: Article): Promise<void> {
  await s3Put(`articles/${article.topicSlug}/${article.language}.json`, article);
}

// ── Mindmaps ──────────────────────────────────────────────────────────────────

export async function getMindmap(topicSlug: string): Promise<Mindmap | null> {
  return s3Get<Mindmap>(`mindmaps/${topicSlug}.json`);
}

export async function putMindmap(mindmap: Mindmap): Promise<void> {
  await s3Put(`mindmaps/${mindmap.topicSlug}.json`, mindmap);
}
