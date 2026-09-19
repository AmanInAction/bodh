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

  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
    language?: unknown;
    preferredStyle?: unknown;
  } | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid profile data." },
      { status: 400 },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const language =
    body.language === "hi" || body.language === "en"
      ? body.language
      : undefined;
  const preferredStyle = ["simple", "socratic", "visual", "interview"].includes(
    body.preferredStyle as string,
  )
    ? (body.preferredStyle as Student["preferredStyle"])
    : undefined;
  if (name !== undefined && (name.length < 1 || name.length > 80)) {
    return NextResponse.json(
      { error: "Name must be between 1 and 80 characters." },
      { status: 400 },
    );
  }
  if (body.language !== undefined && !language) {
    return NextResponse.json(
      { error: "Language must be en or hi." },
      { status: 400 },
    );
  }
  if (body.preferredStyle !== undefined && !preferredStyle) {
    return NextResponse.json(
      { error: "Invalid teaching style." },
      { status: 400 },
    );
  }

  const existing = await getStudentProfile(session.email);

  const student: Student = {
<<<<<<< HEAD
    id: session.email,
    name: existing?.name ?? session.email.split("@")[0],
    email: session.email,
    language: existing?.language ?? "en",
    preferredStyle: existing?.preferredStyle ?? "simple",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    ...(name !== undefined ? { name } : {}),
    ...(language !== undefined ? { language } : {}),
    ...(preferredStyle !== undefined ? { preferredStyle } : {}),
  };
=======
  id: session.email,
  name: existing?.name ?? session.email.split("@")[0],
  email: session.email,
  language: existing?.language ?? "en",
  preferredStyle: existing?.preferredStyle ?? "simple",
  createdAt: existing?.createdAt ?? new Date().toISOString(),
};
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a

  await putStudentProfile(student);
  return NextResponse.json(student, { status: 200 });
}
