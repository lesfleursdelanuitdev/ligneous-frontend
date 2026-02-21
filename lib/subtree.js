/**
 * Subtree Utilities
 * Functions for checking subtree membership using Prisma.
 */

import { prisma } from './database/prisma.js';

const descendantCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Get all descendants of an individual using the parent-child table.
 * Performs a BFS traversal via Prisma.
 */
export async function getSubtreeDescendants(fileId, subtreeRootXref, useCache = true) {
  const cacheKey = `${fileId}:${subtreeRootXref}`;

  if (useCache) {
    const cached = descendantCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.descendants;
    }
  }

  try {
    const root = await prisma.gedcomIndividual.findFirst({
      where: { fileUuid: fileId, xref: subtreeRootXref },
      select: { id: true },
    });

    if (!root) return [];

    const visited = new Set();
    const queue = [root.id];
    const xrefs = [subtreeRootXref];
    visited.add(root.id);

    while (queue.length > 0) {
      const parentIds = queue.splice(0, queue.length);
      const children = await prisma.gedcomParentChild.findMany({
        where: { fileUuid: fileId, parentId: { in: parentIds } },
        select: { child: { select: { id: true, xref: true } } },
      });

      for (const c of children) {
        if (!visited.has(c.child.id)) {
          visited.add(c.child.id);
          queue.push(c.child.id);
          xrefs.push(c.child.xref);
        }
      }
    }

    if (useCache) {
      descendantCache.set(cacheKey, { descendants: xrefs, timestamp: Date.now() });
    }

    return xrefs;
  } catch (error) {
    console.error('Error getting subtree descendants:', error);
    return [];
  }
}

/**
 * Get family members (husband, wife, children) from the local database.
 */
export async function getFamilyMembers(fileId, familyXref) {
  try {
    const family = await prisma.gedcomFamily.findFirst({
      where: { fileUuid: fileId, xref: familyXref },
      select: {
        husband: { select: { xref: true } },
        wife: { select: { xref: true } },
      },
    });

    if (!family) return [];

    const members = [];
    if (family.husband?.xref) members.push(family.husband.xref);
    if (family.wife?.xref) members.push(family.wife.xref);

    const childRels = await prisma.gedcomParentChild.findMany({
      where: {
        fileUuid: fileId,
        familyXref,
      },
      select: { child: { select: { xref: true } } },
    });

    for (const r of childRels) {
      if (r.child?.xref) members.push(r.child.xref);
    }

    return members;
  } catch (error) {
    console.error('Error getting family members:', error);
    return [];
  }
}

/**
 * Clear the descendant cache.
 */
export function clearSubtreeCache(fileId, subtreeRootXref) {
  if (fileId && subtreeRootXref) {
    descendantCache.delete(`${fileId}:${subtreeRootXref}`);
  } else if (fileId) {
    for (const key of descendantCache.keys()) {
      if (key.startsWith(`${fileId}:`)) descendantCache.delete(key);
    }
  } else {
    descendantCache.clear();
  }
}
