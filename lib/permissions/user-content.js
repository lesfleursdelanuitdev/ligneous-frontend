/**
 * User Content Permission Utilities
 * Functions for checking permissions on user-generated content
 */

import { prisma } from '../database/prisma.js';

/**
 * Check if user can view content
 * @param {string|null} userId - User ID (null for unauthenticated)
 * @param {string} contentId - Content ID
 * @returns {Promise<boolean>}
 */
export async function canViewContent(userId, contentId) {
  const content = await prisma.userContent.findUnique({
    where: { id: contentId },
    include: { user: true },
  });
  
  if (!content) {
    return false; // Content doesn't exist
  }
  
  // Creator can always view
  if (content.userId === userId) {
    return true;
  }
  
  // Check visibility level
  switch (content.visibility) {
    case 'private':
      return false; // Only creator
    
    case 'followers_only':
      if (!userId) {
        return false; // Must be authenticated
      }
      // Check if user follows content creator
      const follow = await prisma.follow.findFirst({
        where: {
          followerId: userId,
          followingId: content.userId,
          isActive: true,
        },
      });
      return !!follow;
    
    case 'collaborators_only':
      if (!userId) {
        return false; // Must be authenticated
      }
      // Check if user is a collaborator (has permission on same tree)
      if (content.treeId) {
        // TODO: Check if user has permission on the tree
        // For now, return false (can be enhanced later)
        return false;
      }
      return false;
    
    case 'public':
      return true; // Everyone can view
    
    default:
      return false;
  }
}

/**
 * Check if user can edit content
 * @param {string|null} userId - User ID (null for unauthenticated)
 * @param {string} contentId - Content ID
 * @returns {Promise<boolean>}
 */
export async function canEditContent(userId, contentId) {
  if (!userId) {
    return false; // Must be authenticated
  }
  
  const content = await prisma.userContent.findUnique({
    where: { id: contentId },
  });
  
  if (!content) {
    return false;
  }
  
  // Only creator can edit
  return content.userId === userId;
}

/**
 * Check if user can delete content
 * @param {string|null} userId - User ID (null for unauthenticated)
 * @param {string} contentId - Content ID
 * @returns {Promise<boolean>}
 */
export async function canDeleteContent(userId, contentId) {
  // Same as edit (only creator)
  return canEditContent(userId, contentId);
}

