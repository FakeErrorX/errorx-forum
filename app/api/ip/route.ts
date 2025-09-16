import { NextRequest } from 'next/server';
import { createSecureResponse } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

function getFirstIp(value: string | null): string | null {
  if (!value) return null;
  // X-Forwarded-For may contain a list: client, proxy1, proxy2
  const first = value.split(',')[0]?.trim();
  return first || null;
}

function resolveClientIp(request: NextRequest) {
  const headers = request.headers;

  const headerOrder: Array<{ name: string; getter: () => string | null }> = [
    { name: 'cf-connecting-ip', getter: () => headers.get('cf-connecting-ip') },
    { name: 'x-real-ip', getter: () => headers.get('x-real-ip') },
    { name: 'x-client-ip', getter: () => headers.get('x-client-ip') },
    { name: 'x-forwarded-for', getter: () => getFirstIp(headers.get('x-forwarded-for')) },
    { name: 'true-client-ip', getter: () => headers.get('true-client-ip') },
    { name: 'fastly-client-ip', getter: () => headers.get('fastly-client-ip') },
    { name: 'x-cluster-client-ip', getter: () => headers.get('x-cluster-client-ip') },
    { name: 'forwarded', getter: () => {
      const f = headers.get('forwarded');
      // forwarded: for=192.0.2.60;proto=http;by=203.0.113.43
      if (!f) return null;
      const match = /for=\"?\[?([a-fA-F0-9:.]+)\]?\"?/i.exec(f);
      return match?.[1] || null;
    } },
  ];

  let ip: string | null = null;
  let source: string | null = null;

  for (const h of headerOrder) {
    const val = h.getter();
    if (val) {
      ip = val;
      source = h.name;
      break;
    }
  }

  // Fallbacks
  if (!ip) {
    // Next.js may expose an experimental ip header
    ip = headers.get('x-vercel-proxied-for') || null;
    source = ip ? 'x-vercel-proxied-for' : null;
  }

  // Build a minimal response payload including raw values for debugging
  const allHeaders = {
    'cf-connecting-ip': headers.get('cf-connecting-ip') || undefined,
    'x-real-ip': headers.get('x-real-ip') || undefined,
    'x-client-ip': headers.get('x-client-ip') || undefined,
    'x-forwarded-for': headers.get('x-forwarded-for') || undefined,
    'true-client-ip': headers.get('true-client-ip') || undefined,
    'fastly-client-ip': headers.get('fastly-client-ip') || undefined,
    'x-cluster-client-ip': headers.get('x-cluster-client-ip') || undefined,
    forwarded: headers.get('forwarded') || undefined,
    'x-vercel-proxied-for': headers.get('x-vercel-proxied-for') || undefined,
  } as const;

  return { ip: ip || null, source, headers: allHeaders };
}

export async function GET(request: NextRequest) {
  const data = resolveClientIp(request);
  return createSecureResponse(data);
}


