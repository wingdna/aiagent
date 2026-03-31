import { Env } from '../index';

export async function handleEmbedRoute(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
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

    if (request.method === 'POST') {
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

    return new Response('Method Not Allowed', { status: 405 });
}
