import { PagesFunction, Env } from './_shared/types';
import { isBotRequest } from './_shared/botDetector';
import { fetchAgentData } from './_shared/agentDataService';
import { generateGhostHtml, handleGhostRequest, generateAgentMeta } from './_shared/ghostRenderer';
import { negotiateContent } from '../lib/llmo-core/content-negotiator';
import { toMarkdown, toCLIString } from '../lib/llmo-core/agent-transformers';

function getOrigin(url: URL) {
  return `${url.protocol}//${url.host}`;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env, waitUntil } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // ACTION 2: MIDDLEWARE FIX - Ignore API paths and React Router data requests
  if (path.startsWith('/api/') || path.endsWith('.data')) return next();

  // Handle agent routes for bots and normal users
  // [SHADOW_PROTOCOL] Edge Hijack & Route Hardening
  const agentMatch = path.match(/^\/agent\/([^/]+)/);
  if (agentMatch) {
    let slug = agentMatch[1];
    try {
        slug = decodeURIComponent(slug);
    } catch (e) {
        // ignore
    }

    // [SLUG_RENAISSANCE] 301 Redirect Protocol
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
    
    if (isUUID) {
        try {
            // We need to fetch the agent to get the slug.
            // We use a short timeout to not block too long.
            const agent = await fetchAgentData(slug, env, waitUntil, AbortSignal.timeout(2000));
            if (agent && agent.slug) {
                return Response.redirect(`${getOrigin(url)}/agent/${agent.slug}`, 301);
            }
        } catch (e) {
            // Ignore error, proceed to normal handling
        }
    }
    
    if (isBotRequest(request)) {
      // [SHADOW_PROTOCOL] Bot detected: Serve SSR content (Ghost Protocol)
      try {
        // [APEX_STRIKE] 5000ms Absolute Guillotine
        const timeoutSignal = AbortSignal.timeout(5000);
        
        // We pass the timeout signal directly to fetchAgentData to prevent resource leaks
        const agentPromise = fetchAgentData(slug, env, waitUntil, timeoutSignal);
        const timeoutPromise = new Promise((_, reject) => {
            timeoutSignal.addEventListener('abort', () => reject(new Error('TimeoutError')));
        });
        
        const agent = await Promise.race([agentPromise, timeoutPromise]) as any;
        
        if (!agent) {
          return new Response("Agent Not Found", { status: 404 });
        }

        const intent = negotiateContent(request.headers);
        switch (intent) {
          case 'CLI':
            return new Response(toCLIString(agent), {
              headers: { 
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Robots-Tag': 'index, follow'
              },
            });
          case 'JSON':
            return new Response(JSON.stringify(agent), {
              headers: { 
                'Content-Type': 'application/json',
                'X-Robots-Tag': 'index, follow'
              },
            });
          case 'MARKDOWN':
          case 'HTML':
          default:
            return handleGhostRequest(agent, request, intent);
        }
      } catch (error: any) {
        // [APEX_STRIKE] 503 Tactical Degradation
        console.error("[GHOST_PROTOCOL] Edge Timeout or Failure:", error);
        const fallbackHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>YouAgent OS - System Overloaded</title>
          </head>
          <body style="background:#000; color:#0f0; font-family:monospace; padding:2rem;">
              <h1>[503] SYSTEM OVERLOADED</h1>
              <p>The neural uplink is currently saturated. Please retry later.</p>
          </body>
          </html>
        `;
        return new Response(fallbackHtml, {
          status: 503,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Retry-After': '3600'
          }
        });
      }
    } else {
      // [SHADOW_PROTOCOL] User detected: Serve SPA with Optimistic Ghost Snippet
      const response = await next();
      const agent = await fetchAgentData(slug, env, waitUntil);
      
      if (agent) {
          const { metaTags, jsonLdScript, proxiedCover } = generateAgentMeta(agent);
          
          const ghostSnippet = `
            <div style="background:#050505; color:#00F0FF; font-family:monospace; padding: 20px;">
                <h1>${agent.name}</h1>
                <h2>${agent.slogan || ''}</h2>
                <img src="${proxiedCover}" alt="${agent.name} preview" style="max-width: 100%; height: auto;" />
                <p>${agent.description}</p>
                <ul>
                  <li>Authority Score (NRI): ${agent.metrics?.nri_score}</li>
                  <li>Kinetic Heat: ${agent.metrics?.hot_score}</li>
                  <li>Type: ${agent.entity_type}</li>
                </ul>
            </div>
          `;

          const transformed = new HTMLRewriter()
            .on('head', {
              element(element) {
                element.append(metaTags, { html: true });
                element.append(jsonLdScript, { html: true });
              }
            })
            .on('title', {
              element(element) {
                element.remove(); // Remove existing title to avoid duplicates
              }
            })
            .on('meta[name="description"]', {
              element(element) {
                element.remove();
              }
            })
            .on('meta[property^="og:"]', {
              element(element) {
                element.remove();
              }
            })
            .on('meta[name="twitter:card"]', {
              element(element) {
                element.remove();
              }
            })
            .on('div#root', {
              element(element) {
                element.setInnerContent(ghostSnippet, { html: true });
              }
            })
            .transform(response);
            
          const newHeaders = new Headers(transformed.headers);
          newHeaders.set('Content-Type', 'text/html; charset=utf-8');
          // Add a short cache control for the SPA shell to prevent stale ghost snippets
          newHeaders.set('Cache-Control', 'public, max-age=3600');
          
          // 强制清除并覆盖 X-Robots-Tag
          newHeaders.delete('x-robots-tag');
          newHeaders.set('X-Robots-Tag', 'index, follow');
          
          return new Response(transformed.body, {
            status: transformed.status,
            statusText: transformed.statusText,
            headers: newHeaders
          });
        }
        return response;
      }
    }

  // Pass through to file-based routing (functions/...) or static assets
  const response = await next();

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const canonicalUrl = `https://youagent.top${path}`;
    
    let transformed = new HTMLRewriter()
      .on('link[rel="canonical"]', {
        element(element) {
          element.remove();
        }
      })
      .on('head', {
        element(element) {
          element.append(`<link rel="canonical" href="${canonicalUrl}" />`, { html: true });
        }
      })
      .transform(response);

    // ACTION 4: LIST SCHEMA FOR HOMEPAGE
    if (path === '/' && isBotRequest(request)) {
      const schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "url": "https://youagent.top/discover",
            "name": "Discover AI Agents"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "url": "https://youagent.top/rankings",
            "name": "Top Ranked Agents"
          }
        ]
      };

      transformed = new HTMLRewriter()
        .on('head', {
          element(element) {
            element.append(`<script type="application/ld+json">${JSON.stringify(schema)}</script>`, { html: true });
          }
        })
        .transform(transformed);
    }

    const newHeaders = new Headers(transformed.headers);
    newHeaders.set('Content-Type', 'text/html; charset=utf-8');
    
    // 强制清除并覆盖 X-Robots-Tag
    newHeaders.delete('x-robots-tag');
    newHeaders.set('X-Robots-Tag', 'index, follow');

    return new Response(transformed.body, {
      status: transformed.status,
      statusText: transformed.statusText,
      headers: newHeaders
    });
  }

  return response;
};
