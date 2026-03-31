import { Env } from './types';
import { Agent } from '../../types';

export async function fetchAgentData(
  slug: string,
  env: Env,
  waitUntil: (promise: Promise<any>) => void,
  signal?: AbortSignal
): Promise<Agent | null> {
  const cacheKey = `agent_data_${slug}`;

  if (env.SYNAPSE_CACHE) {
    const cached = await env.SYNAPSE_CACHE.get(cacheKey, 'json');
    if (cached) return cached as Agent;
  }

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const msg = "[FATAL] Missing Supabase environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)";
    console.error(msg);
    throw new Error(msg);
  }

  // Fetch from Supabase
  let agent: Agent | null = null;
  try {
    // For single-agent detail: include full_description but still exclude embedding.
    const DETAIL_SELECT_FIELDS = [
      'id', 'name', 'slogan', 'description', 'full_description', 'category',
      'nri_score', 'hot_score', 'entity_type', 'video_url', 'cover_url',
      'slug', 'tags', 'capability_tags', 'metrics', 'stats', 'external_stats',
      'connectivity', 'voice_config', 'specs', 'pricing_model', 'market_analysis',
      'vendor_id', 'vendor_slug'
    ].join(',');
    const sbUrl = `${supabaseUrl}/rest/v1/agents?or=(id.eq.${encodeURIComponent(slug)},slug.eq.${encodeURIComponent(slug)})&select=${DETAIL_SELECT_FIELDS}&limit=1`;
    const response = await fetch(sbUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
      signal,
    });

    const rawData = await response.text();

    if (!response.ok) return null;

    const results = JSON.parse(rawData) as any[];
    agent = results[0] || null;
  } catch (dbError: any) {
    console.error("[DataService] Failed to fetch agent:", slug, "Error Code:", dbError.code);
    return null;
  }

  if (agent && env.SYNAPSE_CACHE) {
    waitUntil(env.SYNAPSE_CACHE.put(cacheKey, JSON.stringify(agent), { expirationTtl: 3600 }));
  }

  return agent;
}

export async function fetchAllAgents(env: Env, waitUntil: (promise: Promise<any>) => void): Promise<Agent[]> {
  const cacheKey = 'all_agents_list';

  if (env.SYNAPSE_CACHE) {
    const cached = await env.SYNAPSE_CACHE.get(cacheKey, 'json');
    if (cached) return cached as Agent[];
  }

  // Fetch up to 5000 agents for the directory
  const agents = await fetchAgentsPage(env, waitUntil, { limit: 5000, offset: 0 });

  if (agents && env.SYNAPSE_CACHE) {
    waitUntil(env.SYNAPSE_CACHE.put(cacheKey, JSON.stringify(agents), { expirationTtl: 600 }));
  }

  return agents;
}

export async function fetchAgentsPage(
  env: Env,
  waitUntil: (promise: Promise<any>) => void,
  opts: { limit: number; offset: number }
): Promise<Agent[]> {
  const limit = Math.max(1, Math.min(5000, Math.floor(opts.limit))); // Increased max limit to 5000
  const offset = Math.max(0, Math.floor(opts.offset));
  const cacheKey = `agents_page_${limit}_${offset}`;

  if (env.SYNAPSE_CACHE) {
    const cached = await env.SYNAPSE_CACHE.get(cacheKey, 'json');
    if (cached) return cached as Agent[];
  }

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const msg = "[FATAL] Missing Supabase environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)";
    console.error(msg);
    throw new Error(msg);
  }

  try {
    // ⚡ OPERATION GOLDEN GATE: CRITICAL PAYLOAD REDUCTION
    // NEVER select 'embedding' (vector, massive) or 'full_description' (long text) in list view.
    // Only fetch fields required by Grid View and Discover View cards.
    const LIST_SELECT_FIELDS = [
      'id', 'name', 'slogan', 'description', 'category', 'nri_score', 'hot_score', 'entity_type',
      'video_url', 'cover_url', 'slug', 'tags', 'capability_tags',
      'metrics', 'stats', 'external_stats', 'connectivity',
      'specs', 'pricing_model', 'market_analysis', 'vendor_id', 'vendor_slug'
    ].join(',');
    const sbUrl = `${supabaseUrl}/rest/v1/agents?select=${LIST_SELECT_FIELDS}&order=hot_score.desc.nullslast&limit=${limit}&offset=${offset}`;
    const response = await fetch(sbUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) return [];

    const agents = (await response.json()) as Agent[];

    if (agents && env.SYNAPSE_CACHE) {
      waitUntil(env.SYNAPSE_CACHE.put(cacheKey, JSON.stringify(agents), { expirationTtl: 120 }));
    }

    return agents;
  } catch (error) {
    return [];
  }
}
