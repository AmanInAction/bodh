/**
 * Environment configuration validator.
 * Validates required configuration when running in production to ensure
 * issues are caught immediately at startup rather than during user requests.
 */

export function validateProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  // Do not fail during next build if CI builds before runtime secrets are injected
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  const missing: string[] = [];

  const requiredKeys = [
    "AWS_REGION",
    "AWS_S3_BUCKET",
    "AWS_AUTH_TABLE",
    "AWS_STUDENT_RECORD_TABLE",
    "BEDROCK_MODEL_ID",
    "RESEND_API_KEY",
  ];

  for (const key of requiredKeys) {
    if (!getEnv(key)) {
      missing.push(key);
    }
  }

  if (!getEnv("AWS_DYNAMODB_TABLE") && !getEnv("AWS_STUDENTS_TABLE")) {
    missing.push("AWS_DYNAMODB_TABLE (or AWS_STUDENTS_TABLE)");
  }

  if (!getEnv("AUTH_SECRET") && !getEnv("JWT_SECRET")) {
    missing.push("AUTH_SECRET (or JWT_SECRET)");
  }

  if (missing.length > 0) {
    console.warn(
      `[env] Running with local/in-memory fallbacks. Unconfigured optional production variables: ${missing.join(", ")}`,
    );
  }
}

export function getEnv(key: string): string | undefined {
  return process.env[`APP_${key}`] || process.env[key];
}

export function getAwsCredentials() {
  const accessKeyId = getEnv("AWS_ACCESS_KEY_ID");
  const secretAccessKey = getEnv("AWS_SECRET_ACCESS_KEY");
  return accessKeyId && secretAccessKey
    ? { accessKeyId, secretAccessKey }
    : undefined;
}

/**
 * Determines whether demo sessions and unauthenticated guest bypass are permitted.
 * Production-safe default:
 * - When ALLOW_DEMO is explicitly provided:
 *     - "false" -> false
 *     - "true"  -> true
 * - When ALLOW_DEMO is omitted:
 *     - in production (NODE_ENV === "production"): false (strict security default)
 *     - in development / test: true (frictionless local development)
 */
export function isDemoAllowed(): boolean {
  const allowDemo = getEnv("ALLOW_DEMO");
  if (allowDemo !== undefined) {
    return allowDemo.trim().toLowerCase() === "true";
  }
  return process.env.NODE_ENV !== "production";
}

/**
 * Returns the public application URL for metadataBase, canonical links, and absolute redirects.
 */
export function getAppUrl(): string {
  const raw = getEnv("APP_URL");
  if (raw) {
    return raw.replace(/\/+$/, "");
  }
  return "http://localhost:3000";
}

/**
 * Returns maximum retry attempts for AWS SDK service clients.
 * Defaults to 3 attempts with exponential backoff.
 */
export function getAwsMaxAttempts(): number {
  const configured =
    getEnv("BEDROCK_MAX_RETRIES") ||
    getEnv("AWS_MAX_ATTEMPTS");
  if (!configured) return 3;
  const parsed = parseInt(configured, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
}

/**
 * Returns invocation timeout in milliseconds for Amazon Bedrock inference requests.
 * Defaults to 15000ms (15s).
 */
export function getBedrockTimeoutMs(): number {
  const configured =
    getEnv("BEDROCK_TIMEOUT_MS") ||
    getEnv("AWS_TIMEOUT_MS");
  if (!configured) return 15000;
  const parsed = parseInt(configured, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15000;
}

