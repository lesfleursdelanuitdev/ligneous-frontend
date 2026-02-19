/**
 * Catch-All Proxy Route for GEDCOM Operations
 * 
 * This route proxies all GEDCOM data operations to the Go API.
 * It handles:
 * - Authentication (optional for public trees, required for write operations)
 * - Permission checking
 * - Tree ID to File ID mapping
 * - Request/response proxying
 * 
 * Path structure: /api/trees/[treeId]/[...path]
 * Examples:
 *   /api/trees/abc123/individuals → /api/v1/files/{file_id}/individuals
 *   /api/trees/abc123/individuals/I1 → /api/v1/files/{file_id}/individuals/I1
 *   /api/trees/abc123/families/F2 → /api/v1/files/{file_id}/families/F2
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { getFileIdFromTreeId, checkTreeAccessForProxy } from '@/lib/tree-access';
import { config } from '@/config/index.js';

const GO_API_URL = config.api.goApi.baseURL;

// Routes that should NOT be proxied (handled by other routes)
const EXCLUDED_ROUTES = [
  'collaborators',
  'permissions',
  'maintainers',
  'owners',
  'invitations',
  'upload',
  'stats',
  'entities', // Handled by specific entity tags route
];

/**
 * Determine permission type from HTTP method
 */
function getPermissionType(method) {
  switch (method) {
    case 'GET':
    case 'HEAD':
      return 'read';
    case 'POST':
    case 'PUT':
    case 'PATCH':
      return 'write';
    case 'DELETE':
      return 'delete';
    default:
      return 'read';
  }
}

/**
 * Proxy request to Go API
 */
async function proxyToGoAPI(request, fileId, pathSegments, queryString) {
  // Build Go API URL
  const path = pathSegments.length > 0 ? pathSegments.join('/') : '';
  const url = `${GO_API_URL}/api/v1/files/${fileId}${path ? `/${path}` : ''}${queryString ? `?${queryString}` : ''}`;

  // Get request body (if any)
  let body = null;
  const contentType = request.headers.get('content-type');
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'DELETE') {
    if (contentType?.includes('multipart/form-data')) {
      // For multipart/form-data, we need to pass the form data
      body = await request.formData();
    } else if (contentType?.includes('application/json')) {
      // For JSON, parse and re-stringify
      body = await request.json();
    } else {
      // For other types, get as blob
      body = await request.blob();
    }
  }

  // Build fetch options
  const fetchOptions = {
    method: request.method,
    headers: {},
  };

  // Copy relevant headers (exclude host, connection, etc.)
  const headersToForward = [
    'authorization',
    'content-type',
    'accept',
    'accept-language',
    'user-agent',
  ];

  for (const headerName of headersToForward) {
    const headerValue = request.headers.get(headerName);
    if (headerValue) {
      fetchOptions.headers[headerName] = headerValue;
    }
  }

  // Add body if present
  if (body !== null) {
    if (body instanceof FormData) {
      fetchOptions.body = body;
      // Don't set content-type for FormData, let fetch set it with boundary
    } else if (typeof body === 'object') {
      fetchOptions.body = JSON.stringify(body);
      fetchOptions.headers['content-type'] = 'application/json';
    } else {
      fetchOptions.body = body;
    }
  }

  // Make request to Go API
  try {
    const response = await fetch(url, fetchOptions);

    // Get response body
    const responseBody = await response.text();
    let parsedBody;
    try {
      parsedBody = JSON.parse(responseBody);
    } catch {
      parsedBody = responseBody;
    }

    // Create response with same status and headers
    const nextResponse = NextResponse.json(parsedBody, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy relevant response headers
    const headersToCopy = [
      'content-type',
      'content-length',
      'cache-control',
      'etag',
      'last-modified',
    ];

    for (const headerName of headersToCopy) {
      const headerValue = response.headers.get(headerName);
      if (headerValue) {
        nextResponse.headers.set(headerName, headerValue);
      }
    }

    return nextResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to Go API', message: error.message },
      { status: 502 }
    );
  }
}

/**
 * Handle all HTTP methods
 * Note: In Next.js 15+, params can be a Promise and must be awaited.
 */
async function getParams(context) {
  const params = context?.params;
  return typeof params?.then === 'function' ? await params : params;
}

export async function GET(request, context) {
  const params = await getParams(context);
  return handleRequest(request, params);
}

export async function POST(request, context) {
  const params = await getParams(context);
  return handleRequest(request, params);
}

export async function PUT(request, context) {
  const params = await getParams(context);
  return handleRequest(request, params);
}

export async function PATCH(request, context) {
  const params = await getParams(context);
  return handleRequest(request, params);
}

export async function DELETE(request, context) {
  const params = await getParams(context);
  return handleRequest(request, params);
}

export async function HEAD(request, context) {
  const params = await getParams(context);
  return handleRequest(request, params);
}

export async function OPTIONS(request, context) {
  const params = await getParams(context);
  return handleRequest(request, params);
}

/**
 * Main request handler
 */
async function handleRequest(request, params) {
  try {
    if (!params) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Missing route params' },
        { status: 400 }
      );
    }
    const { treeId, path: pathSegments = [] } = params;

    // Check if this route should be excluded (handled by other routes)
    if (pathSegments.length > 0 && EXCLUDED_ROUTES.includes(pathSegments[0])) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    // 1. Get authenticated user (optional for read operations on public trees)
    const { user, error: authError } = await getAuthenticatedUser(request);
    const userId = user?.id || null;

    // 2. Determine required permission type from HTTP method
    const permissionType = getPermissionType(request.method);

    // 3. Check tree access
    const hasAccess = await checkTreeAccessForProxy(userId, treeId, permissionType);
    if (!hasAccess) {
      // If authentication failed and it's a write operation, return auth error
      if (authError && (permissionType === 'write' || permissionType === 'delete')) {
        return NextResponse.json(
          { error: authError || 'Unauthorized' },
          { status: 401 }
        );
      }
      // Otherwise, return forbidden
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this tree' },
        { status: 403 }
      );
    }

    // 4. Map tree_id → file_id
    const fileId = await getFileIdFromTreeId(treeId);
    if (!fileId) {
      return NextResponse.json(
        { error: 'Tree not found or file not linked' },
        { status: 404 }
      );
    }

    // 5. Get query string
    const url = new URL(request.url);
    const queryString = url.searchParams.toString();

    // 6. Proxy to Go API
    return await proxyToGoAPI(request, fileId, pathSegments, queryString);
  } catch (error) {
    console.error('Catch-all proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

