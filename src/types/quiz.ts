export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  concept: string; // e.g. "mid calculation", "base case", "sorted array condition"
};

export type QuizSubmission = {
  topicSlug: string;
  answers: number[];
  language?: string;
};
