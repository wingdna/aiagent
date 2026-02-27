import { negotiateContent } from '../src/lib/llmo-core/content-negotiator';
import { toMarkdown, toCLIString, toJsonLD } from '../src/lib/llmo-core/agent-transformers';
import { buildSEOMetadata } from '../src/lib/llmo-core/seo-metadata-builder';
import { Agent } from '../types';

type KVNamespace = {
  get: (key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream') => Promise<any>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
};

type PagesFunction<E> = (context: {
  request: Request;
  env: E;
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<any>) => void;
}) => Promise<Response>;

declare const HTMLRewriter: any;

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildSiteMeta(opts: { url: URL; path: string }) {
  const origin = `${opts.url.protocol}//${opts.url.host}`;
  const canonical = `${origin}${opts.path}`;

  const base = {
    siteName: 'YouAgent - Decentralized AI Discovery',
    ogImage: `${origin}/og.png`,
  };

  if (opts.path === '/' || opts.path === '') {
    return {
      title: 'YouAgent - Decentralized AI Discovery',
      description: 'Discover and evaluate AI agents. Browse, compare, and deploy capabilities across providers.',
      canonical,
      ...base,
    };
  }

  if (opts.path === '/discover') {
    return {
      title: 'YouAgent Discovery',
      description: 'Browse 1000+ Agents, compare capabilities, and find the right AI workflow for your mission.',
      canonical,
      ...base,
    };
  }

  if (opts.path === '/rankings') {
    return {
      title: 'RANKINGS // YouAgent',
      description: 'Global standings of top agents by NRI score and performance signals.',
      canonical,
      ...base,
    };
  }

  return {
    title: base.siteName,
    description: 'AI agent directory.',
    canonical,
    ...base,
  };
}

function renderBotHtml(meta: ReturnType<typeof buildSiteMeta>, bodyHtml: string) {
  const head = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(meta.siteName)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.ogImage)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.ogImage)}" />`,
  ].join('');

  return `<!doctype html><html lang="en"><head>${head}</head><body>${bodyHtml}</body></html>`;
}

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SYNAPSE_CACHE: KVNamespace;
}

function xmlEscape(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function getOrigin(url: URL) {
  return `${url.protocol}//${url.host}`;
}

function parsePositiveInt(raw: string | null, fallback: number) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const request = context.request;
  const env = context.env;

  const url = new URL(request.url);
  const path = url.pathname;

  const userAgent = request.headers.get('User-Agent') || '';
  const isBot = /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|discordbot|applebot|yandex|baiduspider|duckduckbot/i.test(
    userAgent
  );

  // --- Hard routes that must never fall back to SPA ---
  // 0) robots.txt
  if (path === '/robots.txt') {
    const origin = getOrigin(url);
    const body = [
      'User-agent: *',
      'Allow: /',
      `Sitemap: ${origin}/sitemap.xml`,
      '',
    ].join('\n');

    return new Response(body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // /sitemap.xml → Handled exclusively by functions/sitemap.xml.ts
  // Cloudflare Pages routes that file before this middleware, so this path
  // will never be reached for /sitemap.xml requests. Do NOT add logic here.

  // Sitemap shards for large datasets
  if (path.startsWith('/sitemap-') && path.endsWith('.xml')) {
    const match = path.match(/^\/sitemap-(\w+)-(\d+)\.xml$/);
    if (match) {
      const [, type, page] = match;
      const origin = getOrigin(url);
      const pageNum = parseInt(page, 10);

      const body = await generateSitemapShard(env, context.waitUntil, type, pageNum, origin);
      if (body) {
        return new Response(body, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=1800', // 30 min cache
          },
        });
      }
    }
  }

  if (isBot) {
    // Bot SEO: home page meta injection
    if (path === '/' || path === '') {
      const originResponse = await context.next();
      const meta = buildSiteMeta({ url, path: '/' });

      const metaTags = [
        `<meta name="description" content="${escapeHtml(meta.description)}" />`,
        `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="${escapeHtml(meta.siteName)}" />`,
        `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
        `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
        `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
        `<meta property="og:image" content="${escapeHtml(meta.ogImage)}" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
        `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
        `<meta name="twitter:image" content="${escapeHtml(meta.ogImage)}" />`,
      ].join('');

      const rewriter = new HTMLRewriter()
        .on('title', {
          element(element: any) {
            element.setInnerContent(meta.title);
          },
        })
        .on('head', {
          element(element: any) {
            element.append(metaTags, { html: true });
          },
        });

      return rewriter.transform(originResponse);
    }

    // Bot SEO: static templates for key SPA routes
    if (path === '/discover' || path === '/rankings') {
      const meta = buildSiteMeta({ url, path });

      const body =
        path === '/discover'
          ? `
<main>
  <h1>Discover AI Agents</h1>
  <p>${escapeHtml(meta.description)}</p>
  <p><a href="/">Home</a> | <a href="/rankings">Rankings</a> | <a href="/api/agents">Agents API</a></p>
</main>
          `.trim()
          : `
<main>
  <h1>Global Rankings</h1>
  <p>${escapeHtml(meta.description)}</p>
  <p><a href="/">Home</a> | <a href="/discover">Discover</a> | <a href="/api/agents">Agents API</a></p>
</main>
          `.trim();

      return new Response(renderBotHtml(meta, body), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // Bot SEO: /agents directory landing (real content + internal links)
    if (path === '/agents') {
      const origin = getOrigin(url);
      const agents = await fetchAllAgents(env, context.waitUntil);
      const meta = {
        ...buildSiteMeta({ url, path: '/agents' }),
        title: 'AGENTS // YouAgent',
        description: 'Browse the YouAgent agent directory. Follow links to agent detail pages for machine-readable data.',
        canonical: `${origin}/agents`,
      };

      const list = agents
        .map((a) => {
          const href = `/agent/${encodeURIComponent(a.id)}`;
          const desc = a.description || a.slogan || '';
          return `<li><a href="${href}">${escapeHtml(a.name || a.id)}</a> — ${escapeHtml(desc)}</li>`;
        })
        .join('');

      const body = `
<main>
  <h1>Agent Directory</h1>
  <p>${escapeHtml(meta.description)}</p>
  <p><a href="/api/agents">Agents API</a> | <a href="/llms.txt">LLMs Guide</a> | <a href="/sitemap.xml">Sitemap</a></p>
  <ul>${list}</ul>
</main>
      `.trim();

      return new Response(renderBotHtml(meta, body), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }
  }

  // 1. Static Route: /llms.txt for AI bots
  if (path === '/llms.txt') {
    const origin = getOrigin(url);
    const llmsTxt = `
# YouAgent - Decentralized AI Discovery
This site provides AI agents.
Primary machine-readable endpoints:
- ${origin}/api/agents (JSON)
- ${origin}/api/agent/{id} (JSON)

Human/SEO endpoints:
- ${origin}/agents
- ${origin}/agent/{id}

Content negotiation (for /agent/{id}):
- Accept: text/markdown
- Accept: application/ld+json
- Accept: application/json
    `.trim();

    return new Response(llmsTxt, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // 3. Proxy Route: /api/v1/proxy/execute
  if (path === '/api/v1/proxy/execute' && request.method === 'OPTIONS') {
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
  }

  if (path === '/api/v1/proxy/execute' && request.method === 'POST') {
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
          Vary: 'Origin',
        },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: { message: error.message || 'Proxy Error' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 5. List Agents Route: /api/agents (pagination + bot-friendly defaults)
  if (path === '/api/agents') {
    const params = url.searchParams;
    const limit = Math.min(parsePositiveInt(params.get('limit'), 50), 200);
    const page = Math.max(0, parsePositiveInt(params.get('page'), 0));
    const offset = Math.max(0, parsePositiveInt(params.get('offset'), page * limit));

    const agents = await fetchAgentsPage(env, context.waitUntil, { limit, offset });
    const payload = {
      items: agents,
      limit,
      offset,
      nextOffset: agents.length === limit ? offset + limit : null,
    };

    return new Response(JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=120',
      },
    });
  }

  // 4. Dynamic Route: /agent/[slug] or /api/agent/[slug]
  const agentMatch = path.match(/^\/(?:api\/)?agent\/([^/]+)$/);
  if (agentMatch) {
    const slug = agentMatch[1];

    // Human traffic should get the original SPA HTML (no SEO rewrite)
    if (!isBot && !path.startsWith('/api/')) {
      return context.next();
    }

    // Fetch data from Supabase/KV
    const agentData = await fetchAgentData(slug, env, context.waitUntil);

    if (!agentData) {
      return new Response('Agent Not Found', { status: 404 });
    }

    // Determine Client Intent
    const intent = negotiateContent(request.headers);

    switch (intent) {
      case 'MARKDOWN':
        return new Response(toMarkdown(agentData), {
          headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
        });

      case 'CLI':
        return new Response(toCLIString(agentData), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

      case 'JSON':
        return new Response(JSON.stringify(agentData), {
          headers: { 'Content-Type': 'application/json' },
        });

      case 'HTML':
      default: {
        // If it's an API call (starts with /api/), return JSON by default
        if (path.startsWith('/api/')) {
          return new Response(JSON.stringify(agentData), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Bots should receive a fully rendered HTML document (no-JS required)
        if (isBot) {
          const origin = getOrigin(url);
          const meta = {
            ...buildSiteMeta({ url, path: `/agent/${slug}` }),
            title: `${agentData.name || agentData.id} // YouAgent`,
            description: agentData.description || agentData.slogan || 'AI agent profile.',
            canonical: `${origin}/agent/${encodeURIComponent(agentData.id)}`,
          };
          const jsonLd = toJsonLD(agentData);
          const body = `
<main>
  <h1>${escapeHtml(agentData.name || agentData.id)}</h1>
  <p>${escapeHtml(agentData.slogan || '')}</p>
  <p>${escapeHtml(agentData.description || '')}</p>
  <p><a href="/agents">All agents</a> | <a href="/api/agent/${encodeURIComponent(agentData.id)}">JSON</a> | <a href="/agent/${encodeURIComponent(agentData.id)}" data-format="markdown">Markdown (Accept header)</a></p>
  <pre style="white-space:pre-wrap">${escapeHtml(JSON.stringify(jsonLd, null, 2))}</pre>
</main>
          `.trim();
          const html = renderBotHtml(meta, body).replace(
            '</head>',
            `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head>`
          );
          return new Response(html, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=300',
            },
          });
        }

        // Fetch the base HTML from Pages origin
        const originResponse = await context.next();

        // Use HTMLRewriter to inject SEO tags and JSON-LD
        const { title, metaTags } = buildSEOMetadata(agentData);
        const jsonLd = toJsonLD(agentData);

        const rewriter = new HTMLRewriter()
          .on('title', {
            element(element: any) {
              element.setInnerContent(title);
            },
          })
          .on('head', {
            element(element: any) {
              element.append(metaTags, { html: true });
              element.append(
                `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
                { html: true }
              );
            },
          });

        return rewriter.transform(originResponse);
      }
    }
  }

  // Human traffic: allow SPA to handle /agents (but bots are handled above)
  if (path === '/agents') {
    return context.next();
  }

  // Pass through all other requests
  return context.next();
};

async function getTotalAgentCount(env: Env, waitUntil: (promise: Promise<any>) => void): Promise<number> {
  const cacheKey = 'total_agent_count';

  if (env.SYNAPSE_CACHE) {
    const cached = await env.SYNAPSE_CACHE.get(cacheKey);
    if (cached) return parseInt(cached, 10);
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return 0;

  try {
    const sbUrl = `${env.SUPABASE_URL}/rest/v1/agents?select=count`;
    const response = await fetch(sbUrl, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
        Prefer: 'count=exact',
      },
    });

    if (!response.ok) return 0;

    const count = parseInt(response.headers.get('content-range')?.split('/')[1] || '0', 10);

    if (env.SYNAPSE_CACHE) {
      waitUntil(env.SYNAPSE_CACHE.put(cacheKey, count.toString(), { expirationTtl: 300 }));
    }

    return count;
  } catch {
    return 0;
  }
}

function generateSitemapIndex(origin: string, totalAgents: number): string {
  const AGENTS_PER_SITEMAP = 5000; // Google limit is 50K URLs per sitemap
  const totalPages = Math.ceil(totalAgents / AGENTS_PER_SITEMAP);

  const sitemaps = [
    { type: 'static', priority: '1.0' },
    { type: 'agents', priority: '0.8' },
  ];

  const sitemapEntries = sitemaps.flatMap(({ type, priority }) => {
    if (type === 'static') {
      return `<sitemap><loc>${origin}/sitemap-static-0.xml</loc><lastmod>${new Date().toISOString()}</lastmod><priority>${priority}</priority></sitemap>`;
    } else {
      const entries = [];
      for (let i = 0; i < totalPages; i++) {
        entries.push(
          `<sitemap><loc>${origin}/sitemap-agents-${i}.xml</loc><lastmod>${new Date().toISOString()}</lastmod><priority>${priority}</priority></sitemap>`
        );
      }
      return entries;
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('\n  ')}
</sitemapindex>`;
}

async function generateSitemapShard(
  env: Env,
  waitUntil: (promise: Promise<any>) => void,
  type: string,
  pageNum: number,
  origin: string
): Promise<string | null> {
  const AGENTS_PER_SITEMAP = 5000;
  const offset = pageNum * AGENTS_PER_SITEMAP;

  if (type === 'static') {
    // Static pages sitemap
    const staticUrls = [
      { loc: `${origin}/`, changefreq: 'daily', priority: '1.0' },
      { loc: `${origin}/discover`, changefreq: 'daily', priority: '0.9' },
      { loc: `${origin}/rankings`, changefreq: 'daily', priority: '0.9' },
      { loc: `${origin}/agents`, changefreq: 'daily', priority: '0.8' },
      { loc: `${origin}/api/agents`, changefreq: 'hourly', priority: '0.7' },
      { loc: `${origin}/llms.txt`, changefreq: 'weekly', priority: '0.5' },
    ];

    const urlset = staticUrls
      .map(
        url => `<url><loc>${xmlEscape(url.loc)}</loc><changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`
      )
      .join('\n  ');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlset}
</urlset>`;
  }

  if (type === 'agents') {
    // Agents sitemap shard
    const agents = await fetchAgentsPage(env, waitUntil, {
      limit: AGENTS_PER_SITEMAP,
      offset
    });

    if (agents.length === 0) return null;

    const urlset = agents
      .map(agent => {
        const nriScore = agent.nri_score || 0;
        const priority = nriScore > 1000 ? '0.8' :
          nriScore > 500 ? '0.7' : '0.6';
        const changefreq = nriScore > 1000 ? 'daily' : 'weekly';
        const lastMod = agent.external_stats?.last_crawled || new Date().toISOString();

        return `<url>
  <loc>${xmlEscape(`${origin}/agent/${encodeURIComponent(agent.id)}`)}</loc>
  <lastmod>${lastMod}</lastmod>
  <changefreq>${changefreq}</changefreq>
  <priority>${priority}</priority>
</url>`;
      })
      .join('\n  ');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlset}
</urlset>`;
  }

  return null;
}

async function fetchAllAgents(env: Env, waitUntil: (promise: Promise<any>) => void): Promise<Agent[]> {
  const cacheKey = 'all_agents_list';

  if (env.SYNAPSE_CACHE) {
    const cached = await env.SYNAPSE_CACHE.get(cacheKey, 'json');
    if (cached) return cached as Agent[];
  }

  // Fetch up to 5000 agents for the directory
  const agents = await fetchAgentsPage(env, waitUntil, { limit: 5000, offset: 0 });

  if (agents && env.SYNAPSE_CACHE) {
    waitUntil(env.SYNAPSE_CACHE.put(cacheKey, JSON.stringify(agents), { expirationTtl: 600 }));
  }

  return agents;
}

async function fetchAgentsPage(
  env: Env,
  waitUntil: (promise: Promise<any>) => void,
  opts: { limit: number; offset: number }
): Promise<Agent[]> {
  const limit = Math.max(1, Math.min(5000, Math.floor(opts.limit))); // Increased max limit to 5000
  const offset = Math.max(0, Math.floor(opts.offset));
  const cacheKey = `agents_page_${limit}_${offset}`;

  if (env.SYNAPSE_CACHE) {
    const cached = await env.SYNAPSE_CACHE.get(cacheKey, 'json');
    if (cached) return cached as Agent[];
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return [];

  try {
    // ⚡ OPERATION GOLDEN GATE: CRITICAL PAYLOAD REDUCTION
    // NEVER select 'embedding' (vector, massive) or 'full_description' (long text) in list view.
    // Only fetch fields required by Grid View and Discover View cards.
    const LIST_SELECT_FIELDS = [
      'id', 'name', 'slogan', 'category', 'nri_score', 'hot_score', 'entity_type',
      'tactical_badges', 'persona_img', 'video_poster', 'video_url',
      'slug', 'tags', 'capability_tags', 'theme_color',
      'metrics', 'stats', 'external_stats', 'connectivity',
      'specs', 'pricing_model', 'hardware_req',
      'benchmarks', 'market_analysis'
    ].join(',');
    const sbUrl = `${env.SUPABASE_URL}/rest/v1/agents?select=${LIST_SELECT_FIELDS}&order=hot_score.desc.nullslast&limit=${limit}&offset=${offset}`;
    const response = await fetch(sbUrl, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) return [];

    const agents = (await response.json()) as Agent[];

    if (agents && env.SYNAPSE_CACHE) {
      waitUntil(env.SYNAPSE_CACHE.put(cacheKey, JSON.stringify(agents), { expirationTtl: 120 }));
    }

    return agents;
  } catch (error) {
    return [];
  }
}

async function fetchAgentData(
  slug: string,
  env: Env,
  waitUntil: (promise: Promise<any>) => void
): Promise<Agent | null> {
  const cacheKey = `agent_data_${slug}`;

  if (env.SYNAPSE_CACHE) {
    const cached = await env.SYNAPSE_CACHE.get(cacheKey, 'json');
    if (cached) return cached as Agent;
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;

  // Fetch from Supabase
  let agent: Agent | null = null;
  try {
    // For single-agent detail: include full_description but still exclude embedding.
    const DETAIL_SELECT_FIELDS = [
      'id', 'name', 'slogan', 'description', 'full_description', 'category',
      'nri_score', 'hot_score', 'entity_type', 'tactical_badges', 'persona_img', 'video_poster',
      'video_url', 'slug', 'tags', 'capability_tags', 'theme_color',
      'metrics', 'stats', 'external_stats', 'connectivity', 'voice_config',
      'slogan_audio_url', 'neuralBreakdown', 'specs', 'system_prompts',
      'pricing_model', 'hardware_req', 'benchmarks', 'market_analysis'
    ].join(',');
    const sbUrl = `${env.SUPABASE_URL}/rest/v1/agents?id=eq.${encodeURIComponent(slug)}&select=${DETAIL_SELECT_FIELDS}`;
    const response = await fetch(sbUrl, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) return null;

    const results = (await response.json()) as any[];
    agent = results[0] || null;
  } catch {
    return null;
  }

  if (agent && env.SYNAPSE_CACHE) {
    waitUntil(env.SYNAPSE_CACHE.put(cacheKey, JSON.stringify(agent), { expirationTtl: 3600 }));
  }

  return agent;
}
