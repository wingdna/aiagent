
import { createBrowserClient } from '@supabase/ssr';
import { CONFIG } from '../config';

const supabaseUrl = CONFIG.SUPABASE_URL;
const supabaseKey = CONFIG.SUPABASE_KEY;

// Singleton instance for the entire application
if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.error("SUPABASE_URL_MISSING");
}

export const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder'))
  ? createBrowserClient(supabaseUrl, supabaseKey, {
      auth: {
        flowType: 'pkce', // 🚀 在初始化时就全局锁死 PKCE 模式
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;
