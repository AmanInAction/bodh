import { NextResponse } from "next/server";
import { recommend } from "@/lib/ai/recommendation";
export async function GET() {
  return NextResponse.json(recommend());
}
