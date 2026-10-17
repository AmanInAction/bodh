export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  concept: string; // e.g. "mid calculation", "base case", "sorted array condition"
};

/**
 * Public question shape sent to the browser before submission.
 * Answer keys and explanations remain server-side until grading completes.
 */
export type PublicQuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  concept: string;
};

export type GradedQuestionResult = {
  id: string;
  prompt: string;
  options: string[];
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string;
  concept: string;
};

export type QuizSubmission = {
  topicSlug: string;
  answers: number[];
  language?: string;
  quizToken?: string;
};
