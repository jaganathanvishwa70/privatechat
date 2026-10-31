import { useRef, useLayoutEffect, useState, memo } from 'react';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle, foldGutter } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { sql } from '@codemirror/lang-sql';
import { markdown } from '@codemirror/lang-markdown';
import { xml } from '@codemirror/lang-xml';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { rust } from '@codemirror/lang-rust';
import { php } from '@codemirror/lang-php';

function languageExtension(lang: string): Extension[] {
  switch (lang.toLowerCase()) {
    case 'javascript':
    case 'js':
    case 'jsx':
    case 'typescript':
    case 'ts':
    case 'tsx':
      return [javascript({ jsx: true, typescript: lang.toLowerCase().startsWith('ts') })];
    case 'python':
    case 'py':
      return [python()];
    case 'html':
    case 'htm':
      return [html()];
    case 'css':
    case 'scss':
    case 'sass':
      return [css()];
    case 'json':
      return [json()];
    case 'sql':
      return [sql()];
    case 'markdown':
    case 'md':
      return [markdown()];
    case 'xml':
    case 'svg':
      return [xml()];
    case 'cpp':
    case 'c++':
    case 'cc':
    case 'hpp':
      return [cpp()];
    case 'c':
      return [cpp()];
    case 'java':
      return [java()];
    case 'rust':
    case 'rs':
      return [rust()];
    case 'php':
      return [php()];
    default:
      return [];
  }
}

interface HighlightedCodeProps {
  code: string;
  language?: string;
}

export const HighlightedCode = memo(function HighlightedCode({ code, language = 'text' }: HighlightedCodeProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useLayoutEffect(() => {
    if (!hostRef.current) return;
    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        foldGutter(),
        indentOnInput(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        ...languageExtension(language),
        oneDark,
        EditorView.lineWrapping,
        EditorView.theme({
          '&': { fontSize: '13px', backgroundColor: 'transparent', height: 'auto' },
          '.cm-scroller': {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            overflow: 'auto',
          },
          '&.cm-focused': { outline: 'none' },
          '.cm-gutters': { backgroundColor: 'transparent', border: 'none' },
        }),
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
      ],
    });
    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [code, language]);

  return <div ref={hostRef} className="w-full" />;
});
