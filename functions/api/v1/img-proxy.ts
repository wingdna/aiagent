type PagesFunction<E = any> = (context: {
  request: Request;
  env: E;
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<any>) => void;
}) => Promise<Response>;

export const onRequest: PagesFunction = async (context) => {
  const request = context.request;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');
  const widthParam = url.searchParams.get('w');
  const width = widthParam ? parseInt(widthParam, 10) : 800;

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    // Basic validation to prevent SSRF or abuse
    const parsedTarget = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsedTarget.protocol)) {
      return new Response('Invalid protocol', { status: 400 });
    }

    // Use Cloudflare Image Resizing via fetch cf object
    const response = await fetch(targetUrl, {
      cf: {
        image: {
          width: width,
          format: 'auto' as any, // Automatically converts to WebP/AVIF based on Accept header
          fit: 'scale-down'
        }
      },
      headers: {
        'User-Agent': 'YouAgent-ImageProxy/1.0',
        'Accept': request.headers.get('Accept') || 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      return new Response('Failed to fetch image', { status: response.status });
    }

    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    
    // Only allow image content types
    if (!contentType.startsWith('image/')) {
      return new Response('Invalid content type', { status: 400 });
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    return new Response('Error fetching image', { status: 500 });
  }
};
