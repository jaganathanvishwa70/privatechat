import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { HighlightedCode } from './HighlightedCode';
import { formatTime } from '@/lib/utils';

interface CodeMessageProps {
  code: string;
  language: string | null;
  timestamp: string;
}

export function CodeMessage({ code, language, timestamp }: CodeMessageProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const lineCount = code.split('\n').length;
  const collapsed = !expanded && lineCount > 24;

  return (
    <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-[#282c34] max-w-2xl w-full">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#21252b] border-b border-black/30">
        <span className="text-xs font-medium text-slate-300 uppercase tracking-wide">
          {language || 'code'}
        </span>
        <div className="flex items-center gap-1.5">
          {lineCount > 24 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? 'Collapse' : `${lineCount} lines`}
            </button>
          )}
          <button
            onClick={copy}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div
        className="text-slate-200 overflow-auto"
        style={collapsed ? { maxHeight: '320px' } : { maxHeight: '60vh' }}
      >
        <HighlightedCode code={code} language={language || 'text'} />
      </div>
      <div className="px-3.5 py-1.5 bg-[#21252b] border-t border-black/30">
        <span className="text-[10px] text-slate-500">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}
