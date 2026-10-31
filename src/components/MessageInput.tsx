import { useRef, useState } from 'react';
import {
  Plus,
  X,
  Send,
  Image as ImageIcon,
  Paperclip,
  Code2,
  Loader2,
  Trash2,
  AlertCircle,
  Clipboard,
} from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import { detectLanguage, isImageFile, formatBytes } from '@/lib/utils';
import type { PendingFile } from '@/lib/types';

type Mode = 'normal' | 'code';
type MessageType = 'normal' | 'code' | 'image' | 'file';

interface MessageInputProps {
  onSend: (payload: {
    messageType: MessageType;
    content: string;
    language: string | null;
    files: PendingFile[];
  }) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [mode, setMode] = useState<Mode>('normal');
  const [text, setText] = useState('');
  const [code, setCode] = useState('');
  const [codeLang, setCodeLang] = useState('text');
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openPhotoPicker() {
    photoInputRef.current?.click();
    setMenuOpen(false);
  }
  function openFilePicker() {
    fileInputRef.current?.click();
    setMenuOpen(false);
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const newPending: PendingFile[] = Array.from(fileList).map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      isImage: isImageFile(f),
      previewUrl: isImageFile(f) ? URL.createObjectURL(f) : undefined,
      progress: 0,
    }));

    setPending((prev) => [...prev, ...newPending]);

    // Upload each file
    for (const pf of newPending) {
      setUploading(true);
      const safeName = `${pf.id}-${pf.file.name.replace(/[^\w.\-]+/g, '_')}`;
      const path = `uploads/${safeName}`;
      try {
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, pf.file, {
            cacheControl: '3600',
            upsert: false,
          });
        if (error) throw error;
        setPending((prev) =>
          prev.map((p) => (p.id === pf.id ? { ...p, progress: 100, storagePath: path } : p)),
        );
      } catch (err) {
        setPending((prev) =>
          prev.map((p) =>
            p.id === pf.id
              ? { ...p, error: err instanceof Error ? err.message : 'Upload failed' }
              : p,
          ),
        );
      }
    }
    setUploading(false);
  }

  function removePending(id: string) {
    setPending((prev) => {
      const pf = prev.find((p) => p.id === id);
      if (pf?.previewUrl) URL.revokeObjectURL(pf.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function pasteCode() {
    setPasteError(null);
    try {
      const pasted = await navigator.clipboard.readText();
      if (!pasted) return;
      setCode((current) => current ? `${current}\n${pasted}` : pasted);
    } catch {
      setPasteError('Clipboard access was blocked. Use long-press and Paste in the editor.');
    }
  }

  async function handleSend() {
    const hasText = mode === 'normal' ? text.trim() : code.trim();
    if (!hasText && pending.length === 0) return;
    if (pending.some((p) => !p.storagePath && !p.error)) return; // still uploading

    setSending(true);
    try {
      const files = pending.filter((p) => p.storagePath);
      const hasImage = files.some((f) => f.isImage);
      let messageType: MessageType = 'normal';
      if (mode === 'code' && hasText) {
        messageType = files.length > 0 ? 'file' : 'code';
      } else if (mode === 'normal') {
        if (files.length > 0 && hasText) messageType = 'file';
        else if (files.length > 0 && hasImage && files.every((f) => f.isImage)) messageType = 'image';
        else if (files.length > 0) messageType = 'file';
      }

      await onSend({
        messageType,
        content: mode === 'code' ? code : text,
        language: mode === 'code' && code.trim() ? codeLang : null,
        files,
      });

      setText('');
      setCode('');
      setCodeLang('text');
      pending.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      setPending([]);
    } finally {
      setSending(false);
    }
  }

  const canSend = (
    mode === 'normal'
      ? text.trim().length > 0 || pending.length > 0
      : code.trim().length > 0 || pending.length > 0
  ) && !uploading && !sending;
  const anyUploading = pending.some((p) => !p.storagePath && !p.error);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && mode === 'normal') {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="relative bg-white/80 backdrop-blur border-t border-slate-200">
      {/* pending previews */}
      {pending.length > 0 && (
        <div className="px-3 pt-3 flex flex-wrap gap-2">
          {pending.map((pf) => (
            <div
              key={pf.id}
              className="relative group rounded-xl overflow-hidden ring-1 ring-slate-200 bg-slate-50"
              style={{ width: pf.isImage ? '80px' : 'auto' }}
            >
              {pf.isImage && pf.previewUrl ? (
                <div className="relative w-20 h-20">
                  <img src={pf.previewUrl} alt="" className="w-full h-full object-cover" />
                  {!pf.storagePath && !pf.error && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 max-w-[200px]">
                  <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{pf.file.name}</p>
                    <p className="text-[10px] text-slate-400">{formatBytes(pf.file.size)}</p>
                  </div>
                  {!pf.storagePath && !pf.error && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin shrink-0" />}
                  {pf.error && <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                </div>
              )}
              <button
                onClick={() => removePending(pf.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Plus menu popup */}
      {menuOpen && (
        <div className="absolute bottom-full left-3 mb-2 flex flex-col gap-1.5 animate-[slideUp_0.15s_ease-out]">
          <button
            onClick={openPhotoPicker}
            className="flex items-center gap-2.5 pl-2.5 pr-4 py-2 bg-white rounded-xl shadow-lg ring-1 ring-slate-200 hover:bg-slate-50 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">Photo</span>
          </button>
          <button
            onClick={openFilePicker}
            className="flex items-center gap-2.5 pl-2.5 pr-4 py-2 bg-white rounded-xl shadow-lg ring-1 ring-slate-200 hover:bg-slate-50 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Paperclip className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">File</span>
          </button>
        </div>
      )}

      {/* hidden inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {/* Input row */}
      <div className="flex items-end gap-2 p-3">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            disabled={disabled}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm ${
              menuOpen
                ? 'bg-slate-800 text-white rotate-90'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex-1 rounded-2xl bg-slate-100 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-emerald-200 transition overflow-hidden">
          {/* mode selector */}
          <div className="flex items-center gap-1.5 px-3 pt-2">
            <button
              onClick={() => setMode('normal')}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition ${
                mode === 'normal' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => { setMode('code'); if (!codeLang || codeLang === 'text') setCodeLang('javascript'); }}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition ${
                mode === 'code' ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Code
            </button>
            {mode === 'code' && (
              <>
                <select
                  value={codeLang}
                onChange={(e) => setCodeLang(e.target.value)}
                className="text-xs font-medium px-2 py-1 rounded-lg bg-slate-200 text-slate-700 border-0 focus:outline-none cursor-pointer"
              >
                <option value="text">Plain text</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="sql">SQL</option>
                <option value="markdown">Markdown</option>
                <option value="xml">XML</option>
                <option value="cpp">C/C++</option>
                <option value="java">Java</option>
                <option value="rust">Rust</option>
                  <option value="php">PHP</option>
                </select>
                <button
                  type="button"
                  onClick={pasteCode}
                  className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  Paste
                </button>
              </>
            )}
          </div>

          {/* editor area */}
          <div className="px-3 pb-1">
            {mode === 'normal' ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Message…"
                rows={1}
                className="w-full resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none py-2 max-h-40 overflow-auto"
                style={{ minHeight: '36px' }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 160) + 'px';
                }}
              />
            ) : (
              <div className="py-2" style={{ minHeight: '120px' }}>
                <CodeEditor
                  value={code}
                  onChange={(v) => {
                    setCode(v);
                    if (!codeLang || codeLang === 'text') {
                      const det = detectLanguage('snippet.tmp');
                      setCodeLang(det === 'text' ? 'javascript' : det);
                    }
                  }}
                  language={codeLang}
                  onSubmit={handleSend}
                />
                {pasteError && <p className="px-1 pt-1 text-[11px] text-rose-600">{pasteError}</p>}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm hover:shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {anyUploading && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 bg-white px-3 py-1 rounded-full shadow ring-1 ring-slate-200 flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
        </div>
      )}
    </div>
  );
}
