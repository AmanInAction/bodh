import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionOrDemo, sessionCookie } from "@/lib/auth/session";
import { getStudentProfile, putStudentProfile } from "@/lib/aws/dynamodb";
import type { Student } from "@/types/student";

export async function GET() {
  let session;
  try {
    session = await getSessionOrDemo(
      (await cookies()).get(sessionCookie)?.value,
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getStudentProfile(session.email);

  if (!profile) {
    const newStudent: Student = {
      id: session.email,
      name: session.name,
      email: session.email,
      language: "en",
      preferredStyle: "simple",
      createdAt: new Date().toISOString(),
    };

    await putStudentProfile(newStudent);

    return NextResponse.json(newStudent);
  }

  return NextResponse.json(profile);
}

export async function POST(request: Request) {
  let session;
  try {
    session = await getSessionOrDemo(
      (await cookies()).get(sessionCookie)?.value,
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates = (await request.json()) as Partial<Student>;
  const existing = await getStudentProfile(session.email);

  const student: Student = {
    id: session.email,
    name: updates.name ?? existing?.name ?? session.name,
    email: session.email,
    language: updates.language ?? existing?.language ?? "en",
    preferredStyle:
      updates.preferredStyle ?? existing?.preferredStyle ?? "simple",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  await putStudentProfile(student);

  return NextResponse.json(student, { status: 200 });
}
