import { NextResponse } from "next/server";
import type { Student } from "@/types/student";

export async function GET() {
  const student: Student = {
    id: "demo-student",
    name: "Anika",
    email: "anika@example.com",
    language: "en",
  };
  return NextResponse.json(student);
}
export async function POST(request: Request) {
  const student = (await request.json()) as Student;
  return NextResponse.json(student, { status: 201 });
}
