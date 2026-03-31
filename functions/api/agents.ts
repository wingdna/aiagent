import { PagesFunction, Env } from '../_shared/types';
import { fetchAgentsPage } from '../_shared/agentDataService';

function parsePositiveInt(raw: string | null, fallback: number) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, waitUntil } = context;
  const url = new URL(request.url);
  const params = url.searchParams;
  const limit = Math.min(parsePositiveInt(params.get('limit'), 50), 200);
  const page = Math.max(0, parsePositiveInt(params.get('page'), 0));
  const offset = Math.max(0, parsePositiveInt(params.get('offset'), page * limit));

  const agents = await fetchAgentsPage(env, waitUntil, { limit, offset });
  const payload = {
    items: agents,
    limit,
    offset,
    nextOffset: agents.length === limit ? offset + limit : null,
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
