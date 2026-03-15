import { negotiateContent } from '../../../../lib/llmo-core/content-negotiator';
import { toMarkdown, toCLIString, toJsonLD } from '../../../../lib/llmo-core/agent-transformers';
import { buildSEOMetadata } from '../../../../lib/llmo-core/seo-metadata-builder';
import { Env } from '../index';
import { fetchAgentData } from '../utils/db';

export async function handleAgentRoute(request: Request, env: Env, ctx: ExecutionContext, match: RegExpMatchArray): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const slug = match[1];

    // Fetch data from Supabase/KV
    const agentData = await fetchAgentData(slug, env, ctx);

    if (!agentData) {
        return new Response('Agent Not Found', { status: 404 });
    }

    // Determine Client Intent
    const intent = negotiateContent(request.headers);

    switch (intent) {
        case 'MARKDOWN':
            return new Response(toMarkdown(agentData), {
                headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
            });

        case 'CLI':
            return new Response(toCLIString(agentData), {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });

        case 'JSON':
            return new Response(JSON.stringify(agentData), {
                headers: { 'Content-Type': 'application/json' }
            });

        case 'HTML':
        default:
            // If it's an API call (starts with /api/), return JSON by default
            if (path.startsWith('/api/')) {
                return new Response(JSON.stringify(agentData), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Fetch the base HTML (e.g., from Vite dev server or static assets)
            // For this worker, we assume the origin serves the base HTML.
            const originResponse = await fetch(request);

            // Use HTMLRewriter to inject SEO tags and JSON-LD
            const { title, metaTags } = buildSEOMetadata(agentData);
            const jsonLd = toJsonLD(agentData);

            const rewriter = new HTMLRewriter()
                .on('title', {
                    element(element) {
                        element.setInnerContent(title);
                    }
                })
                .on('head', {
                    element(element) {
                        element.append(metaTags, { html: true });
                        element.append(`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`, { html: true });
                    }
                });

            return rewriter.transform(originResponse);
    }
}
