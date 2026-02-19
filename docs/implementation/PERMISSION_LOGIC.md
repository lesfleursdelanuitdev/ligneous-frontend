# Permission Logic - Detailed Analysis

**Date:** 2026-01-23  
**Purpose:** Detailed analysis of permission resolution logic

---

## Permission Resolution Algorithm

### Step-by-Step Permission Check

```javascript
function hasPermission(userId, treeId, resourceType, resourceId, permissionType) {
  // Step 1: Check if user is tree owner
  const tree = await getTree(treeId);
  if (tree.owner_id === userId) {
    return true;  // Owner has all permissions
  }
  
  // Step 2: Check explicit permission on the specific resource
  const explicitPerm = await getPermission(userId, treeId, resourceType, resourceId, permissionType);
  if (explicitPerm && !isExpired(explicitPerm)) {
    return true;
  }
  
  // Step 3: Check subtree permissions (if resource is individual or family)
  if (resourceType === 'individual' || resourceType === 'family') {
    const subtreePerms = await getSubtreePermissions(userId, treeId);
    for (const subtreePerm of subtreePerms) {
      if (isInSubtree(resourceId, subtreePerm.resource_id, treeId)) {
        if (hasPermissionType(subtreePerm, permissionType)) {
          return true;
        }
      }
    }
  }
  
  // Step 4: Check tree-level permission
  const treePerm = await getPermission(userId, treeId, 'tree', 'tree', permissionType);
  if (treePerm && !isExpired(treePerm)) {
    return true;
  }
  
  // Step 5: Check public tree (read-only)
  if (tree.is_public && permissionType === 'read') {
    return true;
  }
  
  return false;
}
```

---

## Subtree Permission Logic

### What is a Subtree?

A subtree is all descendants of a particular individual, including:
- The root individual itself
- All children of the root
- All grandchildren
- All great-grandchildren
- ... (all descendants)

### Subtree Includes

When user has `write` permission on subtree rooted at I1:

**Included:**
- ✅ I1 (the root)
- ✅ All descendants of I1 (children, grandchildren, etc.)
- ✅ All families where I1 or descendants are members
- ✅ All individuals connected to descendants (spouses via families)

**Not Included:**
- ❌ Ancestors of I1 (parents, grandparents, etc.)
- ❌ Siblings of I1 (unless they share a family with descendants)
- ❌ Unrelated individuals

### Subtree Detection Algorithm

```javascript
function isInSubtree(individualXref, subtreeRootXref, treeId) {
  // Query Go API to get descendants of subtree root
  const descendants = await goAPI.getDescendants(treeId, subtreeRootXref);
  
  // Check if individual is in descendants list
  return descendants.includes(individualXref);
}

function isFamilyInSubtree(familyXref, subtreeRootXref, treeId) {
  // Get family from Go API
  const family = await goAPI.getFamily(treeId, familyXref);
  
  // Check if any family member is in subtree
  const descendants = await goAPI.getDescendants(treeId, subtreeRootXref);
  
  return (
    descendants.includes(family.husband) ||
    descendants.includes(family.wife) ||
    family.children.some(child => descendants.includes(child))
  );
}
```

---

## Monica's Permission Breakdown

### Scenario: Monica linked to I1 in T1

#### Automatic Permissions (via User-Individual Link)

**Key Rule:** When user U links to individual I in tree T:
- Read access to entire tree T
- Write access to I and subtree rooted at I

**1. Tree-Level Read:**
```sql
INSERT INTO permissions (user_id, tree_id, resource_type, resource_id, permission_type)
VALUES ('monica-uuid', 't1-uuid', 'tree', 'tree', 'read');
```
This grants read access to ALL resources in the tree (individuals, families, relationships).

**2. Individual I1 Write:**
```sql
INSERT INTO permissions (user_id, tree_id, resource_type, resource_id, permission_type)
VALUES ('monica-uuid', 't1-uuid', 'individual', 'I1', 'write');
```

**3. Subtree Rooted at I1 Write:**
```sql
INSERT INTO permissions (user_id, tree_id, resource_type, resource_id, permission_type)
VALUES ('monica-uuid', 't1-uuid', 'subtree', 'I1', 'write');
```

**Note:** No need to explicitly grant permissions on ancestors, siblings, or families outside the subtree - tree-level read covers everything. Families in the subtree are covered by subtree permission.

### Permission Check Examples

#### Example 1: Can Monica edit I1?

```javascript
hasPermission('monica-uuid', 't1-uuid', 'individual', 'I1', 'write')
// Step 1: Not owner → continue
// Step 2: Check explicit permission → ✅ Found: write on I1
// Result: ✅ TRUE
```

#### Example 2: Can Monica edit I1's child (I5)?

```javascript
hasPermission('monica-uuid', 't1-uuid', 'individual', 'I5', 'write')
// Step 1: Not owner → continue
// Step 2: No explicit permission on I5 → continue
// Step 3: Check subtree permissions → ✅ I5 is descendant of I1 (subtree root)
// Result: ✅ TRUE
```

#### Example 3: Can Monica edit I1's parent (I10)?

```javascript
hasPermission('monica-uuid', 't1-uuid', 'individual', 'I10', 'write')
// Step 1: Not owner → continue
// Step 2: No explicit permission on I10 → continue
// Step 3: Check subtree permissions → ❌ I10 is NOT in subtree (it's an ancestor)
// Step 4: Check tree-level permission → ❌ Tree-level is read, not write
// Step 5: Check public tree → ❌ Not public or not read
// Result: ❌ FALSE (but has read permission)
```

#### Example 4: Can Monica read I1's parent (I10)?

```javascript
hasPermission('monica-uuid', 't1-uuid', 'individual', 'I10', 'read')
// Step 1: Not owner → continue
// Step 2: No explicit permission on I10 → continue
// Step 3: Check subtree permissions → ❌ I10 is NOT in subtree
// Step 4: Check tree-level permission → ✅ Found: read on tree
// Result: ✅ TRUE
```

#### Example 5: Can Monica edit family F1 (where I1 is husband)?

```javascript
hasPermission('monica-uuid', 't1-uuid', 'family', 'F1', 'write')
// Step 1: Not owner → continue
// Step 2: Check explicit permission → ✅ Found: write on F1 (family in subtree)
// Result: ✅ TRUE
```

---

## Permission Types

### Read Permission

**What it allows:**
- View resource data
- Query relationships
- View graph structure

**What it does NOT allow:**
- Edit resource data
- Delete resource
- Grant permissions

### Write Permission

**What it allows:**
- All read permissions
- Edit resource data
- Create new resources in subtree (if subtree permission)

**What it does NOT allow:**
- Delete resource (unless also has delete permission)
- Grant permissions (unless also has admin permission)

### Delete Permission

**What it allows:**
- All write permissions
- Delete resource

**What it does NOT allow:**
- Grant permissions (unless also has admin permission)

### Admin Permission

**What it allows:**
- All delete permissions
- Grant/revoke permissions
- Change tree settings
- Delete tree

---

## Edge Cases

### Case 1: Multiple Subtree Permissions

**Scenario:** User has `write` on subtree rooted at I1 and `read` on subtree rooted at I5 (where I5 is descendant of I1).

**Resolution:** Most specific permission wins. Since I5 is in I1's subtree, user has `write` on I5 (not just `read`).

### Case 2: Conflicting Permissions

**Scenario:** User has `write` on individual I1 but `read` on subtree rooted at I1.

**Resolution:** More specific permission wins. Individual permission (`write`) overrides subtree permission (`read`).

### Case 3: Expired Permissions

**Scenario:** User has `write` permission that expired yesterday.

**Resolution:** Expired permissions are ignored. User has no permission.

### Case 4: Family Member Permissions

**Scenario:** User has `write` on family F1. Can they edit husband I1?

**Resolution:** Yes. Family permission applies to all members. User can edit I1, wife, and children.

### Case 5: Subtree with Multiple Roots

**Scenario:** User is linked to I1 and I5 (siblings). They have subtree permissions on both.

**Resolution:** User has `write` on both subtrees. They can edit descendants of I1 and descendants of I5, but not each other (siblings are not in each other's subtrees).

---

## Performance Considerations

### Permission Caching

**Recommendation:** Cache permission checks for performance.

```javascript
// Cache structure
const permissionCache = new Map();

function getCacheKey(userId, treeId, resourceType, resourceId, permissionType) {
  return `${userId}:${treeId}:${resourceType}:${resourceId}:${permissionType}`;
}

function hasPermissionCached(userId, treeId, resourceType, resourceId, permissionType) {
  const cacheKey = getCacheKey(userId, treeId, resourceType, resourceId, permissionType);
  
  if (permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey);
  }
  
  const result = hasPermission(userId, treeId, resourceType, resourceId, permissionType);
  permissionCache.set(cacheKey, result);
  
  // Invalidate cache when permissions change
  return result;
}
```

### Database Indexes

**Critical indexes for performance:**
- `permissions(user_id, tree_id, resource_type, resource_id)` - Fast permission lookup
- `permissions(tree_id, resource_type, resource_id)` - Fast resource permission lookup
- `user_individual_links(user_id, tree_id)` - Fast link lookup

---

## Summary

### Permission Model

1. **Tree Owner:** Has all permissions (admin)
2. **User-Individual Link:** Grants write on individual + subtree, read on ancestors/siblings
3. **Explicit Permissions:** Can be granted by owner/admin
4. **Subtree Permissions:** Cascade down to descendants
5. **Public Trees:** Read-only for everyone

### Monica's Permissions (I1 in T1)

- ✅ Write: I1, descendants, families in subtree, spouses
- ✅ Read: Ancestors, siblings
- ❌ No permission: Unrelated individuals

### Implementation Priority

1. ✅ Schema designed
2. ⏳ Permission check functions
3. ⏳ Subtree detection (check if resource is descendant of subtree root)
4. ⏳ Automatic permission granting (on user-individual link)
5. ⏳ Permission caching
6. ⏳ Testing

