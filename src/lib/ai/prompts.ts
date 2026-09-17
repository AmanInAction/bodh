export const explanationStyles = ["simple", "analogy", "step-by-step"] as const;

export function buildExplanationPrompt(topic: string, style = "simple") {
  return `Explain ${topic} in a ${style} way for a curious beginner.`;
}
