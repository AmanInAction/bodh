import { ProgressBar } from "@/components/ui/ProgressBar";
export function QuizProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="quiz-progress">
      <span>
        Question {current} of {total}
      </span>
      <ProgressBar value={(current / total) * 100} />
    </div>
  );
}
