import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * App.tsx checks isSupabaseConfigured and renders SetupError instead of
 * the chat UI when env vars are missing. By the time any component
 * imports `supabase`, a real client is guaranteed. The fallback is only
 * a type-level placeholder so destructuring never throws during HMR.
 */
const client: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (null as unknown as SupabaseClient);

export const supabase = client;

export const STORAGE_BUCKET = 'attachments';
