import { Agent } from '../../types';

export const generateAgentMeta = (agent: Agent) => {
  const vendorName = agent.vendor?.name || "YouAgent Network";
  const pageTitle = `${agent.name} - AI Agent Specs & Neural Uplink | YouAgent`;
  
  let rawDesc = agent.description || agent.slogan || `Explore detailed specifications for ${agent.name}.`;
  const pageDesc = rawDesc.length > 160 ? rawDesc.substring(0, 160) + '...' : rawDesc;
  
  const fallbackImage = "https://youagent.top/assets/default_og.png"; 
  const coverUrl = agent.cover_url || fallbackImage;
  const proxiedCover = `/api/v1/img-proxy?url=${encodeURIComponent(coverUrl)}&w=800&q=80`;
  const videoUrl = agent.video_url || "";

  // Strict Sanitization
  const sanitizeValue = (val: any): any => {
      if (val === undefined || val === null) return "";
      if (Array.isArray(val)) {
          return val.map(v => sanitizeValue(v)).join(', ');
      }
      if (typeof val === 'object') {
          if (val.type) return val.type;
          if (val.name) return val.name;
          return "";
      }
      if (typeof val === 'string') {
          return val.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      return val;
  };

  const metaTags = `
    <title>${sanitizeValue(pageTitle)}</title>
    <meta name="description" content="${sanitizeValue(pageDesc)}" />
    <meta property="og:title" content="${sanitizeValue(pageTitle)}" />
    <meta property="og:description" content="${sanitizeValue(pageDesc)}" />
    <meta property="og:image" content="${sanitizeValue(proxiedCover)}" />
    ${videoUrl ? `<meta property="og:video" content="${sanitizeValue(videoUrl)}" />` : ''}
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="https://youagent.top/agent/${agent.slug || agent.id}" />
    <link rel="preload" as="image" href="${sanitizeValue(proxiedCover)}" fetchpriority="high" />
  `;

  // Schema.org Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": sanitizeValue(agent.name),
    "description": sanitizeValue(pageDesc),
    "url": `https://youagent.top/agent/${agent.slug || agent.id}`,
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web/API",
    "author": { "@type": "Organization", "name": sanitizeValue(vendorName) },
    "aggregateRating": agent.metrics?.nri_score ? {
      "@type": "AggregateRating",
      "ratingValue": sanitizeValue((agent.metrics.nri_score / 200).toFixed(1)),
      "ratingCount": sanitizeValue(Math.floor((agent.metrics.nri_score || 900) * 1.2))
    } : undefined,
    "image": sanitizeValue(proxiedCover),
    "video": videoUrl ? sanitizeValue(videoUrl) : undefined
  };

  // Remove undefined fields
  Object.keys(jsonLd).forEach(key => {
      if ((jsonLd as any)[key] === undefined) {
          delete (jsonLd as any)[key];
      }
  });

  const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  return {
    metaTags,
    jsonLdScript,
    pageTitle,
    pageDesc,
    proxiedCover
  };
};

export const generateGhostHtml = (agent: Agent): string => {
  const { metaTags, jsonLdScript, proxiedCover } = generateAgentMeta(agent);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        ${metaTags}
        <!-- LLM/Bot Neural Sync (JSON-LD) -->
        ${jsonLdScript}
    </head>
    <body style="background:#050505; color:#00F0FF; font-family:monospace;">
        <h1>${agent.name}</h1>
        <h2>${agent.slogan || ''}</h2>
        <img src="${proxiedCover}" alt="${agent.name} preview" />
        <p>${agent.description}</p>
        <ul>
          <li>Authority Score (NRI): ${agent.metrics?.nri_score}</li>
          <li>Kinetic Heat: ${agent.metrics?.hot_score}</li>
          <li>Type: ${agent.entity_type}</li>
        </ul>
    </body>
    </html>
  `;
};

export const handleGhostRequest = (agent: Agent, request: Request, intent?: string): Response => {
  const accept = request.headers.get('Accept') || '';
  
  if (intent === 'MARKDOWN' || accept.includes('text/markdown')) {
    const markdown = `
# ${agent.name}
> ${agent.slogan || ''}

## Technical Specs
- NRI Score: ${agent.metrics?.nri_score || 'N/A'}
- Entity Type: ${agent.entity_type || 'N/A'}
- Context Window: ${agent.specs?.context_window || 'N/A'}

## Description
${agent.full_description || agent.description || ''}
    `.trim();

    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Robots-Tag': 'index, follow'
      },
    });
  }

  const html = generateGhostHtml(agent);
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'index, follow'
    },
  });
};
