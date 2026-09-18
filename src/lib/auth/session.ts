import { jwtVerify, SignJWT } from "jose";

export const sessionCookie = "bodh_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "local-development-secret-change-me",
);

export type Session = { email: string; name: string };

export async function createSession(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function readSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.email !== "string" || typeof payload.name !== "string") {
      return null;
    }
    return { email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}
