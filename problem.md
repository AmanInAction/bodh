# Current Problems and Production Readiness

Last reviewed: 2026-09-21

This report reflects the current codebase after the AWS configuration, and authentication configuration updates.

## Validation status

The production build currently succeeds:

```bash
npm run build
```

TypeScript diagnostics report no errors. ESLint completes with one warning in `scripts/seed-s3.ts`, and Next.js reports that the `middleware` convention is deprecated in favor of `proxy`.

## Resolved issues

### 1. Production build configuration

`next.config.ts` uses the supported top-level `reactCompiler` option, and the previous invalid TypeScript configuration no longer blocks the build.

### 2. JWT verification in middleware

`src/middleware.ts` now verifies the session JWT with `jose` and `getAuthSecret()` instead of trusting a decoded payload. Modified tokens are therefore rejected by middleware.

### 3. Production environment validation

`src/config/env.ts` validates required production variables, including AWS resources, Bedrock, Resend, and the auth secret. Missing production configuration fails clearly instead of silently selecting local behavior.

### 4. Environment naming and AWS setup drift

Standard variables such as `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_DYNAMODB_TABLE`, `AWS_AUTH_TABLE`, `AWS_STUDENT_RECORD_TABLE`, `BEDROCK_MODEL_ID`, and `AUTH_SECRET` are now canonical. Legacy aliases remain supported for compatibility. `scripts/setup-aws.sh` provisions the student, student-record, and auth tables with the documented defaults.

### 5. TypeScript path aliases

The `@/*` path alias is working in the current build and is no longer a known build blocker.

## Remaining problems

### 1. Demo authentication remains available in development

**File:** `src/lib/auth/session.ts`

When `NODE_ENV` is not `production`, an invalid or missing session falls back to `DEMO_SESSION`. Production can also enable this with `ALLOW_DEMO=true`.

This is useful for local development, but it must not be enabled in a public production deployment because requests could operate as the demo student.

### 2. Local verification codes are intentionally predictable

**File:** `src/lib/auth/store.ts`

Non-production sign-in uses the fixed code `123456` and an in-memory `Map` when DynamoDB is unavailable. This is acceptable for local development but is not suitable for shared, multi-instance, or production environments. Production correctly throws when the auth table is unavailable.

### 3. Development fallbacks can hide missing integrations

**Files:** `src/lib/aws/bedrock.ts`, `src/lib/aws/s3.ts`, `src/lib/aws/dynamodb.ts`, `src/lib/ai/`, `src/lib/learning/`

Local mode intentionally falls back to seed content, placeholder AI responses, and local persistence when AWS is unavailable. Staging should exercise real AWS resources so degraded behavior is detected before release.

### 4. AWS and AI failures need operational observability

Production paths throw or log many service errors, but the project does not yet provide centralized alerting, structured logs, request correlation, or service health checks. Operators may still discover Bedrock, S3, DynamoDB, or Resend failures through user reports.

### 5. Middleware migration warning

Next.js 16 reports that the `middleware` file convention is deprecated and recommends migrating to `proxy`. The current build succeeds, but this should be scheduled before a future Next.js version removes support.

### 6. ESLint warning in the S3 seed script

`npm run lint` reports one `@typescript-eslint/no-unused-expressions` warning at `scripts/seed-s3.ts:97`. It does not currently fail lint or the build, but the stray expression should be removed or corrected.

### 7. Automated test coverage is limited

The repository contains focused tests for auth validation and roadmap logic, but `package.json` does not expose a test script and there is no documented integration or end-to-end test command. Auth flows, AWS failure paths, API contracts, and the main learning flow need automated coverage before production deployment.

## Next priorities

1. Remove the S3 seed-script lint warning.
2. Add a `test` script and CI checks for unit, API, and authentication flows.
3. Add health checks and structured error reporting for AWS and Resend dependencies.
4. Confirm `ALLOW_DEMO` is unset in production environments.
5. Migrate `middleware.ts` to the Next.js `proxy` convention.
