import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Student } from "@/types/student";
import type { TopicProgress } from "@/types/progress";
import type { StudentRecord, TopicPerformance } from "@/types/student-record";

// ── Clients ───────────────────────────────────────────────────────────────────

const REGION = process.env.AWS_REGION;
const STUDENT_TABLE = process.env.AWS_DYNAMODB_TABLE ?? "";
const AUTH_TABLE = process.env.AWS_AUTH_TABLE ?? "";
const STUDENT_RECORD_TABLE = process.env.AWS_STUDENT_RECORD_TABLE ?? "";

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

// ── Student Record ────────────────────────────────────────────────────────────
// Partition key: studentId
// Shape: { studentId, language, topics: { [slug]: { score, attempts } }, weakTopics }

/** Weak-topic threshold — topics scoring below this are considered weak. */
const WEAK_THRESHOLD = 60;

/**
 * Recomputes weakTopics from the full topics map.
 * A topic is weak if score < WEAK_THRESHOLD.
 */
export function computeWeakTopics(
  topics: Record<string, TopicPerformance>,
): string[] {
  return Object.entries(topics)
    .filter(([, perf]) => perf.score < WEAK_THRESHOLD)
    .sort(([, a], [, b]) => a.score - b.score) // lowest score first
    .map(([slug]) => slug);
}

/**
 * Write (or overwrite) an entire StudentRecord.
 * Prefer `updateTopicScore` for incremental score updates.
 */
export async function putStudentRecord(record: StudentRecord): Promise<void> {
  if (!db || !STUDENT_RECORD_TABLE) return;
  await db.send(
    new PutCommand({
      TableName: STUDENT_RECORD_TABLE,
      Item: { ...record, updatedAt: Date.now() },
    }),
  );
}

/**
 * Fetch a student's full record by studentId.
 * Returns null when the table is unconfigured or the item doesn't exist.
 */
export async function getStudentRecord(
  studentId: string,
): Promise<StudentRecord | null> {
  if (!db || !STUDENT_RECORD_TABLE) return null;
  try {
    const res = await db.send(
      new GetCommand({
        TableName: STUDENT_RECORD_TABLE,
        Key: { studentId },
      }),
    );
    return res.Item ? (res.Item as StudentRecord) : null;
  } catch {
    return null;
  }
}

/**
 * Atomically update a single topic's score + attempts for a student,
 * then recompute and persist weakTopics.
 *
 * Uses a TWO-PHASE write to avoid a DynamoDB ValidationException:
 *   Phase 1 — ensures the item + topics map exist (safe to run on new students).
 *   Phase 2 — writes the nested topics.slug.score / attempts path.
 *
 * Only keeps the best (highest) score per topic across attempts.
 */
export async function updateTopicScore({
  studentId,
  language,
  topicSlug,
  score,
}: {
  studentId: string;
  language: "en" | "hi";
  topicSlug: string;
  score: number;
}): Promise<StudentRecord | null> {
  if (!db || !STUDENT_RECORD_TABLE) return null;

  // ── Phase 1: Ensure the item and top-level topics map exist ──────────────
  // DynamoDB cannot write to topics.slug.score when topics map doesn't exist.
  await db.send(
    new UpdateCommand({
      TableName: STUDENT_RECORD_TABLE,
      Key: { studentId },
      UpdateExpression: [
        "SET #lang       = if_not_exists(#lang,       :lang)",
        "    #topics     = if_not_exists(#topics,     :emptyMap)",
        "    #weakTopics = if_not_exists(#weakTopics, :emptyList)",
        "    #updatedAt  = :now",
      ].join(", "),
      ExpressionAttributeNames: {
        "#lang"      : "language",
        "#topics"    : "topics",
        "#weakTopics": "weakTopics",
        "#updatedAt" : "updatedAt",
      },
      ExpressionAttributeValues: {
        ":lang"     : language,
        ":emptyMap" : {},
        ":emptyList": [],
        ":now"      : Date.now(),
      },
    }),
  );

  // ── Phase 2: Write nested score + increment attempts ──────────────────────
  try {
    await db.send(
      new UpdateCommand({
        TableName: STUDENT_RECORD_TABLE,
        Key: { studentId },
        UpdateExpression: [
          "SET #topics.#slug.#attempts = if_not_exists(#topics.#slug.#attempts, :zero) + :one",
          "    #topics.#slug.#score    = :score",
          "    #updatedAt              = :now",
        ].join(", "),
        // Only overwrite score when the new score is strictly higher
        ConditionExpression:
          "attribute_not_exists(#topics.#slug.#score) OR #topics.#slug.#score < :score",
        ExpressionAttributeNames: {
          "#topics"   : "topics",
          "#slug"     : topicSlug,
          "#attempts" : "attempts",
          "#score"    : "score",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":score": score,
          ":zero" : 0,
          ":one"  : 1,
          ":now"  : Date.now(),
        },
      }),
    );
  } catch (err: unknown) {
    const awsErr = err as { name?: string };
    if (awsErr?.name === "ConditionalCheckFailedException") {
      // Existing score >= new score — just increment attempts, keep the higher score.
      await db.send(
        new UpdateCommand({
          TableName: STUDENT_RECORD_TABLE,
          Key: { studentId },
          UpdateExpression:
            "SET #topics.#slug.#attempts = if_not_exists(#topics.#slug.#attempts, :zero) + :one, #updatedAt = :now",
          ExpressionAttributeNames: {
            "#topics"   : "topics",
            "#slug"     : topicSlug,
            "#attempts" : "attempts",
            "#updatedAt": "updatedAt",
          },
          ExpressionAttributeValues: { ":zero": 0, ":one": 1, ":now": Date.now() },
        }),
      );
    } else {
      throw err;
    }
  }

  // ── Phase 3: Re-read and recompute weakTopics ─────────────────────────────
  const updated = await getStudentRecord(studentId);
  if (!updated) return null;

  const weakTopics = computeWeakTopics(updated.topics);
  await db.send(
    new UpdateCommand({
      TableName: STUDENT_RECORD_TABLE,
      Key: { studentId },
      UpdateExpression: "SET #weakTopics = :wt",
      ExpressionAttributeNames: { "#weakTopics": "weakTopics" },
      ExpressionAttributeValues: { ":wt": weakTopics },
    }),
  );

  return { ...updated, weakTopics };
}

// ── recordLogin ───────────────────────────────────────────────────────────────
// Called on EVERY successful login (new + returning users).
// Atomically upserts the StudentRecord row:
//   • initialises topics / weakTopics / language if the item is brand-new
//   • always stamps lastLoginAt + updatedAt
//   • always increments loginCount

export async function recordLogin({
  studentId,
  language,
}: {
  studentId: string;
  language: "en" | "hi";
}): Promise<void> {
  if (!db || !STUDENT_RECORD_TABLE) return;

  await db.send(
    new UpdateCommand({
      TableName: STUDENT_RECORD_TABLE,
      Key: { studentId },
      UpdateExpression: [
        "SET #lang        = if_not_exists(#lang,       :lang)",
        "    #topics      = if_not_exists(#topics,     :emptyMap)",
        "    #weakTopics  = if_not_exists(#weakTopics, :emptyList)",
        "    #lastLoginAt = :now",
        "    #updatedAt   = :ts",
        "    #loginCount  = if_not_exists(#loginCount, :zero) + :one",
      ].join(", "),
      ExpressionAttributeNames: {
        "#lang"       : "language",
        "#topics"     : "topics",
        "#weakTopics" : "weakTopics",
        "#lastLoginAt": "lastLoginAt",
        "#updatedAt"  : "updatedAt",
        "#loginCount" : "loginCount",
      },
      ExpressionAttributeValues: {
        ":lang"     : language,
        ":emptyMap" : {},
        ":emptyList": [],
        ":now"      : new Date().toISOString(),
        ":ts"       : Date.now(),
        ":zero"     : 0,
        ":one"      : 1,
      },
    }),
  );
}
