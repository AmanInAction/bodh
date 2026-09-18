import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Student } from "@/types/student";
import type { TopicProgress } from "@/types/progress";

// ── Clients ───────────────────────────────────────────────────────────────────

const REGION = process.env.AWS_REGION;
const STUDENT_TABLE = process.env.AWS_DYNAMODB_TABLE ?? "";
const AUTH_TABLE = process.env.AWS_AUTH_TABLE ?? "";

const rawClient = REGION ? new DynamoDBClient({ region: REGION }) : null;
const db = rawClient ? DynamoDBDocumentClient.from(rawClient) : null;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function dbGet<T>(table: string, pk: string): Promise<T | null> {
  if (!db || !table) return null;
  try {
    const res = await db.send(
      new GetCommand({ TableName: table, Key: { pk } }),
    );
    return res.Item ? (res.Item as T) : null;
  } catch {
    return null;
  }
}

async function dbPut(table: string, item: Record<string, unknown>): Promise<void> {
  if (!db || !table) return;
  await db.send(new PutCommand({ TableName: table, Item: item }));
}

async function dbDelete(table: string, pk: string): Promise<void> {
  if (!db || !table) return;
  await db.send(new DeleteCommand({ TableName: table, Key: { pk } }));
}

// ── Student Profile ───────────────────────────────────────────────────────────

export async function getStudentProfile(email: string): Promise<Student | null> {
  const row = await dbGet<{ pk: string; profile: Student }>(
    STUDENT_TABLE,
    `student:${email}`,
  );
  return row?.profile ?? null;
}

export async function putStudentProfile(student: Student): Promise<void> {
  await dbPut(STUDENT_TABLE, {
    pk: `student:${student.email}`,
    profile: student,
    updatedAt: Date.now(),
  });
}

// ── Roadmap ───────────────────────────────────────────────────────────────────

export async function getRoadmapFromDB(
  email: string,
): Promise<TopicProgress[] | null> {
  const row = await dbGet<{ pk: string; roadmap: TopicProgress[] }>(
    STUDENT_TABLE,
    `roadmap:${email}`,
  );
  return row?.roadmap ?? null;
}

export async function putRoadmapToDB(
  email: string,
  roadmap: TopicProgress[],
): Promise<void> {
  await dbPut(STUDENT_TABLE, {
    pk: `roadmap:${email}`,
    roadmap,
    updatedAt: Date.now(),
  });
}

// ── Auth Codes ────────────────────────────────────────────────────────────────

export async function getAuthCode(
  email: string,
): Promise<{ code: string; expiresAt: number } | null> {
  const row = await dbGet<{
    pk: string;
    code: string;
    expiresAt: number;
  }>(AUTH_TABLE, `auth:${email}`);
  if (!row) return null;
  return { code: row.code, expiresAt: row.expiresAt };
}

export async function putAuthCode(
  email: string,
  code: string,
  expiresAt: number,
): Promise<void> {
  await dbPut(AUTH_TABLE, {
    pk: `auth:${email}`,
    code,
    expiresAt,
    ttl: Math.floor(expiresAt / 1000), // DynamoDB TTL (seconds)
  });
}

export async function deleteAuthCode(email: string): Promise<void> {
  await dbDelete(AUTH_TABLE, `auth:${email}`);
}
