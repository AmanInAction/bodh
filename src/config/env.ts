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
    "app_aWs_REGION",
    "app_aWs_S3_BUCKET",
    "app_aWs_DYNAMODB_TABLE",
    "app_aWs_AUTH_TABLE",
    "app_aWs_STUDENT_RECORD_TABLE",
    "app_BEDROCK_MODEL_ID",
    "app_RESEND_API_KEY",
  ];

  for (const key of requiredKeys) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (
    !process.env.app_AUTH_SECRET &&
    !process.env.app_JWT_SECRET &&
    !process.env.AUTH_SECRET &&
    !process.env.JWT_SECRET
  ) {
    missing.push("app_AUTH_SECRET (or app_JWT_SECRET)");
  }

  if (missing.length > 0) {
    const message = [
      "============================================================",
      "❌ CRITICAL CONFIGURATION ERROR: Missing required environment variables",
      "============================================================",
      ...missing.map((key) => `  - ${key}`),
      "============================================================",
      "Please set these environment variables before deploying.",
      "============================================================",
    ].join("\n");

    console.error(message);
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`,
    );
  }
}
