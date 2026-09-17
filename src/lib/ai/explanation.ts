import type { ExplanationRequest } from "@/types/ai";

export function explain(request: ExplanationRequest) {
  return `Here is a ${request.style ?? "simple"} explanation of ${request.topic}: start with the smallest useful example, then connect each step to the bigger idea.`;
}
