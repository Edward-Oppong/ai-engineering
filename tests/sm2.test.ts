import { describe, it, expect } from 'vitest';
import { calculateSM2, quizAnswerToSM2Rating, createNewReviewItem } from '../src/lib/sm2';

// ─── calculateSM2 ──────────────────────────────────────────────────────────────

describe('calculateSM2', () => {
  it('returns interval=1 for first correct answer (q=5, rep=0)', () => {
    const result = calculateSM2(5, 0, 1);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeGreaterThan(2.5);
  });

  it('returns interval=6 for second correct answer (rep=1)', () => {
    const result = calculateSM2(5, 1, 1);
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
  });

  it('grows interval geometrically after rep>=2', () => {
    const r1 = calculateSM2(5, 2, 6);
    expect(r1.interval).toBeGreaterThan(6);
    expect(r1.repetitions).toBe(3);
  });

  it('resets to rep=0 and interval=1 on failure (q<3)', () => {
    const result = calculateSM2(1, 5, 30);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it('clamps easeFactor to minimum 1.3 after repeated failures', () => {
    let ef = 2.5;
    let rep = 0;
    let interval = 1;
    // 20 consecutive failures
    for (let i = 0; i < 20; i++) {
      const r = calculateSM2(1, rep, interval, ef);
      ef = r.easeFactor;
      rep = r.repetitions;
      interval = r.interval;
    }
    expect(ef).toBeGreaterThanOrEqual(1.3);
  });

  it('clamps quality above 5', () => {
    const result = calculateSM2(10, 0, 1); // quality=10 should behave like 5
    const ref = calculateSM2(5, 0, 1);
    expect(result.easeFactor).toBe(ref.easeFactor);
  });

  it('clamps quality below 0', () => {
    const result = calculateSM2(-2, 0, 1); // quality=-2 should behave like 0
    const ref = calculateSM2(0, 0, 1);
    expect(result.easeFactor).toBe(ref.easeFactor);
  });

  it('returns a valid dueDate in YYYY-MM-DD format', () => {
    const result = calculateSM2(5, 0, 1);
    expect(result.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('easeFactor is rounded to 2 decimal places', () => {
    const result = calculateSM2(4, 3, 12);
    const decimals = result.easeFactor.toString().split('.')[1] ?? '';
    expect(decimals.length).toBeLessThanOrEqual(2);
  });

  it('correct at q=3 keeps repetition streak', () => {
    const result = calculateSM2(3, 2, 6);
    expect(result.repetitions).toBe(3);
  });

  it('q=2 (borderline fail) resets streak', () => {
    const result = calculateSM2(2, 5, 30);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });
});

// ─── quizAnswerToSM2Rating ─────────────────────────────────────────────────────

describe('quizAnswerToSM2Rating', () => {
  it('wrong answer → 1', () => {
    expect(quizAnswerToSM2Rating(false)).toBe(1);
  });

  it('correct but hesitant → 3', () => {
    expect(quizAnswerToSM2Rating(true, false)).toBe(3);
  });

  it('correct and confident → 5', () => {
    expect(quizAnswerToSM2Rating(true, true)).toBe(5);
    expect(quizAnswerToSM2Rating(true)).toBe(5); // default isConfidant=true
  });
});

// ─── createNewReviewItem ───────────────────────────────────────────────────────

describe('createNewReviewItem', () => {
  const params = {
    questionId: '0',
    lessonId: 'phase-01-lesson-03',
    phaseId: 'phase-01',
    lessonTitle: 'Test Lesson',
    questionText: 'What is X?',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 2,
    explanation: 'X is C.',
  };

  it('creates item with SM-2 defaults (rep=0, EF=2.5, interval=1)', () => {
    const item = createNewReviewItem(params);
    expect(item.repetitions).toBe(0);
    expect(item.easeFactor).toBe(2.5);
    expect(item.interval).toBe(1);
    expect(item.lastQualityRating).toBe(1);
  });

  it('generates a stable ID from lessonId + questionId', () => {
    const item = createNewReviewItem(params);
    expect(item.id).toBe('phase-01-lesson-03_q0');
  });

  it('dueDate is set to today', () => {
    const today = new Date().toISOString().slice(0, 10);
    const item = createNewReviewItem(params);
    expect(item.dueDate).toBe(today);
  });

  it('preserves all question fields', () => {
    const item = createNewReviewItem(params);
    expect(item.questionText).toBe(params.questionText);
    expect(item.options).toEqual(params.options);
    expect(item.correctAnswer).toBe(params.correctAnswer);
    expect(item.explanation).toBe(params.explanation);
  });
});
