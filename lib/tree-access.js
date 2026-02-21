/**
 * Tree Access Utilities
 * Functions for checking tree access and mapping tree_id to file_id / fileUuid
 */

import { NextResponse } from 'next/server';
import { prisma } from './database/prisma.js';
import { hasPermission } from './permissions/index.js';
import { getAuthenticatedUser } from './middleware.js';

/**
 * Get file_id from tree_id
 * @param {string} treeId - Tree ID
 * @returns {Promise<string|null>} File ID or null if tree not found
 */
export async function getFileIdFromTreeId(treeId) {
  const tree = await prisma.tree.findUnique({
    where: { id: treeId },
    select: { fileId: true },
  });
  return tree?.fileId || null;
}

/**
 * Check if user has access to a tree
 * @param {string|null} userId - User ID (null for unauthenticated)
 * @param {string} treeId - Tree ID
 * @param {string} permissionType - 'read', 'write', 'delete', or 'admin'
 * @returns {Promise<boolean>}
 */
export async function checkTreeAccessForProxy(userId, treeId, permissionType = 'read') {
  return hasPermission(userId, treeId, 'tree', 'tree', permissionType);
}

/**
 * Resolve tree access for an API route handler.
 *
 * Authenticates the user (optional for reads), looks up the tree,
 * resolves the GedcomFile UUID, and checks permissions.
 *
 * @param {Request} request
 * @param {string}  treeId
 * @param {string}  [permissionType='read']
 * @returns {Promise<{fileUuid: string, user: object|null, error: NextResponse|null}>}
 */
export async function resolveTreeAccess(request, treeId, permissionType = 'read') {
  if (!treeId) {
    return { fileUuid: null, user: null, error: NextResponse.json({ error: 'Tree ID is required' }, { status: 400 }) };
  }

  const { user } = await getAuthenticatedUser(request);
  const userId = user?.id || null;

  const tree = await prisma.tree.findUnique({
    where: { id: treeId },
    select: { fileId: true },
  });

  if (!tree) {
    return { fileUuid: null, user, error: NextResponse.json({ error: 'Tree not found' }, { status: 404 }) };
  }

  const gedcomFile = await prisma.gedcomFile.findUnique({
    where: { fileId: tree.fileId },
    select: { id: true },
  });

  if (!gedcomFile) {
    return { fileUuid: null, user, error: NextResponse.json({ error: 'Tree not found' }, { status: 404 }) };
  }

  const hasAccess = await hasPermission(userId, treeId, 'tree', 'tree', permissionType);
  if (!hasAccess) {
    return { fileUuid: null, user, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { fileUuid: gedcomFile.id, user, error: null };
}

/**
 * Parse standard pagination & sorting query params.
 *
 * @param {URL|URLSearchParams} searchParams
 * @param {{ defaultLimit?: number, maxLimit?: number }} opts
 * @returns {{ limit: number, offset: number, search: string|null, sort: string|null, order: string }}
 */
export function parsePagination(searchParams, opts = {}) {
  const sp = searchParams instanceof URLSearchParams ? searchParams : searchParams.searchParams;
  const { defaultLimit = 50, maxLimit = 500 } = opts;
  let limit = parseInt(sp.get('limit'), 10) || defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  const offset = parseInt(sp.get('offset'), 10) || 0;
  const search = sp.get('search') || sp.get('q') || null;
  const sort = sp.get('sort') || null;
  const order = sp.get('order') === 'asc' ? 'asc' : 'desc';
  return { limit, offset, search, sort, order };
}

/**
 * Build a standard paginated JSON response.
 */
export function paginatedResponse(data, total, limit, offset) {
  return NextResponse.json({
    data,
    pagination: { total, limit, offset, hasMore: offset + data.length < total },
  });
}

