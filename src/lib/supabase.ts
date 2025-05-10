import { createClient } from '@supabase/supabase-js';

export const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials are missing');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = typeof window !== 'undefined' 
  ? getSupabase() 
  : null as any; // Only initialize on client-side
