# Database Schema Plan - Executive Summary

**Date:** 2026-01-23  
**Status:** Planning Complete - Ready for Implementation

---

## ⭐ Key Permission Rule

**When user U is linked to individual I in tree T:**
- ✅ **Read access to entire tree T** - Can view all individuals, families, relationships
- ✅ **Write access to individual I** - Can edit their own record
- ✅ **Write access to subtree rooted at I** - Can edit all descendants and their families
- ❌ **No write access to rest of tree** - Cannot edit ancestors, siblings, or unrelated individuals

**Implementation:** Only 3 permissions needed (tree read, individual write, subtree write)

---

## Quick Answer to Your Questions

### 1. Users with username, password, email
✅ **Table:** `users`
- Fields: `id`, `username`, `email`, `password_hash`, `name`, `created_at`, `updated_at`, `last_login_at`, `is_active`

### 2. User Sessions
✅ **Table:** `sessions`
- Stores hashed JWT tokens for revocation
- Tracks: `user_id`, `token_hash`, `expires_at`, `ip_address`, `user_agent`, `is_revoked`

### 3. Link Users to Individuals
✅ **Table:** `user_individual_links`
- Links: `user_id` → `tree_id` → `individual_xref`
- Supports multiple links (Monica → I1 in T1, Monica → I10 in T2)

### 4. Permission System
✅ **Table:** `permissions`
- Flexible system supporting:
  - **Tree-level:** Who can access entire tree
  - **Individual-level:** Who can edit specific individuals
  - **Family-level:** Who can edit specific families
  - **Subtree-level:** Who can edit subtrees rooted at individuals

---

## Database Setup

### Go API Database Usage

- **Database:** `ligneous_graphs` (or similar)
- **Purpose:** Graph persistence (PostgreSQL + BadgerDB)
- **Connection:** Via `DATABASE_URL` environment variable
- **Format:** `postgres://user:password@host:5432/ligneous_graphs?sslmode=disable`

### Frontend Database

- **Database:** `ligneous_frontend` (separate database)
- **Purpose:** User management, permissions, tree metadata
- **Connection:** Via `DATABASE_URL` environment variable
- **Format:** `postgres://user:password@host:5432/ligneous_frontend?sslmode=disable`

**Recommendation:** Use separate databases for clean separation.

---

## Complete Schema (5 Tables)

### 1. `users` - User Accounts
- Primary key: `id` (UUID)
- Unique: `username`, `email`
- Fields: password hash, name, timestamps, active flag

### 2. `sessions` - User Sessions
- Primary key: `id` (UUID)
- Foreign key: `user_id` → `users.id`
- Fields: token hash, expires_at, ip_address, user_agent, revoked flag

### 3. `trees` - Tree Metadata
- Primary key: `id` (UUID) - frontend's `tree_id`
- Unique: `file_id` - Go API's `file_id`
- Foreign key: `owner_id` → `users.id`
- Fields: name, description, is_public, timestamps

### 4. `user_individual_links` - User-Individual Links
- Primary key: `id` (UUID)
- Foreign keys: `user_id` → `users.id`, `tree_id` → `trees.id`
- Unique: `(user_id, tree_id, individual_xref)`
- Fields: individual_xref (e.g., "I1"), verified flag

### 5. `permissions` - Permission System
- Primary key: `id` (UUID)
- Foreign keys: `user_id` → `users.id`, `tree_id` → `trees.id`
- Fields: `resource_type` (tree/individual/family/subtree), `resource_id` (xref or 'tree'), `permission_type` (read/write/delete/admin)
- Unique: `(user_id, tree_id, resource_type, resource_id, permission_type)`

---

## Monica's Example - Detailed

### Scenario
Monica is linked to:
- **I1 in T1** (Tree 1)
- **I10 in T2** (Tree 2)

### What Monica Can Do

#### For I1 in T1:

**✅ Read Permission (Entire Tree):**
- **All individuals** - Can view any individual in T1
- **All families** - Can view any family in T1
- **All relationships** - Can query any relationship in T1
- **Ancestors, siblings, unrelated individuals** - Can view everything

**✅ Write Permission (I1 and Subtree Only):**
- **I1** (herself) - Can edit her own record
- **All descendants of I1** - Can edit children, grandchildren, etc.
- **Families containing I1 or descendants** - Can edit families in subtree
- **Spouses of I1** (if in subtree) - Can edit spouse

**❌ No Write Permission:**
- Ancestors of I1 (read-only)
- Siblings of I1 (read-only)
- Unrelated individuals (read-only)
- Families outside subtree (read-only)

#### For I10 in T2:
Same rules apply.

### Automatic Permissions (When Monica Links to I1)

1. **Read on entire tree T1:**
   ```sql
   INSERT INTO permissions (user_id, tree_id, resource_type, resource_id, permission_type)
   VALUES ('monica-uuid', 't1-uuid', 'tree', 'tree', 'read');
   ```

2. **Write on I1:**
   ```sql
   INSERT INTO permissions (user_id, tree_id, resource_type, resource_id, permission_type)
   VALUES ('monica-uuid', 't1-uuid', 'individual', 'I1', 'write');
   ```

3. **Write on subtree rooted at I1:**
   ```sql
   INSERT INTO permissions (user_id, tree_id, resource_type, resource_id, permission_type)
   VALUES ('monica-uuid', 't1-uuid', 'subtree', 'I1', 'write');
   ```

**That's it!** Only 3 permissions needed. The tree-level read covers:
- All ancestors (no need to grant individual permissions)
- All siblings (no need to grant individual permissions)
- All unrelated individuals (no need to grant individual permissions)
- All families outside subtree (read-only via tree-level read)

Families in the subtree are automatically covered by the subtree permission.

---

## Permission Resolution

### Hierarchy (Most Specific First)

1. **Tree Owner** - Has all permissions (admin)
2. **Explicit Permission** - Specific permission on resource
3. **Subtree Permission** - If resource is in user's subtree
4. **Tree-Level Permission** - General tree access
5. **Public Tree** - Read-only for everyone (if tree is public)

### Permission Types

- **`read`** - Can view resource
- **`write`** - Can edit resource
- **`delete`** - Can delete resource
- **`admin`** - Full control (grant permissions, delete tree)

### Resource Types

- **`tree`** - Entire tree
- **`individual`** - Single individual (e.g., "I1")
- **`family`** - Single family (e.g., "F1")
- **`subtree`** - Subtree rooted at individual (e.g., "I1" = all descendants of I1)

---

## Key Decisions Made

### 1. Tree-Level Read Permission
✅ **Decision:** Read access to entire tree when user links to individual
- User can view ALL individuals, families, and relationships
- Simplifies permission model (one permission instead of many)
- Rationale: User should be able to explore entire tree for genealogy research

### 2. Write Permission Scope
✅ **Decision:** Write access only to linked individual and subtree
- User can edit their own record (I1)
- User can edit all descendants (subtree)
- User cannot edit ancestors, siblings, or unrelated individuals
- Rationale: User owns their branch but not the rest of the tree

### 3. Subtree Scope
✅ **Decision:** Subtree includes descendants, not ancestors
- Subtree permission cascades DOWN (to descendants)
- Does NOT cascade UP (to ancestors)
- Families in subtree are included (can edit)

### 4. Permission Simplification
✅ **Decision:** Tree-level read instead of individual permissions
- No need to grant read on each ancestor/sibling
- Single tree-level read permission covers everything
- Easier to manage and more performant

---

## Implementation Notes

### Permission Granting (On User-Individual Link)

When user links to individual:
1. Grant `read` on entire tree (tree-level)
2. Grant `write` on individual
3. Grant `write` on subtree rooted at individual

**That's it!** Only 3 permissions. No Go API queries needed.

### Permission Checking

```javascript
// Check if user can perform action
const canEdit = await hasPermission(userId, treeId, 'individual', 'I1', 'write');

// Permission check algorithm:
// 1. Is user tree owner? → YES
// 2. Check explicit permission → Check database
// 3. Check subtree permission → Query Go API to see if I1 is in any subtree
// 4. Check tree-level permission → Check database
// 5. Check public tree → Check tree.is_public
```

### Subtree Detection

To check if individual is in subtree:
1. Query Go API: `GET /api/v1/files/{file_id}/individuals/{subtree_root}/descendants`
2. Check if target individual is in descendants list
3. If yes, user has subtree permission

---

## Database Connection

### Environment Variables

```bash
# Frontend database
DATABASE_URL=postgres://user:password@localhost:5432/ligneous_frontend?sslmode=disable

# Go API database (for reference)
GO_API_DATABASE_URL=postgres://user:password@localhost:5432/ligneous_graphs?sslmode=disable
```

### Recommended Setup

1. **Same PostgreSQL instance** (easier management)
2. **Separate databases** (clean separation)
3. **Same user** (or separate users with appropriate permissions)

---

## Next Steps

1. ✅ Schema designed
2. ⏳ Create Prisma schema file
3. ⏳ Create database migrations
4. ⏳ Implement permission check functions
5. ⏳ Implement automatic permission granting
6. ⏳ Test permission scenarios

---

## Files Created

1. **`DATABASE_SCHEMA_PLAN.md`** - Complete schema design with all tables
2. **`PERMISSION_LOGIC.md`** - Detailed permission resolution logic
3. **`DATABASE_PLAN_SUMMARY.md`** - This summary document

---

## Questions Answered

✅ **Users:** Table designed with username, email, password hash  
✅ **Sessions:** Table designed with JWT token management  
✅ **User-Individual Links:** Table designed supporting multiple links  
✅ **Permissions:** Flexible system supporting tree/individual/family/subtree permissions  
✅ **Monica's Example:** Detailed analysis of what Monica can do  
✅ **Subtree Permissions:** Clear rules on what's included/excluded  
✅ **Family Permissions:** Rules for families containing user or descendants  
✅ **Ancestor/Sibling Permissions:** Decisions made (read-only)

---

**Status:** Ready for implementation! 🚀

