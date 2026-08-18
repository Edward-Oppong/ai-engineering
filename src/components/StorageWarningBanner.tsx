import React from 'react';
import { AlertTriangle, X, Database } from 'lucide-react';

interface StorageWarningBannerProps {
  onDismiss: () => void;
}

/**
 * Shown when IndexedDB is unavailable (Safari Private mode, Firefox strict, quota exceeded).
 * The app still works — reading lessons, search, and UI all function — but progress won't persist.
 */
export const StorageWarningBanner: React.FC<StorageWarningBannerProps> = ({ onDismiss }) => {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="w-full bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-4 py-3 flex items-start sm:items-center justify-between gap-3 font-sans text-sm"
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
          <Database className="w-4 h-4 text-amber-700 dark:text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
            Progress won't be saved this session
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
            Local storage isn't available in this browser context (e.g. Private/Incognito mode, or storage blocked by browser settings). You can still read and search all lessons — your progress just won't persist after closing the tab.
          </p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss storage warning"
        className="shrink-0 p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
