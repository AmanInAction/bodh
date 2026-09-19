import { jwtVerify, SignJWT } from "jose";

export const sessionCookie = "bodh_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "local-development-secret-change-me",
);

export type Session = { email: string; name: string };

/** Demo session used when no auth cookie is present (hackathon / guest mode). */
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
 * Returns the real session if the cookie is valid, otherwise returns the
 * built-in demo session (student_001).  Use this in API routes and pages
 * where the complete learning loop must work without sign-in.
 */
export async function getSessionOrDemo(token: string | undefined): Promise<Session> {
  return (await readSession(token)) ?? DEMO_SESSION;
}
