/**
 * 🛑 IRON SHIELD PROTOCOL: TITANIUM RELAY 🛑
 * Cloudflare Worker API Gateway.
 * Intercepts requests, negotiates content, and transforms responses.
 */

import { negotiateContent } from '../../../src/lib/llmo-core/content-negotiator';
import { toMarkdown, toCLIString, toJsonLD } from '../../../src/lib/llmo-core/agent-transformers';
import { buildSEOMetadata } from '../../../src/lib/llmo-core/seo-metadata-builder';
import { Agent } from '../../../types';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SYNAPSE_CACHE: KVNamespace;
  SILICONFLOW_API_KEY?: string;
  JWT_SECRET?: string;
}

// --- JWT Utilities ---
async function signJWT(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataToSign));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${dataToSign}.${encodedSignature}`;
}

async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureStr = atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/'));
    const signature = new Uint8Array(signatureStr.length);
    for (let i = 0; i < signatureStr.length; i++) {
      signature[i] = signatureStr.charCodeAt(i);
    }
    
    const isValid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(dataToSign));
    if (!isValid) return null;
    
    const payloadStr = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payloadStr);
  } catch (e) {
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Static Route: /llms.txt for AI bots
    if (path === '/llms.txt') {
      const llmsTxt = `
# YouAgent Agent Directory
This site provides AI agents.
To access agent data in markdown format, append \`/md\` to the agent URL or send an \`Accept: text/markdown\` header.
Example: /agent/gpt-4o -> Returns markdown for GPT-4o.
      `.trim();
      return new Response(llmsTxt, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // 2. Proxy Route: /api/v1/proxy/embed
    if (path === '/api/v1/proxy/embed' && request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    if (path === '/api/v1/proxy/embed' && request.method === 'POST') {
      try {
        const body = await request.json() as { text: string };
        const text = body.text;
        if (!text) return new Response('Missing text', { status: 400 });

        // Hash the text for cache key
        const msgUint8 = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const cacheKey = `embed_${hashHex}`;

        if (env.SYNAPSE_CACHE) {
          const cached = await env.SYNAPSE_CACHE.get(cacheKey, 'json');
          if (cached) {
            return new Response(JSON.stringify({ embedding: cached }), {
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
        }

        // Call SiliconFlow API for bge-m3 embedding
        const sfResponse = await fetch('https://api.siliconflow.cn/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.SILICONFLOW_API_KEY || 'sk-dummy'}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'BAAI/bge-m3',
                input: text
            })
        });
        
        if (!sfResponse.ok) {
            // Fallback to a deterministic pseudo-random vector for development if API fails
            console.warn('[YOUAGENT_EMBED] SiliconFlow API failed, generating fallback vector');
            const fallbackVector = Array.from({ length: 1024 }, (_, i) => Math.sin(i * hashArray[0]));
            return new Response(JSON.stringify({ embedding: fallbackVector }), {
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
        }
        
        const sfData = await sfResponse.json() as any;
        const embedding = sfData.data[0].embedding;

        if (env.SYNAPSE_CACHE) {
          ctx.waitUntil(env.SYNAPSE_CACHE.put(cacheKey, JSON.stringify(embedding), { expirationTtl: 86400 })); // 24h TTL
        }

        return new Response(JSON.stringify({ embedding }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 500,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // 3. Proxy Route: /api/v1/proxy/token (Ephemeral JWT Generation)
    if (path === '/api/v1/proxy/token' && request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    if (path === '/api/v1/proxy/token' && request.method === 'POST') {
      try {
        const body = await request.json() as { apiKey: string, provider: string };
        if (!body.apiKey || !body.provider) {
          return new Response(JSON.stringify({ error: 'Missing apiKey or provider' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        const secret = env.JWT_SECRET || env.SUPABASE_ANON_KEY; // Fallback to anon key if secret not set
        
        // Create payload with 5-minute expiration
        const payload = {
          apiKey: body.apiKey,
          provider: body.provider,
          exp: Math.floor(Date.now() / 1000) + (5 * 60) // 5 minutes
        };

        const token = await signJWT(payload, secret);

        return new Response(JSON.stringify({ token }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
    }

    // 4. Proxy Route: /api/v1/proxy/execute
    if (path === '/api/v1/proxy/execute' && request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Provider, X-Api-Base-Url',
          'Access-Control-Expose-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
          Vary: 'Origin',
        }
      });
    }

    if (path === '/api/v1/proxy/execute' && request.method === 'POST') {
      const provider = request.headers.get('X-Provider');
      const authHeader = request.headers.get('Authorization');

      if (!provider || !authHeader) {
        return new Response(JSON.stringify({ error: { message: 'Missing Provider or Authorization header' } }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Verify Ephemeral JWT
      const token = authHeader.replace('Bearer ', '');
      const secret = env.JWT_SECRET || env.SUPABASE_ANON_KEY;
      const payload = await verifyJWT(token, secret);

      if (!payload || !payload.apiKey || payload.exp < Math.floor(Date.now() / 1000)) {
        return new Response(JSON.stringify({ error: { message: 'Invalid or expired Ephemeral Token' } }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Use the actual API key from the JWT payload
      const actualApiKey = payload.apiKey;

      const normalizeUniversalTarget = (raw: string) => {
        try {
          const u = new URL(raw);
          const pathname = u.pathname || '';
          if (pathname === '' || pathname === '/') {
            u.pathname = '/v1';
          }
          let next = u.toString();
          if (!next.endsWith('/chat/completions') && !next.endsWith('/messages')) {
            next = next.replace(/\/$/, '') + '/chat/completions';
          }
          return next;
        } catch {
          return raw;
        }
      };

      let targetUrl = '';
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${actualApiKey}`
      };

      // Provider Mapping Strategy
      switch (provider) {
        case 'universal':
          targetUrl = normalizeUniversalTarget(
            request.headers.get('X-Api-Base-Url') || 'https://api.openai.com/v1/chat/completions'
          );
          break;
        case 'openai':
          targetUrl = 'https://api.openai.com/v1/chat/completions';
          break;
        case 'deepseek':
          targetUrl = 'https://api.deepseek.com/chat/completions';
          break;
        case 'anthropic':
          targetUrl = 'https://api.anthropic.com/v1/messages';
          headers['x-api-key'] = actualApiKey;
          headers['anthropic-version'] = '2023-06-01';
          delete headers['Authorization']; // Anthropic uses x-api-key
          break;
        default:
          return new Response(JSON.stringify({ error: { message: 'Unsupported Provider' } }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
      }

      try {
        const body = await request.json();
        
        // Forward the request to the provider
        const upstreamResponse = await fetch(targetUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body)
        });

        // Create a streaming response
        // We use the upstream body directly to avoid buffering
        return new Response(upstreamResponse.body, {
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText,
          headers: {
            'Content-Type': upstreamResponse.headers.get('Content-Type') || 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Provider, X-Api-Base-Url',
            'Access-Control-Expose-Headers': 'Content-Type',
            Vary: 'Origin',
          }
        });

      } catch (error: any) {
        return new Response(JSON.stringify({ error: { message: error.message || 'Proxy Error' } }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 4. Dynamic Route: /agent/[slug] or /api/agent/[slug]
    const agentMatch = path.match(/^\/(?:api\/)?agent\/([^/]+)$/);
    if (agentMatch) {
      const slug = agentMatch[1];
      
      // Fetch data from Supabase/KV
      const agentData = await fetchAgentData(slug, env, ctx);
      
      if (!agentData) {
        return new Response('Agent Not Found', { status: 404 });
      }

      // Determine Client Intent
      const intent = negotiateContent(request.headers);

      switch (intent) {
        case 'MARKDOWN':
          return new Response(toMarkdown(agentData), {
            headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
          });
          
        case 'CLI':
          return new Response(toCLIString(agentData), {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
          
        case 'JSON':
          return new Response(JSON.stringify(agentData), {
            headers: { 'Content-Type': 'application/json' }
          });
          
        case 'HTML':
        default:
          // If it's an API call (starts with /api/), return JSON by default
          if (path.startsWith('/api/')) {
             return new Response(JSON.stringify(agentData), {
                headers: { 'Content-Type': 'application/json' }
              });
          }

          // Fetch the base HTML (e.g., from Vite dev server or static assets)
          // For this worker, we assume the origin serves the base HTML.
          const originResponse = await fetch(request);
          
          // Use HTMLRewriter to inject SEO tags and JSON-LD
          const { title, metaTags } = buildSEOMetadata(agentData);
          const jsonLd = toJsonLD(agentData);

          const rewriter = new HTMLRewriter()
            .on('title', {
              element(element) {
                element.setInnerContent(title);
              }
            })
            .on('head', {
              element(element) {
                element.append(metaTags, { html: true });
                element.append(`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`, { html: true });
              }
            });
            
          return rewriter.transform(originResponse);
      }
    }

    // 5. List Agents Route: /api/agents
    if (path === '/api/agents') {
      const params = url.searchParams;
      const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200);
      const page = Math.max(0, parseInt(params.get('page') || '0', 10));
      const offset = Math.max(0, parseInt(params.get('offset') || String(page * limit), 10));

      const agents = await fetchAgentsPage(env, ctx, { limit, offset });
      const payload = {
        items: agents,
        limit,
        offset,
        nextOffset: agents.length === limit ? offset + limit : null,
      };

      return new Response(JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Pass through all other requests
    return fetch(request);
  }
};

async function fetchAgentsPage(env: Env, ctx: ExecutionContext, opts: { limit: number; offset: number }): Promise<Agent[]> {
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

async function fetchAgentData(slug: string, env: Env, ctx: ExecutionContext): Promise<Agent | null> {
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
