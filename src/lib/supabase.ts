import { createClient } from '@supabase/supabase-js';

// Fallback dummy credentials prevent runtime initialization crashes when no Supabase backend is configured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-offline.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);