import { NextRequest } from 'next/server';

const ALLOWED_HOSTS = new Set([
  'upload.wikimedia.org',
]);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const target = url.searchParams.get('u');
  if (!target) {
    return new Response('Missing url', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new Response('Host not allowed', { status: 403 });
  }

  const upstream = await fetch(parsed.toString(), {
    redirect: 'follow',
    headers: {
      'User-Agent': 'autoquiz/1.0',
      'Accept': 'image/*',
    },
    cache: 'force-cache',
  });

  if (!upstream.ok) {
    return new Response('Upstream error', { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') || 'image/svg+xml';
  const body = await upstream.arrayBuffer();

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
