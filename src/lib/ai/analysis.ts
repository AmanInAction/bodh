export function analyzeQuiz(answers: number[], correctAnswers: number[]) {
  const correct = answers.filter(
    (answer, index) => answer === correctAnswers[index],
  ).length;
  return {
    correct,
    total: correctAnswers.length,
    score: correctAnswers.length
      ? Math.round((correct / correctAnswers.length) * 100)
      : 0,
  };
}
