import { PagesFunction, Env } from '../../_shared/types';
import { createClient } from '@supabase/supabase-js';

// [SHADOW_PROTOCOL] Sitemap Shard Sync
// This function is intended to be triggered by a Cron Job (or manually)
// to refresh the sitemap cache and ensure SEO dominance.

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, waitUntil } = context;

  // Verify secret if needed, but for now we assume this is an internal endpoint
  // or protected by Cloudflare Access if deployed.

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new Response('Missing Supabase credentials', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch total count
  const { count, error } = await supabase
    .from('agents')
    .select('id', { count: 'exact', head: true });

  if (error) {
    return new Response(`Supabase Error: ${error.message}`, { status: 500 });
  }

  const totalAgents = count || 0;
  const agentsPerPage = 1000;
  const agentShardCount = Math.ceil(totalAgents / agentsPerPage);

  // 2. Refresh Cache (if KV is available)
  if (env.SYNAPSE_CACHE) {
    // We can pre-warm the cache for each shard here if we wanted to be aggressive.
    // For now, we just log the sync status.
    const status = {
      timestamp: new Date().toISOString(),
      totalAgents,
      shards: agentShardCount,
      status: 'SYNCED'
    };
    
    await env.SYNAPSE_CACHE.put('sitemap_sync_status', JSON.stringify(status));
    
    return new Response(JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ 
    message: "Sync complete (No Cache)", 
    totalAgents, 
    shards: agentShardCount 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
