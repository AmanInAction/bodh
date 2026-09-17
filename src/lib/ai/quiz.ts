import type { QuizQuestion } from "@/types/quiz";

export function generateQuiz(topic: string): QuizQuestion[] {
  return [
    {
      id: `${topic}-1`,
      prompt: `Which idea is most important when learning ${topic}?`,
      options: [
        "Understand the invariant",
        "Memorize every line",
        "Avoid examples",
        "Skip practice",
      ],
      answer: 0,
      explanation:
        "A clear invariant helps you reason about behavior, even when the inputs change.",
    },
  ];
}
