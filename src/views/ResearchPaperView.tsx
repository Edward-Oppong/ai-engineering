import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Sparkles, TrendingUp, CheckCircle2, Lock, ExternalLink,
  Clock, ChevronDown, ChevronUp, Zap, FileText, Brain, AlertCircle,
  RefreshCw, Star, ArrowRight, Target, Code2, Plus, Key, Layers, Search
} from 'lucide-react';
import {
  getDailyPapers,
  getAIPaperAnalysis,
  fetchAITrends,
  getReadPapersToday,
  markPaperRead,
  isDailyReadingGoalMet,
  PAPER_CATALOGUE,
  getAllPapers,
  fetchDynamicResearchPapers,
  getGroqApiKey,
  setGroqApiKey,
  hasGroqApiKey,
} from '../lib/groq-papers';
import { ResearchPaper, AITrendItem } from '../types';

const DAILY_GOAL = 4;

const CATEGORY_COLORS: Record<string, string> = {
  'Foundations':        'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700',
  'Transformers & LLMs':'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300/60 dark:border-amber-800',
  'Agents & MCP':       'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-800',
  'Inference & Systems':'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300/60 dark:border-blue-800',
  'Frontier Evals':     'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300/60 dark:border-purple-800',
};

const TREND_CATEGORY_COLORS: Record<string, string> = {
  'LLMs':       'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300',
  'Agents':     'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
  'Inference':  'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300',
  'Training':   'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300',
  'Multimodal': 'bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300',
  'Safety':     'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300',
};

interface Props {
  onGoalMet?: () => void;
}

type Tab = 'daily' | 'library' | 'trends';

// ─── Daily Progress Ring ──────────────────────────────────────
function ProgressRing({ read, goal }: { read: number; goal: number }) {
  const pct = Math.min(read / goal, 1);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={90} height={90} className="-rotate-90">
        <circle cx={45} cy={45} r={r} fill="none"
          stroke="currentColor" strokeWidth={6}
          className="text-stone-200 dark:text-stone-700" />
        <circle cx={45} cy={45} r={r} fill="none"
          stroke="currentColor" strokeWidth={6}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-amber-600 dark:text-amber-400 transition-all duration-700" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold font-mono text-stone-900 dark:text-stone-100">{read}</span>
        <span className="text-[10px] text-stone-500 dark:text-stone-400">/ {goal}</span>
      </div>
    </div>
  );
}

// ─── Paper Card ───────────────────────────────────────────────
function PaperCard({
  paper,
  isRead,
  onRead,
  isToday = false,
}: {
  paper: ResearchPaper;
  isRead: boolean;
  onRead: (id: string) => void;
  isToday?: boolean;
}) {
  const [expanded, setExpanded]     = useState(false);
  const [analysis, setAnalysis]     = useState<string | null>(null);
  const [loadingAI, setLoadingAI]   = useState(false);
  const [aiError, setAIError]       = useState<string | null>(null);

  const catColor = CATEGORY_COLORS[paper.category] ?? CATEGORY_COLORS['Foundations'];

  async function handleGetAnalysis() {
    if (analysis) { setExpanded(e => !e); return; }
    setLoadingAI(true);
    setAIError(null);
    try {
      const result = await getAIPaperAnalysis(paper);
      setAnalysis(result);
      setExpanded(true);
    } catch (err: any) {
      setAIError(err.message ?? 'Failed to get AI analysis');
    } finally {
      setLoadingAI(false);
    }
  }

  function handleMarkRead() {
    onRead(paper.id);
  }

  return (
    <article className={`rounded-xl border transition-all duration-200 ${
      isRead
        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/30'
        : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900'
    } ${isToday ? 'ring-1 ring-amber-400/40 dark:ring-amber-500/20' : ''}`}>

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isRead ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-stone-100 dark:bg-stone-800'}`}>
            {isRead
              ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              : <FileText className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${catColor}`}>
                {paper.category}
              </span>
              {paper.isSeminal && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800">
                  <Star className="w-2.5 h-2.5" /> Seminal
                </span>
              )}
            </div>

            <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100 leading-snug mb-0.5">
              {paper.title}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {paper.authors.join(', ')} · {paper.publishedDate}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-xs text-stone-400 dark:text-stone-500">
            <Clock className="w-3 h-3" />
            <span>{paper.readingMinutes}m</span>
          </div>
        </div>

        {/* Abstract */}
        <p className="mt-3 text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3">
          {paper.abstract}
        </p>

        {/* Key Takeaways */}
        <ul className="mt-3 space-y-1">
          {paper.keyTakeaways.map((tk, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400">
              <ArrowRight className="w-3 h-3 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{tk}</span>
            </li>
          ))}
        </ul>

        {/* Phases */}
        {paper.phaseTitles?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {paper.phaseTitles.map(pt => (
              <span key={pt} className="px-1.5 py-0.5 text-[10px] rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                {pt}
              </span>
            ))}
          </div>
        )}

        {/* AI Analysis section */}
        {expanded && analysis && (
          <div className="mt-4 border-t border-stone-200 dark:border-stone-700 pt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Brain className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">AI Analysis by Groq</span>
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-wrap prose-compact">
              {analysis}
            </div>
          </div>
        )}

        {aiError && (
          <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-lg p-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {paper.arxivUrl && (
            <a
              href={paper.arxivUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors border border-stone-200 dark:border-stone-700"
            >
              <ExternalLink className="w-3 h-3" /> Read Paper
            </a>
          )}

          <button
            onClick={handleGetAnalysis}
            disabled={loadingAI}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors border border-amber-300/60 dark:border-amber-800 disabled:opacity-50"
          >
            {loadingAI ? (
              <><RefreshCw className="w-3 h-3 animate-spin" /> Getting AI analysis…</>
            ) : expanded ? (
              <><ChevronUp className="w-3 h-3" /> Hide Analysis</>
            ) : (
              <><Sparkles className="w-3 h-3" /> AI Deep-Dive</>
            )}
          </button>

          {!isRead && (
            <button
              onClick={handleMarkRead}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Read
            </button>
          )}

          {isRead && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Read today
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Trend Card ───────────────────────────────────────────────
function TrendCard({ item }: { item: AITrendItem }) {
  const catColor = TREND_CATEGORY_COLORS[item.category] ?? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300';

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 hover:border-stone-300 dark:hover:border-stone-600 transition-colors">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
          <TrendingUp className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${catColor}`}>
              {item.category}
            </span>
            <span className="text-[10px] text-stone-400 dark:text-stone-500">{item.date}</span>
            <span className="text-[10px] text-stone-400 dark:text-stone-500">· {item.source}</span>
          </div>
          <h4 className="font-semibold text-sm text-stone-900 dark:text-stone-100 leading-snug mb-1.5">
            {item.title}
          </h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            {item.summary}
          </p>
          {item.engineeringTakeaway && (
            <div className="mt-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5">
              <Zap className="w-3 h-3 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                {item.engineeringTakeaway}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────
export function ResearchPaperView({ onGoalMet }: Props) {
  const [activeTab, setActiveTab]   = useState<Tab>('daily');
  const [dailyPapers, setDailyPapers] = useState<ResearchPaper[]>([]);
  const [readToday, setReadToday]   = useState<string[]>([]);
  const [goalMet, setGoalMet]       = useState(false);
  const [trends, setTrends]         = useState<AITrendItem[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [trendsLoaded, setTrendsLoaded]   = useState(false);
  const [libFilter, setLibFilter]   = useState<string>('All');

  // Refresh & Dynamic Discovery State
  const [cycleOffset, setCycleOffset]             = useState(0);
  const [isDiscoverOpen, setIsDiscoverOpen]       = useState(false);
  const [discoverTopic, setDiscoverTopic]         = useState('Reasoning Models & Test-Time Compute');
  const [customTopicInput, setCustomTopicInput]   = useState('');
  const [isGenerating, setIsGenerating]           = useState(false);
  const [discoverError, setDiscoverError]         = useState<string | null>(null);

  // Groq API Key UI state
  const [apiKeyConfigured, setApiKeyConfigured] = useState(() => hasGroqApiKey());
  const [isKeyModalOpen, setIsKeyModalOpen]     = useState(false);
  const [keyInputValue, setKeyInputValue]       = useState('');

  function handleSaveKey() {
    const trimmed = keyInputValue.trim();
    if (!trimmed) return;
    setGroqApiKey(trimmed);
    setApiKeyConfigured(true);
    setIsKeyModalOpen(false);
    setKeyInputValue('');
  }

  const allLibraryPapers = getAllPapers();
  const LIB_CATEGORIES = ['All', ...Array.from(new Set(allLibraryPapers.map(p => p.category)))];

  // Init
  useEffect(() => {
    const papers = getDailyPapers(5, 0);
    setDailyPapers(papers);
    const read = getReadPapersToday();
    setReadToday(read);
    setGoalMet(read.length >= DAILY_GOAL);
  }, []);

  // Watch goal
  useEffect(() => {
    if (goalMet) onGoalMet?.();
  }, [goalMet, onGoalMet]);

  const handleMarkRead = useCallback((paperId: string) => {
    const updated = markPaperRead(paperId);
    setReadToday(updated);
    const met = updated.length >= DAILY_GOAL;
    setGoalMet(met);
  }, []);

  function handleRefreshBatch() {
    const nextOffset = cycleOffset + 1;
    setCycleOffset(nextOffset);
    const nextBatch = getDailyPapers(5, nextOffset);
    setDailyPapers(nextBatch);
  }

  async function handleGeneratePapers() {
    const topicToUse = customTopicInput.trim() || discoverTopic;
    setIsGenerating(true);
    setDiscoverError(null);
    try {
      const generated = await fetchDynamicResearchPapers(topicToUse, 3);
      setDailyPapers(prev => [...generated, ...prev]);
      setIsDiscoverOpen(false);
      setCustomTopicInput('');
    } catch (err: any) {
      setDiscoverError(err.message || 'Failed to generate papers with Groq AI');
    } finally {
      setIsGenerating(false);
    }
  }


  async function loadTrends() {
    if (trendsLoaded) return;
    setLoadingTrends(true);
    const items = await fetchAITrends();
    setTrends(items);
    setTrendsLoaded(true);
    setLoadingTrends(false);
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab === 'trends' && !trendsLoaded) loadTrends();
  }

  const libPapers = libFilter === 'All'
    ? allLibraryPapers
    : allLibraryPapers.filter(p => p.category === libFilter);

  const readCount  = readToday.length;
  const remaining  = Math.max(0, DAILY_GOAL - readCount);

  const SUGGESTED_TOPICS = [
    'Reasoning Models & Test-Time Compute',
    'Model Context Protocol & AI Agents',
    'vLLM Inference, PagedAttention & Quantization',
    'Multi-Agent Orchestration & Swarms',
    'RLHF, Direct Preference Optimization (DPO)',
    'Vision-Language Models & Multimodal Systems',
  ];

  return (
    <div className="min-h-screen bg-[#f5f2eb] dark:bg-[#1c1b1a]">

      {/* ── Hero Header ── */}
      <div className="border-b border-stone-300/70 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">

            {/* Title & description */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <h1 className="font-serif text-2xl font-semibold text-stone-900 dark:text-stone-100">
                  Research & AI Trends
                </h1>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 max-w-xl leading-relaxed">
                Explore seminal AI engineering papers & frontier industry trends. Read <strong className="text-stone-800 dark:text-stone-200">{DAILY_GOAL}–5 papers</strong> daily as a recommended study habit to bridge theory and production practice.
                Powered by <strong className="text-amber-700 dark:text-amber-400">Groq AI</strong> for instant deep-dive synthesis.
              </p>
            </div>

            {/* Progress ring + goal status */}
            <div className="flex items-center gap-5">
              <ProgressRing read={readCount} goal={DAILY_GOAL} />
              <div>
                {goalMet ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Daily habit goal complete!
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Great job! Keep exploring additional papers anytime.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold text-sm">
                      <Target className="w-4 h-4" />
                      {remaining} paper{remaining !== 1 ? 's' : ''} to reach daily goal
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Recommended: 4 papers/day for frontier mastery.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min((readCount / DAILY_GOAL) * 100, 100)}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-stone-500 dark:text-stone-400">
            <span>{readCount} of {DAILY_GOAL} papers read today</span>
            {goalMet && <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Daily goal achieved</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0 border-b border-transparent -mb-px">
            {([
              { id: 'daily',  label: 'Today\'s Papers', icon: Target   },
              { id: 'library',label: `Full Library (${allLibraryPapers.length})`, icon: BookOpen },
              { id: 'trends', label: 'AI Trends',       icon: TrendingUp },
            ] as { id: Tab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-amber-700 dark:border-amber-400 text-amber-900 dark:text-amber-300'
                    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Daily Tab ── */}
        {activeTab === 'daily' && (
          <div>
            {!goalMet && (
              <div className="mb-6 flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Daily Habit Target: Read {DAILY_GOAL} papers per day
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Build deep theoretical context alongside your code. Read the abstract & key takeaways, click "Mark as Read" to track your progress, or use "AI Deep-Dive" for Groq-powered synthesis.
                  </p>
                </div>
              </div>
            )}

            {goalMet && (
              <div className="mb-6 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    Daily reading goal achieved!
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    You've reviewed your daily research quota. You can continue reading more papers anytime or jump directly into lessons.
                  </p>
                </div>
              </div>
            )}

            {/* Action Bar: Refresh Batch + Discover with Groq */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-xl bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Daily Paper Selection
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  (Showing batch #{cycleOffset + 1})
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleRefreshBatch}
                  title="Cycle to the next batch of 5 papers from the library"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors border border-stone-200 dark:border-stone-700"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  Next 5 Papers
                </button>

                <button
                  onClick={() => setIsDiscoverOpen(true)}
                  title="Generate dynamic breakthrough research papers on any AI topic with Groq"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors border border-amber-300/60 dark:border-amber-800 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Discover with Groq AI
                </button>

                {!apiKeyConfigured && (
                  <button
                    onClick={() => setIsKeyModalOpen(true)}
                    title="Configure your Groq API Key"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                  >
                    <Key className="w-3 h-3" />
                    Add Groq Key
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              {dailyPapers.map(paper => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  isRead={readToday.includes(paper.id)}
                  onRead={handleMarkRead}
                  isToday
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Library Tab ── */}
        {activeTab === 'library' && (
          <div>
            {/* Category filter */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {LIB_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setLibFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    libFilter === cat
                      ? 'bg-amber-700 text-white border-amber-700 dark:bg-amber-500 dark:border-amber-500'
                      : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setIsDiscoverOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Papers
                </button>
                <span className="text-xs text-stone-400 dark:text-stone-500 self-center">
                  {libPapers.length} papers
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {libPapers.map(paper => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  isRead={readToday.includes(paper.id)}
                  onRead={handleMarkRead}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Trends Tab ── */}
        {activeTab === 'trends' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                  Current AI Engineering Trends
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Generated by Groq AI — refreshes on each visit
                </p>
              </div>
              <button
                onClick={() => { setTrendsLoaded(false); loadTrends(); }}
                disabled={loadingTrends}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loadingTrends ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loadingTrends && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="relative">
                  <div className="w-10 h-10 border-2 border-stone-200 dark:border-stone-700 rounded-full" />
                  <div className="absolute inset-0 w-10 h-10 border-t-2 border-amber-600 dark:border-amber-400 rounded-full animate-spin" />
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Generating AI trends with Groq…
                </p>
              </div>
            )}

            {!loadingTrends && trends.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {trends.map(item => (
                  <TrendCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {!loadingTrends && trends.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <TrendingUp className="w-8 h-8 text-stone-300 dark:text-stone-700" />
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Click Refresh to load AI-generated trends
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Discover Papers with Groq Modal ── */}
      {isDiscoverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                    Discover Research Papers with Groq
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Fetch 3 landmark papers synthesized on your chosen topic
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDiscoverOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-lg px-2"
              >
                ✕
              </button>
            </div>

            {discoverError && (
              <div className="mb-4 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-lg p-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{discoverError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  Select a Frontier Topic:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_TOPICS.map(topic => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => { setDiscoverTopic(topic); setCustomTopicInput(''); }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors border ${
                        discoverTopic === topic && !customTopicInput
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-700 font-medium'
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Or Custom Topic / Curriculum Phase:
                </label>
                <input
                  type="text"
                  value={customTopicInput}
                  onChange={e => setCustomTopicInput(e.target.value)}
                  placeholder="e.g. FlashAttention-3, LoRA variants, DeepSeek-R1..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsDiscoverOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePapers}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-700 text-white hover:bg-amber-800 transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isGenerating ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Querying Groq AI…</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" /> Synthesize Papers</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Groq API Key Modal ── */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <Key className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                </div>
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                  Groq API Key
                </h3>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-lg px-2"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
              Groq provides free, ultra-fast LLaMA-3.3 inference for instant paper deep-dives, trend generation, and dynamic research paper discovery. Your key is stored locally in your browser and never committed to git.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  API Key (starts with <code className="text-[11px] font-mono">gsk_...</code>):
                </label>
                <input
                  type="password"
                  value={keyInputValue}
                  onChange={e => setKeyInputValue(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-800">
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Get free Groq key
                </a>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveKey}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-700 text-white hover:bg-amber-800 transition-colors shadow-xs"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
