import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSession, sessionCookie } from "@/lib/auth/session";
import { getRoadmap } from "@/lib/learning/roadmap";
import { getRecommendations } from "@/lib/learning/recommendation";

export async function GET() {
  const session = await readSession(
    (await cookies()).get(sessionCookie)?.value,
  );

  // If signed in, use real roadmap data; otherwise return empty set
  if (!session) {
    return NextResponse.json([]);
  }

  const roadmap = await getRoadmap(session.email);
  const recommendations = getRecommendations(roadmap);
  return NextResponse.json(recommendations);
}
