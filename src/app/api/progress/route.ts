import { NextResponse } from "next/server";
<<<<<<< HEAD
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
=======
export async function GET() {
  return NextResponse.json({
    streak: 5,
    lessonsCompleted: 18,
    minutesLearned: 276,
    averageMastery: 61,
  });
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a
}
