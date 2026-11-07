import { AlertTriangle, ExternalLink } from 'lucide-react';

interface SetupErrorProps {
  missingVars: string[];
}

export function SetupError({ missingVars }: SetupErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-100 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/50 transition-colors">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-5">
          <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2.2} />
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Setup needed</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
          This app needs Supabase environment variables to work. If you deployed on Vercel, add them in your project settings.
        </p>

        <div className="w-full glass-panel rounded-2xl p-4 mb-5 text-left">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Missing environment {missingVars.length === 1 ? 'variable' : 'variables'}:
          </p>
          <ul className="space-y-1.5">
            {missingVars.map((v) => (
              <li key={v} className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <code className="font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">{v}</code>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              In Vercel: <strong>Settings → Environment Variables</strong>, then redeploy.
              Both must start with <code className="font-mono text-emerald-700 dark:text-emerald-400">VITE_</code> so Vite exposes them to the browser.
            </p>
          </div>
        </div>

        <a
          href="https://vercel.com/docs/projects/environment-variables"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-3d flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl transition"
        >
          Vercel env docs <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
