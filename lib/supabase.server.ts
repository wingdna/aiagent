/**
 * ==========================================
 * 🛑[CTO ARCHITECTURE LOCK: TITANIUM V10] 🛑
 * ==========================================
 * DEPLOYMENT TARGET: Cloudflare Pages SSR (Edge Workers)
 * 
 * 1. STRICTLY FORBIDDEN to use `process.env` here.
 * 2. Environment variables MUST be injected via `context.env` from Remix Loaders.
 * 3. The Proxy pattern is INTENTIONAL to handle Edge request lifecycles. 
 * DO NOT refactor this to a top-level singleton instantiation.
 * ==========================================
 */
import { createClient } from '@supabase/supabase-js';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { CONFIG } from '../config';

// 🛡️ Safe environment access for WebWorker/Browser
const getEnv = (key: string, env?: any) => {
  try {
    // Cloudflare Workers polyfill or global access
    return env?.[key] || (globalThis as any)[key] || (globalThis as any).process?.env?.[key] || (import.meta as any).env?.[key];
  } catch {
    return undefined;
  }
};

/**
 * 🛡️ Protocol V10: getSupabaseSystemClient
 * Specialized for Cloudflare Pages SSR with cookie handling.
 */
export const getSupabaseSystemClient = (request: Request, env: any, responseHeaders?: Headers) => {
  const supabaseUrl = getEnv('SUPABASE_URL', env) || CONFIG.SUPABASE_URL;
  const supabaseKey = getEnv('SUPABASE_ANON_KEY', env) || CONFIG.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("❌ Supabase Server: Failed to initialize. Check environment variables.");
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    auth: {
      flowType: 'pkce',
    },
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '').map(c => ({
          name: c.name,
          value: c.value ?? ''
        }));
      },
      setAll(cookiesToSet: any[]) {
        cookiesToSet.forEach(({ name, value, options }: any) => {
          if (responseHeaders) {
            responseHeaders.append('Set-Cookie', serializeCookieHeader(name, value, options));
          }
        });
      },
    },
  });
};

let _supabaseInstance: any = null;

export const initSupabaseWithEnv = (env?: any) => {
  if (_supabaseInstance) return _supabaseInstance;
  
  const supabaseUrl = getEnv('SUPABASE_URL', env) || CONFIG.SUPABASE_URL;
  const supabaseKey = getEnv('SUPABASE_ANON_KEY', env) || CONFIG.SUPABASE_KEY;

  if (supabaseUrl && supabaseKey) {
    _supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  return _supabaseInstance;
};

const initSupabase = () => {
  return initSupabaseWithEnv();
};

// 🛡️ Protocol V10: Surgical Proxy Implementation
// This allows loaders to use 'supabaseServer' as a constant while delaying initialization
export const supabaseServer = new Proxy({} as any, {
  get(target, prop) {
    const instance = initSupabase();
    if (!instance) {
      console.error("❌ Supabase Server: Failed to initialize. Check environment variables.");
      return undefined;
    }
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
  // Handle 'if (!supabaseServer)' checks
  apply(target, thisArg, argumentsList) {
    return !!initSupabase();
  }
});
