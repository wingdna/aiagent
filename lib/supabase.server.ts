import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config';

// 🛡️ Safe environment access for WebWorker/Browser
const getEnv = (key: string) => {
  try {
    return (globalThis as any).process?.env?.[key] || (import.meta as any).env?.[key];
  } catch {
    return undefined;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL') || CONFIG.SUPABASE_URL;
const supabaseKey = getEnv('SUPABASE_ANON_KEY') || CONFIG.SUPABASE_KEY;

export const supabaseServer = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
