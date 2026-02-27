/**
 * GET /api/research/connectivity
 * Diagnostic endpoint to verify the Python research API is reachable.
 * No auth required for easier debugging.
 */
import { NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5001';

export async function GET() {
  const healthUrl = `${PYTHON_API_URL}/api/health`;
  try {
    const res = await fetch(healthUrl, { method: 'GET' });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({
      ok: res.ok,
      pythonApiReachable: true,
      pythonApiUrl: PYTHON_API_URL,
      healthUrl,
      status: res.status,
      pythonApiResponse: data,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      pythonApiReachable: false,
      pythonApiUrl: PYTHON_API_URL,
      healthUrl,
      error: {
        code: err?.code,
        message: err?.message,
        cause: err?.cause?.message,
      },
      hint: err?.code === 'ECONNREFUSED'
        ? 'Python API is not running. Start it: cd ligneous-python-api && source .venv/bin/activate && python run.py'
        : err?.code === 'ENOTFOUND'
          ? `Host in PYTHON_API_URL (${PYTHON_API_URL}) could not be resolved. If using Docker, try host.docker.internal or the container name.`
          : 'Check that ligneous-python-api is running on port 5001.',
    }, { status: 502 });
  }
}
