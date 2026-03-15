import { Agent } from '../../../../types';
import { Env } from '../index';

export async function fetchAgentsPage(env: Env, ctx: ExecutionContext, opts: { limit: number; offset: number }): Promise<Agent[]> {
    const limit = Math.max(1, Math.min(200, Math.floor(opts.limit)));
    const offset = Math.max(0, Math.floor(opts.offset));
    const cacheKey = `agents_page_${limit}_${offset}`;

    if (env.SYNAPSE_CACHE) {
        const cached = await env.SYNAPSE_CACHE.get(cacheKey, 'json');
        if (cached) return cached as Agent[];
    }

    const LIST_SELECT_FIELDS = [
        'id', 'name', 'slogan', 'category', 'nri_score', 'hot_score', 'entity_type',
        'tactical_badges', 'persona_img', 'video_poster', 'video_url',
        'slug', 'tags', 'capability_tags', 'theme_color',
        'metrics', 'stats', 'external_stats', 'connectivity',
        'specs', 'pricing_model', 'hardware_req',
        'benchmarks', 'market_analysis'
    ].join(',');

    const sbUrl = `${env.SUPABASE_URL}/rest/v1/agents?select=${LIST_SELECT_FIELDS}&order=hot_score.desc.nullslast&limit=${limit}&offset=${offset}`;
    const response = await fetch(sbUrl, {
        headers: {
            "apikey": env.SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) return [];

    const agents = await response.json() as Agent[];

    if (agents && env.SYNAPSE_CACHE) {
        ctx.waitUntil(env.SYNAPSE_CACHE.put(cacheKey, JSON.stringify(agents), { expirationTtl: 120 })); // Cache for 2 mins
    }

    return agents;
}

export async function fetchAgentData(slug: string, env: Env, ctx: ExecutionContext): Promise<Agent | null> {
    const cacheKey = `agent_data_${slug}`;

    if (env.SYNAPSE_CACHE) {
        const cached = await env.SYNAPSE_CACHE.get(cacheKey, 'json');
        if (cached) return cached as Agent;
    }

    // Fetch from Supabase
    const sbUrl = `${env.SUPABASE_URL}/rest/v1/agents?id=eq.${slug}&select=*`;
    const response = await fetch(sbUrl, {
        headers: {
            "apikey": env.SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) return null;

    const results = await response.json() as any[];
    const agent = results[0] || null;

    if (agent && env.SYNAPSE_CACHE) {
        ctx.waitUntil(env.SYNAPSE_CACHE.put(cacheKey, JSON.stringify(agent), { expirationTtl: 3600 }));
    }

    return agent;
}
