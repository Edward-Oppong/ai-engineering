import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Highlight, themes } from 'prism-react-renderer';
import mermaid from 'mermaid';
import { Check, Copy, SquareTerminal } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'strict',
  fontFamily: 'Inter, -apple-system, sans-serif',
  fontSize: 13,
});

interface MarkdownRendererProps {
  content: string;
}

const MermaidBlock: React.FC<{ chart: string }> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      if (!chart.trim()) return;
      const isDark = document.documentElement.classList.contains('dark');
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'neutral',
        themeVariables: isDark ? {
          darkMode: true,
          background: '#171513',
          primaryColor: '#2b2723',
          primaryTextColor: '#f5f5f4',
          primaryBorderColor: '#44403c',
          lineColor: '#78716c',
          secondaryColor: '#211e1b',
        } : {
          darkMode: false,
          background: '#ffffff',
          primaryColor: '#f5f4ef',
          primaryTextColor: '#1c1917',
          primaryBorderColor: '#d6d3d1',
          lineColor: '#78716c',
          secondaryColor: '#faf9f6',
        }
      });

      const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      try {
        const { svg: renderedSvg } = await mermaid.render(uniqueId, chart.trim());
        if (isMounted) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to render diagram');
        }
      }
    };

    renderChart();
    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="my-4 p-4 rounded-xl bg-amber-50 dark:bg-stone-900 border border-amber-200 dark:border-stone-800 text-xs font-mono text-stone-700 dark:text-stone-300">
        <div className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Diagram Note:</div>
        <pre className="overflow-x-auto">{chart}</pre>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="mermaid-container select-none my-6 p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm"
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
};

const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // Works on HTTPS and localhost
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for plain HTTP (e.g. LAN preview server)
        const textarea = document.createElement('textarea');
        textarea.value = value;
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

  const cleanLang = (language || '').toLowerCase().trim();

  if (cleanLang === 'mermaid') {
    return <MermaidBlock chart={value} />;
  }

  const getDisplayLanguage = (lang: string) => {
    switch (lang) {
      case 'bash':
      case 'sh':
      case 'shell':
        return 'Terminal (Bash / PowerShell)';
      case 'powershell':
      case 'pwsh':
      case 'ps1':
        return 'PowerShell';
      case 'python':
      case 'py':
        return 'Python';
      case 'rust':
      case 'rs':
        return 'Rust';
      case 'ts':
      case 'typescript':
        return 'TypeScript';
      case 'js':
      case 'javascript':
        return 'JavaScript';
      default:
        return lang || 'code';
    }
  };

  return (
    <div className="relative group my-6 rounded-xl border border-stone-300 dark:border-stone-800 bg-[#1e1e1e] dark:bg-[#121110] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] dark:bg-[#1c1a17] border-b border-[#3d3d3d] dark:border-stone-800 text-xs font-sans">
        <div className="flex items-center gap-2 font-mono text-[11px] text-stone-300 dark:text-stone-400">
          <SquareTerminal className="w-3.5 h-3.5 text-stone-400" />
          <span>{getDisplayLanguage(cleanLang)}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#3d3d3d] dark:bg-stone-800 hover:bg-[#4d4d4d] dark:hover:bg-stone-700 text-stone-200 dark:text-stone-300 transition-all text-xs border border-[#4d4d4d] dark:border-stone-700"
          title="Copy code"
        >
          {copied ? (
            <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Copied</span>
          </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-xs sm:text-sm font-mono leading-relaxed bg-[#1e1e1e] dark:bg-[#121110]">
        <Highlight
          theme={themes.vsDark}
          code={value.trimEnd()}
          language={cleanLang === 'bash' || cleanLang === 'sh' || cleanLang === 'powershell' ? 'bash' : (cleanLang || 'typescript')}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre style={{ ...style, backgroundColor: 'transparent', margin: 0 }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line, key: i })} className="table-row">
                  <span className="table-cell select-none text-right pr-4 text-stone-600 text-xs font-mono w-8">
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
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1({ children, ...props }) {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return (
              <h1 id={id} {...props}>
                {children}
              </h1>
            );
          },
          h2({ children, ...props }) {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return (
              <h2 id={id} {...props}>
                {children}
              </h2>
            );
          },
          h3({ children, ...props }) {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return (
              <h3 id={id} {...props}>
                {children}
              </h3>
            );
          },
          code(props) {
            const { className, children, node: _node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            const codeString = String(children).replace(/\n$/, '');

            if (isInline) {
              return (
                <code className={className} {...rest}>
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                language={match ? match[1] : ''}
                value={codeString}
              />
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
