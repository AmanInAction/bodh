import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { getAwsCredentials, getEnv } from "@/config/env";

const MODEL_ID = getEnv("BEDROCK_MODEL_ID") || "amazon.nova-lite-v1:0";

function hasExplicitCredentials() {
  return Boolean(getAwsCredentials());
}

export function isBedrockConfigured() {
  return Boolean(
    getEnv("AWS_REGION") &&
    getEnv("BEDROCK_MODEL_ID") &&
    (hasExplicitCredentials() ||
      getEnv("EXECUTION_ENV") ||
      getEnv("LAMBDA_FUNCTION_NAME") ||
      getEnv("CONTAINER_CREDENTIALS_RELATIVE_URI") ||
      getEnv("CONTAINER_CREDENTIALS_FULL_URI")),
  );
}

function getClient() {
  if (!isBedrockConfigured()) return null;

  return new BedrockRuntimeClient({
    region: getEnv("AWS_REGION"),
    credentials: getAwsCredentials(),
  });
}

export async function invokeBedrockText(
  systemPrompt: string,
  userPrompt: string,
  opts?: {
    temperature?: number;
    maxTokens?: number;
  },
): Promise<string> {
  const client = getClient();

  if (!client) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[bedrock] AWS Bedrock is not configured. Required environment variables (APP_AWS_REGION, APP_BEDROCK_MODEL_ID, and AWS credentials) are missing in production.",
      );
    }
    console.warn(
      "[bedrock] AWS Bedrock is not configured. Falling back to local placeholder for prompt:",
      userPrompt.slice(0, 80),
    );
    return `[local] ${userPrompt.slice(0, 160)}`;
  }

  try {
    const response = await client.send(
      new ConverseCommand({
        modelId: MODEL_ID,
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
    );

    return (
      response.output?.message?.content
        ?.map((part) => part.text ?? "")
        .join("") ?? ""
    );
  } catch (error) {
    console.error("[bedrock] invocation failed:", error);
    throw error;
  }
}
