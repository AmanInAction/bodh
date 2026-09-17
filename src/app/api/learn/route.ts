import { NextResponse } from "next/server";
import { getLessons } from "@/lib/learning/topics";
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("topic") ?? "arrays";
  return NextResponse.json(getLessons(slug));
}
