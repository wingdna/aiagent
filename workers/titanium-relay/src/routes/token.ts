import { Env } from '../index';
import { signJWT } from '../utils/jwt';

export async function handleTokenRoute(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
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

    if (request.method === 'POST') {
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

    return new Response('Method Not Allowed', { status: 405 });
}
