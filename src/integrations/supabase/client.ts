import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const missingSupabaseVariables = [
  !SUPABASE_URL && "VITE_SUPABASE_URL",
  !SUPABASE_PUBLISHABLE_KEY && "VITE_SUPABASE_PUBLISHABLE_KEY",
].filter((value): value is string => Boolean(value));

// Keep module initialization safe so a misconfigured GitHub Pages deployment can
// display an actionable error instead of crashing before React renders.
const safeUrl = SUPABASE_URL || "http://127.0.0.1:54321";
const safePublishableKey = SUPABASE_PUBLISHABLE_KEY || "missing-publishable-key";

export const supabase = createClient<Database>(safeUrl, safePublishableKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
