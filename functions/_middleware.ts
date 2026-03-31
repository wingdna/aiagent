import { PagesFunction, Env } from './_shared/types';
import { isBotRequest } from './_shared/botDetector';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);
  let path = url.pathname;

  // 1. 规范化路径：移除末尾斜杠（根路径 / 除外）
  if (path.length > 1 && path.endsWith('/')) {
    const cleanPath = path.slice(0, -1);
    const search = url.search;
    return Response.redirect(`${url.origin}${cleanPath}${search}`, 301);
  }

  // 严禁路由干预：直接透传给 React Router v7 SSR 核心
  const response = await next();
  const contentType = response.headers.get('content-type') || '';
  
  // 仅对 SSR 产生的 HTML 进行 SEO 增强，严禁修改任何非 HTML 资源
  if (contentType.includes('text/html')) {
    // 2. 规范化 Canonical URL：确保不包含末尾斜杠
    const canonicalPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
    const canonicalUrl = `https://youagent.top${canonicalPath}`;
    
    let transformed = new HTMLRewriter()
      .on('link[rel="canonical"]', {
        element(element) { element.remove(); }
      })
      .on('head', {
        element(element) {
          element.append(`<link rel="canonical" href="${canonicalUrl}" />`, { html: true });
        }
      })
      .transform(response);

    // 仅在首页注入 Schema
    if (path === '/' && isBotRequest(request)) {
      const schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "url": "https://youagent.top/discover", "name": "Discover AI Agents" },
          { "@type": "ListItem", "position": 2, "url": "https://youagent.top/rankings", "name": "Top Ranked Agents" }
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
    newHeaders.delete('Content-Encoding');
    newHeaders.delete('Content-Length');
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
