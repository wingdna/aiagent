/**
 * functions/sitemap.xml.ts
 * Cloudflare Pages Function — Dynamic Sitemap Generator
 *
 * Priority:  This file takes precedence over _middleware.ts for /sitemap.xml
 * Strategy:  For <= 5000 agents → single sitemap
 *            For >  5000 agents → sitemapindex pointing to shards handled by _middleware.ts
 */

// ─── Type Definitions ────────────────────────────────────────────────────────

interface KVNamespace {
    get(key: string, type?: 'text'): Promise<string | null>;
    get(key: string, type: 'json'): Promise<unknown>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SYNAPSE_CACHE?: KVNamespace;
}

interface PagesContext {
    request: Request;
    env: Env;
    next: () => Promise<Response>;
    waitUntil: (promise: Promise<unknown>) => void;
}

interface AgentRow {
    id: string;
    nri_score: number | null;
    updated_at: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATIC_PAGES = [
    { path: '/', priority: 1.0, changefreq: 'daily' },
    { path: '/discover', priority: 0.9, changefreq: 'daily' },
    { path: '/rankings', priority: 0.9, changefreq: 'daily' },
    { path: '/agents', priority: 0.8, changefreq: 'daily' },
    { path: '/api/agents', priority: 0.7, changefreq: 'hourly' },
    { path: '/llms.txt', priority: 0.5, changefreq: 'weekly' },
] as const;

/** Max agents to include in a single sitemap before switching to sitemapindex */
const SINGLE_SITEMAP_LIMIT = 5000;

/** KV cache TTL for the full sitemap (seconds) */
const SITEMAP_CACHE_TTL = 3600;

/** Google/Bing recommended max agents per shard */
const SHARD_SIZE = 5000;

// ─── Main Handler ─────────────────────────────────────────────────────────────

export const onRequest = async (context: PagesContext): Promise<Response> => {
    const { env, waitUntil } = context;
    const url = new URL(context.request.url);
    const origin = url.hostname === 'localhost' || url.hostname === '127.0.0.1' 
        ? `${url.protocol}//${url.host}` 
        : 'https://youagent.top';

    // ── 1. Try KV cache first ──────────────────────────────────────────────────
    const cacheKey = `sitemap_xml_v2_${origin}`;
    if (env.SYNAPSE_CACHE) {
        const cached = await env.SYNAPSE_CACHE.get(cacheKey, 'text');
        if (cached) {
            return xmlResponse(cached);
        }
    }

    // ── 2. Fetch agents from Supabase (minimal fields only) ───────────────────
    const agents = await fetchAgentsForSitemap(env);

    // ── 3. Decide: single sitemap or sitemapindex ──────────────────────────────
    let body: string;
    if (agents.length <= SINGLE_SITEMAP_LIMIT) {
        body = buildSingleSitemap(origin, agents);
    } else {
        body = buildSitemapIndex(origin, agents.length);
    }

    // ── 4. Store in KV cache (non-blocking) ───────────────────────────────────
    if (env.SYNAPSE_CACHE) {
        waitUntil(
            env.SYNAPSE_CACHE.put(cacheKey, body, { expirationTtl: SITEMAP_CACHE_TTL })
        );
    }

    return xmlResponse(body);
};

// ─── Sitemap Builders ────────────────────────────────────────────────────────

/**
 * Build a single <urlset> sitemap.
 * Deduplication is guaranteed by using a Map<id, AgentRow> before rendering.
 */
function buildSingleSitemap(origin: string, agents: AgentRow[]): string {
    const today = isoDate(new Date().toISOString());

    // Static pages
    const staticEntries = STATIC_PAGES.map(({ path, priority, changefreq }) =>
        urlEntry({
            loc: `${origin}${path}`,
            lastmod: today,
            changefreq,
            priority,
        })
    );

    // Agent pages — deduplicated by id
    const seen = new Map<string, AgentRow>();
    for (const agent of agents) {
        if (agent.id && !seen.has(agent.id)) {
            seen.set(agent.id, agent);
        }
    }

    const agentEntries = Array.from(seen.values()).map((agent) => {
        const priority = calcPriority(agent.nri_score);
        const lastmod = isoDate(agent.updated_at ?? new Date().toISOString());
        const changefreq = priority >= 0.8 ? 'daily' : 'weekly';

        return urlEntry({
            loc: `${origin}/agent/${encodeURIComponent(agent.id)}`,
            lastmod,
            changefreq,
            priority,
        });
    });

    return xmlDoc(
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        `  ${[...staticEntries, ...agentEntries].join('\n  ')}\n` +
        `</urlset>`
    );
}

/**
 * Build a <sitemapindex> for datasets larger than SINGLE_SITEMAP_LIMIT.
 * Shard URLs (/sitemap-agents-N.xml, /sitemap-static-0.xml) are
 * served by the existing shard logic in _middleware.ts.
 */
function buildSitemapIndex(origin: string, totalAgents: number): string {
    const now = new Date().toISOString();
    const totalShards = Math.ceil(totalAgents / SHARD_SIZE);

    const entries: string[] = [
        `<sitemap><loc>${xmlEscape(`${origin}/sitemap-static-0.xml`)}</loc><lastmod>${now}</lastmod></sitemap>`,
    ];

    for (let i = 0; i < totalShards; i++) {
        entries.push(
            `<sitemap><loc>${xmlEscape(`${origin}/sitemap-agents-${i}.xml`)}</loc><lastmod>${now}</lastmod></sitemap>`
        );
    }

    return xmlDoc(
        `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        `  ${entries.join('\n  ')}\n` +
        `</sitemapindex>`
    );
}

// ─── Supabase Fetch ───────────────────────────────────────────────────────────

/**
 * Fetch only the fields required for sitemap generation.
 * Uses a single paginated request; 5000 rows is well within CF Worker memory.
 */
async function fetchAgentsForSitemap(env: Env): Promise<AgentRow[]> {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return [];

    // Select only what we need; order by nri_score desc so highest-value agents
    // appear first in case we need to truncate.
    const url =
        `${env.SUPABASE_URL}/rest/v1/agents` +
        `?select=id%2Cnri_score%2Cupdated_at` +
        `&order=hot_score.desc.nullslast` +
        `&limit=${SINGLE_SITEMAP_LIMIT}`;

    try {
        const response = await fetch(url, {
            headers: {
                apikey: env.SUPABASE_ANON_KEY,
                Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`[sitemap] Supabase error ${response.status}: ${await response.text()}`);
            return [];
        }

        const rows = (await response.json()) as AgentRow[];
        return Array.isArray(rows) ? rows : [];
    } catch (err) {
        console.error('[sitemap] fetch failed:', err);
        return [];
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Calculate <priority> from nri_score. Clamped to [0.5, 0.9]. */
function calcPriority(nri_score: number | null | undefined): number {
    if (!nri_score || nri_score <= 0) return 0.5;
    const raw = nri_score / 100;
    return Math.round(Math.min(0.9, Math.max(0.5, raw)) * 10) / 10;
}

/** Extract YYYY-MM-DD from an ISO string (for <lastmod>). */
function isoDate(iso: string): string {
    try {
        return new Date(iso).toISOString().split('T')[0];
    } catch {
        return new Date().toISOString().split('T')[0];
    }
}

/** Build a single <url> block. */
function urlEntry({
    loc,
    lastmod,
    changefreq,
    priority,
}: {
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: number;
}): string {
    return (
        `<url>` +
        `<loc>${xmlEscape(loc)}</loc>` +
        `<lastmod>${lastmod}</lastmod>` +
        `<changefreq>${changefreq}</changefreq>` +
        `<priority>${priority.toFixed(1)}</priority>` +
        `</url>`
    );
}

/** Wrap content in XML declaration. */
function xmlDoc(content: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>\n${content}`;
}

/** Escape special XML characters. */
function xmlEscape(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/** Return a well-formed XML Response with correct headers. */
function xmlResponse(body: string): Response {
    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'X-Robots-Tag': 'noindex',        // prevent the sitemap page itself from being indexed
        },
    });
}
