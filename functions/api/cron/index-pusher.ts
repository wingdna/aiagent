import { PagesFunction, Env } from '../../_shared/types';
import { createClient } from '@supabase/supabase-js';

function str2ab(str: string) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function base64UrlEncode(str: string) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function importPrivateKey(pem: string) {
  // remove header, footer, newlines
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem.substring(
    pem.indexOf(pemHeader) + pemHeader.length,
    pem.indexOf(pemFooter)
  ).replace(/\s/g, '');
  
  const binaryDerString = atob(pemContents);
  const binaryDer = str2ab(binaryDerString);

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
}

async function getGoogleAccessToken(serviceAccountJson: string) {
  const serviceAccount = JSON.parse(serviceAccountJson);
  const privateKey = await importPrivateKey(serviceAccount.private_key);
  
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: serviceAccount.private_key_id
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/indexing"
  };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    str2ab(unsignedToken)
  );
  
  const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  const jwt = `${unsignedToken}.${encodedSignature}`;
  
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  const data: any = await response.json();
  return data.access_token;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  // Check CRON_SECRET
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return new Response('Missing Google Service Account JSON', { status: 500 });
  }
  
  try {
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        return new Response('Missing Supabase credentials', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch latest 50 agents
    const { data: agents, error } = await supabase
        .from('agents')
        .select('slug, updated_at')
        .order('updated_at', { ascending: false })
        .limit(50);
        
    if (error || !agents) {
      return new Response(`Supabase Error: ${error?.message}`, { status: 500 });
    }
    
    const accessToken = await getGoogleAccessToken(env.GOOGLE_SERVICE_ACCOUNT_JSON as string);
    
    const results = [];
    for (const agent of agents) {
      const url = `https://youagent.top/agent/${agent.slug}`;
      const response = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          url: url,
          type: "URL_UPDATED"
        })
      });
      
      const result = await response.json();
      results.push({ url, status: response.status, result });
    }
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (e: any) {
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
};
