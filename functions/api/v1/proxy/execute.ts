import { PagesFunction, Env } from '../../../_shared/types';

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Provider, X-Api-Base-Url',
      'Access-Control-Expose-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const provider = request.headers.get('X-Provider');
  const authHeader = request.headers.get('Authorization');

  if (!provider || !authHeader) {
    return new Response(
      JSON.stringify({ error: { message: 'Missing Provider or Authorization header' } }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: authHeader,
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
      headers['x-api-key'] = authHeader.replace('Bearer ', '');
      headers['anthropic-version'] = '2023-06-01';
      delete headers.Authorization; // Anthropic uses x-api-key
      break;
    default:
      return new Response(JSON.stringify({ error: { message: 'Unsupported Provider' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  try {
    const body = await request.json();

    // Forward the request to the provider
    const upstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
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
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: { message: error.message || 'Proxy Error' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
