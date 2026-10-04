import React, { useState } from 'react';
import { CodeFile, PythonExecutionResult } from '../types';
import { Highlight, themes } from 'prism-react-renderer';
import { FileCode, Copy, Check, Terminal, Play, AlertCircle, Download, FolderDown, ExternalLink } from 'lucide-react';
import { runPythonCode } from '../lib/pyodide-runner';

interface CodeViewerProps {
  files: CodeFile[];
}

// Electron context-bridge â€” only present in the desktop app
declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      platform: string;
      openFile?: (filename: string, content: string) => Promise<{ ok: boolean; error?: string }>;
    };
  }
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ files }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<PythonExecutionResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

  if (!files || files.length === 0) {
    return null;
  }

  const currentFile = files[activeTab] || files[0];
  const isPython = currentFile.filename.endsWith('.py') || currentFile.language === 'python' || currentFile.language === 'py';

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentFile.content);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = currentFile.content;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  /** Download a single file via Blob â†’ anchor click */
  const downloadFile = (file: CodeFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCurrent = () => {
    downloadFile(currentFile);
  };

  /** Open the file in the OS default editor via Electron IPC */
  const handleOpenInEditor = async () => {
    setOpenError(null);
    if (window.electronAPI?.openFile) {
      const result = await window.electronAPI.openFile(currentFile.filename, currentFile.content);
      if (!result.ok) setOpenError(result.error ?? 'Could not open file in editor.');
    } else {
      // Running in browser â€” fall back to download
      downloadFile(currentFile);
    }
  };

  /** Download all files as individual sequential downloads */
  const handleDownloadAll = async () => {
    if (downloading) return;
    setDownloading(true);
    for (let i = 0; i < files.length; i++) {
      downloadFile(files[i]);
      // small delay so the browser doesn't block multiple simultaneous downloads
      if (i < files.length - 1) {
        await new Promise(res => setTimeout(res, 300));
      }
    }
    setDownloading(false);
  };

  const handleRunPython = async () => {
    if (!isPython || executing) return;
    setExecuting(true);
    setExecutionResult(null);

    try {
      const res = await runPythonCode(currentFile.content);
      setExecutionResult(res);
    } catch (err: any) {
      setExecutionResult({
        stdout: '',
        stderr: '',
        executionTimeMs: 0,
        error: err?.message || 'Failed to execute script.'
      });
    } finally {
      setExecuting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="my-8 rounded-xl border border-stone-200/90 dark:border-stone-800 bg-[#faf8f4] dark:bg-[#242321] shadow-sm overflow-hidden font-sans">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50/80 dark:bg-[#1e1d1c] border-b border-stone-200 dark:border-stone-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          <span className="font-medium text-xs text-stone-900 dark:text-stone-100">Practice Source Files</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Run Python Button */}
          {isPython && (
            <button
              onClick={handleRunPython}
              disabled={executing}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors shadow-2xs ${
                executing
                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 cursor-wait'
                  : 'bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 cursor-pointer'
              }`}
              title="Run this file in your browser via WebAssembly (Pyodide)"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{executing ? 'Executing...' : 'Run in Browser'}</span>
            </button>
          )}

          {/* â”€â”€ Open in Editor (Electron) / Download (browser) â”€â”€ */}
          <button
            onClick={handleOpenInEditor}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#faf8f4] dark:bg-stone-800 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-stone-700 dark:text-stone-300 hover:text-violet-800 dark:hover:text-violet-300 transition-colors text-xs font-medium border border-stone-300/80 dark:border-stone-700 shadow-2xs"
            title={isElectron ? `Open ${currentFile.filename} in your default editor` : `Download ${currentFile.filename}`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{isElectron ? 'Open in Editor' : 'Download'}</span>
          </button>

          {/* Download All â€” multiple files */}
          {files.length > 1 && (
            <button
              onClick={handleDownloadAll}
              disabled={downloading}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#faf8f4] dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-stone-700 dark:text-stone-300 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors text-xs font-medium border border-stone-300/80 dark:border-stone-700 shadow-2xs"
              title={`Download all ${files.length} files`}
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>{downloading ? 'Downloading...' : `All ${files.length} files`}</span>
            </button>
          )}

          {/* Download current file â€” always available */}
          <button
            onClick={handleDownloadCurrent}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#faf8f4] dark:bg-stone-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-stone-700 dark:text-stone-300 hover:text-blue-800 dark:hover:text-blue-300 transition-colors text-xs font-medium border border-stone-300/80 dark:border-stone-700 shadow-2xs"
            title={`Download ${currentFile.filename}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          {/* Copy File Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#faf8f4] dark:bg-stone-800 hover:bg-[#ece8df] dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors text-xs font-medium border border-stone-300/80 dark:border-stone-700 shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Open-in-editor error banner */}
      {openError && (
        <div className="flex items-center justify-between px-4 py-2 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
          <span>Could not open in editor: {openError}</span>
          <button onClick={() => setOpenError(null)} className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 ml-4">✕</button>
        </div>
      )}

      {/* File Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 bg-stone-100/60 dark:bg-[#1a1918] border-b border-stone-200 dark:border-stone-800 overflow-x-auto">
        {files.map((file, idx) => {
          const isActive = idx === activeTab;
          return (
            <button
              key={file.filename}
              onClick={() => {
                setActiveTab(idx);
                setExecutionResult(null);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-t-md transition-colors border-t-2 ${
                isActive
                  ? 'bg-[#1e1e1e] dark:bg-[#121110] text-stone-200 border-stone-400 font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 border-transparent'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>{file.filename}</span>
              <span className="text-[10px] text-stone-500 font-sans">({formatFileSize(file.sizeBytes)})</span>
            </button>
          );
        })}
      </div>

      {/* Code Display */}
      <div className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed max-h-[500px] overflow-y-auto bg-[#1e1e1e] dark:bg-[#121110]">
        <Highlight
          theme={themes.vsDark}
          code={currentFile.content.trimEnd()}
          language={currentFile.language || 'text'}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre style={{ ...style, backgroundColor: 'transparent', margin: 0 }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line, key: i })} className="table-row">
                  <span className="table-cell select-none text-right pr-4 text-stone-600 text-xs font-mono w-10">
                    {i + 1}
                  </span>
                  <span className="table-cell">
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token, key })} />
                    ))}
                  </span>
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>

      {/* Python Execution Terminal Output Console */}
      {executionResult && (
        <div className="border-t border-stone-800 bg-[#161514] text-stone-200 p-4 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-stone-800 pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-stone-400" />
              <span>WebAssembly Console</span>
              <span>Â·</span>
              <span className="text-stone-500">Executed in {executionResult.executionTimeMs}ms</span>
            </div>

            <button
              onClick={() => setExecutionResult(null)}
              className="text-stone-500 hover:text-stone-300 text-[10px]"
            >
              Clear
            </button>
          </div>

          {/* Standard Output */}
          {executionResult.stdout && (
            <div className="whitespace-pre-wrap leading-relaxed text-stone-200">
              {executionResult.stdout}
            </div>
          )}

          {/* Empty Output Note */}
          {!executionResult.stdout && !executionResult.error && (
            <div className="text-stone-500 italic text-[11px]">
              Script executed successfully with no stdout output.
            </div>
          )}

          {/* Error Output */}
          {executionResult.error && (
            <div className="p-3 rounded bg-rose-950/40 border border-rose-900 text-rose-300 text-xs flex items-start gap-2 whitespace-pre-wrap">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{executionResult.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
