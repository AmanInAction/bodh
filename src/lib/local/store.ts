import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Student } from "@/types/student";
import type { TopicProgress } from "@/types/progress";

type LocalData = {
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
      profiles: data.profiles ?? {},
      roadmaps: data.roadmaps ?? {},
    };
  } catch {
    return { profiles: {}, roadmaps: {} };
  }
}

async function writeData(data: LocalData) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(data, null, 2), "utf8");
  await rename(temporaryFile, dataFile);
}

export async function getLocalProfile(email: string) {
  return (await readData()).profiles[email] ?? null;
}

export async function putLocalProfile(student: Student) {
  const data = await readData();
  data.profiles[student.email] = student;
  await writeData(data);
}

export async function getLocalRoadmap(email: string) {
  return (await readData()).roadmaps[email] ?? null;
}

export async function putLocalRoadmap(email: string, roadmap: TopicProgress[]) {
  const data = await readData();
  data.roadmaps[email] = roadmap;
  await writeData(data);
}
