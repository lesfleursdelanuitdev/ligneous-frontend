# Owner vs Maintainer - Role Comparison

**Date:** 2026-01-23  
**Status:** Current Implementation Analysis

---

## Current Implementation

### Tree Owner

**Storage:** `tree_owners` table
- Multiple owners per tree
- `isPrimary` flag to mark primary owner
- `addedBy` tracks who added the owner

**Permissions:**
- ✅ Full read access to entire tree
- ✅ Full write access to entire tree
- ✅ Can add/remove other owners
- ✅ Can add/remove maintainers
- ✅ Can manage tree settings
- ✅ Can delete the tree
- ✅ Can grant/revoke permissions

**Priority:** Checked second (after website owner)

### Tree Maintainer

**Storage:** `tree_maintainers` table
- Multiple maintainers per tree
- `addedBy` tracks who added the maintainer

**Permissions:**
- ✅ Full read access to entire tree
- ✅ Full write access to entire tree
- ✅ Can add/remove maintainers (but not owners)
- ✅ Can manage tree settings
- ✅ Can grant/revoke permissions
- ❌ Cannot delete the tree
- ❌ Cannot add/remove owners

**Priority:** Checked third (after tree owner)

---

## Key Differences

### 1. Tree Deletion

**Owner:**
- ✅ Can delete the tree

**Maintainer:**
- ❌ Cannot delete the tree

**Note:** This is a conceptual difference. The current permission system doesn't explicitly check for tree deletion separately - it would need to be implemented in the tree deletion API route.

### 2. Owner Management

**Owner:**
- ✅ Can add/remove other owners
- ✅ Can add/remove maintainers

**Maintainer:**
- ❌ Cannot add/remove owners
- ✅ Can add/remove maintainers

**Note:** This is a conceptual difference. The current permission system doesn't explicitly check for owner management - it would need to be implemented in the owner management API routes.

### 3. Primary Owner

**Owner:**
- Has `isPrimary` flag (for display purposes)
- First owner is typically marked as primary

**Maintainer:**
- No primary flag
- All maintainers have equal status

---

## Current Permission Logic

In the current implementation, both owners and maintainers have the same permissions checked:

```javascript
// Tree Owner check
if (userId && await isTreeOwner(userId, treeId)) {
  return true; // Any owner has all permissions (full read and write)
}

// Tree Maintainer check
if (userId && await isTreeMaintainer(userId, treeId)) {
  return true; // Maintainers have admin access
}
```

Both return `true` for all permission checks, meaning they have the same functional permissions in the current implementation.

---

## Recommended Implementation

To properly distinguish between owners and maintainers, you should:

### 1. Add Owner-Only Checks

For operations that only owners can do:

```javascript
// Check if user can delete tree
export async function canDeleteTree(userId, treeId) {
  // Only owners can delete trees
  return await isTreeOwner(userId, treeId);
}

// Check if user can manage owners
export async function canManageOwners(userId, treeId) {
  // Only owners can manage owners
  return await isTreeOwner(userId, treeId);
}

// Check if user can manage maintainers
export async function canManageMaintainers(userId, treeId) {
  // Both owners and maintainers can manage maintainers
  return await isTreeOwner(userId, treeId) || await isTreeMaintainer(userId, treeId);
}
```

### 2. Update API Routes

In tree management API routes:

```javascript
// DELETE /api/trees/:id
export async function DELETE(request, { params }) {
  const userId = await getUserId(request);
  const treeId = params.id;
  
  // Only owners can delete trees
  if (!await canDeleteTree(userId, treeId)) {
    return new Response('Only tree owners can delete trees', { status: 403 });
  }
  
  // Delete tree...
}

// POST /api/trees/:id/owners
export async function POST(request, { params }) {
  const userId = await getUserId(request);
  const treeId = params.id;
  
  // Only owners can add/remove owners
  if (!await canManageOwners(userId, treeId)) {
    return new Response('Only tree owners can manage owners', { status: 403 });
  }
  
  // Add/remove owner...
}
```

---

## Summary

### Current State

**Functionally:** Owners and maintainers have the same permissions in the permission checking system.

**Conceptually:** 
- Owners can delete trees and manage owners
- Maintainers cannot delete trees or manage owners
- Both can manage maintainers and have full read/write access

### Recommended Changes

1. **Add owner-only permission checks** for:
   - Tree deletion
   - Owner management

2. **Update API routes** to use these checks

3. **Document the difference** clearly in the API

---

## Use Cases

### When to Use Owners

- **Primary creator** of the tree
- **Co-owners** who should have full control
- **People who can delete** the tree

### When to Use Maintainers

- **Trusted collaborators** who need admin access
- **People who can manage permissions** but shouldn't delete the tree
- **People who can manage other maintainers** but not owners

---

**Status:** Current implementation treats them the same functionally. Owner-only operations need to be implemented in API routes.


