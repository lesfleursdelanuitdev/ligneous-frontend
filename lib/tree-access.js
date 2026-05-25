import { NextResponse } from 'next/server';
import { prisma } from './database/prisma.js';

/**
 * Get tree.fileId (legacy string) from treeId.
 * Used by the entity tags route which indexes tagged items by fileId string.
 * Note: this is distinct from gedcomFileId (UUID) used by the authz package.
 * @param {string} treeId
 * @returns {Promise<string|null>}
 */
export async function getFileIdFromTreeId(treeId) {
  const tree = await prisma.tree.findUnique({
    where: { id: treeId },
    select: { fileId: true },
  });
  return tree?.fileId || null;
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

