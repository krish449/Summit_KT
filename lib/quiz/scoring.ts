import type { AssignedQuestion, QuizOptionKey, QuizReviewQuestion } from '@/lib/types/database';

export function scoreQuizSubmission(
  assignedQuestions: AssignedQuestion[],
  answers: Record<string, QuizOptionKey>,
  passThreshold = 60,
) {
  const review: QuizReviewQuestion[] = assignedQuestions.map((question) => {
    const selectedKey = answers[question.questionId] ?? null;
    const isCorrect = selectedKey === question.correctKey;

    return {
      ...question,
      selectedKey,
      isCorrect,
    };
  });

  const score = review.reduce((sum, question) => {
    return sum + (question.isCorrect ? question.marks : 0);
  }, 0);

  const totalMarks = review.reduce((sum, question) => sum + question.marks, 0);
  const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

  return {
    review,
    score,
    totalMarks,
    percentage,
    passed: percentage >= passThreshold,
  };
}