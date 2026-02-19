/**
 * Comment Permission Utilities
 * Who can comment, edit, delete, and moderate comments on tree entities.
 */

import { prisma } from '../database/prisma.js';
import {
  isWebsiteOwner,
  isTreeOwner,
  isTreeMaintainer,
  hasPermission,
} from './index.js';

/**
 * Check if user can add a comment on an entity (must have read access to the entity/tree).
 * @param {string|null} userId - User ID (null for unauthenticated)
 * @param {string} entityType - e.g. 'individual', 'family', 'event', 'media'
 * @param {string} entityId - Entity identifier (XREF or UUID)
 * @param {string} treeId - Tree UUID
 * @returns {Promise<boolean>}
 */
export async function canComment(userId, entityType, entityId, treeId) {
  if (!userId) return false;
  // Must have at least read access to the tree/entity to comment
  return hasPermission(userId, treeId, entityType, entityId, 'read');
}

/**
 * Check if user can edit a comment.
 * Comment author can edit; tree owners/maintainers and website owners can edit any.
 * @param {string|null} userId - User ID
 * @param {string} commentId - Comment UUID
 * @returns {Promise<boolean>}
 */
export async function canEditComment(userId, commentId) {
  if (!userId) return false;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true, treeId: true, deletedAt: true },
  });
  if (!comment || comment.deletedAt) return false;

  if (comment.userId === userId) return true;
  if (await isWebsiteOwner(userId)) return true;
  if (await isTreeOwner(userId, comment.treeId)) return true;
  if (await isTreeMaintainer(userId, comment.treeId)) return true;
  return false;
}

/**
 * Check if user can delete a comment.
 * Comment author, tree owners/maintainers, and website owners can delete.
 * @param {string|null} userId - User ID
 * @param {string} commentId - Comment UUID
 * @returns {Promise<boolean>}
 */
export async function canDeleteComment(userId, commentId) {
  return canEditComment(userId, commentId);
}

/**
 * Check if user can moderate comments on a tree (pin, hide, resolve, etc.).
 * Tree owners, tree maintainers, and website owners.
 * @param {string|null} userId - User ID
 * @param {string} treeId - Tree UUID
 * @returns {Promise<boolean>}
 */
export async function canModerateComments(userId, treeId) {
  if (!userId) return false;
  if (await isWebsiteOwner(userId)) return true;
  if (await isTreeOwner(userId, treeId)) return true;
  if (await isTreeMaintainer(userId, treeId)) return true;
  return false;
}
