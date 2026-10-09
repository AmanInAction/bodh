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
import type { ContentIndex, ContentType } from "@/types/content";
import { getAwsCredentials, getEnv } from "@/config/env";
import { DEMO_STUDENT_ID } from "@/lib/auth/session";

// ── Clients ───────────────────────────────────────────────────────────────────

const REGION = getEnv("AWS_REGION");
const STUDENT_TABLE = getEnv("AWS_DYNAMODB_TABLE") || "";
const AUTH_TABLE = getEnv("AWS_AUTH_TABLE") || "";
const STUDENT_RECORD_TABLE = getEnv("AWS_STUDENT_RECORD_TABLE") || "";
const CONTENT_TABLE = getEnv("AWS_CONTENT_INDEX_TABLE") || getEnv("AWS_CONTENT_TABLE") || "";

const rawClient = REGION
  ? new DynamoDBClient({ region: REGION, credentials: getAwsCredentials() })
  : null;
const db = rawClient ? DynamoDBDocumentClient.from(rawClient) : null;

// In-memory fallback when DynamoDB is not configured
const memoryTableStore = new Map<string, Record<string, unknown>>();
const memoryStudentRecordStore = new Map<string, StudentRecord>();
const memoryContentIndexStore = new Map<string, ContentIndex>();

// Pre-seed memory content index with initial catalog
function seedMemoryContentIndex() {
  const topicsList = [
    { slug: "arrays", enTitle: "Arrays", hiTitle: "ऐरे (Arrays)" },
    { slug: "linked-list", enTitle: "Linked Lists", hiTitle: "लिंक्ड लिस्ट" },
    { slug: "stacks", enTitle: "Stacks", hiTitle: "स्टैक (Stacks)" },
    { slug: "queues", enTitle: "Queues", hiTitle: "क्यू (Queues)" },
    { slug: "binary-search", enTitle: "Binary Search", hiTitle: "बाइनरी सर्च" },
    { slug: "recursion", enTitle: "Recursion", hiTitle: "रिकर्शन" },
  ];

  const now = "2026-10-09T00:00:00.000Z";

  // Articles & Mindmaps
  for (const t of topicsList) {
    // Article EN
    memoryContentIndexStore.set(`article:${t.slug}:en`, {
      contentId: `article:${t.slug}:en`,
      contentType: "article",
      slug: t.slug,
      topicSlug: t.slug,
      language: "en",
      status: "published",
      s3Key: `articles/${t.slug}/en.json`,
      title: `Understanding ${t.enTitle}`,
      excerpt: `Core intuition and step-by-step mental models for ${t.enTitle}.`,
      category: "Data Structures",
      readingTime: 6,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    });
    // Article HI
    memoryContentIndexStore.set(`article:${t.slug}:hi`, {
      contentId: `article:${t.slug}:hi`,
      contentType: "article",
      slug: t.slug,
      topicSlug: t.slug,
      language: "hi",
      status: "published",
      s3Key: `articles/${t.slug}/hi.json`,
      title: `${t.hiTitle} को समझना`,
      excerpt: `${t.hiTitle} की मुख्य अवधारणा और मानसिक मॉडल।`,
      category: "डेटा स्ट्रक्चर्स",
      readingTime: 6,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    });
    // Mindmap EN
    memoryContentIndexStore.set(`mindmap:${t.slug}:en`, {
      contentId: `mindmap:${t.slug}:en`,
      contentType: "mindmap",
      slug: t.slug,
      topicSlug: t.slug,
      language: "en",
      status: "published",
      s3Key: `mindmaps/${t.slug}/en.json`,
      title: `${t.enTitle} Visual Map`,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    });
    // Mindmap HI
    memoryContentIndexStore.set(`mindmap:${t.slug}:hi`, {
      contentId: `mindmap:${t.slug}:hi`,
      contentType: "mindmap",
      slug: t.slug,
      topicSlug: t.slug,
      language: "hi",
      status: "published",
      s3Key: `mindmaps/${t.slug}/hi.json`,
      title: `${t.hiTitle} विज़ुअल मैप`,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    });
  }

  // Seed Educational Blogs
  const seedBlogs = [
    {
      slug: "why-time-complexity-matters",
      en: {
        title: "Why Time Complexity Matters in Class 11–12",
        excerpt: "Learn how Big-O helps you predict program speed before writing code, without memorizing heavy mathematical notation.",
        category: "Complexity & Analysis",
        readingTime: 5,
      },
      hi: {
        title: "कक्षा 11–12 में Time Complexity को समझना क्यों ज़रूरी है?",
        excerpt: "बिना कठिन गणितीय सूत्रों के समझें कि Big-O कोड चलाने से पहले प्रोग्राम की गति का अनुमान कैसे लगाता है।",
        category: "जटिलता और विश्लेषण",
        readingTime: 5,
      },
      tags: ["big-o", "time-complexity", "foundations"],
      authorName: "bodh. Team",
      publishedAt: "2026-10-01T10:00:00.000Z",
    },
    {
      slug: "visualizing-recursion-call-stack",
      en: {
        title: "Visualizing the Recursion Call Stack Without Panic",
        excerpt: "A calm, visual way to understand base cases, call frames, and how recursion unwinds on the stack.",
        category: "Core Algorithms",
        readingTime: 6,
      },
      hi: {
        title: "बिना घबराए Recursion Call Stack को कैसे विज़ुअलाइज़ करें?",
        excerpt: "Base cases, कॉल फ्रेम्स और स्टैक से फ़ंक्शन की वापसी को समझने का शांत और स्पष्ट विज़ुअल तरीका।",
        category: "एल्गोरिदम",
        readingTime: 6,
      },
      tags: ["recursion", "call-stack", "visual"],
      authorName: "bodh. Team",
      publishedAt: "2026-10-03T10:00:00.000Z",
    },
    {
      slug: "arrays-vs-linked-lists",
      en: {
        title: "Arrays vs Linked Lists: The Real Memory Mental Model",
        excerpt: "Why cache locality makes contiguous arrays fast, and when linked list node pointers are genuinely useful.",
        category: "Data Structures",
        readingTime: 5,
      },
      hi: {
        title: "Arrays vs Linked Lists: मेमोरी और परफॉर्मेंस का सही मॉडल",
        excerpt: "कंप्यूटर मेमोरी में लगातार स्लॉट और अलग-अलग नोड पॉइंटर्स के बीच वास्तविक अंतर को समझें।",
        category: "डेटा स्ट्रक्चर्स",
        readingTime: 5,
      },
      tags: ["arrays", "linked-list", "memory"],
      authorName: "bodh. Team",
      publishedAt: "2026-10-05T10:00:00.000Z",
    },
  ];

  for (const b of seedBlogs) {
    memoryContentIndexStore.set(`blog:${b.slug}:en`, {
      contentId: `blog:${b.slug}:en`,
      contentType: "blog",
      slug: b.slug,
      language: "en",
      status: "published",
      s3Key: `blogs/${b.slug}/en.json`,
      title: b.en.title,
      excerpt: b.en.excerpt,
      category: b.en.category,
      tags: b.tags,
      authorName: b.authorName,
      readingTime: b.en.readingTime,
      createdAt: b.publishedAt,
      updatedAt: b.publishedAt,
      publishedAt: b.publishedAt,
    });
    memoryContentIndexStore.set(`blog:${b.slug}:hi`, {
      contentId: `blog:${b.slug}:hi`,
      contentType: "blog",
      slug: b.slug,
      language: "hi",
      status: "published",
      s3Key: `blogs/${b.slug}/hi.json`,
      title: b.hi.title,
      excerpt: b.hi.excerpt,
      category: b.hi.category,
      tags: b.tags,
      authorName: b.authorName,
      readingTime: b.hi.readingTime,
      createdAt: b.publishedAt,
      updatedAt: b.publishedAt,
      publishedAt: b.publishedAt,
    });
  }
}

seedMemoryContentIndex();

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

  const goal = updates.goal ?? existing?.goal;
  const derivedStyle: TeachingStyle =
    updates.preferredStyle ??
    (updates.goal === "scratch"
      ? "simple"
      : updates.goal === "foundations"
      ? "visual"
      : updates.goal === "interview"
      ? "interview"
      : existing?.preferredStyle ?? "simple");

  const merged: StudentRecord = {
    studentId: canonicalId,
    name: updates.name ?? existing?.name ?? canonicalId.split("@")[0],
    email: updates.email ?? existing?.email ?? studentIdOrEmail,
    language: updates.language ?? existing?.language ?? "en",
    preferredStyle: derivedStyle,
    goal,
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
      const updateExpressions = [
        "SET #lang       = :lang",
        "    #name       = :name",
        "    #email      = :email",
        "    #style      = :style",
        "    #topics     = if_not_exists(#topics, :emptyMap)",
        "    #weakTopics = if_not_exists(#weakTopics, :emptyList)",
        "    #createdAt  = if_not_exists(#createdAt, :createdAt)",
        "    #updatedAt  = :updatedAt",
      ];
      const exprAttrNames: Record<string, string> = {
        "#lang": "language",
        "#name": "name",
        "#email": "email",
        "#style": "preferredStyle",
        "#topics": "topics",
        "#weakTopics": "weakTopics",
        "#createdAt": "createdAt",
        "#updatedAt": "updatedAt",
      };
      const exprAttrValues: Record<string, unknown> = {
        ":lang": merged.language,
        ":name": merged.name,
        ":email": merged.email,
        ":style": merged.preferredStyle,
        ":emptyMap": {},
        ":emptyList": [],
        ":createdAt": merged.createdAt,
        ":updatedAt": merged.updatedAt,
      };

      if (goal) {
        updateExpressions.push("    #goal = :goal");
        exprAttrNames["#goal"] = "goal";
        exprAttrValues[":goal"] = goal;
      }

      await db.send(
        new UpdateCommand({
          TableName: STUDENT_RECORD_TABLE,
          Key: { studentId: canonicalId },
          UpdateExpression: updateExpressions.join(", "),
          ExpressionAttributeNames: exprAttrNames,
          ExpressionAttributeValues: exprAttrValues,
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
 * Daily streak calculator comparing the last active date (YYYY-MM-DD)
 * against today's calendar date (UTC).
 * - Same day: streak stays currentStreak (minimum 1).
 * - Next consecutive day (diff === 1): streak increments by 1.
 * - Missed 1+ days (diff > 1): streak resets to 1.
 * - First activity: streak is 1.
 */
export function calculateDailyStreak(
  lastActiveDate?: string,
  currentStreak = 0,
): { streakDays: number; lastActiveDate: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (!lastActiveDate) {
    return { streakDays: 1, lastActiveDate: today };
  }
  if (lastActiveDate === today) {
    return { streakDays: Math.max(1, currentStreak), lastActiveDate: today };
  }

  const lastTime = new Date(`${lastActiveDate}T00:00:00Z`).getTime();
  const curTime = new Date(`${today}T00:00:00Z`).getTime();
  const diffDays = Math.round((curTime - lastTime) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return { streakDays: Math.max(1, currentStreak) + 1, lastActiveDate: today };
  } else {
    return { streakDays: 1, lastActiveDate: today };
  }
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
  teachingStyle,
  missedConcepts,
}: {
  studentId: string;
  language: "en" | "hi";
  topicSlug: string;
  score: number;
  teachingStyle?: TeachingStyle;
  missedConcepts?: string[];
}): Promise<StudentRecord | null> {
  const canonicalId = resolveStudentId(studentId);
  const nowIso = new Date().toISOString();

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
        lastScore: score,
        attempts: (prevTopic.attempts ?? 0) + 1,
        completedLessons: Math.min(4, (prevTopic.completedLessons ?? 0) + 1),
        lastAttemptAt: nowIso,
        missedConcepts: missedConcepts ?? prevTopic.missedConcepts,
        teachingStyle: teachingStyle ?? prevTopic.teachingStyle,
      },
    };
    const streakResult = calculateDailyStreak(existing.lastActiveDate, existing.streakDays);
    const updatedRecord: StudentRecord = {
      ...existing,
      language: language || existing.language,
      topics: nextTopics,
      weakTopics: computeWeakTopics(nextTopics),
      streakDays: streakResult.streakDays,
      lastActiveDate: streakResult.lastActiveDate,
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
          "SET #topics.#slug.#attempts      = if_not_exists(#topics.#slug.#attempts, :zero) + :one",
          "    #topics.#slug.#score         = :score",
          "    #topics.#slug.#lastScore     = :score",
          "    #topics.#slug.#lastAttemptAt = :attemptAt",
          "    #updatedAt                   = :now",
        ].join(", "),
        ConditionExpression:
          "attribute_not_exists(#topics.#slug.#score) OR #topics.#slug.#score < :score",
        ExpressionAttributeNames: {
          "#topics": "topics",
          "#slug": topicSlug,
          "#attempts": "attempts",
          "#score": "score",
          "#lastScore": "lastScore",
          "#lastAttemptAt": "lastAttemptAt",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":score": score,
          ":attemptAt": nowIso,
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
          UpdateExpression: [
            "SET #topics.#slug.#attempts      = if_not_exists(#topics.#slug.#attempts, :zero) + :one",
            "    #topics.#slug.#lastScore     = :score",
            "    #topics.#slug.#lastAttemptAt = :attemptAt",
            "    #updatedAt                   = :now",
          ].join(", "),
          ExpressionAttributeNames: {
            "#topics": "topics",
            "#slug": topicSlug,
            "#attempts": "attempts",
            "#lastScore": "lastScore",
            "#lastAttemptAt": "lastAttemptAt",
            "#updatedAt": "updatedAt",
          },
          ExpressionAttributeValues: {
            ":score": score,
            ":attemptAt": nowIso,
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

  // ── Phase 3: Re-read and recompute weakTopics & streak ─────────────────────
  const updated = await getStudentRecord(canonicalId);
  if (!updated) return null;

  const weakTopics = computeWeakTopics(updated.topics);
  const streakResult = calculateDailyStreak(updated.lastActiveDate, updated.streakDays);

  await db.send(
    new UpdateCommand({
      TableName: STUDENT_RECORD_TABLE,
      Key: { studentId: canonicalId },
      UpdateExpression: "SET #weakTopics = :wt, #streakDays = :sd, #lastActiveDate = :lad",
      ExpressionAttributeNames: {
        "#weakTopics": "weakTopics",
        "#streakDays": "streakDays",
        "#lastActiveDate": "lastActiveDate",
      },
      ExpressionAttributeValues: {
        ":wt": weakTopics,
        ":sd": streakResult.streakDays,
        ":lad": streakResult.lastActiveDate,
      },
    }),
  );

  const finalRecord = {
    ...updated,
    weakTopics,
    streakDays: streakResult.streakDays,
    lastActiveDate: streakResult.lastActiveDate,
  };
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
  const nowIso = new Date().toISOString();

  if (!db || !STUDENT_RECORD_TABLE) {
    const existing = memoryStudentRecordStore.get(canonicalId);
    const streakResult = calculateDailyStreak(existing?.lastActiveDate, existing?.streakDays);
    memoryStudentRecordStore.set(canonicalId, {
      ...existing,
      studentId: canonicalId,
      language: existing?.language ?? language,
      topics: existing?.topics ?? {},
      weakTopics: existing?.weakTopics ?? [],
      lastLoginAt: nowIso,
      updatedAt: Date.now(),
      loginCount: (existing?.loginCount ?? 0) + 1,
      streakDays: streakResult.streakDays,
      lastActiveDate: streakResult.lastActiveDate,
    });
    return;
  }

  try {
    const existing = await getStudentRecord(canonicalId);
    const streakResult = calculateDailyStreak(existing?.lastActiveDate, existing?.streakDays);

    await db.send(
      new UpdateCommand({
        TableName: STUDENT_RECORD_TABLE,
        Key: { studentId: canonicalId },
        UpdateExpression: [
          "SET #lang           = if_not_exists(#lang,       :lang)",
          "    #topics         = if_not_exists(#topics,     :emptyMap)",
          "    #weakTopics     = if_not_exists(#weakTopics, :emptyList)",
          "    #lastLoginAt    = :now",
          "    #updatedAt      = :ts",
          "    #loginCount     = if_not_exists(#loginCount, :zero) + :one",
          "    #streakDays     = :streakDays",
          "    #lastActiveDate = :lastActiveDate",
        ].join(", "),
        ExpressionAttributeNames: {
          "#lang": "language",
          "#topics": "topics",
          "#weakTopics": "weakTopics",
          "#lastLoginAt": "lastLoginAt",
          "#updatedAt": "updatedAt",
          "#loginCount": "loginCount",
          "#streakDays": "streakDays",
          "#lastActiveDate": "lastActiveDate",
        },
        ExpressionAttributeValues: {
          ":lang": language,
          ":emptyMap": {},
          ":emptyList": [],
          ":now": nowIso,
          ":ts": Date.now(),
          ":zero": 0,
          ":one": 1,
          ":streakDays": streakResult.streakDays,
          ":lastActiveDate": streakResult.lastActiveDate,
        },
      }),
    );
  } catch (error) {
    console.error(`[dynamodb] Error in recordLogin for ${canonicalId}:`, error);
  }
}

// ── Content Index Architecture ────────────────────────────────────────────────
// Partition key: contentId (e.g. "article:arrays:en", "blog:why-time-complexity-matters:hi")

export async function getContentIndex(
  contentType: ContentType,
  slug: string,
  language: SupportedLanguage = "en",
): Promise<ContentIndex | null> {
  const contentId = `${contentType}:${slug}:${language}`;
  if (!db || !CONTENT_TABLE) {
    return memoryContentIndexStore.get(contentId) ?? null;
  }
  try {
    const res = await db.send(
      new GetCommand({
        TableName: CONTENT_TABLE,
        Key: { contentId },
      }),
    );
    if (res.Item) {
      const item = res.Item as ContentIndex;
      memoryContentIndexStore.set(contentId, item);
      return item;
    }
    return memoryContentIndexStore.get(contentId) ?? null;
  } catch (error) {
    console.error(`[dynamodb] Error in getContentIndex for ${contentId}:`, error);
    return memoryContentIndexStore.get(contentId) ?? null;
  }
}

export async function putContentIndex(item: ContentIndex): Promise<void> {
  memoryContentIndexStore.set(item.contentId, item);
  if (!db || !CONTENT_TABLE) return;
  try {
    await db.send(
      new PutCommand({
        TableName: CONTENT_TABLE,
        Item: item,
      }),
    );
  } catch (error) {
    console.error(`[dynamodb] Error in putContentIndex for ${item.contentId}:`, error);
  }
}

export async function listContentIndices(
  contentType?: ContentType,
  language?: SupportedLanguage,
): Promise<ContentIndex[]> {
  const items = Array.from(memoryContentIndexStore.values());
  return items.filter((item) => {
    if (contentType && item.contentType !== contentType) return false;
    if (language && item.language !== language) return false;
    return item.status === "published";
  });
}
