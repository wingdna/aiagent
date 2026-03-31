import { Env } from '../index';
import { verifyJWT } from '../utils/jwt';

export async function handleExecuteRoute(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
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

    if (request.method === 'POST') {
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

    return new Response('Method Not Allowed', { status: 405 });
}
