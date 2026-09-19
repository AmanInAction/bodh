import { jwtVerify, SignJWT } from "jose";
<<<<<<< HEAD
import { randomBytes } from "node:crypto";

export const sessionCookie = "bodh_session";
const developmentSecret = randomBytes(32).toString("base64url");

export function getAuthSecret() {
  const configuredSecret = process.env.AUTH_SECRET?.trim();

  if (configuredSecret) {
    if (configuredSecret.length < 32) {
      throw new Error("AUTH_SECRET must be at least 32 characters long.");
    }
    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be configured in production.");
  }

  return developmentSecret;
}
=======

export const sessionCookie = "bodh_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "local-development-secret-change-me",
);
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a

export type Session = { email: string; name: string };

export async function createSession(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
<<<<<<< HEAD
    .sign(new TextEncoder().encode(getAuthSecret()));
=======
    .sign(secret);
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a
}

export async function readSession(token: string | undefined) {
  if (!token) return null;
  try {
<<<<<<< HEAD
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(getAuthSecret()),
      { algorithms: ["HS256"] },
    );
=======
    const { payload } = await jwtVerify(token, secret);
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a
    if (typeof payload.email !== "string" || typeof payload.name !== "string") {
      return null;
    }
    return { email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}
