
/**
 * YOUAGENT EDGE GATEWAY (V5.3)
 * Architecture: Self-Diagnostic Edge Protocol
 * Purpose: Robust error isolation and environment transparency.
 * Updates: Added Dynamic Sorting Matrix (V5.3)
 */

export default {
  async fetch(request, env, ctx) {
    // 1. Unified CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-User-Key, X-Agent-Provider, X-Model, cf-turnstile-response',
    };

    // Handle OPTIONS (Preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 2. Environment Self-Diagnosis
      if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
        throw new Error("MISSING_ENV: SUPABASE_URL or SUPABASE_ANON_KEY is not set in Worker secrets.");
      }
      
      // Check for KV Binding (Warning only to allow non-cache mode if needed, or strict if requested)
      if (!env.SYNAPSE_CACHE) {
        console.warn("MISSING_BINDING: SYNAPSE_CACHE (YouAgent Cache) KV is not bound. Proceeding without cache.");
      }

      const url = new URL(request.url);
      const pathname = url.pathname;
      const sbBase = env.SUPABASE_URL.endsWith('/') ? env.SUPABASE_URL.slice(0, -1) : env.SUPABASE_URL;

      // 3. Routing Logic
      if (pathname === "/api/agents" && request.method === "GET") {
        return await handleGetAgents(request, sbBase, env, ctx, corsHeaders);
      }
      
      // V17.0: Specific Agent Detail with KV Caching
      // Regex check for /api/agent/:id (excluding /intel)
      if (pathname.match(/^\/api\/agent\/[^/]+$/) && request.method === "GET") {
        return await handleGetAgent(request, sbBase, env, ctx, corsHeaders);
      }

      // V17.0: Parallel Intel Fetch
      if (pathname.match(/^\/api\/agent\/[^/]+\/intel$/) && request.method === "GET") {
        return await handleGetAgentIntel(request, sbBase, env, ctx, corsHeaders);
      }

      if (pathname === "/api/proxy-image" && request.method === "GET") {
        return await handleProxyImage(request, env, ctx, corsHeaders);
      }

      if (pathname === "/api/chat" && request.method === "POST") {
        return await handleChatProxy(request, env, ctx, corsHeaders);
      }

      return new Response(JSON.stringify({ error: "ROUTE_NOT_FOUND", path: pathname }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });

    } catch (err) {
      // 4. Critical Error Trap (Protocol V5.2)
      console.error("[WORKER_CRASH_LOG]", err.stack);
      
      return new Response(JSON.stringify({
        error: "WORKER_CRASH",
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        env_status: {
          has_supabase_url: !!env.SUPABASE_URL,
          has_supabase_key: !!env.SUPABASE_ANON_KEY,
          has_kv: !!env.SYNAPSE_CACHE
        }
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};

/**
 * --- Handler Implementations ---
 */

const KV_TTL = 600; // Reduced TTL for dynamic sorting

async function handleGetAgents(request, sbBase, env, ctx, corsHeaders) {
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "0";
  const cat = url.searchParams.get("category") || "ALL";
  const sortBy = url.searchParams.get("sortBy") || "hot"; // hot, rank, score, speed, creative, logic
  const order = url.searchParams.get("order") || "desc";
  
  const cacheKey = `v5_agents_${cat}_p${page}_s${sortBy}_o${order}`;

  // Protocol V19.0: Edge Cache & KV Layer
  // 1. Check KV
  if (env.SYNAPSE_CACHE) {
    try {
      const cached = await env.SYNAPSE_CACHE.get(cacheKey);
      if (cached) {
        return new Response(cached, { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json", 
            "X-Cache": "HIT",
            // V19.0: Force Browser & CDN Caching
            "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=600"
          } 
        });
      }
    } catch (e) {
      console.error("KV_READ_ERROR:", e.message);
    }
  }

  const start = parseInt(page) * 20;
  
  // Construct Query
  let sbUrl = `${sbBase}/rest/v1/agents?select=*`;
  
  // Filtering
  if (cat !== "ALL") {
    // If it's a specific category tag
    if (["TEXT_GEN", "IMAGE_GEN", "VIDEO_GEN", "CODING", "SECURITY", "ANALYSIS"].includes(cat)) {
        sbUrl += `&category=eq.${cat}`;
    } else {
        // Assume it's a capability tag if not a category
        sbUrl += `&tags=cs.{${cat}}`; 
    }
  }

  // Sorting Logic (The Sorting Matrix)
  let orderParam = 'nri_score.desc'; // Default to Heat/NRI
  
  switch(sortBy) {
      case 'rank':
      case 'hot':
          orderParam = `nri_score.${order}`;
          break;
      case 'score': // ELO
          orderParam = `stats->elo.${order}`; // Note: JSONB numeric sort reliability depends on DB casting
          break;
      case 'speed':
          // Use arrow operator for JSONB path. Requires Postgres 14+ or cast for strict numeric sort.
          // Fallback: Client side sort if DB returns text sort.
          orderParam = `metrics->speed.${order}`;
          break;
      case 'creative':
          orderParam = `metrics->creativity.${order}`;
          break;
      case 'logic':
          orderParam = `metrics->reasoning.${order}`;
          break;
      case 'new':
          orderParam = `created_at.${order}`;
          break;
      default:
          orderParam = `nri_score.desc`;
  }
  
  sbUrl += `&order=${orderParam}`;
  sbUrl += `&offset=${start}&limit=20`;

  const response = await fetch(sbUrl, {
    headers: {
      "apikey": env.SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`,
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    // Fallback to default sort if JSON sort fails (often due to missing keys or casting issues)
    // FIX: Added guard `sortBy !== 'hot'` to prevent infinite recursion if the default sort itself fails.
    if (response.status === 400 && errorBody.includes("failed") && sortBy !== 'hot') {
        console.warn(`Sort '${sortBy}' failed, retrying with default 'hot'.`);
        url.searchParams.set("sortBy", "hot");
        const newRequest = new Request(url.toString(), request);
        return handleGetAgents(newRequest, sbBase, env, ctx, corsHeaders);
    }
    throw new Error(`UPSTREAM_REJECTION_${response.status}: ${errorBody.substring(0, 150)}`);
  }

  const data = await response.text();
  
  // V19.0: KV Write-Back (Fire and Forget)
  if (env.SYNAPSE_CACHE) {
    ctx.waitUntil(env.SYNAPSE_CACHE.put(cacheKey, data, { expirationTtl: KV_TTL }));
  }

  return new Response(data, { 
    headers: { 
      ...corsHeaders, 
      "Content-Type": "application/json", 
      "X-Cache": "MISS",
      // V19.0: Force Browser & CDN Caching
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=600"
    } 
  });
}

// V17.0: Optimized Cache-First Handler
async function handleGetAgent(request, sbBase, env, ctx, corsHeaders) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();
  if (!id) throw new Error("ID_MISSING_IN_PATH");

  const cacheKey = `agent_profile_${id}`;

  // 1. KV Shield Check
  if (env.SYNAPSE_CACHE) {
    const cached = await env.SYNAPSE_CACHE.get(cacheKey, 'json');
    if (cached) {
      return new Response(JSON.stringify(cached), { 
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" } 
      });
    }
  }

  // 2. Cache Miss - Query Supabase
  const sbUrl = `${sbBase}/rest/v1/agents?id=eq.${id}&select=*`;
  const response = await fetch(sbUrl, {
    headers: { 
      "apikey": env.SUPABASE_ANON_KEY, 
      "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`,
      "Accept": "application/json"
    }
  });

  if (!response.ok) throw new Error(`UPSTREAM_AGENT_QUERY_FAILED_${response.status}`);

  const results = await response.json();
  const agent = results[0] || null;

  // 3. Asynchronous Write-Back
  if (agent && env.SYNAPSE_CACHE) {
    ctx.waitUntil(env.SYNAPSE_CACHE.put(cacheKey, JSON.stringify(agent), { expirationTtl: 3600 })); // 1 Hour TTL
  }

  const jsonStr = agent ? JSON.stringify(agent) : "{}";
  return new Response(jsonStr, { headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" } });
}

// V17.0: Intel Handler
async function handleGetAgentIntel(request, sbBase, env, ctx, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 2]; // .../agent/:id/intel

  if (!id) throw new Error("ID_MISSING_IN_INTEL_PATH");

  // Mock Intel for now, or fetch from a separate table if available
  // In a real scenario, this would query `agent_intel` table.
  
  const intelItems = [
      { 
          type: 'NEWS', 
          title: `Latest Benchmarks: ${id} Performance Review`, 
          date: '2h ago',
          url: `https://www.google.com/search?q=${encodeURIComponent(id + " benchmark")}`
      },
      { 
          type: 'TUTORIAL', 
          title: `Optimizing Prompts for ${id}`, 
          date: '1d ago',
          url: `https://www.google.com/search?q=${encodeURIComponent("how to use " + id)}`
      },
      { 
          type: 'UPDATE', 
          title: 'System Patch V4.2 Released', 
          date: '3d ago',
          url: '#'
      }
  ];

  return new Response(JSON.stringify(intelItems), { 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  });
}

async function handleProxyImage(request, env, ctx, corsHeaders) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");
  if (!target) throw new Error("TARGET_URL_PARAMETER_REQUIRED");

  const imageResp = await fetch(target, { 
    headers: { "User-Agent": "YouAgent-Edge-Gateway/5.2" } 
  });
  
  if (!imageResp.ok) return imageResp;

  const response = new Response(imageResp.body, imageResp);
  response.headers.set("Cache-Control", "public, max-age=604800");
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}

async function handleChatProxy(request, env, ctx, corsHeaders) {
  const body = await request.json();
  const provider = request.headers.get("X-Agent-Provider") || "google";
  const model = request.headers.get("X-Model") || "gemini-3-flash-preview";
  
  if (provider === "google") {
    if (!env.GOOGLE_API_KEY) throw new Error("MISSING_ENV: GOOGLE_API_KEY is not configured.");
    
    const aiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GOOGLE_API_KEY}`;
    const aiResp = await fetch(aiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: body.prompt }] }] })
    });

    if (!aiResp.ok) {
      const errTxt = await aiResp.text();
      throw new Error(`GOOGLE_API_REJECTION_${aiResp.status}: ${errTxt.substring(0, 100)}`);
    }

    return new Response(aiResp.body, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "PROVIDER_UNSUPPORTED", provider }), { 
    status: 400, 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  });
}
