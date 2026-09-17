export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type QuizSubmission = {
  topicSlug: string;
  answers: number[];
};
