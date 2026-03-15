
/**
 * PURE CORE: Content Negotiation Logic
 * Platform-Agnostic: Works in Node.js, Cloudflare Workers, Deno, or Browser.
 * 
 * Determines the "Intent" of the request based on User-Agent and Accept headers.
 * Priority:
 * 1. Explicit Accept Header (text/markdown, application/json)
 * 2. User-Agent Detection (CLI tools, AI Bots)
 * 3. Default (HTML)
 */

export type ContentIntent = 'HTML' | 'MARKDOWN' | 'CLI' | 'JSON';

export function negotiateContent(headers: Headers): ContentIntent {
  const userAgent = (headers.get('user-agent') || '').toLowerCase();
  const accept = (headers.get('accept') || '').toLowerCase();

  // 1. Explicit Accept Headers
  if (accept.includes('application/json')) return 'JSON';
  if (accept.includes('text/markdown') || accept.includes('text/x-markdown')) return 'MARKDOWN';

  // 2. CLI Tools (Curl, Wget, HTTPie)
  // These users usually want a clean, terminal-friendly text output
  if (
    userAgent.includes('curl') || 
    userAgent.includes('wget') || 
    userAgent.includes('httpie') ||
    userAgent.includes('xh')
  ) {
    return 'CLI';
  }

  // 3. AI Bots & LLM Crawlers
  // These entities prefer structured Markdown for RAG (Retrieval Augmented Generation)
  if (
    userAgent.includes('gptbot') ||
    userAgent.includes('chatgpt-user') ||
    userAgent.includes('google-extended') ||
    userAgent.includes('anthropic-ai') ||
    userAgent.includes('claude-web') ||
    userAgent.includes('facebookexternalhit') || // Often used by previews
    userAgent.includes('twitterbot') // Often used by previews
  ) {
    return 'MARKDOWN';
  }

  // 4. Default to HTML for browsers
  return 'HTML';
}
