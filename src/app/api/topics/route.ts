import { NextResponse } from "next/server";
import { topics } from "@/config/topics";
export async function GET() {
  return NextResponse.json(topics);
}
