export type ExplanationRequest = {
  topic: string;
  question: string;
  style?: "simple" | "analogy" | "step-by-step";
};

export type Recommendation = {
  title: string;
  reason: string;
  href: string;
};
