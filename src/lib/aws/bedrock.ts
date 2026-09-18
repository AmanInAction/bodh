import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? "amazon.nova-lite-v1:0";

const client = process.env.AWS_REGION
  ? new BedrockRuntimeClient({ region: process.env.AWS_REGION })
  : null;

export async function invokeBedrockText(
  systemPrompt: string,
  userPrompt: string,
  opts?: { maxTokens?: number; temperature?: number },
): Promise<string> {
  if (!client) {
    // local fallback — never crashes the UI
    return `[local] ${userPrompt.slice(0, 120)}`;
  }
  const response = await client.send(
    new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: systemPrompt }],
      messages: [{ role: "user", content: [{ text: userPrompt }] }],
      inferenceConfig: {
        maxTokens: opts?.maxTokens ?? 800,
        temperature: opts?.temperature ?? 0.4,
      },
    }),
  );
  return (
    response.output?.message?.content
      ?.map((part) => part.text ?? "")
      .join("") ?? ""
  );
}
