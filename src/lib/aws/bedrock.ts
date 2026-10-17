import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  getAwsCredentials,
  getAwsMaxAttempts,
  getBedrockTimeoutMs,
  getEnv,
} from "@/config/env";

export type BedrockTaskType =
  | "quiz"
  | "assessment"
  | "teaching"
  | "recommendation"
  | "default";

const DEFAULT_MODEL_ID = getEnv("BEDROCK_MODEL_ID") || "amazon.nova-lite-v1:0";

export function getBedrockModelId(task: BedrockTaskType = "default"): string {
  switch (task) {
    case "quiz":
      return (
        getEnv("BEDROCK_QUIZ_MODEL_ID") ||
        getEnv("BEDROCK_MODEL_ID") ||
        DEFAULT_MODEL_ID
      );
    case "assessment":
      return (
        getEnv("BEDROCK_ASSESSMENT_MODEL_ID") ||
        getEnv("BEDROCK_MODEL_ID") ||
        DEFAULT_MODEL_ID
      );
    case "teaching":
      return (
        getEnv("BEDROCK_TEACHING_MODEL_ID") ||
        getEnv("BEDROCK_TEACH_MODEL") ||
        getEnv("BEDROCK_MODEL_ID") ||
        DEFAULT_MODEL_ID
      );
    case "recommendation":
      return (
        getEnv("BEDROCK_RECOMMENDATION_MODEL_ID") ||
        getEnv("BEDROCK_RECOMMEND_MODEL") ||
        getEnv("BEDROCK_MODEL_ID") ||
        DEFAULT_MODEL_ID
      );
    default:
      return getEnv("BEDROCK_MODEL_ID") || DEFAULT_MODEL_ID;
  }
}

function hasExplicitCredentials() {
  return Boolean(getAwsCredentials());
}

export function isBedrockConfigured() {
  return Boolean(
    getEnv("AWS_REGION") &&
      (getEnv("BEDROCK_MODEL_ID") || hasExplicitCredentials()) &&
      (hasExplicitCredentials() ||
        getEnv("EXECUTION_ENV") ||
        getEnv("LAMBDA_FUNCTION_NAME") ||
        getEnv("CONTAINER_CREDENTIALS_RELATIVE_URI") ||
        getEnv("CONTAINER_CREDENTIALS_FULL_URI")),
  );
}

let cachedClient: BedrockRuntimeClient | null = null;

function getClient(): BedrockRuntimeClient | null {
  if (!isBedrockConfigured()) return null;
  if (!cachedClient) {
    cachedClient = new BedrockRuntimeClient({
      region: getEnv("AWS_REGION"),
      credentials: getAwsCredentials(),
      maxAttempts: getAwsMaxAttempts(),
    });
  }
  return cachedClient;
}

export type BedrockInvokeOptions = {
  task?: BedrockTaskType;
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export async function invokeBedrockText(
  systemPrompt: string,
  userPrompt: string,
  opts?: BedrockInvokeOptions,
): Promise<string> {
  const client = getClient();

  if (!client) {
    return `[local] ${userPrompt.slice(0, 160)}`;
  }

  const modelId = opts?.modelId || getBedrockModelId(opts?.task ?? "default");
  const timeoutMs = opts?.timeoutMs ?? getBedrockTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await client.send(
      new ConverseCommand({
        modelId,
        system: [{ text: systemPrompt }],
        messages: [
          {
            role: "user",
            content: [{ text: userPrompt }],
          },
        ],
        inferenceConfig: {
          temperature: opts?.temperature ?? 0.4,
          maxTokens: opts?.maxTokens ?? 700,
        },
      }),
      { abortSignal: controller.signal },
    );

    return (
      response.output?.message?.content
        ?.map((part) => part.text ?? "")
        .join("") ?? ""
    );
  } catch (error) {
    console.error(`[bedrock] invocation failed for model ${modelId}:`, error);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Invokes Bedrock and parses structured JSON safely with validation.
 * Strips markdown fences or leading/trailing text if present, then runs validator.
 */
export async function invokeBedrockJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  validator: (parsed: unknown) => T | null,
  opts?: BedrockInvokeOptions,
): Promise<T | null> {
  try {
    const raw = await invokeBedrockText(systemPrompt, userPrompt, opts);
    if (!raw || raw.startsWith("[local]")) {
      return null;
    }

    const cleaned = extractJsonString(raw);
    const parsed = JSON.parse(cleaned) as unknown;
    return validator(parsed);
  } catch (error) {
    console.warn("[bedrock] Structured JSON invocation or validation failed:", error);
    return null;
  }
}

export function extractJsonString(raw: string): string {
  const stripped = raw
    .replace(/```json?\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const firstBrace = stripped.indexOf("{");
  const firstBracket = stripped.indexOf("[");

  if (firstBrace === -1 && firstBracket === -1) {
    return stripped;
  }

  const isArray =
    firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace);

  if (isArray) {
    const lastBracket = stripped.lastIndexOf("]");
    if (lastBracket > firstBracket) {
      return stripped.slice(firstBracket, lastBracket + 1);
    }
  } else if (firstBrace !== -1) {
    const lastBrace = stripped.lastIndexOf("}");
    if (lastBrace > firstBrace) {
      return stripped.slice(firstBrace, lastBrace + 1);
    }
  }

  return stripped;
}

/**
 * Streams text chunks from Bedrock ConverseStreamCommand when supported,
 * falling back to single-chunk invokeBedrockText if streaming is not supported.
 */
export async function* streamBedrockText(
  systemPrompt: string,
  userPrompt: string,
  opts?: BedrockInvokeOptions,
): AsyncGenerator<string, void, unknown> {
  const client = getClient();
  if (!client) {
    return;
  }

  const modelId = opts?.modelId || getBedrockModelId(opts?.task ?? "teaching");
  try {
    const response = await client.send(
      new ConverseStreamCommand({
        modelId,
        system: [{ text: systemPrompt }],
        messages: [
          {
            role: "user",
            content: [{ text: userPrompt }],
          },
        ],
        inferenceConfig: {
          temperature: opts?.temperature ?? 0.4,
          maxTokens: opts?.maxTokens ?? 500,
        },
      }),
    );

    if (response.stream) {
      for await (const chunk of response.stream) {
        const text = chunk.contentBlockDelta?.delta?.text;
        if (text) {
          yield text;
        }
      }
      return;
    }
  } catch (err) {
    console.warn("[bedrock] ConverseStream fallback to standard Converse:", err);
  }

  const fullText = await invokeBedrockText(systemPrompt, userPrompt, opts);
  if (fullText && !fullText.startsWith("[local]")) {
    yield fullText;
  }
}
