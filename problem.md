# Production Problems and Loopholes Report

## 1. Build is currently failing

### Issue

The application does not currently build successfully in production mode.

### Evidence

Running:

```bash
cd c:/Users/Asus/bodh-ai/my-app; npm run build
```

produced exit code 1 and reported:

- `Invalid next.config.ts options detected`
- `experimental.reactCompiler` has been moved to `reactCompiler`
- `TS5103: Invalid value for '--ignoreDeprecations'`

### Why this matters

A production build must succeed before deployment. This failing build means the app is not production-ready as-is.

---

## 2. Invalid Next.js config option

### File

- `next.config.ts`

### Problem

The config uses:

```ts
experimental: {
  reactCompiler: true,
}
```

In the current Next.js version, this key is no longer valid under `experimental` and should be moved to the top-level config as `reactCompiler`.

### Why this matters

Using deprecated or invalid config keys can cause unexpected behavior and configuration drift between local and production environments.

---

## 3. TypeScript deprecation config is invalid

### File

- `tsconfig.json`

### Problem

The TypeScript config is resulting in:

```text
TS5103: Invalid value for '--ignoreDeprecations'
```

This typically means the project is configured with a deprecated TypeScript setting or value that the current TypeScript version rejects.

### Why this matters

Type checking fails during build, which blocks production deployment and may hide true runtime issues until later.

---

## 4. Auth secret falls back to a default hardcoded value

### File

- `src/lib/auth/session.ts`

### Problem

```ts
process.env.AUTH_SECRET ?? "local-development-secret-change-me";
```

If the environment variable is missing in production, the app silently uses a fixed local secret.

### Why this matters

This creates a serious authentication weakness. Anyone who knows the default value can forge JWTs and impersonate users.

---

## 5. Middleware validates route access without verifying the JWT signature

### File

- `src/middleware.ts`

### Problem

The middleware parses the JWT payload using base64 decoding, but it does not verify the signature.

```ts
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = atob(payload);
  const parsed = JSON.parse(json) as Record<string, unknown>;
```

### Why this matters

This allows manipulated or tampered tokens to look valid to the middleware and can lead to incorrect access control decisions.

---

## 6. Demo session fallback bypasses real authentication

### File

- `src/lib/auth/session.ts`

### Problem

```ts
export async function getSessionOrDemo(
  token: string | undefined,
): Promise<Session> {
  return (await readSession(token)) ?? DEMO_SESSION;
}
```

When no valid session is found, the app silently falls back to a predefined demo user.

### Why this matters

This can cause the app to behave as a different user without an explicit sign-in. In production, that creates confusing user identity behavior and data leakage risk.

---

## 7. AWS services silently degrade to local behavior instead of failing fast

### Files

- `src/lib/aws/bedrock.ts`
- `src/lib/aws/dynamodb.ts`
- `src/lib/aws/s3.ts`
- `src/lib/auth/store.ts`

### Problem

The code contains many silent fallbacks such as:

```ts
if (!db || !table) return null;
```

and:

```ts
if (!client) {
  return `[local] ${userPrompt.slice(0, 160)}`;
}
```

### Why this matters

If AWS credentials, region, or tables are misconfigured, the app keeps running but in a degraded mode that looks normal. This leads to unexpected production behavior and makes outages hard to detect.

---

## 8. In-memory verification code storage is not production-safe

### File

- `src/lib/auth/store.ts`

### Problem

```ts
const memoryCodes = new Map<string, VerificationCode>();
```

This stores verification codes in process memory only.

### Why this matters

In a multi-instance production deployment, this state is not shared across servers. A code created on one instance may not be valid on another, causing abrupt login failures or inconsistent auth behavior.

---

## 9. Critical environment configuration is not validated at startup

### Files

- `src/lib/aws/bedrock.ts`
- `src/lib/aws/dynamodb.ts`
- `src/lib/auth/email.ts`

### Problem

The app assumes required environment variables exist but does not clearly fail fast when they are missing.

### Why this matters

Production misconfiguration becomes runtime instability rather than a clear startup error. This is a common source of abrupt behavior changes after deployment.

---

## 10. Auth and user data may be inconsistent across sessions

### Files

- `src/lib/auth/session.ts`
- `src/lib/aws/dynamodb.ts`
- `src/middleware.ts`

### Problem

The app mixes cookie-based session checks with stored demo settings and AWS-backed profile data, but the logic does not consistently enforce a strict authenticated state.

### Why this matters

This can result in a user being treated as logged in, logged out, or demo-mode depending on cookie state and config, leading to inconsistent access and data changes in production.

---

## 11. The app may behave differently in local vs production without obvious notifications

### Problem

Several modules intentionally degrade to "local" behavior when external services are unavailable.

### Why this matters

This can create an application that works locally but behaves unpredictably in production when AWS or auth services are unavailable or misconfigured.

---

## 12. Security and reliability gaps in AI-backed features

### Files

- `src/lib/agentcore/teaching.ts`
- `src/lib/ai/feedback.ts`
- `src/lib/ai/quiz.ts`
- `src/lib/learning/content.ts`
- `src/lib/learning/recommendation.ts`

### Problem

The app relies on AWS Bedrock and generated content, but many paths fallback to local or mock outputs when Bedrock is unavailable.

### Why this matters

In production, users may suddenly get less accurate or inconsistent generated content, recommendations, and explanations without any explicit error handling to notify operators.

---

## 13. Alias path config may be broken without `baseUrl`

### File

- `tsconfig.json`

### Problem

The config includes:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

but it is missing:

```json
"baseUrl": "."
```

### Why this matters

This commonly breaks `@/` imports in TypeScript and can lead to compilation issues, runtime import errors, or inconsistent app behavior depending on tooling.

---

## 14. Possible silent data corruption risk in DynamoDB updates

### File

- `src/lib/aws/dynamodb.ts`

### Problem

The project updates nested topic data and recomputes weak topics, but there are multiple conditional logic branches and silent catches that can mask underlying data issues.

### Why this matters

When AWS data conditions are not perfect, user progress and recommendation calculations may become inconsistent or partially updated without meaningful error reporting.

---

## Summary

The project has multiple critical production risks:

- failing build configuration,
- insecure JWT handling,
- silent fallback to demo or local mode,
- non-shared auth code storage,
- AWS misconfiguration masking,
- and unpredictable behavior across environments.

These issues can cause abrupt changes in production, including broken login, wrong user identity, inaccessible routes, degraded AI features, and missing data or personalization.
