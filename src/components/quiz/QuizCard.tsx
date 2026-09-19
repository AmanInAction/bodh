import type { QuizQuestion } from "@/types/quiz";
import { Card } from "@/components/ui/Card";

export function QuizCard({ question }: { question: QuizQuestion }) {
  return (
    <Card>
      <span className="eyebrow">Quick check</span>
      <h2>{question.prompt}</h2>
      <div className="quiz-options">
        {question.options.map((option, index) => (
          <button className="quiz-option" key={option}>
            {String.fromCharCode(65 + index)} <span>{option}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
