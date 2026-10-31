import { useEffect, useState } from 'react';
import { Download, Loader2, Eye } from 'lucide-react';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import { downloadBlob, formatBytes, formatTime, getFileExtension, getFileAccentColor } from '@/lib/utils';
import type { Attachment } from '@/lib/types';

interface FileAttachmentCardProps {
  attachment: Attachment;
  timestamp: string;
}

const ICON_LABELS: Record<string, string> = {
  PDF: 'PDF',
  DOC: 'DOC',
  DOCX: 'DOC',
  XLS: 'XLS',
  XLSX: 'XLS',
  CSV: 'CSV',
  PPT: 'PPT',
  PPTX: 'PPT',
  TXT: 'TXT',
  ZIP: 'ZIP',
  RAR: 'RAR',
  JS: 'JS',
  TS: 'TS',
  HTML: 'HTML',
  CSS: 'CSS',
  PY: 'PY',
  JAVA: 'JAVA',
  C: 'C',
  CPP: 'CPP',
  JSON: 'JSON',
  XML: 'XML',
  SQL: 'SQL',
};

export function FileAttachmentCard({ attachment, timestamp }: FileAttachmentCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ext = getFileExtension(attachment.original_filename);
  const color = getFileAccentColor(ext);

  async function download() {
    setError(null);
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(attachment.storage_path);
      if (error) throw error;
      if (!data) throw new Error('No file data returned');
      downloadBlob(data as Blob, attachment.original_filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="max-w-sm w-full rounded-2xl ring-1 ring-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 p-3.5">
        <div
          className="w-11 h-13 rounded-lg flex flex-col items-center justify-center shrink-0 text-white font-bold relative"
          style={{ backgroundColor: color, width: '44px', height: '56px' }}
        >
          <span className="text-[10px] font-extrabold tracking-tight">{ICON_LABELS[ext] || ext.slice(0, 4)}</span>
          <div className="absolute top-0 right-0 w-2.5 h-2.5" style={{ borderLeft: `5px solid transparent`, borderBottom: `5px solid white` }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate" title={attachment.original_filename}>
            {attachment.original_filename}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {ext} · {formatBytes(attachment.file_size)}
          </p>
          <p className="text-[10px] text-slate-300 mt-0.5">{formatTime(timestamp)}</p>
        </div>
        <button
          onClick={download}
          disabled={downloading}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition disabled:opacity-60"
        >
          {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {downloading ? '…' : 'Download'}
        </button>
      </div>
      {error && (
        <div className="px-3.5 pb-2.5 -mt-1">
          <p className="text-xs text-rose-600">{error}</p>
        </div>
      )}
    </div>
  );
}

interface ImageAttachmentProps {
  attachment: Attachment;
  timestamp: string;
  onOpen: (attachment: Attachment) => void;
}

export function ImageAttachment({ attachment, timestamp, onOpen }: ImageAttachmentProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(attachment.storage_path, 3600);
      if (active) {
        if (data) setUrl(data.signedUrl);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [attachment.storage_path]);

  return (
    <div className="max-w-xs">
      <div
        className="relative rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-slate-100 cursor-pointer group"
        onClick={() => onOpen(attachment)}
        style={{ aspectRatio: 'auto' }}
      >
        {loading && (
          <div className="w-full h-40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        )}
        {url && (
          <img
            src={url}
            alt={attachment.original_filename}
            className="max-w-full max-h-72 object-contain transition group-hover:opacity-90"
            onLoad={() => setLoading(false)}
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center gap-1.5 text-white text-xs font-medium">
            <Eye className="w-4 h-4" /> View
          </div>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-1 px-1">{formatTime(timestamp)}</p>
    </div>
  );
}
