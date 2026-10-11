import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Student } from "@/types/student";
import type { TopicProgress } from "@/types/progress";
import type { StudentRecord } from "@/types/student-record";
import { resolveStudentId } from "@/lib/aws/dynamodb";

type LocalData = {
  studentRecords: Record<string, StudentRecord>;
  profiles: Record<string, Student>;
  roadmaps: Record<string, TopicProgress[]>;
};

const dataDirectory = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDirectory, "bodh.json");

async function readData(): Promise<LocalData> {
  try {
    const raw = await readFile(dataFile, "utf8");
    const data = JSON.parse(raw) as Partial<LocalData>;
    return {
      studentRecords: data.studentRecords ?? {},
      profiles: data.profiles ?? {},
      roadmaps: data.roadmaps ?? {},
    };
  } catch {
    return { studentRecords: {}, profiles: {}, roadmaps: {} };
  }
}

async function writeData(data: LocalData) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(data, null, 2), "utf8");
  await rename(temporaryFile, dataFile);
}

export async function getLocalStudentRecord(
  studentIdOrEmail: string,
): Promise<StudentRecord | null> {
  const canonicalId = resolveStudentId(studentIdOrEmail);
  const data = await readData();
  if (data.studentRecords[canonicalId]) {
    return data.studentRecords[canonicalId];
  }
  const legacyProfile = data.profiles[studentIdOrEmail] ?? data.profiles[canonicalId];
  if (legacyProfile) {
    return {
      studentId: canonicalId,
      name: legacyProfile.name,
      email: legacyProfile.email,
      language: legacyProfile.language,
      preferredStyle: legacyProfile.preferredStyle,
      topics: {},
      weakTopics: [],
      createdAt: legacyProfile.createdAt,
    };
  }
  return null;
}

export async function putLocalStudentRecord(
  record: StudentRecord,
): Promise<void> {
  const canonicalId = resolveStudentId(record.studentId);
  const data = await readData();
  data.studentRecords[canonicalId] = {
    ...record,
    studentId: canonicalId,
  };
  await writeData(data);
}

export async function getLocalProfile(email: string): Promise<Student | null> {
  const record = await getLocalStudentRecord(email);
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

export async function putLocalProfile(student: Student) {
  const existing = await getLocalStudentRecord(student.email || student.id);
  await putLocalStudentRecord({
    studentId: resolveStudentId(student.email || student.id),
    name: student.name,
    email: student.email,
    language: student.language,
    preferredStyle: student.preferredStyle,
    topics: existing?.topics ?? {},
    weakTopics: existing?.weakTopics ?? [],
    createdAt: existing?.createdAt ?? student.createdAt,
    updatedAt: Date.now(),
  });
}

export async function getLocalRoadmap(email: string) {
  return (await readData()).roadmaps[email] ?? null;
}

export async function putLocalRoadmap(email: string, roadmap: TopicProgress[]) {
  const data = await readData();
  data.roadmaps[email] = roadmap;
  await writeData(data);
}
