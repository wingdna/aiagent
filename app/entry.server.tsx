import { ServerRouter } from "react-router";
// @ts-ignore
import { renderToReadableStream } from "react-dom/server.browser";

export default async function handleRequest(request: Request, responseStatusCode: number, responseHeaders: Headers, routerContext: any) {
  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    { signal: request.signal }
  );
  const headers: Record<string, string> = { "Content-Type": "text/html", ...Object.fromEntries(responseHeaders) };
  
  // 强制清除任何可能被注入的 noindex，并显式设置为 index, follow
  delete headers['x-robots-tag'];
  delete headers['X-Robots-Tag'];
  
  const url = new URL(request.url);
  if (url.searchParams.has('page') || url.searchParams.has('category')) {
    headers['X-Robots-Tag'] = 'noindex, follow';
  } else {
    headers['X-Robots-Tag'] = 'index, follow';
  }

  if (request.method === 'GET') {
    headers['Cache-Control'] = 'public, s-maxage=60, stale-while-revalidate=300';
  }
  return new Response(stream, {
    status: responseStatusCode,
    headers
  });
}
