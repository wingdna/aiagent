import { PagesFunction } from '../../../_shared/types';

export const onRequestOptions: PagesFunction<any> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};

export const onRequestPost: PagesFunction<any> = async (context) => {
  const { request } = context;
  try {
    const body = await request.json() as any;
    const { apiKey, provider } = body;

    if (!apiKey || !provider) {
      return new Response(JSON.stringify({ error: 'Missing apiKey or provider' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // In a real implementation, this would generate a JWT or similar token
    // For now, we just pass the API key through as the token
    // since the proxy/execute endpoint expects the raw key in the Authorization header
    // if we don't implement full JWT validation there.
    // Wait, let's just return the apiKey as the token for now.
    const token = apiKey;

    return new Response(JSON.stringify({ token }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
