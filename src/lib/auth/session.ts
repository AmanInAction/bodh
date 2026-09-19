import { jwtVerify, SignJWT } from "jose";

export const sessionCookie = "bodh_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "local-development-secret-change-me",
);

export type Session = { email: string; name: string };

/**
 * Demo session used for hackathon/demo mode.
 * Real authenticated sessions continue to use the signed JWT cookie.
 */
export const DEMO_SESSION: Session = {
  email: "student_001@bodh.demo",
  name: "Demo Student",
};

export const DEMO_STUDENT_ID = "student_001";

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

    if (
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }

    return {
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

/**
 * Returns the authenticated session when available.
 * Falls back to the deterministic demo student when no valid
 * authentication cookie is present.
 *
 * This is intentionally separate from readSession() so protected
 * APIs can still require real authentication where appropriate.
 */
export async function getSessionOrDemo(
  token: string | undefined,
): Promise<Session> {
  return (await readSession(token)) ?? DEMO_SESSION;
}
