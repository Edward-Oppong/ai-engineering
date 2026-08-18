import React, { useState, useEffect, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';
import { LessonSummary } from '../types';
import { lessonsSummary } from '../lib/curriculum-loader';
import { Search, X, CheckCircle, Circle } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLesson: (lessonId: string) => void;
  completedLessonIds: Set<string>;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectLesson,
  completedLessonIds
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(() => {
    return new Fuse(lessonsSummary, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'motto', weight: 0.2 },
        { name: 'phaseTitle', weight: 0.2 },
        { name: 'tags', weight: 0.1 },
        { name: 'slug', weight: 0.1 }
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) {
      return lessonsSummary.slice(0, 25);
    }
    return fuse.search(query.trim()).map(r => r.item).slice(0, 40);
  }, [query, fuse]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      scrollActiveIntoView(selectedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      scrollActiveIntoView(selectedIndex - 1);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      onSelectLesson(results[selectedIndex].id);
      onClose();
    }
  };

  const scrollActiveIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('.search-item');
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#242321] border border-stone-200/90 dark:border-stone-800 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-[#1e1d1c] gap-3">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search topics, chapters, concepts..."
            className="w-full bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-0.5 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-stone-200/80 dark:bg-stone-800 text-stone-500 text-[10px] font-mono border border-stone-300/60 dark:border-stone-700">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto flex-1 divide-y divide-stone-100 dark:divide-stone-800/60 p-1.5">
          {results.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs font-sans">
              No lessons matching "<span className="text-stone-700 dark:text-stone-300">{query}</span>"
            </div>
          ) : (
            results.map((lesson, idx) => {
              const isSelected = idx === selectedIndex;
              const isDone = completedLessonIds.has(lesson.id);

              return (
                <div
                  key={lesson.id}
                  onClick={() => {
                    onSelectLesson(lesson.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`search-item flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-stone-100 dark:bg-[#2d2b29] text-stone-900 dark:text-white' 
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#2a2926]'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[11px] font-mono text-stone-400">
                          T{lesson.phaseNum}·C{lesson.lessonNum}
                        </span>
                        <span className="font-serif text-sm text-stone-900 dark:text-stone-100 truncate">
                          {lesson.title}
                        </span>
                      </div>

                      {lesson.motto && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1 italic font-serif">
                          "{lesson.motto}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-3.5 py-2 bg-stone-50/80 dark:bg-[#1e1d1c] border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
          <span>{results.length} matches</span>
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
          </div>
        </div>
      </div>
    </div>
  );
};
