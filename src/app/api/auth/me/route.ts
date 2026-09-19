import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSession, sessionCookie } from "@/lib/auth/session";

export async function GET() {
  const session = await readSession(
    (await cookies()).get(sessionCookie)?.value,
  );
  return session
    ? NextResponse.json({ authenticated: true, ...session })
    : NextResponse.json({ authenticated: false }, { status: 401 });
}
