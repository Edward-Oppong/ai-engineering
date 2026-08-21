import React, { useState, useMemo } from 'react';
import { PhaseMetadata, LessonSummary, UserLessonRecord, LessonStatus } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  FileCode, 
  ChevronRight, 
  Search,
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface PhasesViewProps {
  roadmap: PhaseMetadata[];
  lessonsSummary: LessonSummary[];
  userLessons: UserLessonRecord[];
  initialSelectedPhaseId?: string;
  onSelectLesson: (lessonId: string) => void;
}

interface MilestoneGroup {
  id: string;
  name: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  illustrationPath: string;
  phaseIds: string[];
}

const MILESTONE_GROUPS: MilestoneGroup[] = [
  {
    id: 'm1',
    name: '1. Foundations & Core ML',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    illustrationPath: './illustrations/foundations.jpg',
    phaseIds: ['phase-00', 'phase-01', 'phase-02', 'phase-03']
  },
  {
    id: 'm2',
    name: '2. Perceptual Modalities',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    illustrationPath: './illustrations/perception.jpg',
    phaseIds: ['phase-04', 'phase-05', 'phase-06']
  },
  {
    id: 'm3',
    name: '3. Generative & Transformers',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-800 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-800',
    illustrationPath: './illustrations/transformers.jpg',
    phaseIds: ['phase-07', 'phase-08', 'phase-09', 'phase-10']
  },
  {
    id: 'm4',
    name: '4. Agentic Systems',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-800 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-800',
    illustrationPath: './illustrations/agents.jpg',
    phaseIds: ['phase-11', 'phase-12', 'phase-13', 'phase-14', 'phase-15', 'phase-16']
  },
  {
    id: 'm5',
    name: '5. Production & Capstones',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeText: 'text-teal-800 dark:text-teal-300',
    borderColor: 'border-teal-200 dark:border-teal-800',
    illustrationPath: './illustrations/production.jpg',
    phaseIds: ['phase-17', 'phase-18', 'phase-19']
  }
];

export const PhasesView: React.FC<PhasesViewProps> = ({
  roadmap,
  lessonsSummary,
  userLessons,
  initialSelectedPhaseId,
  onSelectLesson
}) => {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(
    initialSelectedPhaseId || roadmap[0]?.id || 'phase-00'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const userLessonMap = useMemo(() => {
    const map = new Map<string, UserLessonRecord>();
    userLessons.forEach(l => map.set(l.id, l));
    return map;
  }, [userLessons]);

  const selectedPhase = useMemo(() => {
    return roadmap.find(p => p.id === selectedPhaseId) || roadmap[0];
  }, [roadmap, selectedPhaseId]);

  const selectedPhaseIndex = useMemo(() => {
    return roadmap.findIndex(p => p.id === selectedPhaseId);
  }, [roadmap, selectedPhaseId]);

  const prevPhase = selectedPhaseIndex > 0 ? roadmap[selectedPhaseIndex - 1] : null;
  const nextPhase = selectedPhaseIndex < roadmap.length - 1 ? roadmap[selectedPhaseIndex + 1] : null;

  const currentPhaseMilestone = useMemo(() => {
    return MILESTONE_GROUPS.find(g => g.phaseIds.includes(selectedPhaseId)) || MILESTONE_GROUPS[0];
  }, [selectedPhaseId]);

  const currentPhaseLessons = useMemo(() => {
    return lessonsSummary.filter(l => l.phaseId === selectedPhaseId);
  }, [lessonsSummary, selectedPhaseId]);

  const filteredLessons = useMemo(() => {
    return currentPhaseLessons.filter(lesson => {
      const record = userLessonMap.get(lesson.id);
      const status: LessonStatus = record ? record.status : 'not_started';

      if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = lesson.title.toLowerCase().includes(q);
        const matchMotto = lesson.motto.toLowerCase().includes(q);
        const matchNum = String(lesson.lessonNum).includes(q);
        if (!matchTitle && !matchMotto && !matchNum) return false;
      }

      return true;
    });
  }, [currentPhaseLessons, userLessonMap, statusFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200 font-sans">
      
      {/* Header */}
      <div className="mb-8 border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100 tracking-tight">
          Curriculum Syllabus
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          20 progressive tracks organized across 5 connected milestones
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Track Selector Grouped by Milestone */}
        <div className="lg:col-span-4 space-y-6 max-h-[80vh] overflow-y-auto pr-1">
          {MILESTONE_GROUPS.map(milestone => {
            const milestonePhases = roadmap.filter(p => milestone.phaseIds.includes(p.id));

            return (
              <div key={milestone.id} className="space-y-1.5">
                <div className="text-[11px] font-mono font-medium text-stone-500 dark:text-stone-400 px-2 py-0.5 uppercase tracking-wider flex items-center justify-between">
                  <span>{milestone.name}</span>
                </div>

                <div className="space-y-1">
                  {milestonePhases.map(phase => {
                    const isSelected = phase.id === selectedPhaseId;
                    const phaseLessons = lessonsSummary.filter(l => l.phaseId === phase.id);
                    const completedCount = phaseLessons.filter(l => userLessonMap.get(l.id)?.status === 'completed').length;
                    const isDone = phaseLessons.length > 0 && completedCount === phaseLessons.length;

                    return (
                      <button
                        key={phase.id}
                        onClick={() => setSelectedPhaseId(phase.id)}
                        className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-center justify-between border ${
                          isSelected
                            ? 'bg-stone-100 dark:bg-[#2d2b29] border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-medium shadow-xs'
                            : 'bg-[#eee9de] dark:bg-[#242321] hover:bg-[#e5dfd3] dark:hover:bg-[#2a2926] border-stone-300/60 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-xs text-stone-500 dark:text-stone-400 shrink-0">
                            {String(phase.number).padStart(2, '0')}
                          </span>
                          <div className="min-w-0">
                            <div className="font-serif text-sm truncate">{phase.title}</div>
                            <div className="text-[11px] text-stone-500 dark:text-stone-400">
                              {completedCount}/{phaseLessons.length} read
                            </div>
                          </div>
                        </div>

                        {isDone ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 ml-2" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-stone-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Track Content */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPhase && (
            <div className={`p-6 rounded-xl bg-[#faf8f4] dark:bg-[#242321] border ${currentPhaseMilestone.borderColor} shadow-sm space-y-4`}>
              
              {/* Milestone Context Badge */}
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 flex-wrap gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${currentPhaseMilestone.badgeBg} ${currentPhaseMilestone.badgeText}`}>
                  {currentPhaseMilestone.name}
                </span>
                <span className="font-mono">{selectedPhase.estTime}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                <div className="sm:col-span-8 space-y-1.5">
                  <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100 tracking-tight">
                    {selectedPhase.title}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Track {String(selectedPhase.number).padStart(2, '0')} · {currentPhaseLessons.length} chapters
                  </p>
                </div>
                {currentPhaseMilestone.illustrationPath && (
                  <div className="sm:col-span-4 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800 shadow-2xs">
                    <img 
                      src={currentPhaseMilestone.illustrationPath}
                      alt={currentPhaseMilestone.name}
                      className="w-full h-24 sm:h-20 object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-sans">
                  {['all', 'not_started', 'in_progress', 'completed'].map((filterVal) => (
                    <button
                      key={filterVal}
                      onClick={() => setStatusFilter(filterVal)}
                      className={`py-0.5 px-2 rounded capitalize transition-colors ${
                        statusFilter === filterVal
                          ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold'
                          : 'hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      {filterVal.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="flex-1 min-w-[180px] relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search chapters..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-stone-50 dark:bg-[#1c1b1a] border border-stone-200 dark:border-stone-800 rounded-md text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Chapters Directory */}
          <div className="space-y-2">
            {filteredLessons.length === 0 ? (
              <div className="py-12 text-center text-stone-500 dark:text-stone-400 text-xs bg-[#faf8f4] dark:bg-[#242321] rounded-xl border border-stone-300/60 dark:border-stone-800 font-sans">
                No chapters match the selected filter.
              </div>
            ) : (
              filteredLessons.map((lesson) => {
                const record = userLessonMap.get(lesson.id);
                const status: LessonStatus = record ? record.status : 'not_started';

                return (
                  <div
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson.id)}
                    className="p-3.5 rounded-lg bg-[#eee9de] dark:bg-[#242321] hover:bg-[#e5dfd3] dark:hover:bg-[#2a2926] border border-stone-300/60 dark:border-stone-800 hover:border-stone-400/60 dark:hover:border-stone-700 cursor-pointer transition-colors shadow-2xs flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5">
                        {status === 'completed' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                        )}
                        {status === 'in_progress' && (
                          <div className="w-4 h-4 rounded-full border border-sky-600 dark:border-sky-400 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400" />
                          </div>
                        )}
                        {status === 'not_started' && (
                          <Circle className="w-4 h-4 text-stone-300 dark:text-stone-600" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-mono text-xs text-stone-400">
                            #{String(lesson.lessonNum).padStart(2, '0')}
                          </span>
                          <h3 className="font-serif text-sm sm:text-base text-stone-900 dark:text-stone-100 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
                            {lesson.title}
                          </h3>
                        </div>

                        {lesson.motto && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 italic font-serif line-clamp-1">
                            "{lesson.motto}"
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-400 font-sans">
                          <span>{lesson.estTime}</span>
                          {lesson.codeFilesCount > 0 && (
                            <span>• {lesson.codeFilesCount} files</span>
                          )}
                          {lesson.hasQuiz && (
                            <span>• Check-in quiz</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-xs font-mono text-stone-400">
                      {status === 'completed' && <span className="text-emerald-700 dark:text-emerald-400">Done</span>}
                      {status === 'in_progress' && <span className="text-sky-700 dark:text-sky-400">Reading</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sequential Track Navigation Footer */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 font-sans">
            <div>
              {prevPhase ? (
                <button
                  onClick={() => setSelectedPhaseId(prevPhase.id)}
                  className="flex items-center gap-1.5 hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous: Track {prevPhase.number} ({prevPhase.title})</span>
                </button>
              ) : <div />}
            </div>

            <div>
              {nextPhase ? (
                <button
                  onClick={() => setSelectedPhaseId(nextPhase.id)}
                  className="flex items-center gap-1.5 hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  <span>Next: Track {nextPhase.number} ({nextPhase.title})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : <div />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
