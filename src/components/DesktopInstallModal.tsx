import React, { useState } from 'react';
import { 
  X, 
  Monitor, 
  Terminal, 
  FolderDown, 
  Check, 
  Copy, 
  Download, 
  Cpu, 
  ShieldCheck, 
  HardDrive,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface DesktopInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopInstallModal: React.FC<DesktopInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const steps = [
    {
      num: '1',
      title: 'Clone GitHub Repository',
      description: 'Clone the source code onto your local machine or Desktop using Git / PowerShell:',
      cmd: 'git clone https://github.com/Edward-Oppong/ai-engineering.git\ncd ai-engineering',
    },
    {
      num: '2',
      title: 'Install Project Dependencies',
      description: 'Install the pre-configured Node.js dependencies and desktop build tools:',
      cmd: 'npm install',
    },
    {
      num: '3',
      title: 'Package Desktop Executable (.exe)',
      description: 'Run the automated build pipeline to compile data chunks, TypeScript, and package the Windows Electron binary:',
      cmd: 'npm run electron:build',
    },
    {
      num: '4',
      title: 'Launch & Install from the Release Folder',
      description: 'Navigate to the generated release/ directory on your desktop and launch the installer:',
      cmd: 'explorer release\\',
      note: 'Double-click "AI Engineering Study Companion Setup 1.1.0.exe" or use the portable "AI Engineering Study Companion 1.1.0.exe".',
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 px-4 bg-black/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#faf8f4] dark:bg-[#242321] border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1e1d1c]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-600/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100">
                Install Standalone Desktop App (.exe)
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Learn 100% offline with zero browser cache clearing risks and permanent local storage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Benefits Banner */}
        <div className="px-6 py-3 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-200/40 dark:border-amber-900/40 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>Windows Desktop Native • 100% Offline • Zero Remote Trackers</span>
          </div>
          <span className="font-mono text-[11px] text-amber-800/80 dark:text-amber-400 hidden sm:inline">
            v1.1.0 Electron 34
          </span>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-600 dark:text-stone-300">
          
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div 
                key={step.num}
                className="p-4 rounded-xl bg-white dark:bg-[#1f1e1c] border border-stone-200 dark:border-stone-800 space-y-2.5 transition-shadow hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-serif font-bold text-xs flex items-center justify-center shrink-0">
                      {step.num}
                    </span>
                    <h3 className="font-serif font-medium text-sm text-stone-900 dark:text-stone-100">
                      {step.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => copyToClipboard(step.cmd, idx)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-mono transition-colors cursor-pointer"
                  >
                    {copiedStep === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-stone-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-stone-500 dark:text-stone-400 text-xs leading-relaxed">
                  {step.description}
                </p>

                {/* Code Box */}
                <div className="p-2.5 rounded-lg bg-stone-900 dark:bg-black text-stone-100 font-mono text-xs overflow-x-auto border border-stone-800 select-all">
                  <pre className="whitespace-pre">{step.cmd}</pre>
                </div>

                {step.note && (
                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#191817] border border-stone-200/80 dark:border-stone-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <HardDrive className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{step.note}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Direct GitHub Link */}
          <div className="p-4 rounded-xl bg-stone-100/70 dark:bg-[#1e1d1c] border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
            <div>
              <div className="font-serif font-medium text-sm text-stone-900 dark:text-stone-100">
                GitHub Repository
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                View open-source release tags, instructions, and community contributions
              </div>
            </div>

            <a
              href="https://github.com/Edward-Oppong/ai-engineering"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-medium transition-colors shrink-0"
            >
              <span>Open GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-[#1e1d1c] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-medium transition-colors cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
