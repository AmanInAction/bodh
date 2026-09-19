import { NextResponse } from "next/server";
import { sendVerificationCode } from "@/lib/auth/email";
import { createVerificationCode, saveVerificationCode } from "@/lib/auth/store";

const requestWindows = new Map<string, { startedAt: number; count: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const keys = [`email:${email}`, `ip:${ip}`];
  for (const key of keys) {
    const window = requestWindows.get(key);
    if (
      window &&
      now - window.startedAt < WINDOW_MS &&
      window.count >= MAX_REQUESTS
    ) {
      return NextResponse.json(
        { error: "Too many code requests. Try again later." },
        { status: 429 },
      );
    }
  }
  for (const key of keys) {
    const window = requestWindows.get(key);
    requestWindows.set(
      key,
      window && now - window.startedAt < WINDOW_MS
        ? { ...window, count: window.count + 1 }
        : { startedAt: now, count: 1 },
    );
  }
  const { code, record } = createVerificationCode(email);
  await saveVerificationCode(record);
  await sendVerificationCode(email, code);
  return NextResponse.json({ ok: true, expiresInSeconds: 600 });
}
