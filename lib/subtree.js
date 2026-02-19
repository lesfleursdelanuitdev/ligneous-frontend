/**
 * Subtree Utilities
 * Functions for checking subtree membership and fetching descendants from Go API
 */

import { getFileIdFromTreeId } from './tree-access.js';
import { config } from '../config/index.js';

const GO_API_URL = config.api.goApi.baseURL;

// In-memory cache for descendant lists
const descendantCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all descendants of an individual (for subtree permission checking)
 * @param {string} fileId - Go API file_id
 * @param {string} subtreeRootXref - XREF of subtree root individual (e.g., '@I1@')
 * @param {boolean} useCache - Whether to use cached results (default: true)
 * @returns {Promise<string[]>} Array of XREFs of all descendants
 */
export async function getSubtreeDescendants(fileId, subtreeRootXref, useCache = true) {
  const cacheKey = `${fileId}:${subtreeRootXref}`;
  
  // Check cache first
  if (useCache) {
    const cached = descendantCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.descendants;
    }
  }
  
  try {
    // Fetch descendants from Go API
    const response = await fetch(
      `${GO_API_URL}/api/v1/files/${fileId}/individuals/${subtreeRootXref}/descendants`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        // Individual not found, return empty array
        return [];
      }
      throw new Error(`Failed to get descendants: ${response.statusText}`);
    }
    
    const data = await response.json();
    const descendants = data.data?.descendants || [];
    
    // Extract XREFs from descendants array
    const xrefs = descendants.map(desc => desc.xref).filter(Boolean);
    
    // Cache the results
    if (useCache) {
      descendantCache.set(cacheKey, {
        descendants: xrefs,
        timestamp: Date.now()
      });
    }
    
    return xrefs;
  } catch (error) {
    console.error('Error getting subtree descendants:', error);
    // Return empty array on error (fail closed)
    return [];
  }
}

/**
 * Get family members (husband, wife, children) from Go API
 * @param {string} fileId - Go API file_id
 * @param {string} familyXref - Family XREF (e.g., '@F1@')
 * @returns {Promise<string[]>} Array of XREFs of family members
 */
export async function getFamilyMembers(fileId, familyXref) {
  try {
    const response = await fetch(
      `${GO_API_URL}/api/v1/files/${fileId}/families/${familyXref}`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Failed to get family: ${response.statusText}`);
    }
    
    const data = await response.json();
    const family = data.data || {};
    
    // Extract XREFs from family members
    const members = [];
    if (family.husband?.xref) members.push(family.husband.xref);
    if (family.wife?.xref) members.push(family.wife.xref);
    if (family.children) {
      family.children.forEach(child => {
        if (child.xref) members.push(child.xref);
      });
    }
    
    return members;
  } catch (error) {
    console.error('Error getting family members:', error);
    return [];
  }
}

/**
 * Clear the descendant cache (useful for testing or when data changes)
 * @param {string} [fileId] - Optional file ID to clear cache for specific file
 * @param {string} [subtreeRootXref] - Optional XREF to clear cache for specific subtree
 */
export function clearSubtreeCache(fileId, subtreeRootXref) {
  if (fileId && subtreeRootXref) {
    const cacheKey = `${fileId}:${subtreeRootXref}`;
    descendantCache.delete(cacheKey);
  } else if (fileId) {
    // Clear all entries for this file
    for (const key of descendantCache.keys()) {
      if (key.startsWith(`${fileId}:`)) {
        descendantCache.delete(key);
      }
    }
  } else {
    // Clear entire cache
    descendantCache.clear();
  }
}

