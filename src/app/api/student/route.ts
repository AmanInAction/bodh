import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionOrDemo, sessionCookie } from "@/lib/auth/session";
import { getStudentProfile, putStudentProfile } from "@/lib/aws/dynamodb";
import type { Student } from "@/types/student";

export async function GET() {
  const session = await getSessionOrDemo(
    (await cookies()).get(sessionCookie)?.value,
  );

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
  const session = await getSessionOrDemo(
    (await cookies()).get(sessionCookie)?.value,
  );

  const updates = (await request.json()) as Partial<Student>;
  const existing = await getStudentProfile(session.email);

  const { email: _ignored, ...safeUpdates } = updates; // strip any email field from updates
  void _ignored;

  const student: Student = {
  id: session.email,
  name: existing?.name ?? session.email.split("@")[0],
  email: session.email,
  language: existing?.language ?? "en",
  preferredStyle: existing?.preferredStyle ?? "simple",
  createdAt: existing?.createdAt ?? new Date().toISOString(),
};

  await putStudentProfile(student);
  return NextResponse.json(student, { status: 200 });
}
