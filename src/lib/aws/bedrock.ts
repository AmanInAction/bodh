import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? "amazon.nova-lite-v1:0";

function hasExplicitCredentials() {
  return Boolean(
    process.env.aWs_ACCESS_KEY_ID &&
    process.env.aWs_SECRET_ACCESS_KEY,
  );
}

export function isBedrockConfigured() {
  return Boolean(
    process.env.aWs_REGION &&
    process.env.BEDROCK_MODEL_ID &&
    (
      hasExplicitCredentials() ||
      process.env.aWs_EXECUTION_ENV ||
      process.env.aWs_LAMBDA_FUNCTION_NAME ||
      process.env.aWs_CONTAINER_CREDENTIALS_RELATIVE_URI ||
      process.env.aWs_CONTAINER_CREDENTIALS_FULL_URI
    ),
  );
}

function getClient() {
  if (!isBedrockConfigured()) return null;

  return new BedrockRuntimeClient({
    region: process.env.aWs_REGION,
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
