import React, { useState } from 'react';
import { learningPathsData } from '../lib/curriculum-loader';
import { LearningPath, LearningPathStage } from '../types';
import { 
  Compass, 
  X, 
  ArrowRight, 
  Briefcase, 
  Layers, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  BookOpen
} from 'lucide-react';

interface LearningPathsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLesson: (lessonId: string) => void;
}

export const LearningPathsModal: React.FC<LearningPathsModalProps> = ({
  isOpen,
  onClose,
  onSelectLesson
}) => {
  const [activeCategory, setActiveCategory] = useState<'career' | 'domains'>('career');
  const [selectedPathId, setSelectedPathId] = useState<string>('agentic-ai-engineer');

  if (!isOpen) return null;

  const careerRoutes = learningPathsData.filter(p => p.kind === 'career-route');
  const coreDomains = learningPathsData.filter(p => p.kind !== 'career-route');

  const currentList = activeCategory === 'career' ? careerRoutes : coreDomains;
  const activePath: LearningPath = currentList.find(p => p.id === selectedPathId) || currentList[0] || learningPathsData[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 font-sans">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#faf8f4] dark:bg-[#1e1d1c] border border-stone-300 dark:border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-stone-300/70 dark:border-stone-800 flex items-center justify-between bg-[#f5f2eb]/90 dark:bg-[#1c1b1a]/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                AI Engineering Learning Paths & Career Routes
              </h2>
              <p className="text-[11px] text-stone-500">
                Structured sequences of practical lessons designed for high-impact roles
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Switcher */}
        <div className="px-6 pt-3 pb-2 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3 text-xs bg-stone-100/50 dark:bg-stone-900/30">
          <button
            onClick={() => {
              setActiveCategory('career');
              setSelectedPathId(careerRoutes[0]?.id || '');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeCategory === 'career'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>6 Career Routes ({careerRoutes.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveCategory('domains');
              setSelectedPathId(coreDomains[0]?.id || '');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeCategory === 'domains'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Core Competency Domains ({coreDomains.length})</span>
          </button>
        </div>

        {/* Modal Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Left Column: Route Selector List */}
          <div className="md:col-span-4 p-4 border-r border-stone-200 dark:border-stone-800 overflow-y-auto space-y-2 max-h-[70vh]">
            {currentList.map(path => {
              const isSelected = path.id === activePath.id;
              return (
                <button
                  key={path.id}
                  onClick={() => setSelectedPathId(path.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all border ${
                    isSelected
                      ? 'bg-white dark:bg-stone-800 border-amber-600/60 text-stone-900 dark:text-stone-100 shadow-sm ring-1 ring-amber-500/20'
                      : 'bg-transparent border-transparent text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono text-stone-400 uppercase tracking-wider">
                      {path.commonTitles?.[0] || 'Track'}
                    </span>
                    {path.estimatedMinutes && (
                      <span className="font-mono text-[10px] text-stone-400">
                        ~{Math.round(path.estimatedMinutes / 60)}h
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif text-sm font-bold leading-tight">
                    {path.title}
                  </h4>
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                    {path.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Column: Path Detail View */}
          <div className="md:col-span-8 p-6 overflow-y-auto max-h-[70vh] space-y-6">
            {activePath && (
              <>
                {/* Path Header */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800">
                      {activePath.workFamily || activePath.kind}
                    </span>
                    {activePath.commonTitles && (
                      <span className="text-xs text-stone-400 font-mono">
                        Roles: {activePath.commonTitles.slice(0, 2).join(' · ')}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
                    {activePath.title}
                  </h3>
                  
                  {activePath.decisionPrompt && (
                    <blockquote className="mt-2 text-xs italic text-stone-600 dark:text-stone-400 border-l-2 border-amber-600 pl-3 py-0.5">
                      "{activePath.decisionPrompt}"
                    </blockquote>
                  )}
                  
                  <p className="mt-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                    {activePath.mission || activePath.summary}
                  </p>
                </div>

                {/* Portfolio Proof if available */}
                {activePath.portfolioProof && (
                  <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-2 text-xs">
                    <h4 className="font-semibold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Target Portfolio Proof: {activePath.portfolioProof.title}
                    </h4>
                    <p className="text-amber-900/80 dark:text-amber-300/80">
                      {activePath.portfolioProof.description}
                    </p>
                    {activePath.portfolioProof.evidence && (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 text-[11px] text-amber-950 dark:text-amber-200">
                        {activePath.portfolioProof.evidence.map((ev, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="text-amber-600">•</span>
                            <span>{ev}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Sequential Stages & Mapped Lessons */}
                <div className="space-y-4">
                  <h4 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    Structured Learning Curriculum ({activePath.stages?.length || 0} Stages)
                  </h4>

                  <div className="space-y-3">
                    {activePath.stages?.map((stage, idx) => (
                      <div
                        key={stage.id || idx}
                        className="p-4 rounded-xl bg-[#faf8f4] dark:bg-[#242321] border border-stone-300/60 dark:border-stone-800 space-y-2.5 text-xs shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-amber-800 dark:text-amber-300 text-[11px]">
                            Stage 0{idx + 1} · {stage.title}
                          </span>
                        </div>

                        {stage.outcome && (
                          <p className="text-stone-600 dark:text-stone-400 text-xs">
                            <strong className="text-stone-800 dark:text-stone-200">Objective:</strong> {stage.outcome}
                          </p>
                        )}

                        {/* Mapped Lessons List */}
                        {stage.lessons && stage.lessons.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">
                              Associated Lessons:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {stage.lessons.map((lesson, lIdx) => (
                                <button
                                  key={lIdx}
                                  onClick={() => {
                                    if (lesson.id) {
                                      onClose();
                                      onSelectLesson(lesson.id);
                                    }
                                  }}
                                  disabled={!lesson.id}
                                  className={`p-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between gap-2 border ${
                                    lesson.id
                                      ? 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700/80 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 cursor-pointer'
                                      : 'bg-stone-50 dark:bg-stone-900 border-dashed border-stone-200 dark:border-stone-800 text-stone-500 opacity-70 cursor-default'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <BookOpen className="w-3 h-3 text-stone-400 shrink-0" />
                                    <span className="truncate">{lesson.title}</span>
                                  </div>
                                  {lesson.id && <ArrowRight className="w-3 h-3 text-amber-600 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
