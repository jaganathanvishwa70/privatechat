import { useEffect, useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatBytes } from '@/lib/utils';

export const STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024;

export function StorageUsage() {
  const [usedBytes, setUsedBytes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUsage() {
      const { data, error } = await supabase.from('attachments').select('file_size');
      if (!active) return;
      if (!error && data) {
        const total = data.reduce((sum, attachment) => sum + Number(attachment.file_size || 0), 0);
        setUsedBytes(total);
      }
      setLoading(false);
    }

    loadUsage();
    const channel = supabase
      .channel('storage-usage-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attachments' }, loadUsage)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const percent = Math.min((usedBytes / STORAGE_QUOTA_BYTES) * 100, 100);
  const isNearLimit = percent >= 80;

  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 ring-1 ring-slate-200/80 dark:ring-slate-700 p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
          <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Storage</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">Your file space</p>
        </div>
        {loading && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isNearLimit ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
          style={{ width: `${Math.max(percent, usedBytes > 0 ? 1 : 0)}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {formatBytes(usedBytes)} used
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">of 1 GB</span>
      </div>
    </div>
  );
}
