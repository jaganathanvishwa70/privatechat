import { useRef, useLayoutEffect } from 'react';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, indentUnit } from '@codemirror/language';
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

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  onSubmit?: () => void;
}

export function CodeEditor({ value, onChange, language = 'text', onSubmit }: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onSubmitRef = useRef(onSubmit);
  onChangeRef.current = onChange;
  onSubmitRef.current = onSubmit;

  // Create editor once
  useLayoutEffect(() => {
    if (!hostRef.current) return;

    const submitKeymap = keymap.of([
      {
        key: 'Mod-Enter',
        preventDefault: true,
        run: () => {
          onSubmitRef.current?.();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        foldGutter(),
        history(),
        drawSelection(),
        indentOnInput(),
        indentUnit.of('  '),
        bracketMatching(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        ...languageExtension(language),
        oneDark,
        EditorView.lineWrapping,
        EditorView.theme({
          '&': { fontSize: '13px', height: '100%' },
          '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
          '.cm-gutters': { backgroundColor: '#282c34' },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        submitKeymap,
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. clear on send)
  useLayoutEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (view.state.doc.toString() !== value) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={hostRef}
      className="w-full overflow-auto rounded-lg"
      style={{ height: '100%', maxHeight: '40vh' }}
    />
  );
}
