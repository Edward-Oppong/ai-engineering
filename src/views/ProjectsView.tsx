import React, { useState, useEffect, useMemo } from 'react';
import { 
  ProjectItem, 
  ProjectStage, 
  PlannedProject, 
  UserProjectRecord,
  LessonDetail
} from '../types';
import { projectsData, loadLessonDetail } from '../lib/curriculum-loader';
import { db } from '../lib/db';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { CodeViewer } from '../components/CodeViewer';
import { 
  Folder, 
  Layers, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Play, 
  ExternalLink, 
  Filter, 
  Search, 
  X, 
  ChevronRight, 
  ChevronDown, 
  Terminal, 
  Code2, 
  Sparkles,
  Check,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  GitBranch,
  Loader2
} from 'lucide-react';

interface ProjectsViewProps {
  onSelectLesson: (lessonId: string) => void;
  initialProjectId?: string | null;
}

const LEVEL_COLORS: Record<number, { bg: string; text: string; border: string; label: string }> = {
  1: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', label: 'Starter' },
  2: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', label: 'Builder' },
  3: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', label: 'Engineer' },
  4: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', label: 'Systems' },
  5: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-800 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', label: 'Frontier' },
};

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onSelectLesson,
  initialProjectId
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'in_progress' | 'completed' | 'planned'>('all');
  const [activeTab, setActiveTab] = useState<'builds' | 'roadmap'>('builds');
  
  // Selected project for modal/drawer
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [userRecords, setUserRecords] = useState<Record<string, UserProjectRecord>>({});
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [stageSubTab, setStageSubTab] = useState<'spec' | 'starter' | 'tests'>('spec');
  const [projectNotes, setProjectNotes] = useState<string>('');
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [notesSaveStatus, setNotesSaveStatus] = useState<string>('');

  // Prerequisite lesson viewer (in-drawer)
  const [prereqLesson, setPrereqLesson] = useState<{ lesson: LessonDetail; phaseTitle: string } | null>(null);
  const [prereqLoading, setPrereqLoading] = useState(false);

  const handleOpenPrereq = async (lessonId: string) => {
    if (!lessonId) return;
    setPrereqLoading(true);
    try {
      const result = await loadLessonDetail(lessonId);
      if (result) {
        setPrereqLesson({ lesson: result.lesson, phaseTitle: result.phase.title });
      }
    } catch (e) {
      console.error('Failed to load prerequisite lesson:', e);
    } finally {
      setPrereqLoading(false);
    }
  };

  // Load project tracking records from IndexedDB
  const refreshRecords = async () => {
    try {
      const records = await db.getAllProjectRecords();
      const map: Record<string, UserProjectRecord> = {};
      records.forEach(r => {
        map[r.id] = r;
      });
      setUserRecords(map);
    } catch (e) {
      console.error('Failed to load project records:', e);
    }
  };

  useEffect(() => {
    refreshRecords();
  }, []);

  // Handle initial project selection if passed
  useEffect(() => {
    if (initialProjectId) {
      const p = projectsData.projects.find(item => item.id === initialProjectId);
      if (p) {
        openProject(p);
      }
    }
  }, [initialProjectId]);

  const openProject = (project: ProjectItem) => {
    setSelectedProject(project);
    setSelectedStageId(project.stages[0]?.id || null);
    setStageSubTab('spec');
    const existing = userRecords[project.id];
    setProjectNotes(existing?.notes || '');
    setRepoUrl(existing?.repoUrl || '');
    setNotesSaveStatus('');
  };

  const closeProject = () => {
    setSelectedProject(null);
    setSelectedStageId(null);
  };

  // Toggle stage complete
  const handleToggleStage = async (stageId: string) => {
    if (!selectedProject) return;
    try {
      const updated = await db.toggleProjectStageCompleted(selectedProject.id, stageId);
      setUserRecords(prev => ({ ...prev, [selectedProject.id]: updated }));
    } catch (e) {
      console.error('Failed to toggle stage:', e);
    }
  };

  // Mark project completed / in progress
  const handleSetProjectStatus = async (status: 'not_started' | 'in_progress' | 'completed') => {
    if (!selectedProject) return;
    try {
      const updated = await db.setProjectStatus(selectedProject.id, status);
      setUserRecords(prev => ({ ...prev, [selectedProject.id]: updated }));
    } catch (e) {
      console.error('Failed to set project status:', e);
    }
  };

  // Save notes & repo URL
  const handleSaveNotes = async () => {
    if (!selectedProject) return;
    setNotesSaveStatus('saving');
    try {
      const updated = await db.updateProjectNotes(selectedProject.id, projectNotes, repoUrl);
      setUserRecords(prev => ({ ...prev, [selectedProject.id]: updated }));
      setNotesSaveStatus('saved');
      setTimeout(() => setNotesSaveStatus(''), 2500);
    } catch (e) {
      setNotesSaveStatus('error');
    }
  };

  // Extract unique languages across all projects
  const allLanguages = useMemo(() => {
    const set = new Set<string>();
    projectsData.projects.forEach(p => {
      p.languages.forEach(l => set.add(l));
    });
    return Array.from(set).sort();
  }, []);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projectsData.projects.filter(p => {
      // Level
      if (selectedLevel !== 'all' && p.level !== selectedLevel) return false;
      // Language
      if (selectedLanguage !== 'all' && !p.languages.map(l => l.toLowerCase()).includes(selectedLanguage.toLowerCase())) return false;
      // Status
      const record = userRecords[p.id];
      const isCompleted = record?.status === 'completed';
      const isInProgress = record?.status === 'in_progress' || (record?.completedStages && record.completedStages.length > 0);
      if (statusFilter === 'completed' && !isCompleted) return false;
      if (statusFilter === 'in_progress' && (!isInProgress || isCompleted)) return false;
      if (statusFilter === 'ready' && isCompleted) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesTagline = p.tagline.toLowerCase().includes(q);
        const matchesSkills = p.skills.some(s => s.toLowerCase().includes(q));
        const matchesId = p.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTagline && !matchesSkills && !matchesId) return false;
      }
      return true;
    });
  }, [selectedLevel, selectedLanguage, statusFilter, searchQuery, userRecords]);

  // Filter planned roadmap projects
  const filteredPlanned = useMemo(() => {
    return projectsData.planned.filter(p => {
      if (selectedLevel !== 'all' && p.level !== selectedLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedLevel, searchQuery]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = projectsData.projects.length;
    let completed = 0;
    let inProgress = 0;
    Object.values(userRecords).forEach(r => {
      if (r.status === 'completed') completed++;
      else if (r.status === 'in_progress' || (r.completedStages && r.completedStages.length > 0)) inProgress++;
    });
    return { total, completed, inProgress };
  }, [userRecords]);

  const activeStage = useMemo(() => {
    if (!selectedProject || !selectedStageId) return null;
    return selectedProject.stages.find(s => s.id === selectedStageId) || selectedProject.stages[0] || null;
  }, [selectedProject, selectedStageId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans transition-colors">
      
      {/* Top Header & Overview */}
      <div className="mb-8 border-b border-stone-300/70 dark:border-stone-800 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800">
                48 Production Builds · 5 Levels
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                AI Engineering Practice
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Hands-On Engineering Projects
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
              Build complete, deterministic systems from scratch. Each project includes staged milestone specifications, starter code templates, automated local test suites, and verified solution reference implementations.
            </p>
          </div>

          {/* Progress Pill Bar */}
          <div className="flex items-center gap-3 bg-stone-100 dark:bg-stone-900/60 p-2.5 rounded-xl border border-stone-300/60 dark:border-stone-800 text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider font-medium">Built</span>
              <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                {stats.completed} <span className="text-stone-400 dark:text-stone-600">/ {stats.total}</span>
              </span>
            </div>
            <div className="w-px h-8 bg-stone-300 dark:bg-stone-800" />
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider font-medium">In Flight</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {stats.inProgress}
              </span>
            </div>
            <div className="w-px h-8 bg-stone-300 dark:bg-stone-800" />
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider font-medium">Planned</span>
              <span className="font-mono font-bold text-stone-500 dark:text-stone-400">
                {projectsData.planned.length}
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher: Ready Builds vs Planned Roadmap */}
        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={() => setActiveTab('builds')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'builds'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            Ready Projects ({projectsData.projects.length})
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'roadmap'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            Roadmap Pipeline ({projectsData.planned.length})
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Level Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedLevel('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedLevel === 'all'
                  ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              All Levels
            </button>
            {projectsData.levels.map(lvl => {
              const active = selectedLevel === lvl.level;
              const color = LEVEL_COLORS[lvl.level] || LEVEL_COLORS[1];
              return (
                <button
                  key={lvl.level}
                  onClick={() => setSelectedLevel(active ? 'all' : lvl.level)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
                    active
                      ? `${color.bg} ${color.text} ${color.border} font-semibold ring-1 ring-amber-500/30`
                      : 'bg-stone-100 dark:bg-stone-900/60 text-stone-600 dark:text-stone-400 border-transparent hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                  title={lvl.summary}
                >
                  L{lvl.level} {lvl.name}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by title, skill, tech..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-300/60 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter: Language & Status */}
        {activeTab === 'builds' && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-stone-400 flex items-center gap-1 text-[11px]">
              <Filter className="w-3 h-3" /> Language:
            </span>
            <button
              onClick={() => setSelectedLanguage('all')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                selectedLanguage === 'all'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Any
            </button>
            {allLanguages.map(lang => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(selectedLanguage === lang ? 'all' : lang)}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  selectedLanguage === lang
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {lang}
              </button>
            ))}

            <div className="w-px h-4 bg-stone-300 dark:bg-stone-800 mx-1" />

            <span className="text-stone-400 text-[11px]">Status:</span>
            {(['all', 'in_progress', 'completed'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded text-[11px] capitalize ${
                  statusFilter === st
                    ? 'bg-stone-300 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'builds' ? (
        <div>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 bg-stone-100/60 dark:bg-stone-900/40 rounded-xl border border-stone-300/60 dark:border-stone-800">
              <Folder className="w-8 h-8 mx-auto text-stone-400 mb-2 opacity-70" />
              <p className="text-xs text-stone-600 dark:text-stone-400">No projects match the selected filters.</p>
              <button
                onClick={() => { setSelectedLevel('all'); setSelectedLanguage('all'); setSearchQuery(''); setStatusFilter('all'); }}
                className="mt-3 text-xs text-amber-700 dark:text-amber-400 underline font-medium"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(project => {
                const levelMeta = LEVEL_COLORS[project.level] || LEVEL_COLORS[1];
                const record = userRecords[project.id];
                const isCompleted = record?.status === 'completed';
                const completedCount = record?.completedStages?.length || 0;
                const totalStages = project.stagesCount || project.stages.length;

                return (
                  <div
                    key={project.id}
                    onClick={() => openProject(project)}
                    className="group flex flex-col justify-between p-5 rounded-xl bg-[#faf8f4] dark:bg-[#242321] border border-stone-300/70 dark:border-stone-800 hover:border-amber-600/50 dark:hover:border-amber-500/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div>
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${levelMeta.bg} ${levelMeta.text} ${levelMeta.border}`}>
                          L{project.level} · {project.levelName}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isCompleted ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Built
                            </span>
                          ) : completedCount > 0 ? (
                            <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                              {completedCount}/{totalStages} stages
                            </span>
                          ) : null}
                          <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ~{project.hours}h
                          </span>
                        </div>
                      </div>

                      {/* Project Title & Tagline */}
                      <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
                        {project.title}
                      </h3>
                      <p className="mt-1 text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {project.tagline || project.summary}
                      </p>

                      {/* Skills Chips */}
                      {project.skills && project.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {project.skills.slice(0, 3).map((sk, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-stone-200/60 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 text-[10px] font-sans"
                            >
                              {sk}
                            </span>
                          ))}
                          {project.skills.length > 3 && (
                            <span className="text-[10px] text-stone-400 self-center">
                              +{project.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata & CTA */}
                    <div className="mt-5 pt-3 border-t border-stone-200 dark:border-stone-800/60 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px]">
                          {project.languages.join(' · ')}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {totalStages} stages
                        </span>
                      </div>

                      <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium text-[11px] group-hover:translate-x-0.5 transition-transform">
                        Explore <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Planned Projects Roadmap View */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200">
            <strong>Roadmap Pipeline:</strong> These 52 additional project specs represent upcoming challenges from the curriculum, expanding coverage into audio pipelines, distributed evaluation farms, tool-call firewalls, and frontier agent systems.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlanned.map(planned => {
              const levelMeta = LEVEL_COLORS[planned.level] || LEVEL_COLORS[1];
              return (
                <div
                  key={planned.id}
                  className="p-5 rounded-xl bg-[#faf8f4]/80 dark:bg-[#242321]/60 border border-stone-300/50 dark:border-stone-800/60 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${levelMeta.bg} ${levelMeta.text} ${levelMeta.border}`}>
                      L{planned.level}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                      {planned.track || 'Applications'}
                    </span>
                  </div>

                  <h3 className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100">
                    {planned.title}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed">
                    {planned.summary || planned.tagline}
                  </p>

                  {planned.output && (
                    <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/40 text-[11px] text-stone-500 dark:text-stone-400">
                      <strong className="text-stone-700 dark:text-stone-300">Target Output:</strong> {planned.output}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prereq loading spinner — covers the backdrop */}
      {prereqLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-[#faf8f4] dark:bg-[#1e1d1c] border border-stone-300 dark:border-stone-800 shadow-xl text-sm text-stone-700 dark:text-stone-300 font-sans">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            Loading lesson…
          </div>
        </div>
      )}

      {/* In-app Prerequisite Lesson Reader */}
      {prereqLesson && (
        <div className="fixed inset-0 z-[55] bg-stone-900/70 backdrop-blur-sm flex justify-end">
          <div className="relative w-full max-w-4xl min-h-screen bg-[#faf8f4] dark:bg-[#1e1d1c] border-l border-stone-300 dark:border-stone-800 shadow-2xl flex flex-col font-sans transition-colors overflow-y-auto">
            {/* Prereq Header */}
            <div className="sticky top-0 z-20 bg-[#faf8f4]/95 dark:bg-[#1e1d1c]/95 backdrop-blur-md px-6 py-3.5 border-b border-stone-300/70 dark:border-stone-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setPrereqLesson(null)}
                  className="flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Project
                </button>
                <div className="w-px h-4 bg-stone-300 dark:bg-stone-700 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-stone-400 dark:text-stone-500 font-medium truncate">
                    {prereqLesson.phaseTitle} · Prerequisite Reading
                  </p>
                  <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {prereqLesson.lesson.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setPrereqLesson(null)}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors shrink-0"
                aria-label="Close prerequisite reader"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prereq Body */}
            <div className="px-8 py-6 flex-1">
              {/* Reading time & phase context */}
              <div className="flex items-center gap-3 mb-6 text-xs text-stone-500 dark:text-stone-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {prereqLesson.lesson.estTime}
                </span>
                {prereqLesson.lesson.type && (
                  <>
                    <span>·</span>
                    <span className="capitalize">{prereqLesson.lesson.type}</span>
                  </>
                )}
                {prereqLesson.lesson.motto && (
                  <>
                    <span>·</span>
                    <span className="italic text-stone-400 dark:text-stone-500">{prereqLesson.lesson.motto}</span>
                  </>
                )}
              </div>

              {/* Main lesson markdown content */}
              <div className="prose-prereq">
                <MarkdownRenderer content={prereqLesson.lesson.markdown ?? ''} />
              </div>

              {/* Footer CTA */}
              <div className="mt-10 pt-6 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <button
                  onClick={() => setPrereqLesson(null)}
                  className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Project
                </button>
                <button
                  onClick={() => {
                    setPrereqLesson(null);
                    closeProject();
                    onSelectLesson(prereqLesson.lesson.id);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-amber-700 hover:bg-amber-800 text-white transition-colors"
                >
                  Open Full Lesson
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Detail Drawer / Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex justify-end">
          <div className="relative w-full max-w-4xl min-h-screen bg-[#faf8f4] dark:bg-[#1e1d1c] border-l border-stone-300 dark:border-stone-800 shadow-2xl flex flex-col font-sans transition-colors">
            
            {/* Header */}
            <div className="sticky top-0 z-20 bg-[#faf8f4]/95 dark:bg-[#1e1d1c]/95 backdrop-blur-md px-6 py-4 border-b border-stone-300/70 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${LEVEL_COLORS[selectedProject.level]?.bg} ${LEVEL_COLORS[selectedProject.level]?.text} ${LEVEL_COLORS[selectedProject.level]?.border}`}>
                  L{selectedProject.level} · {selectedProject.levelName}
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  ~{selectedProject.hours} hrs · {selectedProject.languages.join(', ')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const isComp = userRecords[selectedProject.id]?.status === 'completed';
                    handleSetProjectStatus(isComp ? 'in_progress' : 'completed');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    userRecords[selectedProject.id]?.status === 'completed'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {userRecords[selectedProject.id]?.status === 'completed' ? 'Finished (Click to undo)' : 'Mark as Built'}
                </button>

                <button
                  onClick={closeProject}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
                  aria-label="Close project modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Title & Tagline */}
              <div>
                <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {selectedProject.title}
                </h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-serif">
                  {selectedProject.tagline || selectedProject.summary}
                </p>
              </div>

              {/* What You Will Build & Useful For */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-stone-100/70 dark:bg-stone-900/60 border border-stone-300/60 dark:border-stone-800 text-xs">
                <div>
                  <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    What You Will Build
                  </h4>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                    {selectedProject.youWillBuild || selectedProject.summary}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Key Acquired Skills
                  </h4>
                  <ul className="space-y-1 text-stone-600 dark:text-stone-400">
                    {selectedProject.skills.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-600 dark:text-amber-400">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Prerequisites if any */}
              {selectedProject.prerequisites && selectedProject.prerequisites.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-stone-500 font-medium flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    Recommended Prerequisites:
                  </span>
                  {selectedProject.prerequisites.map((p, idx) => {
                    const safePath = p.path ?? '';
                    const lessonIdMatch = safePath.replace(/\//g, '-').replace(/^phases-/, 'phase-');
                    return (
                      <button
                        key={idx}
                        onClick={() => handleOpenPrereq(lessonIdMatch)}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800 text-[11px] font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        {p.title}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Run Command Demo Banner */}
              {selectedProject.demo && (
                <div className="p-3.5 rounded-xl bg-stone-900 text-stone-100 dark:bg-black border border-stone-800 text-xs font-mono flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-stone-400 select-none">$</span>
                    <span className="text-emerald-300 font-semibold">{selectedProject.demo.command.join(' ')}</span>
                    <span className="text-stone-500 text-[11px]">in {selectedProject.demo.cwd}</span>
                  </div>
                </div>
              )}

              {/* Staged Milestones Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    Staged Implementation Milestones ({selectedProject.stages.length})
                  </h3>
                  <span className="text-xs text-stone-500">
                    Step-by-step verified progression
                  </span>
                </div>

                {/* Stage Selector Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedProject.stages.map((stage, idx) => {
                    const isStageCompleted = userRecords[selectedProject.id]?.completedStages?.includes(stage.id);
                    const isSelected = stage.id === selectedStageId;

                    return (
                      <button
                        key={stage.id}
                        onClick={() => setSelectedStageId(stage.id)}
                        className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/60 text-stone-900 dark:text-stone-100 ring-1 ring-amber-500/30'
                            : 'bg-stone-100/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200/50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-mono font-bold">Stage 0{idx + 1}</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStage(stage.id);
                            }}
                            className={`p-0.5 rounded cursor-pointer ${
                              isStageCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 hover:text-stone-600'
                            }`}
                            title={isStageCompleted ? 'Stage completed' : 'Mark stage complete'}
                          >
                            {isStageCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                          </span>
                        </div>
                        <span className="font-medium text-xs line-clamp-1">{stage.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Stage Content Area */}
                {activeStage && (
                  <div className="mt-4 p-5 rounded-xl bg-stone-100/60 dark:bg-stone-900/40 border border-stone-300/70 dark:border-stone-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
                      <div>
                        <h4 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
                          {activeStage.title}
                        </h4>
                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                          {activeStage.summary}
                        </p>
                      </div>

                      {/* Sub-tab Switcher: Spec / Starter Code / Tests */}
                      <div className="flex items-center gap-1 bg-stone-200 dark:bg-stone-800 p-1 rounded-lg text-xs self-start">
                        <button
                          onClick={() => setStageSubTab('spec')}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            stageSubTab === 'spec' ? 'bg-[#faf8f4] dark:bg-[#1e1d1c] text-stone-900 dark:text-stone-100 font-semibold shadow-xs' : 'text-stone-500'
                          }`}
                        >
                          Specification
                        </button>
                        <button
                          onClick={() => setStageSubTab('starter')}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            stageSubTab === 'starter' ? 'bg-[#faf8f4] dark:bg-[#1e1d1c] text-stone-900 dark:text-stone-100 font-semibold shadow-xs' : 'text-stone-500'
                          }`}
                        >
                          Starter ({activeStage.starterFiles?.length || 0})
                        </button>
                        <button
                          onClick={() => setStageSubTab('tests')}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            stageSubTab === 'tests' ? 'bg-[#faf8f4] dark:bg-[#1e1d1c] text-stone-900 dark:text-stone-100 font-semibold shadow-xs' : 'text-stone-500'
                          }`}
                        >
                          Tests ({activeStage.testFiles?.length || 0})
                        </button>
                      </div>
                    </div>

                    {/* Stage Tab 1: Spec Markdown */}
                    {stageSubTab === 'spec' && (
                      <div className="space-y-3 font-serif">
                        {activeStage.markdown ? (
                          <MarkdownRenderer content={activeStage.markdown} />
                        ) : (
                          <p className="text-xs text-stone-500 italic">No stage markdown provided.</p>
                        )}
                      </div>
                    )}

                    {/* Stage Tab 2: Starter Code */}
                    {stageSubTab === 'starter' && (
                      <div>
                        {activeStage.starterFiles && activeStage.starterFiles.length > 0 ? (
                          <CodeViewer files={activeStage.starterFiles} />
                        ) : (
                          <p className="text-xs text-stone-500 italic py-4">No starter templates required for this stage.</p>
                        )}
                      </div>
                    )}

                    {/* Stage Tab 3: Test Code */}
                    {stageSubTab === 'tests' && (
                      <div>
                        {activeStage.testFiles && activeStage.testFiles.length > 0 ? (
                          <CodeViewer files={activeStage.testFiles} />
                        ) : (
                          <p className="text-xs text-stone-500 italic py-4">No automated tests configured for this stage.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Developer Workspace & Notes */}
              <div className="p-5 rounded-xl bg-stone-100/70 dark:bg-stone-900/60 border border-stone-300/60 dark:border-stone-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-amber-600" />
                    My Implementation Workspace
                  </h4>
                  {notesSaveStatus === 'saved' && (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                  {notesSaveStatus === 'saving' && <span className="text-stone-400">Saving...</span>}
                </div>

                <div className="space-y-2">
                  <label className="block text-stone-600 dark:text-stone-400 text-[11px]">
                    My Solution Repository / Branch Link:
                  </label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/my-user/ai-engineering-solutions/..."
                    className="w-full p-2.5 rounded-lg bg-[#faf8f4] dark:bg-[#1e1d1c] border border-stone-300 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-stone-500 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-stone-600 dark:text-stone-400 text-[11px]">
                    Implementation Notes & Architecture Takeaways:
                  </label>
                  <textarea
                    value={projectNotes}
                    onChange={e => setProjectNotes(e.target.value)}
                    placeholder="Record notes on edge cases, latency benchmarks, or design decisions..."
                    rows={3}
                    className="w-full p-2.5 rounded-lg bg-[#faf8f4] dark:bg-[#1e1d1c] border border-stone-300 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-stone-500 resize-y font-sans"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveNotes}
                    className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-medium transition-colors"
                  >
                    Save Workspace Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
