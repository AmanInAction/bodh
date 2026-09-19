import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    streak: 5,
    lessonsCompleted: 18,
    minutesLearned: 276,
    averageMastery: 61,
  });
}
