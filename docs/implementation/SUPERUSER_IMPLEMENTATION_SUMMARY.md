# Superuser and Multiple Tree Owners - Implementation Summary

**Date:** 2026-01-23  
**Status:** ✅ Implementation Complete

---

## Changes Made

### 1. ✅ Schema Updates

**Removed:**
- `Tree.ownerId` - Single owner field

**Added:**
- `TreeOwner` model - Supports multiple owners per tree
  - `treeId`, `userId` - Many-to-many relationship
  - `isPrimary` - Flag for primary owner
  - `addedBy` - Tracks who added the owner

**Updated:**
- `User` model relations - Changed from `ownedTrees` to `treeOwners`

### 2. ✅ Permission Utilities Created

**File:** `lib/permissions.js`

**Functions:**
- `isWebsiteOwner(userId)` - Check if user is superuser
- `isTreeOwner(userId, treeId)` - Check if user is an owner
- `isTreeMaintainer(userId, treeId)` - Check if user is a maintainer
- `hasPermission(...)` - Main permission check with priority:
  1. Website Owner (superuser) - **HIGHEST PRIORITY**
  2. Tree Owner
  3. Tree Maintainer
  4. Explicit permissions
  5. Subtree permissions
  6. Tree-level permissions
  7. Public tree (read-only)

**Helper Functions:**
- `getTreeOwners(treeId)` - Get all owners of a tree
- `addTreeOwner(...)` - Add an owner to a tree
- `removeTreeOwner(...)` - Remove an owner from a tree

### 3. ✅ Seed Script Created

**File:** `prisma/seed.js`

**Creates:**
- Website owner user:
  - Username: `monalig`
  - Email: `monalig@ligneous.local`
  - Password: `Oscar890!`
  - `isWebsiteOwner: true`

**Run with:**
```bash
npm run db:seed
# or
npx prisma db seed
```

---

## Next Steps

### 1. Database Migration

**Before running migrations:**
- If you have existing data, you'll need to migrate existing `Tree.ownerId` values to `TreeOwner` records
- Create a migration script to handle this

**Run migration:**
```bash
npx prisma migrate dev --name add_multiple_tree_owners
```

### 2. Update Tree Creation Logic

When creating trees, you should:
1. Create the tree
2. Add creator as primary owner
3. Automatically add website owner (if exists and not the creator)

**Example:**
```javascript
import { prisma } from './lib/prisma.js';
import { addTreeOwner } from './lib/permissions.js';

async function createTree(userId, treeData) {
  // 1. Create the tree
  const tree = await prisma.tree.create({
    data: {
      fileId: treeData.fileId,
      name: treeData.name,
      description: treeData.description,
      isPublic: treeData.isPublic || false,
    },
  });

  // 2. Add creator as primary owner
  await addTreeOwner(tree.id, userId, userId, true);

  // 3. If website owner exists and is not the creator, grant them access
  const websiteOwner = await prisma.user.findFirst({
    where: { isWebsiteOwner: true },
  });

  if (websiteOwner && websiteOwner.id !== userId) {
    await addTreeOwner(tree.id, websiteOwner.id, userId, false);
  }

  return tree;
}
```

### 3. Update API Routes

Any API routes that reference `tree.ownerId` need to be updated to use:
- `getTreeOwners(treeId)` - Get all owners
- `isTreeOwner(userId, treeId)` - Check ownership
- `hasPermission(...)` - Check permissions (includes website owner check)

---

## Testing

### Test Website Owner Access

1. **Create website owner:**
   ```bash
   npm run db:seed
   ```

2. **Login as website owner:**
   - Username: `monalig`
   - Password: `Oscar890!`

3. **Verify superuser access:**
   - Should have access to all trees
   - Should bypass all permission checks
   - Should be able to manage all users and trees

### Test Multiple Owners

1. **Create a tree** (as any user)
2. **Add additional owners** using `addTreeOwner()`
3. **Verify all owners have equal permissions**

---

## Security Notes

### Website Owner (Superuser)

- **Highest priority** in permission checks
- Has **absolute access** to everything
- Bypasses all other permission checks
- Can manage all trees, users, and permissions
- Only **ONE** user should have `isWebsiteOwner: true`

### Multiple Tree Owners

- All owners have **equal permissions** (admin access)
- Any owner can:
  - Edit tree settings
  - Add/remove other owners
  - Delete the tree
- Primary owner flag (`isPrimary`) is for display purposes only

### Permission Hierarchy

1. **Website Owner** - Absolute access (superuser)
2. **Tree Owner** - All permissions on specific tree
3. **Tree Maintainer** - Admin permissions on specific tree
4. **Explicit Permissions** - Resource-specific permissions
5. **Subtree Permissions** - Descendant-based permissions
6. **Tree-level Permissions** - General tree access
7. **Public Tree** - Read-only for everyone

---

## Files Changed

1. ✅ `prisma/schema.prisma` - Updated schema
2. ✅ `lib/permissions.js` - New permission utilities
3. ✅ `prisma/seed.js` - New seed script
4. ✅ `package.json` - Added seed script

---

## Migration Notes

**If you have existing data:**

You'll need to create a migration script to:
1. Create `tree_owners` table
2. Migrate existing `Tree.ownerId` values to `TreeOwner` records
3. Set first owner as `isPrimary: true`
4. Remove `owner_id` column from `trees` table

**Example migration SQL:**
```sql
-- Create tree_owners table (Prisma will do this)
-- Migrate existing owners
INSERT INTO tree_owners (id, tree_id, user_id, is_primary, created_at, added_by)
SELECT 
  gen_random_uuid(),
  id,
  owner_id,
  true,
  created_at,
  owner_id
FROM trees;

-- Remove owner_id column (after verifying migration)
ALTER TABLE trees DROP COLUMN owner_id;
```

---

**Status:** ✅ Ready for database migration and testing!


