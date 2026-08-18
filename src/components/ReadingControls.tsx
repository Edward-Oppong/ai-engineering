import React, { useState, useRef, useEffect } from 'react';
import { UserReadingPreferences, ReadingFontSize, ReadingFontFamily, ReadingColumnWidth } from '../types';
import { 
  Type, 
  Maximize2, 
  Minimize2, 
  Bookmark, 
  BookmarkCheck,
  AlignLeft,
  Columns
} from 'lucide-react';

interface ReadingControlsProps {
  preferences: UserReadingPreferences;
  onUpdatePreferences: (prefs: Partial<UserReadingPreferences>) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onToggleFocusMode: () => void;
}

export const ReadingControls: React.FC<ReadingControlsProps> = ({
  preferences,
  onUpdatePreferences,
  isBookmarked,
  onToggleBookmark,
  onToggleFocusMode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popup on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center gap-1 font-sans" ref={menuRef}>
      
      {/* Bookmark Button */}
      <button
        onClick={onToggleBookmark}
        className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
          isBookmarked
            ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
        }`}
        title={isBookmarked ? 'Remove Bookmark' : 'Bookmark this chapter'}
      >
        {isBookmarked ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
      </button>

      {/* Focus Mode Toggle */}
      <button
        onClick={onToggleFocusMode}
        className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
          preferences.focusMode
            ? 'text-stone-900 dark:text-white bg-stone-200 dark:bg-stone-800'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
        }`}
        title="Distraction-Free Focus Mode (Press 'F')"
      >
        {preferences.focusMode ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </button>

      {/* Typography Controls Popup Trigger */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
          isOpen
            ? 'text-stone-900 dark:text-white bg-stone-200 dark:bg-stone-800'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
        }`}
        title="Adjust Reading Typography & Layout"
      >
        <Type className="w-4 h-4" />
      </button>

      {/* Popover Settings Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 p-4 rounded-xl bg-white dark:bg-[#242321] border border-stone-200 dark:border-stone-800 shadow-xl z-50 space-y-4 animate-in fade-in zoom-in-95 duration-100 text-xs">
          
          {/* Font Size */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Font Size
            </div>
            <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 dark:bg-[#1e1d1c] rounded-lg">
              {(['sm', 'base', 'lg', 'xl'] as ReadingFontSize[]).map((size) => {
                const labels: Record<ReadingFontSize, string> = { sm: 'S', base: 'M', lg: 'L', xl: 'XL' };
                const isSelected = preferences.fontSize === size;

                return (
                  <button
                    key={size}
                    onClick={() => onUpdatePreferences({ fontSize: size })}
                    className={`py-1 rounded text-center transition-all font-mono ${
                      isSelected
                        ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-semibold shadow-xs'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    {labels[size]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography Family */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Font Style
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 dark:bg-[#1e1d1c] rounded-lg">
              <button
                onClick={() => onUpdatePreferences({ fontFamily: 'serif' })}
                className={`py-1 px-2 rounded text-center transition-all font-serif ${
                  preferences.fontFamily === 'serif'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-semibold shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                Book Serif
              </button>

              <button
                onClick={() => onUpdatePreferences({ fontFamily: 'sans' })}
                className={`py-1 px-2 rounded text-center transition-all font-sans ${
                  preferences.fontFamily === 'sans'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-semibold shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                Clean Sans
              </button>
            </div>
          </div>

          {/* Reading Column Width */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Reading Column
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100 dark:bg-[#1e1d1c] rounded-lg">
              {(['focused', 'standard', 'wide'] as ReadingColumnWidth[]).map((width) => {
                const labels: Record<ReadingColumnWidth, string> = { focused: 'Narrow', standard: 'Normal', wide: 'Wide' };
                const isSelected = preferences.columnWidth === width;

                return (
                  <button
                    key={width}
                    onClick={() => onUpdatePreferences({ columnWidth: width })}
                    className={`py-1 rounded text-center transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-semibold shadow-xs'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    {labels[width]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
