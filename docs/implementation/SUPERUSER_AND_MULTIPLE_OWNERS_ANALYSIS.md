# Superuser and Multiple Tree Owners - Analysis

**Date:** 2026-01-23  
**Status:** Analysis - Changes Needed

---

## Current State

### ✅ What We Have

1. **Website Owner Field**
   - `User.isWebsiteOwner` (Boolean) - exists in schema
   - Documented in `DATABASE_SCHEMA_PLAN.md` as having read/write access to all trees
   - **BUT:** Not checked in permission logic!

2. **Tree Ownership**
   - `Tree.ownerId` - single owner (one-to-many relationship)
   - Only ONE owner per tree currently

3. **Tree Maintainers**
   - `TreeMaintainer` table - supports multiple maintainers per tree
   - Maintainers have admin access to specific tree

---

## ❌ What's Missing

### 1. Website Owner Not Checked in Permission Logic

**Current Permission Check Algorithm** (from `PERMISSION_LOGIC.md`):
```javascript
function hasPermission(userId, treeId, resourceType, resourceId, permissionType) {
  // Step 1: Check if user is tree owner
  if (isTreeOwner(userId, treeId)) {
    return true;
  }
  // ... rest of checks
}
```

**Problem:** Website owner is never checked! The algorithm should check website owner FIRST.

**Fix Needed:**
```javascript
function hasPermission(userId, treeId, resourceType, resourceId, permissionType) {
  // Step 0: Check if user is website owner (SUPERUSER)
  if (isWebsiteOwner(userId)) {
    return true;  // Superuser has absolute access to everything
  }
  
  // Step 1: Check if user is tree owner
  if (isTreeOwner(userId, treeId)) {
    return true;
  }
  // ... rest of checks
}
```

### 2. Single Tree Owner Limitation

**Current Schema:**
```prisma
model Tree {
  ownerId     String    @map("owner_id") @db.Uuid
  owner       User      @relation("TreeOwner", fields: [ownerId], references: [id])
}
```

**Problem:** Only ONE owner per tree. We need multiple owners.

**Options:**

**Option A: Many-to-Many Relationship (Recommended)**
- Create `TreeOwner` table (similar to `TreeMaintainer`)
- Remove `ownerId` from `Tree` model
- Multiple owners per tree

**Option B: Keep Primary Owner + Additional Owners**
- Keep `ownerId` as primary owner
- Add `TreeOwner` table for additional owners
- More complex, but preserves "primary owner" concept

**Recommendation:** Option A (cleaner, more flexible)

### 3. Automatic Superuser Access on Tree Creation

**Current State:** No automatic access granted to website owner when tree is created.

**Fix Needed:** When a tree is created:
1. Create the tree
2. If a website owner exists, automatically grant them access (as maintainer or owner)

---

## Proposed Changes

### 1. Schema Changes

#### Option A: Multiple Owners (Recommended)

**Remove `ownerId` from Tree:**
```prisma
model Tree {
  id          String    @id @default(uuid()) @db.Uuid
  fileId      String    @unique @map("file_id") @db.VarChar(255)
  name        String    @db.VarChar(255)
  description String?   @db.Text
  // REMOVED: ownerId
  isPublic    Boolean   @default(false) @map("is_public")
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  owners              TreeOwner[]  // NEW: Multiple owners
  userIndividualLinks UserIndividualLink[]
  permissions        Permission[]
  treeMaintainers    TreeMaintainer[]
  accessRequests     AccessRequest[]
  privateData        PrivateData[]

  @@index([fileId])
  @@index([isPublic])
  @@map("trees")
}
```

**Add TreeOwner Table:**
```prisma
model TreeOwner {
  id        String    @id @default(uuid()) @db.Uuid
  treeId    String    @map("tree_id") @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  isPrimary Boolean   @default(false) @map("is_primary")  // First owner is primary
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  addedBy   String?   @map("added_by") @db.Uuid

  tree    Tree  @relation(fields: [treeId], references: [id], onDelete: Cascade)
  user    User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  adder   User? @relation("OwnerAddedBy", fields: [addedBy], references: [id])

  @@unique([treeId, userId])
  @@index([treeId])
  @@index([userId])
  @@index([treeId, isPrimary])
  @@map("tree_owners")
}
```

**Update User Model:**
```prisma
model User {
  // ... existing fields ...
  
  // Relations
  ownedTrees           TreeOwner[]  // Changed from Tree[]
  // ... rest of relations ...
}
```

#### Option B: Keep Primary Owner + Additional Owners

**Keep `ownerId` in Tree:**
```prisma
model Tree {
  ownerId     String    @map("owner_id") @db.Uuid  // Primary owner
  owner       User      @relation("PrimaryTreeOwner", fields: [ownerId], references: [id])
  additionalOwners TreeOwner[]  // Additional owners
}
```

**Add TreeOwner for Additional Owners:**
```prisma
model TreeOwner {
  // Same as Option A, but only for additional owners
  // Primary owner is in Tree.ownerId
}
```

**Recommendation:** Option A is cleaner and more flexible.

### 2. Permission Logic Changes

**Updated Permission Check Algorithm:**
```javascript
async function hasPermission(userId, treeId, resourceType, resourceId, permissionType) {
  // Step 0: Check if user is website owner (SUPERUSER) - HIGHEST PRIORITY
  const user = await getUser(userId);
  if (user?.isWebsiteOwner) {
    return true;  // Superuser has absolute access to everything
  }
  
  // Step 1: Check if user is tree owner (any owner, not just primary)
  const isOwner = await isTreeOwner(userId, treeId);
  if (isOwner) {
    return true;  // Any owner has all permissions
  }
  
  // Step 2: Check if user is tree maintainer
  const isMaintainer = await isTreeMaintainer(userId, treeId);
  if (isMaintainer) {
    return true;  // Maintainers have admin access
  }
  
  // Step 3: Check explicit permission on the specific resource
  const explicitPerm = await getPermission(userId, treeId, resourceType, resourceId, permissionType);
  if (explicitPerm && !isExpired(explicitPerm)) {
    return true;
  }
  
  // Step 4: Check subtree permissions (if resource is individual or family)
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
  
  // Step 5: Check tree-level permission
  const treePerm = await getPermission(userId, treeId, 'tree', 'tree', permissionType);
  if (treePerm && !isExpired(treePerm)) {
    return true;
  }
  
  // Step 6: Check public tree (read-only)
  const tree = await getTree(treeId);
  if (tree?.isPublic && permissionType === 'read') {
    return true;
  }
  
  return false;
}
```

**Helper Functions:**
```javascript
async function isTreeOwner(userId, treeId) {
  const owner = await prisma.treeOwner.findFirst({
    where: {
      treeId,
      userId,
    },
  });
  return !!owner;
}

async function isTreeMaintainer(userId, treeId) {
  const maintainer = await prisma.treeMaintainer.findFirst({
    where: {
      treeId,
      userId,
    },
  });
  return !!maintainer;
}
```

### 3. Tree Creation Logic

**When Creating a Tree:**
```javascript
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
  await prisma.treeOwner.create({
    data: {
      treeId: tree.id,
      userId: userId,
      isPrimary: true,
      addedBy: userId,
    },
  });
  
  // 3. If website owner exists and is not the creator, grant them access
  const websiteOwner = await prisma.user.findFirst({
    where: { isWebsiteOwner: true },
  });
  
  if (websiteOwner && websiteOwner.id !== userId) {
    // Option A: Add as owner
    await prisma.treeOwner.create({
      data: {
        treeId: tree.id,
        userId: websiteOwner.id,
        isPrimary: false,
        addedBy: userId,  // Creator added the website owner
      },
    });
    
    // Option B: Add as maintainer (alternative)
    // await prisma.treeMaintainer.create({
    //   data: {
    //     treeId: tree.id,
    //     userId: websiteOwner.id,
    //     addedBy: userId,
    //   },
    // });
  }
  
  return tree;
}
```

**Recommendation:** Add website owner as an owner (not just maintainer) so they have full control.

---

## Security Considerations

### 1. Website Owner Access

**Question:** Should website owner have access to:
- ✅ All trees? YES
- ✅ All users? YES (can manage users)
- ✅ All permissions? YES (can grant/revoke any permission)
- ✅ System settings? YES (can change global settings)

**Implementation:** Check `isWebsiteOwner` FIRST in all permission checks.

### 2. Multiple Owners

**Question:** What happens when there are multiple owners?
- ✅ All owners have equal permissions (admin access)
- ✅ Any owner can add/remove other owners (unless restricted)
- ✅ Any owner can delete the tree (unless restricted)

**Recommendation:** All owners have equal permissions. If you need hierarchy, use maintainers.

### 3. Owner vs Maintainer

**Current Design:**
- **Owners:** Have admin access, can manage tree settings, can delete tree
- **Maintainers:** Have admin access, can manage permissions, but cannot delete tree

**Question:** Should owners be able to delete trees that they don't own?

**Recommendation:** Only owners can delete trees. Maintainers cannot delete trees.

---

## Migration Strategy

### 1. Database Migration

**Step 1:** Create `tree_owners` table
**Step 2:** Migrate existing `Tree.ownerId` to `TreeOwner` records
**Step 3:** Remove `ownerId` column from `trees` table
**Step 4:** Update all queries to use `TreeOwner` instead of `Tree.ownerId`

### 2. Code Migration

**Step 1:** Update permission check functions
**Step 2:** Update tree creation logic
**Step 3:** Update tree owner management functions
**Step 4:** Update all API routes that reference `tree.ownerId`

---

## Summary

### ✅ What We Need to Add

1. **Website Owner Check** - Add as first step in all permission checks
2. **Multiple Tree Owners** - Replace single `ownerId` with `TreeOwner` table
3. **Automatic Superuser Access** - Grant website owner access when trees are created

### ✅ What We Already Have

1. `isWebsiteOwner` field in User model
2. `TreeMaintainer` table for multiple maintainers
3. Permission system that can be extended

### ⚠️ Breaking Changes

1. `Tree.ownerId` will be removed (if we choose Option A)
2. All queries using `tree.ownerId` need to be updated
3. API responses that include `ownerId` need to return `owners[]` instead

---

## Next Steps

1. **Decide on Option A vs Option B** for multiple owners
2. **Update Prisma schema** with chosen approach
3. **Create migration** to move existing data
4. **Update permission logic** to check website owner first
5. **Update tree creation** to grant website owner access
6. **Update all API routes** to use new owner model
7. **Test thoroughly** with multiple owners and website owner

---

**Status:** Ready for implementation decision


