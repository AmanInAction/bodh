import { NextResponse } from "next/server";
import { sendVerificationCode } from "@/lib/auth/email";
import { createVerificationCode, saveVerificationCode } from "@/lib/auth/store";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }
  const { code, record } = createVerificationCode(email);
  await saveVerificationCode(record);
  await sendVerificationCode(email, code);
  return NextResponse.json({ ok: true, expiresInSeconds: 600 });
}
