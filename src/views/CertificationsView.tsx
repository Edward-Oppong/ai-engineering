import React, { useState, useMemo } from 'react';
import { 
  CertificationProgram, 
  CertificationDomain, 
  UserLessonRecord, 
  UserQuizAttempt 
} from '../types';
import { certificationsData } from '../lib/curriculum-loader';
import { 
  Award, 
  ShieldCheck, 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  Clock, 
  ExternalLink, 
  Check, 
  Play, 
  Sparkles,
  BarChart3,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface CertificationsViewProps {
  onSelectLesson: (lessonId: string) => void;
  userLessons: UserLessonRecord[];
}

export const CertificationsView: React.FC<CertificationsViewProps> = ({
  onSelectLesson,
  userLessons
}) => {
  const [activeProgramSlug, setActiveProgramSlug] = useState<string>('mcpa');
  const [activeClaudeTrackSlug, setActiveClaudeTrackSlug] = useState<string>('claude-ccdv-f');

  const currentProgram = useMemo(() => {
    return certificationsData.programs.find(p => p.slug === activeProgramSlug) || certificationsData.programs[0];
  }, [activeProgramSlug]);

  const activeTrack = useMemo(() => {
    if (activeProgramSlug === 'mcpa') {
      return currentProgram.tracks[0];
    }
    return currentProgram.tracks.find(t => t.id === activeClaudeTrackSlug || t.slug === activeClaudeTrackSlug) || currentProgram.tracks[0];
  }, [currentProgram, activeProgramSlug, activeClaudeTrackSlug]);

  // Map completed lesson IDs
  const completedLessonIds = useMemo(() => {
    return new Set(
      userLessons
        .filter(l => l.status === 'completed')
        .map(l => l.id)
    );
  }, [userLessons]);

  // Calculate domain readiness scores based on completed lessons
  const domainStats = useMemo(() => {
    if (!activeTrack || !activeTrack.domains) return [];

    return activeTrack.domains.map((dom: CertificationDomain) => {
      // Find all lessons associated with this domain
      const domainLessons = currentProgram.lessons.filter(l => l.domains && l.domains.includes(dom.id));
      const totalLessons = domainLessons.length;
      const completedCount = domainLessons.filter(l => completedLessonIds.has(l.id)).length;
      const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      return {
        ...dom,
        totalLessons,
        completedCount,
        percentage
      };
    });
  }, [activeTrack, currentProgram, completedLessonIds]);

  // Overall readiness score
  const overallReadiness = useMemo(() => {
    if (domainStats.length === 0) return 0;
    const weightedSum = domainStats.reduce((acc, d) => acc + (d.percentage * (d.weight / 100)), 0);
    return Math.round(weightedSum);
  }, [domainStats]);

  const totalCertCompleted = useMemo(() => {
    return currentProgram.lessons.filter(l => completedLessonIds.has(l.id)).length;
  }, [currentProgram, completedLessonIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans transition-colors">
      
      {/* Top Header */}
      <div className="mb-8 border-b border-stone-300/70 dark:border-stone-800 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-300/60 dark:border-blue-800">
                Industry Certification Curricula
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Exam Blueprints & Practice
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              AI Engineering Certifications
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
              Open-source preparation tracks mapped to official exam blueprints. Master the protocol contracts, security threat boundaries, and architectural patterns measured by official accreditation boards.
            </p>
          </div>

          {/* Overall Exam Readiness Score Card */}
          <div className="bg-[#faf8f4] dark:bg-[#242321] p-3.5 rounded-xl border border-stone-300/60 dark:border-stone-800 flex items-center gap-4 text-xs shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
                Exam Readiness
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-mono font-bold text-stone-900 dark:text-stone-100">
                  {overallReadiness}%
                </span>
                <span className="text-[10px] text-stone-400">score</span>
              </div>
            </div>

            <div className="w-px h-10 bg-stone-300 dark:bg-stone-800" />

            <div className="flex flex-col">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
                Syllabus Progress
              </span>
              <span className="text-xs font-mono font-semibold text-stone-800 dark:text-stone-200">
                {totalCertCompleted} <span className="text-stone-400">/ {currentProgram.lessonsCount} lessons</span>
              </span>
            </div>
          </div>
        </div>

        {/* Certification Program Tabs */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => setActiveProgramSlug('mcpa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeProgramSlug === 'mcpa'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>MCPA (Model Context Protocol Associate)</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-stone-700 dark:bg-stone-300 text-stone-200 dark:text-stone-800">
              34 Lessons
            </span>
          </button>

          <button
            onClick={() => setActiveProgramSlug('claude')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeProgramSlug === 'claude'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>Anthropic Claude Certifications</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-stone-700 dark:bg-stone-300 text-stone-200 dark:text-stone-800">
              33 Lessons
            </span>
          </button>
        </div>
      </div>

      {/* Program Content Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Left Column: Track Info & Domain Breakdown */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Claude Track Selector if Claude active */}
          {activeProgramSlug === 'claude' && (
            <div className="p-4 rounded-xl bg-stone-100/70 dark:bg-stone-900/60 border border-stone-300/60 dark:border-stone-800 space-y-2 text-xs">
              <label className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                Select Exam Blueprint:
              </label>
              <div className="space-y-1.5">
                {currentProgram.tracks.map(trk => {
                  const isSelected = trk.id === activeClaudeTrackSlug || trk.slug === activeClaudeTrackSlug;
                  return (
                    <button
                      key={trk.id}
                      onClick={() => setActiveClaudeTrackSlug(trk.id)}
                      className={`w-full p-2.5 rounded-lg text-left text-xs font-medium transition-all flex items-center justify-between border ${
                        isSelected
                          ? 'bg-white dark:bg-stone-800 border-amber-500/70 text-stone-900 dark:text-stone-100 shadow-xs'
                          : 'bg-transparent border-transparent text-stone-600 dark:text-stone-400 hover:bg-stone-200/50'
                      }`}
                    >
                      <span>{trk.shortName || trk.credential}</span>
                      <span className="text-[10px] font-mono text-stone-400">{trk.examCode}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Exam Specifications Card */}
          <div className="p-5 rounded-xl bg-[#faf8f4] dark:bg-[#242321] border border-stone-300/60 dark:border-stone-800 space-y-3.5 text-xs shadow-sm">
            <h3 className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Official Exam Specifications
            </h3>

            <div className="space-y-2 text-stone-600 dark:text-stone-300 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-800/60">
                <span className="text-stone-500">Provider:</span>
                <span className="font-medium text-stone-900 dark:text-stone-100">{currentProgram.provider}</span>
              </div>
              {currentProgram.specVersion && (
                <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-800/60">
                  <span className="text-stone-500">Spec Version:</span>
                  <span className="font-mono font-medium text-stone-900 dark:text-stone-100">{currentProgram.specVersion}</span>
                </div>
              )}
              {activeTrack?.exam && (
                <>
                  <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-800/60">
                    <span className="text-stone-500">Format:</span>
                    <span className="font-medium text-stone-900 dark:text-stone-100">{activeTrack.exam.format}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-800/60">
                    <span className="text-stone-500">Time Limit:</span>
                    <span className="font-medium text-stone-900 dark:text-stone-100">{activeTrack.exam.timeLimitMinutes} minutes</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-800/60">
                    <span className="text-stone-500">Delivery:</span>
                    <span className="font-medium text-stone-900 dark:text-stone-100">{activeTrack.exam.delivery}</span>
                  </div>
                </>
              )}
            </div>

            {/* Official links */}
            {currentProgram.officialLinks && currentProgram.officialLinks.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] text-stone-400 font-semibold block mb-1">Official Resources:</span>
                <div className="space-y-1">
                  {currentProgram.officialLinks.slice(0, 3).map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-blue-700 dark:text-blue-400 hover:underline text-[11px] py-0.5"
                    >
                      <span className="truncate">{link.label}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 ml-1 opacity-70" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Domain Breakdown & Weighted Progress */}
          <div className="p-5 rounded-xl bg-[#faf8f4] dark:bg-[#242321] border border-stone-300/60 dark:border-stone-800 space-y-4 text-xs shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100">
                Exam Domain Weights
              </h3>
              <span className="text-[11px] text-stone-400">Target 100%</span>
            </div>

            <div className="space-y-3.5">
              {domainStats.map(dom => (
                <div key={dom.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-stone-800 dark:text-stone-200 truncate pr-2">
                      {dom.name}
                    </span>
                    <span className="font-mono text-stone-500 text-[11px]">
                      {dom.weight}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                      style={{ width: `${dom.percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>{dom.completedCount}/{dom.totalLessons} lessons completed</span>
                    <span>{dom.percentage}% ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Full Syllabus Lessons List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              Certification Syllabus Lessons ({currentProgram.lessons.length})
            </h3>
            <span className="text-xs text-stone-500">
              Complete every chapter & quiz
            </span>
          </div>

          <div className="space-y-2.5">
            {currentProgram.lessons.map(lesson => {
              const isFinished = completedLessonIds.has(lesson.id);

              return (
                <div
                  key={lesson.id}
                  onClick={() => onSelectLesson(lesson.id)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#faf8f4] dark:bg-[#242321] border border-stone-300/70 dark:border-stone-800 hover:border-amber-600/50 dark:hover:border-amber-500/50 transition-all cursor-pointer shadow-xs hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="mt-0.5 text-stone-400"
                    >
                      {isFinished ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-stone-400 group-hover:text-stone-600" />
                      )}
                    </span>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-stone-400 font-semibold">
                          #{String(lesson.lessonNum).padStart(2, '0')}
                        </span>
                        <h4 className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
                          {lesson.title}
                        </h4>
                      </div>

                      {/* Domain chips */}
                      {lesson.domains && lesson.domains.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lesson.domains.map((domSlug, idx) => (
                            <span 
                              key={idx}
                              className="px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-[10px] font-mono border border-blue-200/50 dark:border-blue-900/50"
                            >
                              {domSlug}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Meta */}
                  <div className="flex items-center gap-3 sm:self-center ml-7 sm:ml-0 text-xs">
                    <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lesson.estTime}
                    </span>

                    {lesson.hasQuiz && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {lesson.questionCount} Questions
                      </span>
                    )}

                    <button
                      className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium transition-colors"
                    >
                      Study Chapter
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
