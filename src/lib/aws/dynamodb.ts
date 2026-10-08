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
import type {
  LearningGoal,
  StudentRecord,
  SupportedLanguage,
  TeachingStyle,
  TopicPerformance,
} from "@/types/student-record";
import { getAwsCredentials, getEnv } from "@/config/env";
import { DEMO_STUDENT_ID } from "@/lib/auth/session";

// ── Clients ───────────────────────────────────────────────────────────────────

const REGION = getEnv("AWS_REGION");
const STUDENT_TABLE = getEnv("AWS_DYNAMODB_TABLE") || "";
const AUTH_TABLE = getEnv("AWS_AUTH_TABLE") || "";
const STUDENT_RECORD_TABLE = getEnv("AWS_STUDENT_RECORD_TABLE") || "";

const rawClient = REGION
  ? new DynamoDBClient({ region: REGION, credentials: getAwsCredentials() })
  : null;
const db = rawClient ? DynamoDBDocumentClient.from(rawClient) : null;

// In-memory fallback when DynamoDB is not configured
const memoryTableStore = new Map<string, Record<string, unknown>>();
const memoryStudentRecordStore = new Map<string, StudentRecord>();

/**
 * Resolves any email or student identifier to the canonical `studentId` key
 * used in `StudentRecord`.
 */
export function resolveStudentId(emailOrId: string): string {
  const normalized = emailOrId.trim().toLowerCase();
  if (normalized === "student_001@bodh.demo" || normalized === DEMO_STUDENT_ID) {
    return DEMO_STUDENT_ID;
  }
  return normalized;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function dbGet<T>(table: string, pk: string): Promise<T | null> {
  if (!db || !table) {
    const item = memoryTableStore.get(`${table || "default"}:${pk}`);
    return item ? (item as T) : null;
  }
  try {
    const res = await db.send(
      new GetCommand({ TableName: table, Key: { pk } }),
    );
    return res.Item ? (res.Item as T) : null;
  } catch (error) {
    console.error(
      `[dynamodb] Error in dbGet on ${table} for key ${pk}:`,
      error,
    );
    const item = memoryTableStore.get(`${table || "default"}:${pk}`);
    return item ? (item as T) : null;
  }
}

async function dbPut(
  table: string,
  item: Record<string, unknown>,
): Promise<void> {
  const pk = typeof item.pk === "string" ? item.pk : "";
  if (pk) {
    memoryTableStore.set(`${table || "default"}:${pk}`, item);
  }
  if (!db || !table) {
    return;
  }
  try {
    await db.send(new PutCommand({ TableName: table, Item: item }));
  } catch (error) {
    console.error(`[dynamodb] Error in dbPut on ${table}:`, error);
  }
}

async function dbDelete(table: string, pk: string): Promise<void> {
  memoryTableStore.delete(`${table || "default"}:${pk}`);
  if (!db || !table) {
    return;
  }
  try {
    await db.send(new DeleteCommand({ TableName: table, Key: { pk } }));
  } catch (error) {
    console.error(
      `[dynamodb] Error in dbDelete on ${table} for key ${pk}:`,
      error,
    );
  }
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

// ── Canonical Student Record ──────────────────────────────────────────────────
// Partition key: studentId
// Single source of truth for profile, language preference, and topic scores.

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
 */
export async function putStudentRecord(record: StudentRecord): Promise<void> {
  const canonicalId = resolveStudentId(record.studentId);
  const updatedRecord: StudentRecord = {
    ...record,
    studentId: canonicalId,
    updatedAt: Date.now(),
  };
  memoryStudentRecordStore.set(canonicalId, updatedRecord);
  if (!db || !STUDENT_RECORD_TABLE) {
    return;
  }
  try {
    await db.send(
      new PutCommand({
        TableName: STUDENT_RECORD_TABLE,
        Item: updatedRecord,
      }),
    );
  } catch (error) {
    console.error("[dynamodb] Error in putStudentRecord:", error);
  }
}

/**
 * Fetch a student's full record by studentId (or email).
 * Returns null when the item doesn't exist.
 */
export async function getStudentRecord(
  studentIdOrEmail: string,
): Promise<StudentRecord | null> {
  const canonicalId = resolveStudentId(studentIdOrEmail);
  if (!db || !STUDENT_RECORD_TABLE) {
    return memoryStudentRecordStore.get(canonicalId) ?? null;
  }
  try {
    const res = await db.send(
      new GetCommand({
        TableName: STUDENT_RECORD_TABLE,
        Key: { studentId: canonicalId },
      }),
    );
    if (res.Item) {
      const record = res.Item as StudentRecord;
      memoryStudentRecordStore.set(canonicalId, record);
      return record;
    }
    return memoryStudentRecordStore.get(canonicalId) ?? null;
  } catch (error) {
    console.error(
      `[dynamodb] Error in getStudentRecord for ${canonicalId}:`,
      error,
    );
    return memoryStudentRecordStore.get(canonicalId) ?? null;
  }
}

/**
 * Updates profile/preference fields (language, name, preferredStyle, goal)
 * directly on the canonical StudentRecord so language state never splits.
 */
export async function updateStudentProfile(
  studentIdOrEmail: string,
  updates: {
    name?: string;
    email?: string;
    language?: SupportedLanguage;
    preferredStyle?: TeachingStyle;
    goal?: LearningGoal;
  },
): Promise<StudentRecord> {
  const canonicalId = resolveStudentId(studentIdOrEmail);
  const existing = await getStudentRecord(canonicalId);
  const nowIso = new Date().toISOString();

  const merged: StudentRecord = {
    studentId: canonicalId,
    name: updates.name ?? existing?.name ?? canonicalId.split("@")[0],
    email: updates.email ?? existing?.email ?? studentIdOrEmail,
    language: updates.language ?? existing?.language ?? "en",
    preferredStyle: updates.preferredStyle ?? existing?.preferredStyle ?? "simple",
    goal: updates.goal ?? existing?.goal,
    topics: existing?.topics ?? {},
    weakTopics: existing?.weakTopics ?? [],
    streakDays: existing?.streakDays ?? 1,
    lastActiveDate: existing?.lastActiveDate,
    loginCount: existing?.loginCount ?? 1,
    lastLoginAt: existing?.lastLoginAt ?? nowIso,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: Date.now(),
  };

  memoryStudentRecordStore.set(canonicalId, merged);

  if (db && STUDENT_RECORD_TABLE) {
    try {
      await db.send(
        new UpdateCommand({
          TableName: STUDENT_RECORD_TABLE,
          Key: { studentId: canonicalId },
          UpdateExpression: [
            "SET #lang       = :lang",
            "    #name       = :name",
            "    #email      = :email",
            "    #style      = :style",
            "    #topics     = if_not_exists(#topics, :emptyMap)",
            "    #weakTopics = if_not_exists(#weakTopics, :emptyList)",
            "    #createdAt  = if_not_exists(#createdAt, :createdAt)",
            "    #updatedAt  = :updatedAt",
          ].join(", "),
          ExpressionAttributeNames: {
            "#lang": "language",
            "#name": "name",
            "#email": "email",
            "#style": "preferredStyle",
            "#topics": "topics",
            "#weakTopics": "weakTopics",
            "#createdAt": "createdAt",
            "#updatedAt": "updatedAt",
          },
          ExpressionAttributeValues: {
            ":lang": merged.language,
            ":name": merged.name,
            ":email": merged.email,
            ":style": merged.preferredStyle,
            ":emptyMap": {},
            ":emptyList": [],
            ":createdAt": merged.createdAt,
            ":updatedAt": merged.updatedAt,
          },
        }),
      );
    } catch (error) {
      console.error(
        `[dynamodb] Error in updateStudentProfile for ${canonicalId}:`,
        error,
      );
    }
  }

  return merged;
}

// ── Legacy Student Profile Wrappers (Delegated to Canonical StudentRecord) ────
// Kept so any caller importing getStudentProfile/putStudentProfile reads and
// writes the exact same canonical StudentRecord rather than a split table.

export async function getStudentProfile(
  email: string,
): Promise<Student | null> {
  const record = await getStudentRecord(email);
  if (!record) return null;
  return {
    id: record.studentId,
    name: record.name ?? email.split("@")[0],
    email: record.email ?? email,
    language: record.language,
    preferredStyle: record.preferredStyle ?? "simple",
    createdAt: record.createdAt ?? new Date().toISOString(),
  };
}

export async function putStudentProfile(student: Student): Promise<void> {
  await updateStudentProfile(student.email || student.id, {
    name: student.name,
    email: student.email,
    language: student.language,
    preferredStyle: student.preferredStyle,
  });
}

/**
 * Atomically update a single topic's score + attempts for a student,
 * then recompute and persist weakTopics.
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
  const canonicalId = resolveStudentId(studentId);

  if (!db || !STUDENT_RECORD_TABLE) {
    const existing = memoryStudentRecordStore.get(canonicalId) ?? {
      studentId: canonicalId,
      language,
      topics: {},
      weakTopics: [],
    };
    const prevTopic = existing.topics[topicSlug] ?? { score: 0, attempts: 0 };
    const nextTopics = {
      ...existing.topics,
      [topicSlug]: {
        score: Math.max(prevTopic.score, score),
        attempts: (prevTopic.attempts ?? 0) + 1,
      },
    };
    const updatedRecord: StudentRecord = {
      ...existing,
      language: language || existing.language,
      topics: nextTopics,
      weakTopics: computeWeakTopics(nextTopics),
      updatedAt: Date.now(),
    };
    memoryStudentRecordStore.set(canonicalId, updatedRecord);
    return updatedRecord;
  }

  // ── Phase 1: Ensure the item and top-level topics map exist ──────────────
  await db.send(
    new UpdateCommand({
      TableName: STUDENT_RECORD_TABLE,
      Key: { studentId: canonicalId },
      UpdateExpression: [
        "SET #lang       = :lang",
        "    #topics     = if_not_exists(#topics,     :emptyMap)",
        "    #weakTopics = if_not_exists(#weakTopics, :emptyList)",
        "    #updatedAt  = :now",
      ].join(", "),
      ExpressionAttributeNames: {
        "#lang": "language",
        "#topics": "topics",
        "#weakTopics": "weakTopics",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":lang": language,
        ":emptyMap": {},
        ":emptyList": [],
        ":now": Date.now(),
      },
    }),
  );

  // Phase 1b: ensure topics[slug] exists
  await db.send(
    new UpdateCommand({
      TableName: STUDENT_RECORD_TABLE,
      Key: { studentId: canonicalId },
      UpdateExpression:
        "SET #topics.#slug = if_not_exists(#topics.#slug, :emptyTopic)",
      ExpressionAttributeNames: { "#topics": "topics", "#slug": topicSlug },
      ExpressionAttributeValues: { ":emptyTopic": { score: 0, attempts: 0 } },
    }),
  );
  // ── Phase 2: Write nested score + increment attempts ──────────────────────
  try {
    await db.send(
      new UpdateCommand({
        TableName: STUDENT_RECORD_TABLE,
        Key: { studentId: canonicalId },
        UpdateExpression: [
          "SET #topics.#slug.#attempts = if_not_exists(#topics.#slug.#attempts, :zero) + :one",
          "    #topics.#slug.#score    = :score",
          "    #updatedAt              = :now",
        ].join(", "),
        ConditionExpression:
          "attribute_not_exists(#topics.#slug.#score) OR #topics.#slug.#score < :score",
        ExpressionAttributeNames: {
          "#topics": "topics",
          "#slug": topicSlug,
          "#attempts": "attempts",
          "#score": "score",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":score": score,
          ":zero": 0,
          ":one": 1,
          ":now": Date.now(),
        },
      }),
    );
  } catch (err: unknown) {
    const awsErr = err as { name?: string };
    if (awsErr?.name === "ConditionalCheckFailedException") {
      await db.send(
        new UpdateCommand({
          TableName: STUDENT_RECORD_TABLE,
          Key: { studentId: canonicalId },
          UpdateExpression:
            "SET #topics.#slug.#attempts = if_not_exists(#topics.#slug.#attempts, :zero) + :one, #updatedAt = :now",
          ExpressionAttributeNames: {
            "#topics": "topics",
            "#slug": topicSlug,
            "#attempts": "attempts",
            "#updatedAt": "updatedAt",
          },
          ExpressionAttributeValues: {
            ":zero": 0,
            ":one": 1,
            ":now": Date.now(),
          },
        }),
      );
    } else {
      throw err;
    }
  }

  // ── Phase 3: Re-read and recompute weakTopics ─────────────────────────────
  const updated = await getStudentRecord(canonicalId);
  if (!updated) return null;

  const weakTopics = computeWeakTopics(updated.topics);
  await db.send(
    new UpdateCommand({
      TableName: STUDENT_RECORD_TABLE,
      Key: { studentId: canonicalId },
      UpdateExpression: "SET #weakTopics = :wt",
      ExpressionAttributeNames: { "#weakTopics": "weakTopics" },
      ExpressionAttributeValues: { ":wt": weakTopics },
    }),
  );

  const finalRecord = { ...updated, weakTopics };
  memoryStudentRecordStore.set(canonicalId, finalRecord);
  return finalRecord;
}

// ── recordLogin ───────────────────────────────────────────────────────────────

export async function recordLogin({
  studentId,
  language,
}: {
  studentId: string;
  language: "en" | "hi";
}): Promise<void> {
  const canonicalId = resolveStudentId(studentId);

  if (!db || !STUDENT_RECORD_TABLE) {
    const existing = memoryStudentRecordStore.get(canonicalId);
    memoryStudentRecordStore.set(canonicalId, {
      ...existing,
      studentId: canonicalId,
      language: existing?.language ?? language,
      topics: existing?.topics ?? {},
      weakTopics: existing?.weakTopics ?? [],
      lastLoginAt: new Date().toISOString(),
      updatedAt: Date.now(),
      loginCount: (existing?.loginCount ?? 0) + 1,
    });
    return;
  }

  try {
    await db.send(
      new UpdateCommand({
        TableName: STUDENT_RECORD_TABLE,
        Key: { studentId: canonicalId },
        UpdateExpression: [
          "SET #lang        = if_not_exists(#lang,       :lang)",
          "    #topics      = if_not_exists(#topics,     :emptyMap)",
          "    #weakTopics  = if_not_exists(#weakTopics, :emptyList)",
          "    #lastLoginAt = :now",
          "    #updatedAt   = :ts",
          "    #loginCount  = if_not_exists(#loginCount, :zero) + :one",
        ].join(", "),
        ExpressionAttributeNames: {
          "#lang": "language",
          "#topics": "topics",
          "#weakTopics": "weakTopics",
          "#lastLoginAt": "lastLoginAt",
          "#updatedAt": "updatedAt",
          "#loginCount": "loginCount",
        },
        ExpressionAttributeValues: {
          ":lang": language,
          ":emptyMap": {},
          ":emptyList": [],
          ":now": new Date().toISOString(),
          ":ts": Date.now(),
          ":zero": 0,
          ":one": 1,
        },
      }),
    );
  } catch (error) {
    console.error(`[dynamodb] Error in recordLogin for ${canonicalId}:`, error);
  }
}
