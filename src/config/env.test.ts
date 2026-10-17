import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getEnv,
  getAwsCredentials,
  isDemoAllowed,
  getAppUrl,
  getAwsMaxAttempts,
  getBedrockTimeoutMs,
  validateProductionEnv,
} from "./env";
import { getBedrockModelId } from "@/lib/aws/bedrock";

describe("Environment Configuration & Security Defaults", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("retrieves environment variables with and without APP_ prefix", () => {
    delete process.env.TEST_KEY;
    delete process.env.APP_TEST_KEY;

    expect(getEnv("TEST_KEY")).toBeUndefined();

    process.env.TEST_KEY = "direct_val";
    expect(getEnv("TEST_KEY")).toBe("direct_val");

    process.env.APP_TEST_KEY = "prefixed_val";
    expect(getEnv("TEST_KEY")).toBe("prefixed_val");
  });

  it("extracts AWS credentials if both key and secret are present", () => {
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    expect(getAwsCredentials()).toBeUndefined();

    process.env.AWS_ACCESS_KEY_ID = "AKIA123";
    expect(getAwsCredentials()).toBeUndefined();

    process.env.AWS_SECRET_ACCESS_KEY = "SECRET456";
    expect(getAwsCredentials()).toEqual({
      accessKeyId: "AKIA123",
      secretAccessKey: "SECRET456",
    });
  });

  it("enforces production-safe defaults for isDemoAllowed", () => {
    // 1. Explicit ALLOW_DEMO=false
    process.env.ALLOW_DEMO = "false";
    process.env.NODE_ENV = "development";
    expect(isDemoAllowed()).toBe(false);

    // 2. Explicit ALLOW_DEMO=true
    process.env.ALLOW_DEMO = "true";
    process.env.NODE_ENV = "production";
    expect(isDemoAllowed()).toBe(true);

    // 3. Unset in production -> MUST default to false for security
    delete process.env.ALLOW_DEMO;
    process.env.NODE_ENV = "production";
    expect(isDemoAllowed()).toBe(false);

    // 4. Unset in development -> defaults to true for developer convenience
    delete process.env.ALLOW_DEMO;
    process.env.NODE_ENV = "development";
    expect(isDemoAllowed()).toBe(true);
  });

  it("returns canonical app URL and strips trailing slashes", () => {
    delete process.env.APP_URL;
    expect(getAppUrl()).toBe("http://localhost:3000");

    process.env.APP_URL = "https://bodh.learn/";
    expect(getAppUrl()).toBe("https://bodh.learn");
  });

  it("handles AWS max attempts and Bedrock timeouts", () => {
    delete process.env.BEDROCK_MAX_RETRIES;
    delete process.env.AWS_MAX_ATTEMPTS;
    delete process.env.BEDROCK_TIMEOUT_MS;
    delete process.env.AWS_TIMEOUT_MS;

    expect(getAwsMaxAttempts()).toBe(3);
    expect(getBedrockTimeoutMs()).toBe(15000);

    process.env.AWS_MAX_ATTEMPTS = "5";
    process.env.BEDROCK_TIMEOUT_MS = "20000";

    expect(getAwsMaxAttempts()).toBe(5);
    expect(getBedrockTimeoutMs()).toBe(20000);

    process.env.BEDROCK_MAX_RETRIES = "2";
    expect(getAwsMaxAttempts()).toBe(2);
  });

  it("routes Bedrock model IDs by task with alias support", () => {
    delete process.env.BEDROCK_MODEL_ID;
    delete process.env.BEDROCK_QUIZ_MODEL_ID;
    delete process.env.BEDROCK_ASSESSMENT_MODEL_ID;
    delete process.env.BEDROCK_TEACHING_MODEL_ID;
    delete process.env.BEDROCK_TEACH_MODEL;
    delete process.env.BEDROCK_RECOMMENDATION_MODEL_ID;
    delete process.env.BEDROCK_RECOMMEND_MODEL;

    // Default fallback
    expect(getBedrockModelId("default")).toBe("amazon.nova-lite-v1:0");
    expect(getBedrockModelId("quiz")).toBe("amazon.nova-lite-v1:0");

    // Task-specific override
    process.env.BEDROCK_QUIZ_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";
    expect(getBedrockModelId("quiz")).toBe(
      "anthropic.claude-3-haiku-20240307-v1:0",
    );

    // Alias test for teaching model
    process.env.BEDROCK_TEACH_MODEL = "amazon.nova-pro-v1:0";
    expect(getBedrockModelId("teaching")).toBe("amazon.nova-pro-v1:0");

    // Canonical override takes precedence over alias
    process.env.BEDROCK_TEACHING_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0";
    expect(getBedrockModelId("teaching")).toBe(
      "anthropic.claude-3-5-sonnet-20240620-v1:0",
    );
  });

  it("validates required production environment variables without throwing", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PHASE;
    delete process.env.AWS_REGION;

    validateProductionEnv();

    expect(consoleSpy).toHaveBeenCalled();
    const warnCall = consoleSpy.mock.calls[0][0];
    expect(warnCall).toContain("AWS_REGION");

    consoleSpy.mockRestore();
  });
});
