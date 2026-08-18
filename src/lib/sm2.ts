import { SM2ReviewItem } from '../types';

export interface SM2Result {
  repetitions: number;
  interval: number;
  easeFactor: number;
  dueDate: string;
}

/**
 * SuperMemo 2 (SM-2) Spaced Repetition Algorithm
 * @param quality rating from 0 (complete blackout) to 5 (perfect recall)
 * @param repetitions current consecutive successful repetitions
 * @param previousInterval previous interval in days
 * @param previousEaseFactor current ease factor (default 2.5)
 */
export function calculateSM2(
  quality: number,
  repetitions: number,
  previousInterval: number,
  previousEaseFactor: number = 2.5
): SM2Result {
  // Clamp quality between 0 and 5
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let nextRepetitions: number;
  let nextInterval: number;
  let nextEaseFactor: number;

  // Calculate new Ease Factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  nextEaseFactor = previousEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (nextEaseFactor < 1.3) {
    nextEaseFactor = 1.3;
  }

  if (q >= 3) {
    // Correct response
    if (repetitions === 0) {
      nextInterval = 1;
    } else if (repetitions === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(previousInterval * nextEaseFactor);
    }
    nextRepetitions = repetitions + 1;
  } else {
    // Incorrect response - reset repetition streak, review tomorrow (or today)
    nextRepetitions = 0;
    nextInterval = 1;
  }

  // Calculate due date (YYYY-MM-DD)
  const dueDateObj = new Date();
  dueDateObj.setDate(dueDateObj.getDate() + nextInterval);
  const dueDate = dueDateObj.toISOString().slice(0, 10);

  return {
    repetitions: nextRepetitions,
    interval: nextInterval,
    easeFactor: Number(nextEaseFactor.toFixed(2)),
    dueDate,
  };
}

/**
 * Convert a binary quiz answer (correct/incorrect) or confidence level to an SM-2 rating
 */
export function quizAnswerToSM2Rating(isCorrect: boolean, isConfidant: boolean = true): number {
  if (!isCorrect) return 1; // Wrong answer
  if (!isConfidant) return 3; // Correct with hesitation
  return 5; // Perfect recall
}

/**
 * Create a new review item from a failed quiz question
 */
export function createNewReviewItem(params: {
  questionId: string;
  lessonId: string;
  phaseId: string;
  lessonTitle: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}): SM2ReviewItem {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `${params.lessonId}_q${params.questionId}`,
    questionId: params.questionId,
    lessonId: params.lessonId,
    phaseId: params.phaseId,
    lessonTitle: params.lessonTitle,
    questionText: params.questionText,
    options: params.options,
    correctAnswer: params.correctAnswer,
    explanation: params.explanation,
    repetitions: 0,
    interval: 1,
    easeFactor: 2.5,
    dueDate: today,
    lastReviewedAt: new Date().toISOString(),
    lastQualityRating: 1,
  };
}
