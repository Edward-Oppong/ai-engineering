import React, { useState, useEffect, useMemo } from 'react';
import { SM2ReviewItem } from '../types';
import { db } from '../lib/db';
import { calculateSM2 } from '../lib/sm2';
import { 
  CheckCircle2, 
  ArrowRight, 
  Eye
} from 'lucide-react';

interface ReviewQueueViewProps {
  onSelectLesson: (lessonId: string) => void;
  onReviewUpdated: () => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  onSelectLesson,
  onReviewUpdated
}) => {
  const [allItems, setAllItems] = useState<SM2ReviewItem[]>([]);
  const [dueItems, setDueItems] = useState<SM2ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'study' | 'deck'>('study');

  const loadDeck = async () => {
    setLoading(true);
    try {
      const all = await db.getAllReviewItems();
      const due = await db.getDueReviewItems();
      setAllItems(all);
      setDueItems(due);
      setCurrentIndex(0);
      setShowAnswer(false);
      setSelectedOption(null);
    } catch (err) {
      console.error('Error loading SM-2 review deck:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeck();
  }, []);

  const currentCard = dueItems[currentIndex] || null;

  const handleRating = async (qualityRating: number) => {
    if (!currentCard) return;

    const sm2 = calculateSM2(
      qualityRating,
      currentCard.repetitions,
      currentCard.interval,
      currentCard.easeFactor
    );

    const updatedCard: SM2ReviewItem = {
      ...currentCard,
      repetitions: sm2.repetitions,
      interval: sm2.interval,
      easeFactor: sm2.easeFactor,
      dueDate: sm2.dueDate,
      lastReviewedAt: new Date().toISOString(),
      lastQualityRating: qualityRating,
    };

    await db.saveReviewItem(updatedCard);
    onReviewUpdated();

    setShowAnswer(false);
    setSelectedOption(null);
    if (currentIndex < dueItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      await loadDeck();
    }
  };

  const previewIntervals = useMemo(() => {
    if (!currentCard) return null;
    return {
      again: calculateSM2(1, currentCard.repetitions, currentCard.interval, currentCard.easeFactor).interval,
      hard: calculateSM2(3, currentCard.repetitions, currentCard.interval, currentCard.easeFactor).interval,
      good: calculateSM2(4, currentCard.repetitions, currentCard.interval, currentCard.easeFactor).interval,
      easy: calculateSM2(5, currentCard.repetitions, currentCard.interval, currentCard.easeFactor).interval,
    };
  }, [currentCard]);

  const masteredCount = allItems.filter(item => item.repetitions >= 3).length;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center font-sans text-xs text-stone-500">
        Loading review deck...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-200 font-sans">
      
      {/* Header */}
      <div className="flex items-baseline justify-between flex-wrap gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100 tracking-tight">
            Review Deck
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Spaced repetition flashcards generated from missed quiz questions
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-4 text-xs font-sans">
          <button
            onClick={() => setActiveTab('study')}
            className={`py-1 transition-colors ${
              activeTab === 'study'
                ? 'text-stone-900 dark:text-stone-100 font-semibold border-b border-stone-800 dark:border-stone-200'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
            }`}
          >
            Due Today ({dueItems.length})
          </button>
          <button
            onClick={() => setActiveTab('deck')}
            className={`py-1 transition-colors ${
              activeTab === 'deck'
                ? 'text-stone-900 dark:text-stone-100 font-semibold border-b border-stone-800 dark:border-stone-200'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
            }`}
          >
            All Cards ({allItems.length})
          </button>
        </div>
      </div>

      {/* Stats Summary Line */}
      <div className="flex items-center gap-6 text-xs text-stone-500 dark:text-stone-400 font-sans">
        <div><strong className="text-stone-900 dark:text-stone-100 font-medium">{dueItems.length}</strong> due for review</div>
        <div><strong className="text-stone-900 dark:text-stone-100 font-medium">{masteredCount}</strong> mastered (streak ≥ 3)</div>
        <div><strong className="text-stone-900 dark:text-stone-100 font-medium">{allItems.length}</strong> total in deck</div>
      </div>

      {/* Cognitive Retention Mathematical Model Banner */}
      <div className="rounded-xl overflow-hidden border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#242321] shadow-sm p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-7 space-y-2">
          <div className="text-[11px] font-mono font-medium text-purple-700 dark:text-purple-400 uppercase tracking-wider">
            Quantitative Memory Model
          </div>
          <h3 className="font-serif text-lg sm:text-xl font-medium text-stone-900 dark:text-stone-100">
            SuperMemo-2 Spaced Consolidation
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            Based on Ebbinghaus forgetting curves. Flashcard intervals expand geometrically upon successful recall, reinforcing neural memory traces just as forgetting begins.
          </p>
        </div>

        <div className="md:col-span-5 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xs">
          <img 
            src="./illustrations/retention.jpg" 
            alt="Cognitive Spaced Repetition Quantitative Models"
            className="w-full h-auto object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Main Flashcard Session */}
      {activeTab === 'study' && (
        <div>
          {dueItems.length === 0 ? (
            <div className="p-10 rounded-xl bg-white dark:bg-[#242321] border border-stone-200/90 dark:border-stone-800 text-center space-y-2 max-w-lg mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-700 dark:text-emerald-400 mx-auto" />
              <h2 className="font-serif text-xl font-medium text-stone-900 dark:text-stone-100">All Reviews Completed</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
                You are caught up on all scheduled review items for today. As you read chapters and complete quizzes, missed concepts will be scheduled here.
              </p>
            </div>
          ) : currentCard ? (
            <div className="max-w-2xl mx-auto space-y-4">
              
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-mono">
                <span>Card {currentIndex + 1} of {dueItems.length}</span>
                <span>Repetition {currentCard.repetitions}</span>
              </div>

              {/* Flashcard Box */}
              <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#242321] border border-stone-200/90 dark:border-stone-800 shadow-sm space-y-6">
                
                {/* Lesson Context */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400">
                  <div className="flex items-center gap-1">
                    <span>From chapter:</span>
                    <button 
                      onClick={() => onSelectLesson(currentCard.lessonId)}
                      className="text-stone-800 dark:text-stone-200 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>{currentCard.lessonTitle}</span>
                      <ArrowRight className="w-3 h-3 text-stone-400" />
                    </button>
                  </div>
                </div>

                {/* Question */}
                <h3 className="font-serif text-lg sm:text-xl font-medium text-stone-900 dark:text-stone-100 leading-snug">
                  {currentCard.questionText}
                </h3>

                {/* Options */}
                <div className="space-y-2 pt-2">
                  {currentCard.options.map((opt, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    const isCorrect = currentCard.correctAnswer === optIdx;

                    let optionStyle = 'bg-stone-50 dark:bg-[#1e1d1c] border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:border-stone-400';
                    if (showAnswer) {
                      if (isCorrect) {
                        optionStyle = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600 text-emerald-900 dark:text-emerald-200 font-medium';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 text-rose-900 dark:text-rose-200';
                      } else {
                        optionStyle = 'bg-transparent border-stone-200 dark:border-stone-800 text-stone-400 opacity-60';
                      }
                    } else if (isSelected) {
                      optionStyle = 'bg-stone-100 dark:bg-stone-800 border-stone-800 dark:border-stone-200 text-stone-900 dark:text-white font-medium';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => {
                          if (!showAnswer) {
                            setSelectedOption(optIdx);
                            setShowAnswer(true);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-colors flex items-start gap-3 text-xs sm:text-sm leading-relaxed ${optionStyle}`}
                      >
                        <span className="w-5 h-5 rounded border border-stone-300 dark:border-stone-700 text-[11px] font-mono flex items-center justify-center shrink-0 mt-0.5 text-stone-500">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {!showAnswer && (
                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-medium transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reveal Explanation</span>
                    </button>
                  </div>
                )}

                {/* Explanation */}
                {showAnswer && currentCard.explanation && (
                  <div className="p-3.5 rounded-lg bg-stone-50 dark:bg-[#1e1d1c] border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 leading-relaxed space-y-1">
                    <strong className="text-stone-900 dark:text-stone-100 block font-medium">Explanation:</strong>
                    <p>{currentCard.explanation}</p>
                  </div>
                )}

                {/* Rating Buttons — Understated Recall Feedback */}
                {showAnswer && previewIntervals && (
                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-3 font-sans">
                    <div className="text-center text-xs text-stone-500 dark:text-stone-400">
                      Rate your recall difficulty:
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => handleRating(1)}
                        className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 border border-stone-200 dark:border-stone-700 transition-colors text-center"
                      >
                        <span className="font-medium text-xs text-stone-900 dark:text-stone-100 block">Forgot</span>
                        <span className="text-[10px] text-stone-500 font-mono mt-0.5 block">+{previewIntervals.again}d</span>
                      </button>

                      <button
                        onClick={() => handleRating(3)}
                        className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-colors text-center"
                      >
                        <span className="font-medium text-xs text-stone-900 dark:text-stone-100 block">Hard</span>
                        <span className="text-[10px] text-stone-500 font-mono mt-0.5 block">+{previewIntervals.hard}d</span>
                      </button>

                      <button
                        onClick={() => handleRating(4)}
                        className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-colors text-center"
                      >
                        <span className="font-medium text-xs text-stone-900 dark:text-stone-100 block">Good</span>
                        <span className="text-[10px] text-stone-500 font-mono mt-0.5 block">+{previewIntervals.good}d</span>
                      </button>

                      <button
                        onClick={() => handleRating(5)}
                        className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 border border-stone-200 dark:border-stone-700 transition-colors text-center"
                      >
                        <span className="font-medium text-xs text-stone-900 dark:text-stone-100 block">Easy</span>
                        <span className="text-[10px] text-stone-500 font-mono mt-0.5 block">+{previewIntervals.easy}d</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* All Cards Table */}
      {activeTab === 'deck' && (
        <div className="space-y-3 font-sans">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            Total {allItems.length} review cards saved in local database
          </div>

          <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#242321] overflow-hidden shadow-sm">
            {allItems.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">
                No cards created yet. Missed quiz questions will appear here.
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {allItems.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 flex-wrap hover:bg-stone-50 dark:hover:bg-[#2a2926]">
                    <div className="min-w-0 max-w-xl">
                      <div className="text-xs text-stone-500 dark:text-stone-400">
                        {item.lessonTitle}
                      </div>
                      <div className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 mt-0.5 line-clamp-2">
                        {item.questionText}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-stone-400 shrink-0">
                      <span>Due: <strong className="text-stone-700 dark:text-stone-300">{item.dueDate}</strong></span>
                      <span>• {item.interval}d</span>
                      <span>• {item.repetitions} reps</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
