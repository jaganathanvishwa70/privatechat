import { useEffect, useState } from 'react';
import { Download, X, Loader2 } from 'lucide-react';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import { downloadBlob, formatBytes } from '@/lib/utils';
import type { Attachment } from '@/lib/types';

interface ImageViewerProps {
  attachment: Attachment;
  onClose: () => void;
}

export function ImageViewer({ attachment, onClose }: ImageViewerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(attachment.storage_path, 3600);
      if (active) setUrl(data?.signedUrl ?? null);
    })();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      active = false;
      window.removeEventListener('keydown', onKey);
    };
  }, [attachment.storage_path, onClose]);

  async function download() {
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(attachment.storage_path);
      if (error) throw error;
      downloadBlob(data as Blob, attachment.original_filename);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col animate-[fadeIn_0.15s_ease-out]">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={download}
            disabled={downloading || !url}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-xl transition disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download
          </button>
          <div className="min-w-0 hidden sm:block">
            <p className="text-sm font-medium truncate">{attachment.original_filename}</p>
            <p className="text-xs text-white/60">{formatBytes(attachment.file_size)}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-xl transition"
        >
          <X className="w-4 h-4" /> Close
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto" onClick={onClose}>
        {!url ? (
          <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
        ) : (
          <img
            src={url}
            alt={attachment.original_filename}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
}
