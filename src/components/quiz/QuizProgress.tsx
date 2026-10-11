import { ProgressBar } from "@/components/ui/ProgressBar";

export function QuizProgress({
  current,
  total,
  language = "en",
}: {
  current: number;
  total: number;
  language?: "en" | "hi";
}) {
  const isHindi = language === "hi";
  return (
    <div className="quiz-progress">
      <span>
        {isHindi
          ? `प्रश्न ${current} / ${total}`
          : `Question ${current} of ${total}`}
      </span>
      <ProgressBar value={(current / total) * 100} />
    </div>
  );
}
