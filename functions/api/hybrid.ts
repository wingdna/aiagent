import { createClient } from '@supabase/supabase-js';
import { PagesFunction } from '../_shared/types';

export interface Env {
  SILICONFLOW_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-siliconflow-key, Authorization',
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { SILICONFLOW_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY } = context.env;
  
  if (!SILICONFLOW_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: "MISSING_ENV_SECRETS" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    const request = context.request;
    const clientKey = request.headers.get('x-siliconflow-key');
    const apiKey = clientKey || SILICONFLOW_API_KEY;
    
    const body = await request.json() as any;
    const query = body.query;
    if (!query) return new Response(JSON.stringify({ results: [] }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    // 1. Intent Distillation
    let distilledKeywords = query;
    let tags: string[] = [];
    
    try {
        const chatRes = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                model: 'Qwen/Qwen2.5-7B-Instruct',
                messages: [
                    { role: 'system', content: 'Output ONLY core technology tags separated by commas.' },
                    { role: 'user', content: `Extract tags: ${query}` }
                ],
                stream: false
            })
        });

        if (chatRes.ok) {
            const chatData = await chatRes.json() as any;
            const content = chatData.choices?.[0]?.message?.content?.trim();
            if (content) {
                distilledKeywords = content;
                tags = content.split(',').map((t: string) => t.trim()).filter(Boolean);
            }
        }
    } catch (e) {
        // Silent fail
    }

    // 2. Vector Search
    let vectorAgents: any[] = [];
    try {
        const embedRes = await fetch('https://api.siliconflow.cn/v1/embeddings', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                model: 'BAAI/bge-m3',
                input: distilledKeywords
            })
        });

        if (embedRes.ok) {
            const embedData = await embedRes.json() as any;
            const vector = embedData.data?.[0]?.embedding;
            if (vector) {
                const { data } = await supabase.rpc('match_agents', {
                    query_embedding: vector,
                    match_threshold: 0.15,
                    match_count: 8
                });
                if (data) vectorAgents = data;
            }
        }
    } catch (e) {
        console.warn("[SEARCH] Vector uplink severed (Timeout/Network). Engaging mechanical fallback.");
    }

    // 3. SQL Search
    let sqlAgents: any[] = [];
    try {
        const { data } = await supabase
            .from('agents')
            .select('id, name, description, entity_type, nri_score, hot_score, video_url, cover_url, display_mode, specs, pricing, metrics, capability_tags, media_gallery, vendor_id, vendor_slug, slogan')
            .ilike('name', `%${query}%`)
            .limit(8);
        if (data) sqlAgents = data;
    } catch (e) {
        // Silent fail
    }

    // 4. Merge
    const allAgents = [...vectorAgents, ...sqlAgents];
    const uniqueAgents = Array.from(new Map(allAgents.map(item => [item.id, item])).values());
    
    return new Response(JSON.stringify({ results: uniqueAgents }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Search Failed', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
