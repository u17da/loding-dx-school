import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      throw new Error('Supabase credentials are missing');
    }
    return null as unknown as SupabaseClient;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = typeof window !== 'undefined' || 
  (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ? getSupabase() 
  : null as unknown as SupabaseClient;
