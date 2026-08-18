import { PythonExecutionResult } from '../types';

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL?: string; stdout?: (text: string) => void; stderr?: (text: string) => void }) => Promise<any>;
  }
}

let pyodideInstance: any = null;
let pyodideLoadingPromise: Promise<any> | null = null;

const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

/**
 * Load the Pyodide WebAssembly Python environment on demand.
 */
export async function getPyodide(): Promise<any> {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (pyodideLoadingPromise) {
    return pyodideLoadingPromise;
  }

  pyodideLoadingPromise = new Promise(async (resolve, reject) => {
    try {
      // 1. Check if Pyodide script is already present in document
      if (!window.loadPyodide) {
        const script = document.createElement('script');
        script.src = `${PYODIDE_CDN_URL}pyodide.js`;
        script.async = true;

        await new Promise((loadResolve, loadReject) => {
          script.onload = loadResolve;
          script.onerror = () => loadReject(new Error('Failed to load Pyodide WebAssembly script from CDN. Ensure you have an internet connection or local Pyodide runtime.'));
          document.head.appendChild(script);
        });
      }

      if (!window.loadPyodide) {
        throw new Error('window.loadPyodide is not available.');
      }

      // 2. Initialize Pyodide WASM runtime
      const pyodide = await window.loadPyodide({
        indexURL: PYODIDE_CDN_URL,
      });

      pyodideInstance = pyodide;
      resolve(pyodide);
    } catch (err) {
      pyodideLoadingPromise = null;
      reject(err);
    }
  });

  return pyodideLoadingPromise;
}

/**
 * Execute Python code in the browser WebAssembly sandbox and capture stdout/stderr.
 */
export async function runPythonCode(code: string): Promise<PythonExecutionResult> {
  const startTime = performance.now();
  let stdoutLogs: string[] = [];
  let stderrLogs: string[] = [];

  try {
    const pyodide = await getPyodide();

    // Set up standard output capturing
    pyodide.setStdout({
      batched: (text: string) => {
        stdoutLogs.push(text);
      },
    });

    pyodide.setStderr({
      batched: (text: string) => {
        stderrLogs.push(text);
      },
    });

    // Run the Python code
    await pyodide.runPythonAsync(code);

    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    return {
      stdout: stdoutLogs.join('\n'),
      stderr: stderrLogs.join('\n'),
      executionTimeMs,
      error: null,
    };
  } catch (err: any) {
    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    return {
      stdout: stdoutLogs.join('\n'),
      stderr: stderrLogs.join('\n'),
      executionTimeMs,
      error: err?.message || String(err),
    };
  }
}
