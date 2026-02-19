/**
 * Tree Access Utilities
 * Functions for checking tree access and mapping tree_id to file_id
 */

import { prisma } from './database/prisma.js';
import { hasPermission } from './permissions/index.js';

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
 * Check if user has access to a tree (for proxying to Go API)
 * @param {string|null} userId - User ID (null for unauthenticated)
 * @param {string} treeId - Tree ID
 * @param {string} permissionType - 'read', 'write', 'delete', or 'admin'
 * @returns {Promise<boolean>}
 */
export async function checkTreeAccessForProxy(userId, treeId, permissionType = 'read') {
  return hasPermission(userId, treeId, 'tree', 'tree', permissionType);
}

