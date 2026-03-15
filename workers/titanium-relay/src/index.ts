/**
 * 🛑 IRON SHIELD PROTOCOL: TITANIUM RELAY 🛑
 * Cloudflare Worker API Gateway.
 * Intercepts requests, negotiates content, and transforms responses.
 */

import { handleEmbedRoute } from './routes/embed';
import { handleTokenRoute } from './routes/token';
import { handleExecuteRoute } from './routes/execute';
import { handleAgentRoute } from './routes/agent';
import { handleAgentsRoute } from './routes/agents';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SYNAPSE_CACHE: KVNamespace;
  SILICONFLOW_API_KEY?: string;
  JWT_SECRET?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Static Route: /llms.txt for AI bots
    if (path === '/llms.txt') {
      const llmsTxt = `
# YouAgent Agent Directory
This site provides AI agents.
To access agent data in markdown format, append \`/md\` to the agent URL or send an \`Accept: text/markdown\` header.
Example: /agent/gpt-4o -> Returns markdown for GPT-4o.
      `.trim();
      return new Response(llmsTxt, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // 2. Proxy Route: /api/v1/proxy/embed
    if (path === '/api/v1/proxy/embed') {
      return handleEmbedRoute(request, env, ctx);
    }

    // 3. Proxy Route: /api/v1/proxy/token (Ephemeral JWT Generation)
    if (path === '/api/v1/proxy/token') {
      return handleTokenRoute(request, env);
    }

    // 4. Proxy Route: /api/v1/proxy/execute
    if (path === '/api/v1/proxy/execute') {
      return handleExecuteRoute(request, env);
    }

    // 5. Dynamic Route: /agent/[slug] or /api/agent/[slug]
    const agentMatch = path.match(/^\/(?:api\/)?agent\/([^/]+)$/);
    if (agentMatch) {
      return handleAgentRoute(request, env, ctx, agentMatch);
    }

    // 6. List Agents Route: /api/agents
    if (path === '/api/agents') {
      return handleAgentsRoute(request, env, ctx);
    }

    // Pass through all other requests
    return fetch(request);
  }
};
