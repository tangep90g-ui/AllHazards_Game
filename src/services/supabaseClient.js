import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client initialization.
 * Note: These environment variables must be prefixed with VITE_ to be 
 * accessible in a Vite project.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
