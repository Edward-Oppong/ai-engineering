import React from 'react';
import { Search, Moon, Sun, Settings } from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'phases' | 'lesson' | 'review';
  onSelectTab: (tab: 'dashboard' | 'phases' | 'review') => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  streakCount: number;
  dueReviewCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSearch,
  onOpenSettings,
  streakCount,
  dueReviewCount,
  darkMode,
  onToggleDarkMode
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-300/70 dark:border-stone-800 bg-[#f5f2eb]/90 dark:bg-[#1c1b1a]/90 backdrop-blur-md transition-colors font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">
        
        {/* Course Logo / Brand — Clean Typographic */}
        <div 
          onClick={() => onSelectTab('dashboard')}
          className="flex items-baseline gap-2.5 cursor-pointer select-none group"
        >
          <span className="font-serif font-medium text-base sm:text-lg text-amber-950 dark:text-stone-100 tracking-tight group-hover:text-amber-800 transition-colors">
            AI Engineering
          </span>
          <span className="text-[11px] text-amber-800/80 dark:text-stone-400 font-sans tracking-wide">
            from scratch
          </span>
        </div>

        {/* Center Nav Links — Understated Text Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-sans">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`transition-colors py-1 ${
              currentTab === 'dashboard'
                ? 'text-amber-950 dark:text-stone-100 font-semibold border-b-2 border-amber-800 dark:border-stone-200'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Study Overview
          </button>

          <button
            onClick={() => onSelectTab('phases')}
            className={`transition-colors py-1 ${
              currentTab === 'phases' || currentTab === 'lesson'
                ? 'text-amber-950 dark:text-stone-100 font-semibold border-b-2 border-amber-800 dark:border-stone-200'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Syllabus
          </button>

          <button
            onClick={() => onSelectTab('review')}
            className={`transition-colors py-1 flex items-center gap-1.5 ${
              currentTab === 'review'
                ? 'text-amber-950 dark:text-stone-100 font-semibold border-b-2 border-amber-800 dark:border-stone-200'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <span>Review Deck</span>
            {dueReviewCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-amber-100 dark:bg-stone-800 text-amber-900 dark:text-stone-200 border border-amber-300 dark:border-stone-700">
                {dueReviewCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Controls: Search, Habit, Settings, Theme */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition-colors text-xs font-sans"
            title="Search topics (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-block px-1 py-0.2 rounded bg-stone-200 dark:bg-stone-800 text-[10px] font-mono text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700">
              Ctrl+K
            </kbd>
          </button>

          {streakCount > 0 && (
            <span className="text-xs text-amber-800 dark:text-stone-400 font-mono hidden sm:inline" title="Consecutive study streak">
              {streakCount}d streak
            </span>
          )}

          {/* Settings & Backup Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition-colors"
            title="Study Data & Backup Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-md text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition-colors"
            title={darkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {darkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="flex md:hidden items-center justify-around py-2 border-t border-stone-300/70 dark:border-stone-800 text-xs font-sans bg-[#f5f2eb] dark:bg-[#1c1b1a]">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`py-1 px-3 ${
            currentTab === 'dashboard' ? 'text-stone-900 dark:text-stone-100 font-semibold' : 'text-stone-500'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => onSelectTab('phases')}
          className={`py-1 px-3 ${
            currentTab === 'phases' || currentTab === 'lesson' ? 'text-stone-900 dark:text-stone-100 font-semibold' : 'text-stone-500'
          }`}
        >
          Syllabus
        </button>

        <button
          onClick={() => onSelectTab('review')}
          className={`py-1 px-3 flex items-center gap-1 ${
            currentTab === 'review' ? 'text-stone-900 dark:text-stone-100 font-semibold' : 'text-stone-500'
          }`}
        >
          <span>Review</span>
          {dueReviewCount > 0 && (
            <span className="px-1 text-[10px] rounded bg-stone-200 dark:bg-stone-800 font-mono">
              {dueReviewCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
