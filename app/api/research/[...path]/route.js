import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5001';

async function proxy(request, { params }, method) {
  const { user, response } = await requireAuth(request);
  if (response) return response;

  const segments = (await params).path;
  const path = segments.join('/');
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
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[research proxy]', err.message);
    return NextResponse.json(
      { error: 'Research API unavailable' },
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
