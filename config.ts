
export const CONFIG = {
  // Database control
  USE_DATABASE: true, 
  
  // Supabase Configuration (Strictly for Identity/Auth)
  SUPABASE_URL: 'https://kumviyxbodfktoamgazw.supabase.co',
  SUPABASE_KEY: 'sb_publishable_gp2I7s0aQDXmEYpP_s1eLQ_2gNKv-OI',
  
  // Cloudflare Edge Gateway (Protocol V5.0)
  // 1. Priority: VITE_API_BASE_URL (Dashboard)
  // 2. Fallback: Live Worker (Provided by Architect)
  // 3. Dev: Localhost
  API_GATEWAY: (import.meta as any).env?.VITE_API_BASE_URL || 'https://cache.roforhy.workers.dev',
  
  API_TIMEOUT: 10000,
  VERSION: 'V5.0-PROD-READY'
};
