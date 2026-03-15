
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config';

const supabaseUrl = CONFIG.SUPABASE_URL;
const supabaseKey = CONFIG.SUPABASE_KEY;

// Singleton instance for the entire application
if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.error("SUPABASE_URL_MISSING");
}

export const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder'))
  ? createClient(supabaseUrl, supabaseKey)
  : null;
