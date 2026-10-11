export function QuizResult({
  score,
  language = "en",
}: {
  score: number;
  language?: "en" | "hi";
}) {
  const isHindi = language === "hi";
  return (
    <div className="result">
      <span className="eyebrow">
        {isHindi ? "अभ्यास पूरा हुआ" : "Practice complete"}
      </span>
      <strong>{score}%</strong>
      <p>
        {isHindi
          ? "बहुत बढ़िया! व्याख्या की समीक्षा करें और फिर अगले प्रश्न का प्रयास करें।"
          : "Nice work. Review the explanation, then try one more question."}
      </p>
    </div>
  );
}
