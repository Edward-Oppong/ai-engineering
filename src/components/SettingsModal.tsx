import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/db';
import { UserDataBackup } from '../types';
import { 
  X, 
  Download, 
  Upload, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Database,
  FileJson
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onDataChanged
}) => {
  const [stats, setStats] = useState<{ lessonCount: number; quizCount: number; reviewCount: number; activityDays: number; bookmarkCount: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStats = async () => {
    try {
      const s = await db.getStorageStats();
      setStats(s);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
      setImportSuccess(null);
      setErrorMessage(null);
      setConfirmReset(false);
    }
  }, [isOpen]);

  const handleExport = async () => {
    setExporting(true);
    setErrorMessage(null);
    try {
      const backup = await db.exportAllUserData();
      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `ai-engineering-study-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to export backup.');
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setErrorMessage(null);
    setImportSuccess(null);

    try {
      const text = await file.text();
      const parsed: UserDataBackup = JSON.parse(text);

      if (!parsed || !parsed.data) {
        throw new Error('File does not match the AI Engineering Study Companion backup schema.');
      }

      const result = await db.importUserData(parsed, 'merge');
      setImportSuccess(`Successfully restored ${result.importedLessons} chapters and ${result.importedReviews} flashcards!`);
      await loadStats();
      onDataChanged();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to import backup file. Ensure it is a valid JSON backup.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetDatabase = async () => {
    try {
      await db.resetAllData();
      await loadStats();
      setConfirmReset(false);
      setImportSuccess('All local study data has been reset.');
      onDataChanged();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reset database.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div 
        className="w-full max-w-lg bg-[#faf8f4] dark:bg-[#242321] border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-[#1e1d1c]">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-stone-700 dark:text-stone-300" />
            <h2 className="font-serif text-base font-medium text-stone-900 dark:text-stone-100">
              Study Data & Portability
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Monograph Art Banner */}
        <div className="w-full h-24 sm:h-28 overflow-hidden relative border-b border-stone-200 dark:border-stone-800 shrink-0">
          <img 
            src="./illustrations/monograph-cover.jpg" 
            alt="AI Engineering Study Companion" 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).parentElement!.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
            <div className="text-white">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-300">Local-First Storage</span>
              <div className="font-serif text-sm font-medium text-white">IndexedDB Study State & Offline Data</div>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-600 dark:text-stone-300">
          
          {/* Messages */}
          {importSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{importSuccess}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Local Storage Stats */}
          <div className="space-y-2">
            <h3 className="font-mono uppercase text-[11px] font-semibold text-stone-500 dark:text-stone-400 tracking-wider">
              Local Database Status
            </h3>

            {stats ? (
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-lg bg-stone-50 dark:bg-[#1e1d1c] border border-stone-200/80 dark:border-stone-800">
                  <div className="text-[10px] text-stone-400 font-mono">Chapters Read</div>
                  <div className="text-base font-serif font-medium text-stone-900 dark:text-stone-100 mt-0.5">
                    {stats.lessonCount}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-stone-50 dark:bg-[#1e1d1c] border border-stone-200/80 dark:border-stone-800">
                  <div className="text-[10px] text-stone-400 font-mono">Review Cards</div>
                  <div className="text-base font-serif font-medium text-stone-900 dark:text-stone-100 mt-0.5">
                    {stats.reviewCount}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-stone-50 dark:bg-[#1e1d1c] border border-stone-200/80 dark:border-stone-800">
                  <div className="text-[10px] text-stone-400 font-mono">Bookmarked</div>
                  <div className="text-base font-serif font-medium text-stone-900 dark:text-stone-100 mt-0.5">
                    {stats.bookmarkCount}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-stone-400 text-xs">Loading storage status...</div>
            )}
          </div>

          {/* Export & Import Section */}
          <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <h3 className="font-mono uppercase text-[11px] font-semibold text-stone-500 dark:text-stone-400 tracking-wider">
              Backup & Portability
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Export your study progress, chapter notes, quiz history, and SM-2 flashcard schedules as a standalone JSON backup file.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-medium transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exporting ? 'Exporting...' : 'Export Backup (.json)'}</span>
              </button>

              {/* Import Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium transition-colors border border-stone-300 dark:border-stone-700 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{importing ? 'Restoring...' : 'Restore from File'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelected}
                className="hidden"
              />
            </div>
          </div>

          {/* Danger Zone: Clear Data */}
          <div className="space-y-2 pt-4 border-t border-stone-100 dark:border-stone-800">
            <h3 className="font-mono uppercase text-[11px] font-semibold text-rose-700 dark:text-rose-400 tracking-wider">
              Reset Local Database
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              Permanently clears all notes, reading marks, and flashcard schedules from this browser. Export a backup first if you wish to keep your records.
            </p>

            {confirmReset ? (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 space-y-2">
                <div className="text-xs font-medium text-rose-900 dark:text-rose-200">
                  Are you sure you want to delete all local study records?
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetDatabase}
                    className="px-3 py-1 rounded bg-rose-700 hover:bg-rose-800 text-white text-xs font-medium transition-colors"
                  >
                    Yes, Delete Everything
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-1 rounded bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Database</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-50/80 dark:bg-[#1e1d1c] border-t border-stone-200 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
