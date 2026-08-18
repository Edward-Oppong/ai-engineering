import React, { useState } from 'react';
import { QuizData, SM2ReviewItem, UserQuizAttempt } from '../types';
import { db } from '../lib/db';
import { createNewReviewItem } from '../lib/sm2';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowRight
} from 'lucide-react';

interface QuizViewProps {
  quiz: QuizData;
  lessonId: string;
  phaseId: string;
  lessonTitle: string;
  onQuizCompleted?: (score: number) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  quiz,
  lessonId,
  phaseId,
  lessonTitle,
  onQuizCompleted
}) => {
  const questions = quiz.questions || [];
  const [userAnswers, setUserAnswers] = useState<{ [index: number]: number }>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!questions || questions.length === 0) {
    return null;
  }

  const handleSelectOption = (qIndex: number, optionIndex: number) => {
    if (submitted) return;
    setUserAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleReset = () => {
    setUserAnswers({});
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    setIsSaving(true);

    let correctCount = 0;
    const wrongIndexes: number[] = [];
    const answerRecords: { questionIndex: number; selectedOption: number; isCorrect: boolean }[] = [];
    const reviewItemsToSchedule: SM2ReviewItem[] = [];

    questions.forEach((q, idx) => {
      const selected = userAnswers[idx];
      const isCorrect = selected === q.correct;
      if (isCorrect) {
        correctCount++;
      } else {
        wrongIndexes.push(idx);
        const item = createNewReviewItem({
          questionId: `${idx}`,
          lessonId,
          phaseId,
          lessonTitle,
          questionText: q.question,
          options: q.options,
          correctAnswer: q.correct,
          explanation: q.explanation,
        });
        reviewItemsToSchedule.push(item);
      }

      answerRecords.push({
        questionIndex: idx,
        selectedOption: selected !== undefined ? selected : -1,
        isCorrect,
      });
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);

    const attempt: UserQuizAttempt = {
      id: `${lessonId}_${Date.now()}`,
      lessonId,
      phaseId,
      score: scorePercentage,
      totalQuestions: questions.length,
      correctCount,
      answeredAt: new Date().toISOString(),
      wrongQuestionIds: wrongIndexes,
      answers: answerRecords,
    };

    try {
      await db.saveQuizAttempt(attempt);
      if (reviewItemsToSchedule.length > 0) {
        await db.saveReviewItems(reviewItemsToSchedule);
      }
      onQuizCompleted?.(scorePercentage);
    } catch (err) {
      console.error('Error saving quiz attempt to IndexedDB:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const allAnswered = questions.every((_, idx) => userAnswers[idx] !== undefined);
  const correctCount = questions.filter((q, idx) => userAnswers[idx] === q.correct).length;
  const scorePercent = Math.round((correctCount / questions.length) * 100);

  return (
    <div className="my-10 rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#242321] shadow-sm overflow-hidden font-sans">
      
      {/* Header */}
      <div className="p-6 bg-stone-50 dark:bg-[#1e1d1c] border-b border-stone-200 dark:border-stone-800 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium tracking-wider uppercase">
            Knowledge Check
          </div>
          <h3 className="font-serif text-lg sm:text-xl font-medium text-stone-900 dark:text-stone-100 mt-0.5">
            Understanding Assessment
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {questions.length} questions • Incorrect answers will be scheduled in your spaced review deck
          </p>
        </div>

        {submitted && (
          <div className="text-right">
            <div className="text-[11px] text-stone-400 font-medium">Score</div>
            <div className={`text-base font-semibold ${
              scorePercent >= 70 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
            }`}>
              {scorePercent}% ({correctCount}/{questions.length})
            </div>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="p-6 space-y-8 divide-y divide-stone-100 dark:divide-stone-800">
        {questions.map((q, qIdx) => {
          const selectedOption = userAnswers[qIdx];
          const isCorrect = selectedOption === q.correct;

          return (
            <div key={qIdx} className={qIdx > 0 ? 'pt-8' : ''}>
              <div className="flex items-start gap-3">
                <span className="shrink-0 font-mono text-xs text-stone-400 mt-0.5">
                  {qIdx + 1}.
                </span>
                <div className="flex-1">
                  <h4 className="text-sm sm:text-base font-medium text-stone-900 dark:text-stone-100 leading-relaxed">
                    {q.question}
                  </h4>
                </div>
              </div>

              {/* Options */}
              <div className="mt-3.5 grid grid-cols-1 gap-2 ml-6">
                {q.options.map((optionText, optIdx) => {
                  const isThisSelected = selectedOption === optIdx;
                  const isThisCorrect = q.correct === optIdx;

                  let buttonStyles = 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-[#1e1d1c] text-stone-800 dark:text-stone-200 hover:border-stone-400';
                  
                  if (submitted) {
                    if (isThisCorrect) {
                      buttonStyles = 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 font-medium';
                    } else if (isThisSelected && !isThisCorrect) {
                      buttonStyles = 'border-rose-400 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200';
                    } else {
                      buttonStyles = 'border-stone-200 dark:border-stone-800 text-stone-400 opacity-60';
                    }
                  } else if (isThisSelected) {
                    buttonStyles = 'border-stone-800 dark:border-stone-200 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white font-medium';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors flex items-start gap-3 text-xs sm:text-sm leading-relaxed ${buttonStyles}`}
                    >
                      <span className="shrink-0 font-mono text-xs text-stone-400 mt-0.5">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      <span className="flex-1">{optionText}</span>

                      {submitted && isThisCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {submitted && isThisSelected && !isThisCorrect && (
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {submitted && q.explanation && (
                <div className="mt-3.5 ml-6 p-3.5 rounded-lg text-xs leading-relaxed bg-stone-50 dark:bg-[#1e1d1c] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300">
                  <strong className="font-semibold block mb-0.5">Explanation:</strong>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-stone-50 dark:bg-[#1e1d1c] border-t border-stone-200 dark:border-stone-800 flex items-center justify-between flex-wrap gap-4 text-xs">
        <div className="text-stone-500 dark:text-stone-400">
          {submitted ? (
            <span>Check completed · Results saved locally</span>
          ) : (
            <span>
              {Object.keys(userAnswers).length} of {questions.length} answered
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {submitted ? (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 hover:bg-stone-100 text-stone-800 dark:text-stone-200 font-medium transition-colors border border-stone-300 dark:border-stone-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || isSaving}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-colors ${
                allAnswered && !isSaving
                  ? 'bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 cursor-pointer shadow-sm'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>{isSaving ? 'Saving...' : 'Check Answers'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
