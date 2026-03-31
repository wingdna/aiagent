import { PagesFunction } from '../_shared/types';

export interface Env {
  SILICONFLOW_API_KEY: string;
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
  const { SILICONFLOW_API_KEY } = context.env;
  
  if (!SILICONFLOW_API_KEY) {
    return new Response(JSON.stringify({ error: "MISSING_ENV_SECRETS" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const request = context.request;
    const clientKey = request.headers.get('x-siliconflow-key');
    const apiKey = clientKey || SILICONFLOW_API_KEY;
    
    const body = await request.json() as any;
    
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    // Create a new response to modify headers (CORS)
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    return newResponse;

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Chat Failed', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
