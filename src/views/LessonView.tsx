import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LessonDetail, PhaseMetadata, UserLessonRecord, LessonStatus, UserReadingPreferences } from '../types';
import { loadLessonDetail, getAdjacentLessons } from '../lib/curriculum-loader';
import { db } from '../lib/db';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { CodeViewer } from '../components/CodeViewer';
import { QuizView } from '../components/QuizView';
import { ReadingControls } from '../components/ReadingControls';
import { 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Clock, 
  Check, 
  ChevronLeft,
  ChevronRight,
  Minimize2
} from 'lucide-react';

interface LessonViewProps {
  lessonId: string;
  onBackToPhases: () => void;
  onSelectLesson: (lessonId: string) => void;
  onProgressUpdated: () => void;
}

const DEFAULT_PREFERENCES: UserReadingPreferences = {
  fontSize: 'base',
  fontFamily: 'serif',
  columnWidth: 'standard',
  focusMode: false,
};

export const LessonView: React.FC<LessonViewProps> = ({
  lessonId,
  onBackToPhases,
  onSelectLesson,
  onProgressUpdated
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [phase, setPhase] = useState<PhaseMetadata | null>(null);
  const [userRecord, setUserRecord] = useState<UserLessonRecord | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [saveNoteStatus, setSaveNoteStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeTab, setActiveTab] = useState<'reading' | 'code' | 'quiz'>('reading');
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Reading preferences stored in localStorage
  const [preferences, setPreferences] = useState<UserReadingPreferences>(() => {
    try {
      const stored = localStorage.getItem('ai_eng_reading_prefs');
      return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const notesTimeoutRef = useRef<any>(null);

  const updatePreferences = (partial: Partial<UserReadingPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...partial };
      localStorage.setItem('ai_eng_reading_prefs', JSON.stringify(updated));
      return updated;
    });
  };

  // Keyboard shortcut 'F' for focus mode toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in textarea or input
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'textarea' || tag === 'input') return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        updatePreferences({ focusMode: !preferences.focusMode });
      }
      if (e.key === 'Escape' && preferences.focusMode) {
        updatePreferences({ focusMode: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preferences.focusMode]);

  useEffect(() => {
    let isMounted = true;
    const fetchLesson = async () => {
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        const detail = await loadLessonDetail(lessonId);
        const bookmarks = await db.getBookmarks();
        if (!isMounted) return;

        setIsBookmarked(bookmarks.includes(lessonId));

        if (detail) {
          setLessonDetail(detail.lesson);
          setPhase(detail.phase);

          const record = await db.markLessonViewed({
            id: detail.lesson.id,
            phaseId: detail.lesson.phaseId,
            title: detail.lesson.title,
            slug: detail.lesson.slug,
          });

          if (isMounted) {
            setUserRecord(record);
            setNotes(record.notes || '');
            onProgressUpdated();
          }
        }
      } catch (err) {
        console.error('Failed to load lesson detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLesson();
    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  const handleToggleBookmark = async () => {
    const newState = await db.toggleBookmark(lessonId);
    setIsBookmarked(newState);
  };

  const handleNotesChange = (val: string) => {
    setNotes(val);
    setSaveNoteStatus('saving');

    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }

    notesTimeoutRef.current = setTimeout(async () => {
      if (lessonDetail) {
        const updated = await db.updateLessonNotes(
          {
            id: lessonDetail.id,
            phaseId: lessonDetail.phaseId,
            title: lessonDetail.title,
            slug: lessonDetail.slug,
          },
          val
        );
        setUserRecord(updated);
        setSaveNoteStatus('saved');
        setTimeout(() => setSaveNoteStatus('idle'), 2000);
      }
    }, 800);
  };

  const handleToggleComplete = async () => {
    if (!lessonDetail) return;
    const newStatus: LessonStatus = userRecord?.status === 'completed' ? 'in_progress' : 'completed';
    const updated = await db.setLessonStatus(
      {
        id: lessonDetail.id,
        phaseId: lessonDetail.phaseId,
        title: lessonDetail.title,
        slug: lessonDetail.slug,
      },
      newStatus
    );
    setUserRecord(updated);
    onProgressUpdated();
  };

  const { prev, next } = getAdjacentLessons(lessonId);

  // Milestone color accent & illustration based on phase number
  const domainTheme = useMemo(() => {
    if (!phase) return { badgeBg: 'bg-stone-100 dark:bg-stone-800', badgeText: 'text-stone-700 dark:text-stone-300', name: 'Curriculum', illustrationPath: './illustrations/monograph-cover.jpg' };
    const num = phase.number;
    if (num <= 3) return { badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40', badgeText: 'text-indigo-800 dark:text-indigo-300', name: '1. Foundations & Core ML', illustrationPath: './illustrations/foundations.jpg' };
    if (num <= 6) return { badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40', badgeText: 'text-emerald-800 dark:text-emerald-300', name: '2. Perceptual Modalities', illustrationPath: './illustrations/perception.jpg' };
    if (num <= 10) return { badgeBg: 'bg-amber-50 dark:bg-amber-950/40', badgeText: 'text-amber-800 dark:text-amber-300', name: '3. Generative & Transformers', illustrationPath: './illustrations/transformers.jpg' };
    if (num <= 16) return { badgeBg: 'bg-purple-50 dark:bg-purple-950/40', badgeText: 'text-purple-800 dark:text-purple-300', name: '4. Agentic Systems', illustrationPath: './illustrations/agents.jpg' };
    return { badgeBg: 'bg-teal-50 dark:bg-teal-950/40', badgeText: 'text-teal-800 dark:text-teal-300', name: '5. Production & Capstones', illustrationPath: './illustrations/production.jpg' };
  }, [phase]);

  // Reading column width CSS class
  const columnWidthClass = useMemo(() => {
    switch (preferences.columnWidth) {
      case 'focused':
        return 'max-w-2xl';
      case 'wide':
        return 'max-w-4xl';
      default:
        return 'max-w-3xl';
    }
  }, [preferences.columnWidth]);

  // Typography font size CSS class
  const fontSizeClass = useMemo(() => {
    switch (preferences.fontSize) {
      case 'sm':
        return 'text-sm leading-relaxed';
      case 'lg':
        return 'text-lg leading-relaxed';
      case 'xl':
        return 'text-xl leading-relaxed';
      default:
        return 'text-base leading-relaxed';
    }
  }, [preferences.fontSize]);

  const fontFamilyClass = preferences.fontFamily === 'serif' ? 'font-serif' : 'font-sans';

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center font-sans">
        <p className="text-xs text-stone-500 dark:text-stone-400">Opening chapter...</p>
      </div>
    );
  }

  if (!lessonDetail || !phase) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4 font-sans">
        <h2 className="font-serif text-xl text-stone-900 dark:text-stone-100">Chapter Not Found</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">Could not locate the requested lesson file.</p>
        <button
          onClick={onBackToPhases}
          className="px-3.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs hover:bg-stone-200 transition-colors border border-stone-200 dark:border-stone-700"
        >
          Return to Syllabus
        </button>
      </div>
    );
  }

  const isCompleted = userRecord?.status === 'completed';

  return (
    <div className={`pb-28 animate-in fade-in duration-200 ${preferences.focusMode ? 'pt-6' : ''}`}>
      
      {/* Top Banner Navigation — Hidden in Focus Mode */}
      {!preferences.focusMode && (
        <div className="border-b border-stone-300/60 dark:border-stone-800 bg-[#f5f2eb]/90 dark:bg-[#1c1b1a]/90 backdrop-blur-md sticky top-14 z-30 font-sans">
          <div className={`${columnWidthClass} mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4 flex-wrap text-xs`}>
            <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
              <button
                onClick={onBackToPhases}
                className="hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1 font-medium transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Track {phase.number}</span>
              </button>
              <span>/</span>
              <span className="text-stone-800 dark:text-stone-200 font-medium truncate max-w-[180px] sm:max-w-sm">
                Chapter {lessonDetail.lessonNum}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Clean Text Tabs */}
              <div className="flex items-center gap-4 text-xs">
                <button
                  onClick={() => setActiveTab('reading')}
                  className={`py-1 transition-colors ${
                    activeTab === 'reading'
                      ? 'text-stone-900 dark:text-stone-100 font-semibold border-b border-stone-800 dark:border-stone-200'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  Read
                </button>

                {lessonDetail.codeFiles && lessonDetail.codeFiles.length > 0 && (
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`py-1 transition-colors ${
                      activeTab === 'code'
                        ? 'text-stone-900 dark:text-stone-100 font-semibold border-b border-stone-800 dark:border-stone-200'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    Code ({lessonDetail.codeFiles.length})
                  </button>
                )}

                {lessonDetail.quiz && (
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className={`py-1 transition-colors ${
                      activeTab === 'quiz'
                        ? 'text-stone-900 dark:text-stone-100 font-semibold border-b border-stone-800 dark:border-stone-200'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    Knowledge Check
                  </button>
                )}
              </div>

              {/* Reading Comfort & Bookmark Toolbar */}
              <div className="pl-3 border-l border-stone-200 dark:border-stone-800">
                <ReadingControls
                  preferences={preferences}
                  onUpdatePreferences={updatePreferences}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={handleToggleBookmark}
                  onToggleFocusMode={() => updatePreferences({ focusMode: !preferences.focusMode })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Focus Mode Exit Floating Bar */}
      {preferences.focusMode && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in duration-200">
          <button
            onClick={() => updatePreferences({ focusMode: false })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-900 dark:bg-stone-100/90 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-medium backdrop-blur-md shadow-lg transition-all"
            title="Exit Focus Mode (Esc or F)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Focus Mode</span>
          </button>
        </div>
      )}

      {/* Main Chapter Column */}
      <div className={`${columnWidthClass} mx-auto px-4 sm:px-6 pt-8`}>
        
        {/* Editorial Domain Artwork Hero Banner */}
        {domainTheme.illustrationPath && (
          <div className="mb-8 rounded-xl overflow-hidden border border-stone-200/90 dark:border-stone-800 bg-stone-50 dark:bg-[#1f1e1c] shadow-xs relative group">
            <img 
              src={domainTheme.illustrationPath}
              alt={domainTheme.name}
              className="w-full h-32 sm:h-44 object-cover transition-transform duration-500 group-hover:scale-[1.01]"
              onError={(e) => {
                (e.target as HTMLElement).parentElement!.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4 sm:p-5">
              <div className="text-white">
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-stone-300 font-medium">
                  {domainTheme.name}
                </span>
                <div className="font-serif text-sm sm:text-base text-stone-100 font-medium line-clamp-1">
                  Track {String(phase.number).padStart(2, '0')}: {phase.title}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chapter Header */}
        <div className="mb-10 space-y-3 font-sans">
          <div className="flex items-center gap-2.5 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${domainTheme.badgeBg} ${domainTheme.badgeText}`}>
              {domainTheme.name}
            </span>
            <span className="font-mono text-stone-400">·</span>
            <span className="font-mono">Track {String(phase.number).padStart(2, '0')} · Chapter {String(lessonDetail.lessonNum).padStart(2, '0')}</span>
            <span className="font-mono text-stone-400">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {lessonDetail.estTime}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
            {lessonDetail.title}
          </h1>

          {lessonDetail.motto && (
            <div className="py-2 text-stone-600 dark:text-stone-300 font-serif text-base sm:text-lg italic leading-relaxed border-b border-stone-200/80 dark:border-stone-800">
              "{lessonDetail.motto}"
            </div>
          )}

          {/* In-chapter section jump links */}
          {lessonDetail.beats && lessonDetail.beats.length > 0 && activeTab === 'reading' && (
            <div className="pt-2">
              <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                In this chapter
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {lessonDetail.beats.map((beat) => (
                  <a
                    key={beat.anchor}
                    href={`#${beat.anchor}`}
                    className="text-xs px-2.5 py-1 rounded bg-stone-100/80 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  >
                    {beat.heading}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Reading View */}
        {activeTab === 'reading' && (
          <div className={`space-y-12 ${fontFamilyClass} ${fontSizeClass}`}>
            <MarkdownRenderer content={lessonDetail.markdown} />

            {lessonDetail.codeFiles && lessonDetail.codeFiles.length > 0 && (
              <div className="pt-8 border-t border-stone-200 dark:border-stone-800 font-sans">
                <CodeViewer files={lessonDetail.codeFiles} />
              </div>
            )}

            {lessonDetail.quiz && (
              <div className="pt-8 border-t border-stone-200 dark:border-stone-800 font-sans">
                <QuizView 
                  quiz={lessonDetail.quiz}
                  lessonId={lessonDetail.id}
                  phaseId={lessonDetail.phaseId}
                  lessonTitle={lessonDetail.title}
                  onQuizCompleted={() => onProgressUpdated()}
                />
              </div>
            )}

            {/* End of Lesson Completion Action Card */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 via-[#faf8f4] to-emerald-500/10 dark:from-amber-950/20 dark:via-[#242321] dark:to-emerald-950/20 border border-stone-300/80 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Chapter Completed?
                </span>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  {isCompleted 
                    ? 'Great work! You have marked this chapter finished. Your study progress and streak are saved.' 
                    : 'Mark this chapter as completed to record your study progress and update your streak.'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleToggleComplete}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isCompleted ? 'Finished (Mark Incomplete)' : 'Complete Chapter'}</span>
                </button>

                {lessonDetail.quiz && (
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-medium border border-amber-300/60 dark:border-amber-800 transition-colors"
                  >
                    <span>Take Quiz</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Next Chapter Connection Card */}
            {next && (
              <div className="p-6 rounded-xl bg-[#faf8f4] dark:bg-[#242321] border border-stone-300/60 dark:border-stone-800 shadow-sm space-y-3 font-sans">
                <div className="text-[11px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center justify-between">
                  <span>Next Chapter in Sequence</span>
                  <span className="font-mono">#{next.lessonNum} · {next.estTime}</span>
                </div>

                <h3 className="font-serif text-xl font-medium text-stone-900 dark:text-stone-100">
                  {next.title}
                </h3>

                {next.motto && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 italic font-serif">
                    "{next.motto}"
                  </p>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onSelectLesson(next.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-medium transition-colors shadow-sm"
                  >
                    <span>Read Next Chapter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Code Files */}
        {activeTab === 'code' && (
          <div className="space-y-6 font-sans">
            <CodeViewer files={lessonDetail.codeFiles} />
          </div>
        )}

        {/* Tab 3: Dedicated Quiz */}
        {activeTab === 'quiz' && lessonDetail.quiz && (
          <div className="space-y-6 font-sans">
            <QuizView 
              quiz={lessonDetail.quiz}
              lessonId={lessonDetail.id}
              phaseId={lessonDetail.phaseId}
              lessonTitle={lessonDetail.title}
              onQuizCompleted={() => onProgressUpdated()}
            />
          </div>
        )}

        {/* Study Notebook */}
        <div className="mt-14 p-6 rounded-xl bg-[#faf8f4] dark:bg-[#242321] border border-stone-300/60 dark:border-stone-800 shadow-sm space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-xs text-stone-900 dark:text-stone-100 uppercase tracking-wider">Chapter Notes</h3>
            <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-3">
              {saveNoteStatus === 'saving' && <span>Saving...</span>}
              {saveNoteStatus === 'saved' && (
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
              {saveNoteStatus === 'idle' && <span>Auto-saved locally</span>}
              <span className="font-mono text-[10px] text-stone-400 dark:text-stone-600">
                {notes.length.toLocaleString()}/50,000
              </span>
            </div>
          </div>

          <textarea
            value={notes}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Record personal notes, synthesis, or key takeaways..."
            maxLength={50000}
            aria-label="Chapter study notes"
            className="w-full h-32 p-3 rounded-lg bg-[#ece8df] dark:bg-[#1e1d1c] border border-stone-300/50 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:border-stone-500 resize-y leading-relaxed font-sans"
          />
        </div>
      </div>

      {/* Persistent Bottom Bar — Hidden in Focus Mode */}
      {!preferences.focusMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#f5f2eb]/95 dark:bg-[#1c1b1a]/95 border-t border-stone-300/60 dark:border-stone-800 backdrop-blur-md py-2.5 px-4 sm:px-8 font-sans">
          <div className={`${columnWidthClass} mx-auto flex items-center justify-between gap-4`}>
            
            {/* Previous Chapter */}
            <div>
              {prev ? (
                <button
                  onClick={() => onSelectLesson(prev.id)}
                  className="flex items-center gap-1 py-1.5 px-2.5 rounded text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white text-xs transition-colors"
                  title={`Previous: ${prev.title}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
              ) : <div />}
            </div>

            {/* Mark Complete Action */}
            <button
              onClick={handleToggleComplete}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm ${
                isCompleted
                  ? 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                  : 'bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Finished (Click to undo)</span>
                </>
              ) : (
                <span>Mark as Finished</span>
              )}
            </button>

            {/* Next Chapter */}
            <div>
              {next ? (
                <button
                  onClick={() => onSelectLesson(next.id)}
                  className="flex items-center gap-1 py-1.5 px-2.5 rounded text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white text-xs transition-colors"
                  title={`Next: ${next.title}`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : <div />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
