import { PagesFunction, Env } from '../../_shared/types';
import { fetchAgentData } from '../../_shared/agentDataService';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params, waitUntil } = context;
  const slug = params.slug as string;

  const agent = await fetchAgentData(slug, env, waitUntil);

  if (!agent) {
    return new Response(JSON.stringify({ error: 'Agent not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(agent), {
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    },
  });
};
