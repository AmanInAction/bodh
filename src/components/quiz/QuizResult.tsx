export function QuizResult({ score }: { score: number }) {
  return (
    <div className="result">
      <span className="eyebrow">Practice complete</span>
      <strong>{score}%</strong>
      <p>Nice work. Review the explanation, then try one more question.</p>
    </div>
  );
}
