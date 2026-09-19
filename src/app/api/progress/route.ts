import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSession, sessionCookie } from "@/lib/auth/session";
import { getRoadmap, summarizeRoadmap } from "@/lib/learning/roadmap";
export async function GET() {
  const session = await readSession(
    (await cookies()).get(sessionCookie)?.value,
  );
  if (!session)
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json(summarizeRoadmap(await getRoadmap(session.email)));
}
