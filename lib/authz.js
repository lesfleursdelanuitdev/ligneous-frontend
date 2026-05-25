import { NextResponse } from 'next/server';
import { can, isPublicTree, getFileIdFromTreeId } from '@ligneous/authz';
import { prisma } from './database/prisma.js';
import { getAuthenticatedUser } from './middleware.js';

/**
 * Authorization bridge: replaces resolveTreeAccess() with @ligneous/authz can().
 *
 * Drop-in replacement — returns the same { fileUuid, user, error } shape so route
 * files only need to change the import and add an entity argument.
 *
 * Authenticated users are checked via can() (role-based, with legacy permission
 * fallback). Unauthenticated users are granted read access only on public trees.
 *
 * @param {Request} request
 * @param {string} treeId
 * @param {string} entity  — one of the AUTHZ_ENTITIES values, e.g. 'individual', 'story'
 * @param {'read'|'create'|'update'|'delete'} [action='read']
 * @returns {Promise<{ fileUuid: string|null, user: object|null, error: Response|null }>}
 */
export async function resolveTreeAuthz(request, treeId, entity, action = 'read') {
  if (!treeId) {
    return { fileUuid: null, user: null, error: NextResponse.json({ error: 'Tree ID is required' }, { status: 400 }) };
  }

  const fileUuid = await getFileIdFromTreeId(treeId, prisma);
  if (!fileUuid) {
    return { fileUuid: null, user: null, error: NextResponse.json({ error: 'Tree not found' }, { status: 404 }) };
  }

  const { user } = await getAuthenticatedUser(request);

  if (user) {
    const allowed = await can({ userId: user.id, entity, action, scope: 'tree', treeId }, prisma);
    if (!allowed) {
      return { fileUuid: null, user, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { fileUuid, user, error: null };
  }

  // Unauthenticated: only public tree reads are allowed.
  if (action === 'read') {
    const isPublic = await isPublicTree(treeId, prisma);
    if (isPublic) {
      return { fileUuid, user: null, error: null };
    }
    return { fileUuid: null, user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { fileUuid: null, user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
}
