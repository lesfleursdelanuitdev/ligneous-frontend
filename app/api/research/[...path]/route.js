import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { checkTreeAccessForProxy } from '@/lib/tree-access';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5001';

async function proxy(request, { params }, method) {
  const { user, response } = await requireAuth(request);
  if (response) return response;

  const segments = (await params).path;
  const path = segments.join('/');

  // For tree-scoped paths (trees/<tree_id>/...), verify tree access
  if (segments[0] === 'trees' && segments[1]) {
    const treeId = segments[1];
    const hasAccess = await checkTreeAccessForProxy(user.id, treeId, 'read');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  const qs = request.nextUrl.searchParams.toString();
  const url = `${PYTHON_API_URL}/api/research/${path}${qs ? `?${qs}` : ''}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': user.id,
  };

  const fetchOpts = { method, headers };

  if (method !== 'GET' && method !== 'HEAD') {
    try {
      fetchOpts.body = await request.text();
    } catch {
      // no body
    }
  }

  try {
    const res = await fetch(url, fetchOpts);
    let data;
    try {
      data = await res.json();
    } catch {
      data = { error: res.statusText || 'Invalid response from research API' };
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const debug = {
      url,
      code: err?.code,
      message: err?.message,
      cause: err?.cause?.message,
    };
    console.error('[research proxy]', JSON.stringify(debug, null, 2));
    const isConnectionRefused = err?.code === 'ECONNREFUSED' || err?.message?.includes('ECONNREFUSED');
    const isNetworkError = err?.code === 'ENOTFOUND' || err?.code === 'ETIMEDOUT' || err?.message?.includes('fetch failed');
    let message = 'Research API unavailable';
    if (isConnectionRefused) {
      message = 'Research API is not running. Start it with: cd ligneous-python-api && python run.py';
    } else if (isNetworkError) {
      message = `Cannot reach Research API at ${PYTHON_API_URL}. Is it running? Check PYTHON_API_URL if using Docker or a different host.`;
    }
    return NextResponse.json(
      { error: message, _debug: process.env.NODE_ENV === 'development' ? debug : undefined },
      { status: 502 },
    );
  }
}

export async function GET(request, ctx) {
  return proxy(request, ctx, 'GET');
}

export async function POST(request, ctx) {
  return proxy(request, ctx, 'POST');
}

export async function PUT(request, ctx) {
  return proxy(request, ctx, 'PUT');
}

export async function DELETE(request, ctx) {
  return proxy(request, ctx, 'DELETE');
}
