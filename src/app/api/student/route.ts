import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSession, sessionCookie } from "@/lib/auth/session";
import { getStudentProfile, putStudentProfile } from "@/lib/aws/dynamodb";
import type { Student } from "@/types/student";

export async function GET() {
  const session = await readSession(
    (await cookies()).get(sessionCookie)?.value,
  );
  if (!session)
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const profile = await getStudentProfile(session.email);
  if (!profile) {
    // Bootstrap a default profile on first access
    const newStudent: Student = {
      id: session.email,
      name: session.email.split("@")[0],
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
  const session = await readSession(
    (await cookies()).get(sessionCookie)?.value,
  );
  if (!session)
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const updates = (await request.json()) as Partial<Student>;
  const existing = await getStudentProfile(session.email);

  const student: Student = {
    id: session.email,
    name: existing?.name ?? session.email.split("@")[0],
    language: existing?.language ?? "en",
    preferredStyle: existing?.preferredStyle ?? "simple",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    ...updates,
    email: session.email, // never allow changing email via POST
  };

  await putStudentProfile(student);
  return NextResponse.json(student, { status: 200 });
}
