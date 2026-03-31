import { Env } from '../index';
import { fetchAgentsPage } from '../utils/db';

export async function handleAgentsRoute(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
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
