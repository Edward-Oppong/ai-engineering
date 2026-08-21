import React, { useMemo } from 'react';
import { PhaseMetadata, LessonSummary, UserLessonRecord, SM2ReviewItem } from '../types';
import { 
  ArrowRight, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  GraduationCap, 
  Layers, 
  Compass, 
  ChevronRight,
  Flame,
  Monitor
} from 'lucide-react';

interface DashboardViewProps {
  roadmap: PhaseMetadata[];
  lessonsSummary: LessonSummary[];
  userLessons: UserLessonRecord[];
  dueReviews: SM2ReviewItem[];
  streakCount: number;
  onSelectLesson: (lessonId: string) => void;
  onSelectPhase: (phaseId: string) => void;
  onOpenReview: () => void;
  onOpenDesktopInstall?: () => void;
}

// 5 Connected Curriculum Milestones
interface CurriculumMilestone {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  colorName: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentBar: string;
  illustrationPath?: string;
  phaseIds: string[];
}

const MILESTONES: CurriculumMilestone[] = [
  {
    id: 'm1',
    title: 'Foundations & Mathematical ML',
    subtitle: 'Tracks 00 – 03',
    description: 'Tooling setup, linear algebra, multivariable optimization, statistical learning algorithms, and deep learning tensor fundamentals.',
    colorName: 'Indigo',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
    borderColor: 'border-indigo-200/80 dark:border-indigo-800/60',
    accentBar: 'bg-indigo-600 dark:bg-indigo-400',
    illustrationPath: './illustrations/foundations.jpg',
    phaseIds: ['phase-00', 'phase-01', 'phase-02', 'phase-03']
  },
  {
    id: 'm2',
    title: 'Perceptual Modalities',
    subtitle: 'Tracks 04 – 06',
    description: 'Spatial computer vision convolutions, linguistic NLP tokenization & embeddings, and temporal speech audio spectrograms.',
    colorName: 'Sage',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    borderColor: 'border-emerald-200/80 dark:border-emerald-800/60',
    accentBar: 'bg-emerald-600 dark:bg-emerald-400',
    illustrationPath: './illustrations/perception.jpg',
    phaseIds: ['phase-04', 'phase-05', 'phase-06']
  },
  {
    id: 'm3',
    title: 'Generative Models & Transformers',
    subtitle: 'Tracks 07 – 10',
    description: 'Scaled dot-product self-attention, diffusion mathematics, policy gradients RLHF, and building full-scale LLMs from scratch.',
    colorName: 'Terracotta',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-800 dark:text-amber-300',
    borderColor: 'border-amber-200/80 dark:border-amber-800/60',
    accentBar: 'bg-amber-600 dark:bg-amber-500',
    illustrationPath: './illustrations/transformers.jpg',
    phaseIds: ['phase-07', 'phase-08', 'phase-09', 'phase-10']
  },
  {
    id: 'm4',
    title: 'Agentic Systems & Autonomy',
    subtitle: 'Tracks 11 – 16',
    description: 'RAG retrieval pipelines, multimodal vision-language architectures, tool protocols (MCP), ReAct loops, and multi-agent swarms.',
    colorName: 'Plum',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-800 dark:text-purple-300',
    borderColor: 'border-purple-200/80 dark:border-purple-800/60',
    accentBar: 'bg-purple-600 dark:bg-purple-400',
    illustrationPath: './illustrations/agents.jpg',
    phaseIds: ['phase-11', 'phase-12', 'phase-13', 'phase-14', 'phase-15', 'phase-16']
  },
  {
    id: 'm5',
    title: 'Production Infrastructure & Capstones',
    subtitle: 'Tracks 17 – 19',
    description: 'vLLM inference optimization, speculative decoding, model alignment ethics, and comprehensive production autonomous capstones.',
    colorName: 'Teal',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeText: 'text-teal-800 dark:text-teal-300',
    borderColor: 'border-teal-200/80 dark:border-teal-800/60',
    accentBar: 'bg-teal-600 dark:bg-teal-400',
    illustrationPath: './illustrations/production.jpg',
    phaseIds: ['phase-17', 'phase-18', 'phase-19']
  }
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  roadmap,
  lessonsSummary,
  userLessons,
  dueReviews,
  streakCount,
  onSelectLesson,
  onSelectPhase,
  onOpenReview,
  onOpenDesktopInstall
}) => {
  const userLessonMap = useMemo(() => {
    const map = new Map<string, UserLessonRecord>();
    userLessons.forEach(l => map.set(l.id, l));
    return map;
  }, [userLessons]);

  const completedCount = useMemo(() => {
    return userLessons.filter(l => l.status === 'completed').length;
  }, [userLessons]);

  const inProgressCount = useMemo(() => {
    return userLessons.filter(l => l.status === 'in_progress').length;
  }, [userLessons]);

  const totalLessons = lessonsSummary.length;
  const overallPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const continueLesson = useMemo(() => {
    const sorted = [...userLessons].sort((a, b) => {
      const timeA = a.lastViewedAt ? new Date(a.lastViewedAt).getTime() : 0;
      const timeB = b.lastViewedAt ? new Date(b.lastViewedAt).getTime() : 0;
      return timeB - timeA;
    });

    if (sorted.length > 0) {
      const summary = lessonsSummary.find(l => l.id === sorted[0].id);
      if (summary) return { summary, record: sorted[0] };
    }

    if (lessonsSummary.length > 0) {
      return { summary: lessonsSummary[0], record: null };
    }

    return null;
  }, [userLessons, lessonsSummary]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14 animate-in fade-in duration-200 font-sans">
      
      {/* Editorial Hero Feature Card with Technical Lithograph Artwork */}
      <section className="rounded-2xl bg-[#faf8f4] dark:bg-[#242321] border border-stone-300/70 dark:border-stone-800 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Column: Title, Overview & Continue CTA */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-stone-500 dark:text-stone-400">
              <span className="font-mono uppercase tracking-wider text-[11px] px-2 py-0.5 rounded bg-amber-100/80 dark:bg-stone-800 text-amber-900 dark:text-stone-300 border border-amber-200 dark:border-stone-700 font-medium">
                Offline Study Companion
              </span>
              <span>·</span>
              <span>20 Tracks · 503 Chapters</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
              AI Engineering <span className="italic font-normal text-stone-600 dark:text-stone-400">from Scratch</span>
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-xl font-sans">
              A comprehensive, self-paced curriculum progressing from core mathematical foundations and neural architectures to multi-agent swarms and production autonomous systems.
            </p>
          </div>

          {/* Current Reading Section */}
          {continueLesson && (
            <div className="p-4 rounded-xl bg-[#ece8df] dark:bg-[#1e1d1c] border border-stone-300/60 dark:border-stone-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span className="text-[11px] font-medium uppercase tracking-wider text-stone-500">
                  Current Chapter
                </span>
                <span className="font-mono text-[11px]">
                  Track {continueLesson.summary.phaseNum} · #{continueLesson.summary.lessonNum}
                </span>
              </div>

              <div className="font-serif text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100 leading-snug">
                {continueLesson.summary.title}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {continueLesson.summary.estTime}
                </span>

                <button
                  onClick={() => onSelectLesson(continueLesson.summary.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-medium transition-colors shadow-sm"
                >
                  <span>{continueLesson.record?.status === 'completed' ? 'Re-read Chapter' : 'Resume Reading'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-6 pt-2 border-t border-stone-300/50 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400">
            <div>
              <span className="text-stone-900 dark:text-stone-100 font-semibold">{completedCount}</span>
              <span>/{totalLessons} chapters</span>
            </div>
            <div>
              <span className="text-stone-900 dark:text-stone-100 font-semibold">{overallPercentage}%</span>
              <span> finished</span>
            </div>
            {streakCount > 0 && (
              <div className="flex items-center gap-1 text-stone-800 dark:text-stone-200">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-mono font-medium">{streakCount}d</span> streak
              </div>
            )}
            {dueReviews.length > 0 && (
              <button
                onClick={onOpenReview}
                className="text-stone-800 dark:text-stone-200 hover:underline font-medium ml-auto flex items-center gap-1"
              >
                <span>{dueReviews.length} cards due</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Editorial Monograph Artwork Illustration */}
        <div className="lg:col-span-5 bg-[#ece8df] dark:bg-[#1a1918] border-t lg:border-t-0 lg:border-l border-stone-300/60 dark:border-stone-800 p-4 sm:p-6 flex items-center justify-center">
          <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-md border border-stone-300/60 dark:border-stone-700/60 group relative">
            <img 
              src="./illustrations/monograph-cover.jpg" 
              alt="Artificial Intelligence Systems — An Engineering Monograph"
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              onError={(e) => {
                // Graceful fallback if image is missing
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      </section>

      {/* Connected Curriculum Roadmap: 5 Sequential Learning Milestones */}
      <section className="space-y-8">
        <div className="border-b border-stone-300/60 dark:border-stone-800 pb-4 flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Curriculum Architecture
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
              5 Connected Learning Milestones
            </h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md">
            Sequential mastery path designed for holistic comprehension from underlying calculus to enterprise orchestration.
          </p>
        </div>

        {/* Milestones Flow */}
        <div className="space-y-8">
          {MILESTONES.map((milestone, mIdx) => {
            const milestonePhases = roadmap.filter(p => milestone.phaseIds.includes(p.id));
            const milestoneLessons = lessonsSummary.filter(l => milestone.phaseIds.includes(l.phaseId));
            const milestoneCompleted = milestoneLessons.filter(l => userLessonMap.get(l.id)?.status === 'completed').length;
            const milestonePercent = milestoneLessons.length > 0 ? Math.round((milestoneCompleted / milestoneLessons.length) * 100) : 0;
            const isMilestoneDone = milestonePercent === 100 && milestoneLessons.length > 0;

            return (
              <div 
                key={milestone.id}
                className={`rounded-2xl bg-[#faf8f4] dark:bg-[#242321] border ${milestone.borderColor} shadow-sm overflow-hidden transition-all`}
              >
                {/* Milestone Header Banner */}
                <div className="p-6 border-b border-stone-300/50 dark:border-stone-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md ${milestone.badgeBg} ${milestone.badgeText} border border-current/20`}>
                        Milestone 0{mIdx + 1}
                      </span>
                      <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                        {milestone.subtitle}
                      </span>
                      <span className="text-xs text-stone-400">·</span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        {milestoneLessons.length} chapters
                      </span>
                    </div>

                    <h3 className="font-serif text-xl sm:text-2xl font-medium text-stone-900 dark:text-stone-100">
                      {milestone.title}
                    </h3>

                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>

                  {/* Milestone Progress Indicator */}
                  <div className="shrink-0 flex items-center gap-4 text-xs font-sans">
                    <div className="text-right">
                      <div className="text-[11px] text-stone-500 font-mono">Progress</div>
                      <div className="font-serif text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {milestoneCompleted}/{milestoneLessons.length} ({milestonePercent}%)
                      </div>
                    </div>

                    {isMilestoneDone && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                </div>

                {/* Milestone Content Grid (Artwork + Track Cards) */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Optional Milestone Technical Illustration */}
                  {milestone.illustrationPath && (
                    <div className="lg:col-span-4 rounded-xl overflow-hidden border border-stone-300/60 dark:border-stone-800 bg-[#ece8df] dark:bg-[#1a1918] shadow-xs">
                      <img 
                        src={milestone.illustrationPath} 
                        alt={milestone.title}
                        className="w-full h-auto object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).parentElement!.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Tracks Grid */}
                  <div className={milestone.illustrationPath ? 'lg:col-span-8' : 'lg:col-span-12'}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {milestonePhases.map((phase) => {
                        const phaseLessons = lessonsSummary.filter(l => l.phaseId === phase.id);
                        const phaseCompleted = phaseLessons.filter(l => userLessonMap.get(l.id)?.status === 'completed').length;
                        const phasePercent = phaseLessons.length > 0 ? Math.round((phaseCompleted / phaseLessons.length) * 100) : 0;
                        const isDone = phasePercent === 100 && phaseLessons.length > 0;

                        return (
                          <div
                            key={phase.id}
                            onClick={() => onSelectPhase(phase.id)}
                            className="p-3.5 rounded-xl bg-[#eee9de] dark:bg-[#1e1d1c] hover:bg-[#e5dfd3] dark:hover:bg-[#282624] border border-stone-300/60 dark:border-stone-800/80 hover:border-stone-400/60 dark:hover:border-stone-700 cursor-pointer transition-all shadow-2xs group flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1 font-mono">
                                <span>Track {String(phase.number).padStart(2, '0')}</span>
                                <span>{phase.estTime}</span>
                              </div>

                              <h4 className="font-serif text-sm sm:text-base font-normal text-stone-900 dark:text-stone-100 group-hover:text-stone-900 dark:group-hover:text-white transition-colors leading-snug">
                                {phase.title}
                              </h4>
                            </div>

                            <div className="mt-3 pt-2 border-t border-stone-300/40 dark:border-stone-800/50 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                              <span>
                                {phaseCompleted}/{phaseLessons.length} read
                              </span>
                              <span className={`font-mono text-xs ${isDone ? 'text-emerald-700 dark:text-emerald-400 font-medium' : ''}`}>
                                {phasePercent}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Review Deck Banner */}
      <section className="p-6 rounded-2xl bg-[#faf8f4] dark:bg-[#242321] border border-stone-300/70 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4 text-purple-700 dark:text-purple-400" />
            <span>Spaced Repetition Deck</span>
          </div>
          <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-stone-100">
            {dueReviews.length > 0 ? `${dueReviews.length} Flashcard Reviews Scheduled Today` : 'Spaced Repetition Queue is Up to Date'}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Questions missed in chapter quizzes automatically populate this deck according to the SuperMemo-2 retention schedule.
          </p>
        </div>

        <button
          onClick={onOpenReview}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 text-amber-900 dark:text-stone-200 text-xs font-medium transition-colors shrink-0 border border-amber-200 dark:border-stone-700 cursor-pointer"
        >
          <span>Open Review Deck</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* Standalone Desktop Executable (.exe) Installation Banner */}
      {onOpenDesktopInstall && (
        <section className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 dark:border-amber-900/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              <Monitor className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>Standalone Desktop App</span>
            </div>
            <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-stone-100">
              Run 100% Offline with Native Windows Desktop App (.exe)
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-2xl">
              Clone from GitHub, run <code className="px-1 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-mono text-[11px]">npm run electron:build</code>, and install the standalone Windows desktop installer from the <code className="px-1 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-mono text-[11px]">release/</code> folder.
            </p>
          </div>

          <button
            onClick={onOpenDesktopInstall}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-medium transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <span>View Setup Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}
    </div>
  );
};
