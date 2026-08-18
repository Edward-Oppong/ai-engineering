import React, { Component, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional context label shown in the error UI (e.g. "Lesson Reader") */
  context?: string;
  /** Lightweight fallback: render a small inline error instead of a full page */
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

/**
 * ErrorBoundary catches unhandled render/lifecycle errors in its subtree
 * and shows a graceful recovery UI instead of a white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console — replace with a remote logger if you add one later
    console.error('[ErrorBoundary]', error, info.componentStack);
    this.setState({ errorInfo: info.componentStack ?? null });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Navigate home so the user doesn't land back in the broken view
    window.location.hash = 'dashboard';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { context = 'Application', inline = false } = this.props;

    if (inline) {
      return (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-300 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div>
            <strong className="font-semibold block">Something went wrong in {context}.</strong>
            <button
              onClick={this.handleReset}
              className="mt-1 text-xs underline text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
            >
              Reset and go to dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0c0a09] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-normal text-stone-900 dark:text-stone-100">
              Unexpected Error
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Something went wrong in the <strong>{context}</strong>. Your study progress is safe — it's stored separately in your browser's local database.
            </p>
          </div>

          {this.state.error && (
            <details className="text-left">
              <summary className="text-xs text-stone-500 dark:text-stone-400 cursor-pointer hover:text-stone-800 dark:hover:text-stone-200">
                Error details
              </summary>
              <pre className="mt-2 p-3 rounded-lg bg-stone-100 dark:bg-stone-900 text-xs text-stone-700 dark:text-stone-300 overflow-auto max-h-40 text-left">
                {this.state.error.message}
                {this.state.errorInfo && `\n\nComponent stack:${this.state.errorInfo}`}
              </pre>
            </details>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 text-sm font-medium shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-sm font-medium border border-stone-200 dark:border-stone-800 transition-all"
            >
              Reload App
            </button>
          </div>
        </div>
      </div>
    );
  }
}
