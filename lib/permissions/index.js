// Permission checking utilities
// These functions check permissions with the following priority:
// 1. Website Owner (superuser) - highest priority
// 2. Tree Owner (any owner)
// 3. Tree Maintainer
// 4. Explicit permissions
// 5. Subtree permissions
// 6. Tree-level permissions
// 7. Public tree (read-only)

import { prisma } from '../database/prisma.js';

/**
 * Check if a user is the website owner (superuser)
 * @param {string|null} userId - User ID (null for unauthenticated users)
 */
export async function isWebsiteOwner(userId) {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isWebsiteOwner: true },
  });
  return user?.isWebsiteOwner === true;
}

/**
 * Check if a user is an owner of a tree
 * @param {string|null} userId - User ID (null for unauthenticated users)
 */
export async function isTreeOwner(userId, treeId) {
  if (!userId) return false;
  const owner = await prisma.treeOwner.findFirst({
    where: {
      treeId,
      userId,
    },
  });
  return !!owner;
}

/**
 * Check if a user is a maintainer of a tree
 * @param {string|null} userId - User ID (null for unauthenticated users)
 */
export async function isTreeMaintainer(userId, treeId) {
  if (!userId) return false;
  const maintainer = await prisma.treeMaintainer.findFirst({
    where: {
      treeId,
      userId,
    },
  });
  return !!maintainer;
}

/**
 * Check if a user has an explicit permission on a resource
 * @param {string|null} userId - User ID (null for unauthenticated users)
 */
export async function hasExplicitPermission(
  userId,
  treeId,
  resourceType,
  resourceId,
  permissionType
) {
  if (!userId) return false; // Unauthenticated users have no explicit permissions
  const permission = await prisma.permission.findFirst({
    where: {
      userId,
      treeId,
      resourceType,
      resourceId,
      permissionType,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });
  return !!permission;
}

/**
 * Check if a user has a tree-level permission
 * @param {string|null} userId - User ID (null for unauthenticated users)
 */
export async function hasTreePermission(userId, treeId, permissionType) {
  return hasExplicitPermission(userId, treeId, 'tree', 'tree', permissionType);
}

/**
 * Check if a tree is public
 */
export async function isPublicTree(treeId) {
  const tree = await prisma.tree.findUnique({
    where: { id: treeId },
    select: { isPublic: true },
  });
  return tree?.isPublic === true;
}

/**
 * Check if a resource is within a subtree that the user has permission for
 * @param {string} resourceId - XREF of resource to check (e.g., 'I1', 'F2')
 * @param {string} subtreeRootXref - XREF of subtree root individual (e.g., '@I1@')
 * @param {string} treeId - Frontend tree ID
 * @returns {Promise<boolean>} True if resource is in subtree
 */
export async function isInSubtree(resourceId, subtreeRootXref, treeId) {
  try {
    // Map treeId to fileId
    const { getFileIdFromTreeId } = await import('../tree-access.js');
    const fileId = await getFileIdFromTreeId(treeId);
    if (!fileId) {
      return false; // Tree not found
    }
    
    // Get all descendants of subtree root
    const { getSubtreeDescendants, getFamilyMembers } = await import('../subtree.js');
    const descendants = await getSubtreeDescendants(fileId, subtreeRootXref);
    
    // Normalize resourceId to match XREF format (ensure @ symbols)
    const normalizedResourceId = resourceId.startsWith('@') ? resourceId : `@${resourceId}@`;
    
    // For individuals: direct check
    if (normalizedResourceId.startsWith('@I')) {
      return descendants.includes(normalizedResourceId);
    }
    
    // For families: check if any family member is in subtree
    if (normalizedResourceId.startsWith('@F')) {
      const familyMembers = await getFamilyMembers(fileId, normalizedResourceId);
      // Check if any member is in descendants
      return familyMembers.some(memberXref => descendants.includes(memberXref));
    }
    
    // Unknown resource type
    return false;
  } catch (error) {
    console.error('Error checking subtree membership:', error);
    return false; // Fail closed (no access on error)
  }
}

/**
 * Get all subtree permissions for a user in a tree
 * @param {string|null} userId - User ID (null for unauthenticated users)
 */
export async function getSubtreePermissions(userId, treeId) {
  if (!userId) return []; // Unauthenticated users have no subtree permissions
  const permissions = await prisma.permission.findMany({
    where: {
      userId,
      treeId,
      resourceType: 'subtree',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });
  return permissions;
}

/**
 * Main permission check function
 * 
 * Permission Model:
 * - Public Trees: Anyone (including unauthenticated) can READ, only registered users with write access can EDIT
 * - Private Trees: Only registered users with read access can READ, only registered users with write access can EDIT
 * - Most users: Read access to entire tree, write access only to subtree
 * - Tree owners: Full read and write access to entire tree
 * 
 * Checks permissions in priority order:
 * 1. Website Owner (superuser) - absolute access (requires authentication)
 * 2. Tree Owner - all permissions on tree (requires authentication)
 * 3. Tree Maintainer - admin permissions on tree (requires authentication)
 * 4. Explicit permission on resource (requires authentication)
 * 5. Subtree permission (if resource is in subtree) (requires authentication)
 * 6. Tree-level permission (requires authentication)
 * 7. Public tree (read-only for anyone, including unauthenticated users)
 * 
 * @param {string|null} userId - User ID (null/undefined for unauthenticated users)
 * @param {string} treeId - Tree ID
 * @param {string} resourceType - Resource type ('tree', 'individual', 'family', 'subtree')
 * @param {string} resourceId - Resource ID (e.g., 'I1', 'F2', 'tree')
 * @param {string} permissionType - Permission type ('read', 'write', 'delete', 'admin')
 * @returns {Promise<boolean>} - True if user has permission
 */
export async function hasPermission(
  userId,
  treeId,
  resourceType,
  resourceId,
  permissionType
) {
  // For write/delete/admin operations, require authentication
  if ((permissionType === 'write' || permissionType === 'delete' || permissionType === 'admin') && !userId) {
    return false; // Unauthenticated users cannot write, delete, or admin
  }

  // Step 0: Check if user is website owner (SUPERUSER) - HIGHEST PRIORITY
  // Only applies to authenticated users
  if (userId && await isWebsiteOwner(userId)) {
    return true; // Superuser has absolute access to everything
  }

  // Step 1: Check if user is tree owner (any owner)
  // Only applies to authenticated users
  if (userId && await isTreeOwner(userId, treeId)) {
    return true; // Any owner has all permissions (full read and write)
  }

  // Step 2: Check if user is tree maintainer
  // Only applies to authenticated users
  if (userId && await isTreeMaintainer(userId, treeId)) {
    return true; // Maintainers have admin access
  }

  // Step 3: Check explicit permission on the specific resource
  // Only applies to authenticated users
  if (userId && await hasExplicitPermission(userId, treeId, resourceType, resourceId, permissionType)) {
    return true;
  }

  // Step 4: Check subtree permissions (if resource is individual or family)
  // Only applies to authenticated users
  if (userId && (resourceType === 'individual' || resourceType === 'family')) {
    const subtreePerms = await getSubtreePermissions(userId, treeId);
    for (const subtreePerm of subtreePerms) {
      if (await isInSubtree(resourceId, subtreePerm.resourceId, treeId)) {
        // Check if subtree permission type matches or is higher
        if (subtreePerm.permissionType === permissionType || 
            (subtreePerm.permissionType === 'admin' && permissionType !== 'delete') ||
            (subtreePerm.permissionType === 'write' && permissionType === 'read')) {
          return true;
        }
      }
    }
  }

  // Step 5: Check tree-level permission
  // Only applies to authenticated users
  if (userId && await hasTreePermission(userId, treeId, permissionType)) {
    return true;
  }

  // Step 6: Check public tree (read-only for anyone, including unauthenticated)
  // For private trees, unauthenticated users have no access
  const isPublic = await isPublicTree(treeId);
  if (isPublic && permissionType === 'read') {
    return true; // Anyone can read public trees
  }

  // Private trees require authentication and explicit permission
  // If we get here and it's a private tree, user has no access
  return false;
}

/**
 * Get all owners of a tree
 */
export async function getTreeOwners(treeId) {
  const owners = await prisma.treeOwner.findMany({
    where: { treeId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: [
      { isPrimary: 'desc' }, // Primary owner first
      { createdAt: 'asc' },
    ],
  });
  return owners;
}

/**
 * Add an owner to a tree
 */
export async function addTreeOwner(treeId, userId, addedBy, isPrimary = false) {
  // If setting as primary, unset other primary owners
  if (isPrimary) {
    await prisma.treeOwner.updateMany({
      where: { treeId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const owner = await prisma.treeOwner.create({
    data: {
      treeId,
      userId,
      isPrimary,
      addedBy,
    },
  });
  return owner;
}

/**
 * Remove an owner from a tree
 */
export async function removeTreeOwner(treeId, userId) {
  await prisma.treeOwner.deleteMany({
    where: {
      treeId,
      userId,
    },
  });
}
