# Database Schema Plan

**Date:** 2026-01-23  
**Status:** Planning Phase - No Implementation Yet  
**Database:** PostgreSQL (same as Go API)

---

## ⭐ Key Permission Rule

**When user U is linked to individual I in tree T:**
- ✅ **Read access to entire tree T** - Can view all individuals, families, relationships
- ✅ **Write access to individual I** - Can edit their own record
- ✅ **Write access to subtree rooted at I** - Can edit all descendants and their families
- ❌ **No write access to rest of tree** - Cannot edit ancestors, siblings, or unrelated individuals

**Implementation:** Only 3 permissions needed (tree read, individual write, subtree write)

---

## Go API Database Usage

### How Go API Uses PostgreSQL

The Go API uses PostgreSQL for:
- **Graph Persistence**: Storing graph metadata and structure
- **Hybrid Storage**: PostgreSQL (metadata) + BadgerDB (graph structure)
- **Connection**: Via `DATABASE_URL` environment variable
- **Format**: `postgres://user:password@host:port/database?sslmode=disable`

**Important:** The Go API manages its own database schema internally. We need a **separate database** or **separate schema** for the frontend's user management and permissions.

### Recommended Approach

**Option 1: Separate Database (Recommended)**
- Go API: `ligneous_graphs` database
- Frontend: `ligneous_frontend` database
- Same PostgreSQL instance, different databases

**Option 2: Separate Schema**
- Go API: `public` schema (or `graphs` schema)
- Frontend: `frontend` schema
- Same database, different schemas

**Recommendation:** Use separate database for cleaner separation and easier management.

---

## GEDCOM Data Model (From Go API)

### Entities

1. **Tree (File)**
   - Each GEDCOM file = one tree
   - Identified by `file_id` (UUID) in Go API
   - Contains individuals and families

2. **Individual**
   - Identified by `xref` (e.g., "I1", "I2")
   - Has: name, sex, birth date/place, death date/place
   - Connected to families as: child, spouse, parent

3. **Family**
   - Identified by `xref` (e.g., "F1", "F2")
   - Contains: husband, wife, children
   - Represents a marriage/union

### Relationships

- **Individual → Family**: As child (via `FAMC`), as spouse (via `FAMS`)
- **Family → Individual**: Husband, wife, children
- **Individual → Individual**: Via families (parents, children, siblings, spouses)

### Graph Structure

The Go API builds a graph where:
- **Nodes**: Individuals and Families
- **Edges**: Relationships (parent-child, spouse, etc.)
- **Subtree**: All descendants/ancestors of a particular individual

---

## Frontend Database Schema

### 1. Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
  name VARCHAR(255),  -- Display name
  is_website_owner BOOLEAN DEFAULT FALSE,  -- Single user with access to all trees
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

**Fields:**
- `id`: Primary key (UUID)
- `username`: Unique username (min 3 chars)
- `email`: Unique email address
- `password_hash`: Bcrypt hashed password
- `name`: Display name (optional)
- `is_website_owner`: Single user with read/write access to ALL trees (only one user should have this)
- `created_at`, `updated_at`: Timestamps
- `last_login_at`: Track last login
- `is_active`: Soft delete flag

**Website Owner:**
- Only ONE user should have `is_website_owner = TRUE`
- Has read and write access to all trees
- Can manage all trees, users, and permissions

---

### 2. Sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,  -- Hashed JWT token
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  is_revoked BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT expires_future CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_active ON sessions(user_id, is_revoked, expires_at) WHERE is_revoked = FALSE;
```

**Fields:**
- `id`: Primary key
- `user_id`: Foreign key to users
- `token_hash`: Hashed JWT token (for revocation)
- `expires_at`: Token expiration time
- `created_at`, `last_used_at`: Timestamps
- `ip_address`, `user_agent`: Security tracking
- `is_revoked`: Revocation flag

**Session Management:**
- JWT tokens stored as hashes (can't be reverse-engineered)
- Tokens can be revoked by setting `is_revoked = TRUE`
- Expired tokens automatically invalid
- `last_used_at` updated on each request

---

### 3. Trees Table

```sql
CREATE TABLE trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id VARCHAR(255) UNIQUE NOT NULL,  -- Go API's file_id
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,  -- Public: anyone can view (read-only), Private: only registered users with access
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT name_length CHECK (char_length(name) >= 1)
);

CREATE INDEX idx_trees_owner_id ON trees(owner_id);
CREATE INDEX idx_trees_file_id ON trees(file_id);
CREATE INDEX idx_trees_public ON trees(is_public) WHERE is_public = TRUE;
```

**Fields:**
- `id`: Primary key (tree_id in frontend)
- `file_id`: Go API's file_id (UUID string)
- `name`: Tree name
- `description`: Optional description
- `owner_id`: User who owns the tree
- `is_public`: Public visibility flag
  - **TRUE (Public)**: Anyone can view (read-only), but cannot edit
  - **FALSE (Private)**: Only registered users with read access can view
- `created_at`, `updated_at`: Timestamps

**Purpose:**
- Maps frontend `tree_id` → Go API `file_id`
- Tracks tree ownership
- Stores tree metadata
- Controls public/private visibility

---

### 4. User-Individual Links Table

```sql
CREATE TABLE user_individual_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  individual_xref VARCHAR(50) NOT NULL,  -- e.g., "I1", "I2"
  verified BOOLEAN DEFAULT FALSE,  -- User confirmed this is them
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_tree_individual UNIQUE (user_id, tree_id, individual_xref),
  CONSTRAINT xref_format CHECK (individual_xref ~* '^I[0-9]+$')
);

CREATE INDEX idx_links_user_id ON user_individual_links(user_id);
CREATE INDEX idx_links_tree_id ON user_individual_links(tree_id);
CREATE INDEX idx_links_individual ON user_individual_links(tree_id, individual_xref);
CREATE INDEX idx_links_verified ON user_individual_links(user_id, verified) WHERE verified = TRUE;
```

**Fields:**
- `id`: Primary key
- `user_id`: User being linked
- `tree_id`: Tree containing the individual
- `individual_xref`: Individual identifier (e.g., "I1", "I10")
- `verified`: User confirmed this link is correct
- `created_at`, `updated_at`: Timestamps

**Purpose:**
- Links users to individuals in trees
- Supports multiple links (user can be I1 in T1 and I10 in T2)
- `verified` flag for user confirmation

**Example:**
- Monica → I1 in T1
- Monica → I10 in T2

---

### 5. Permission Model

We need a flexible permission system that supports:
- Tree-level permissions
- Individual-level permissions
- Family-level permissions
- Subtree-level permissions (rooted at an individual)

#### Permission Types

```sql
CREATE TYPE permission_type AS ENUM (
  'read',      -- Can view
  'write',     -- Can edit
  'delete',    -- Can delete
  'admin'      -- Full control
);

CREATE TYPE resource_type AS ENUM (
  'tree',      -- Entire tree
  'individual', -- Single individual
  'family',    -- Single family
  'subtree'    -- Subtree rooted at individual
);
```

#### Permissions Table

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  resource_id VARCHAR(255) NOT NULL,  -- xref for individual/family, or 'tree' for tree
  permission_type permission_type NOT NULL,
  granted_by UUID REFERENCES users(id),  -- Who granted this permission
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,  -- Optional expiration
  notes TEXT,  -- Optional notes about the permission
  
  CONSTRAINT unique_permission UNIQUE (user_id, tree_id, resource_type, resource_id, permission_type),
  CONSTRAINT resource_id_format CHECK (
    (resource_type = 'tree' AND resource_id = 'tree') OR
    (resource_type = 'individual' AND resource_id ~* '^I[0-9]+$') OR
    (resource_type = 'family' AND resource_id ~* '^F[0-9]+$') OR
    (resource_type = 'subtree' AND resource_id ~* '^I[0-9]+$')
  )
);

CREATE INDEX idx_permissions_user_tree ON permissions(user_id, tree_id);
CREATE INDEX idx_permissions_resource ON permissions(tree_id, resource_type, resource_id);
CREATE INDEX idx_permissions_expires ON permissions(expires_at) WHERE expires_at IS NOT NULL;
```

**Fields:**
- `id`: Primary key
- `user_id`: User who has the permission
- `tree_id`: Tree the permission applies to
- `resource_type`: Type of resource (tree, individual, family, subtree)
- `resource_id`: Identifier of the resource
  - `'tree'` for tree-level
  - `'I1'`, `'I2'` for individuals
  - `'F1'`, `'F2'` for families
  - `'I1'` for subtrees (rooted at I1)
- `permission_type`: Type of permission (read, write, delete, admin)
- `granted_by`: User who granted the permission
- `granted_at`: When permission was granted
- `expires_at`: Optional expiration
- `notes`: Optional notes

**Examples:**

1. **Tree-level permission:**
   ```sql
   INSERT INTO permissions (user_id, tree_id, resource_type, resource_id, permission_type)
   VALUES ('user-uuid', 'tree-uuid', 'tree', 'tree', 'read');
   ```

2. **Individual-level permission:**
   ```sql
   INSERT INTO permissions (user_id, tree_id, resource_type, resource_id, permission_type)
   VALUES ('user-uuid', 'tree-uuid', 'individual', 'I1', 'write');
   ```

3. **Family-level permission:**
   ```sql
   INSERT INTO permissions (user_id, tree_id, resource_type, resource_id, permission_type)
   VALUES ('user-uuid', 'tree-uuid', 'family', 'F1', 'read');
   ```

4. **Subtree-level permission:**
   ```sql
   INSERT INTO permissions (user_id, tree_id, resource_type, resource_id, permission_type)
   VALUES ('user-uuid', 'tree-uuid', 'subtree', 'I1', 'write');
   ```

---

## Permission Resolution Logic

### Default Permissions

1. **Website Owner:**
   - User with `is_website_owner = TRUE`
   - Has `read` and `write` access to ALL trees
   - Can manage all trees, users, and permissions
   - Only ONE user should have this flag

2. **Tree Owner:**
   - Has `admin` permission on entire tree
   - Implicitly has all permissions on all resources in the tree
   - Automatically a maintainer (implicit)

3. **Tree Maintainers:**
   - Users listed in `tree_maintainers` table
   - Have `admin` permission on the specific tree
   - Can grant/revoke permissions, edit anything, manage the tree
   - Multiple maintainers per tree allowed

4. **User-Individual Link:**
   - When user is linked to an individual, they get:
     - `read` permission on entire tree
     - `write` permission on that individual
     - `write` permission on subtree rooted at that individual

5. **Public Trees:**
   - If `is_public = TRUE`: Anyone can view (read-only), but cannot edit
   - Public visitors cannot see private data (only registered users can)
   - Registered users with read access can see private data

6. **Private Trees:**
   - If `is_public = FALSE`: Only registered users with read access can view
   - Must have explicit permission or be linked to an individual

### Permission Hierarchy

Permissions are checked in this order (most specific first):

1. **Website Owner** - Has access to all trees
2. **Tree Owner** - Has all permissions on their tree
3. **Tree Maintainer** - Has admin permissions on the tree
4. **Explicit permission** on the specific resource
5. **Subtree permission** (if resource is within a subtree)
6. **Tree-level permission** (if no specific permission)
7. **Public tree** (if tree is public, read-only for everyone, but private data hidden)
8. **Private tree** (if tree is private, must have explicit permission)

### Permission Check Algorithm

```javascript
function hasPermission(userId, treeId, resourceType, resourceId, permissionType) {
  // 1. Check if user is tree owner
  if (isTreeOwner(userId, treeId)) {
    return true;  // Owner has all permissions
  }
  
  // 2. Check explicit permission on resource
  if (hasExplicitPermission(userId, treeId, resourceType, resourceId, permissionType)) {
    return true;
  }
  
  // 3. Check subtree permission (if resource is individual or family)
  if (resourceType === 'individual' || resourceType === 'family') {
    const subtreeRoots = getSubtreeRootsForUser(userId, treeId);
    if (isInSubtree(resourceId, subtreeRoots)) {
      return hasSubtreePermission(userId, treeId, subtreeRoots, permissionType);
    }
  }
  
  // 4. Check tree-level permission
  if (hasTreePermission(userId, treeId, permissionType)) {
    return true;
  }
  
  // 5. Check public tree (read-only)
  if (isPublicTree(treeId) && permissionType === 'read') {
    return true;
  }
  
  return false;
}
```

---

## Monica's Example - Detailed Analysis

### Scenario

Monica is linked to:
- **I1 in T1** (Tree 1)
- **I10 in T2** (Tree 2)

### GEDCOM Structure Context

From the Go API, we know:
- **Individuals** are identified by `xref` (e.g., "I1", "I2", "I10")
- **Families** are identified by `xref` (e.g., "F1", "F2")
- **Relationships:**
  - Individual → Family: As child (FAMC), as spouse (FAMS)
  - Family → Individual: Husband, wife, children
  - Individual → Individual: Via families (parents, children, siblings, spouses, ancestors, descendants)

### What Monica Should Be Able To Do

#### For I1 in T1:

**1. Read Entire Tree T1:**
- ✅ **Permission:** `read` on entire tree T1
- **Source:** User-individual link automatically grants this
- **Scope:** Can view ALL individuals, families, and relationships in T1
- **Action:** Can query any individual, family, or relationship in the tree
- **Rationale:** User should be able to explore the entire tree for genealogy research

**2. Edit Individual I1:**
- ✅ **Permission:** `write` on individual I1
- **Source:** User-individual link automatically grants this
- **Action:** Can edit I1's name, birth date, death date, etc.

**3. Edit Subtree Rooted at I1:**
- ✅ **Permission:** `write` on subtree rooted at I1
- **Source:** User-individual link automatically grants this
- **Scope:** All descendants of I1 (children, grandchildren, great-grandchildren, etc.)
- **Includes:**
  - All descendant individuals (I1's children, grandchildren, etc.)
  - All families where I1 or descendants are members
  - All individuals connected to descendants (spouses of descendants via families)

**4. Read (But Not Edit) Rest of Tree:**
- ✅ **Permission:** `read` on all other resources (via tree-level read)
- **Scope:** Ancestors, siblings, unrelated individuals, families not in subtree
- **Action:** Can view but cannot edit
- **Rationale:** User can explore the entire tree but can only edit their own branch

#### For I10 in T2:

Same rules apply as for I1 in T1.

### Permission Matrix for Monica (I1 in T1)

| Resource | Permission | Source | Rationale |
|----------|-----------|--------|-----------|
| **Entire Tree T1** | `read` | User-individual link | Can view everything in tree |
| **I1** (herself) | `write` | User-individual link | Can edit her own record |
| **Descendants of I1** | `write` | Subtree permission | Can edit her descendants |
| **Families with I1 or descendants** | `write` | Subtree permission | Can edit families in subtree |
| **Ancestors of I1** | `read` | Tree-level read | Can view but not edit ancestors |
| **Siblings of I1** | `read` | Tree-level read | Can view siblings but not edit |
| **Spouses of I1** | `write` | Subtree permission | Can edit spouse (in subtree) |
| **Unrelated individuals** | `read` | Tree-level read | Can view but not edit |
| **Other families** | `read` | Tree-level read | Can view but not edit |

### Implementation Details

When Monica links to I1:

```sql
-- 1. Create user-individual link
INSERT INTO user_individual_links (user_id, tree_id, individual_xref, verified)
VALUES ('monica-uuid', 't1-uuid', 'I1', TRUE);

-- 2. Automatically grant permissions (only 3 permissions needed!)
INSERT INTO permissions (user_id, tree_id, resource_type, resource_id, permission_type)
VALUES 
  -- Read permission on entire tree (covers all individuals, families, relationships)
  ('monica-uuid', 't1-uuid', 'tree', 'tree', 'read'),
  -- Write permission on I1 (her own record)
  ('monica-uuid', 't1-uuid', 'individual', 'I1', 'write'),
  -- Write permission on subtree rooted at I1 (all descendants)
  ('monica-uuid', 't1-uuid', 'subtree', 'I1', 'write');
```

**Note:** No need to query Go API for ancestors/siblings - tree-level read covers everything. Much simpler!

---

## Permission Rules

### Rule 1: Tree Owner

- Has `admin` permission on entire tree
- Can grant/revoke permissions
- Can delete tree
- Can edit any resource in tree

### Rule 2: User-Individual Link

**Key Rule:** When user U is linked to individual I in tree T:
- ✅ **Read access to entire tree T** - Can view all individuals, families, and relationships
- ✅ **Write access to individual I** - Can edit their own record
- ✅ **Write access to subtree rooted at I** - Can edit all descendants and their families
- ❌ **No write access to rest of tree** - Cannot edit ancestors, siblings, or unrelated individuals

**Summary:**
- `read` permission on entire tree (tree-level)
- `write` permission on individual I
- `write` permission on subtree rooted at I
- `write` permission on families in subtree

### Rule 3: Explicit Permissions & Access Requests

**Explicit Permissions:**
- Can be granted by tree owner
- Can be granted by tree maintainers
- Can be granted by users with `admin` permission
- Can be tree-level, individual-level, family-level, or subtree-level
- Can expire (optional `expires_at`)

**Access Requests:**
- Users can request write access to subtrees they don't have access to
- Requests are reviewed by tree maintainers
- When approved, permission is automatically granted
- Maintainers can add notes/response to requests

### Rule 4: Public/Private Trees

**Public Trees (`is_public = TRUE`):**
- Anyone can view (read-only), but cannot edit
- Public visitors cannot see private data (only registered users can)
- Registered users with read access can see private data
- Useful for public genealogy databases

**Private Trees (`is_public = FALSE`):**
- Only registered users with read access can view
- Must have explicit permission or be linked to an individual
- All data is private by default (only visible to users with access)

### Rule 5: Private Data

- Some fields can be marked as private (e.g., birth date, death date, notes)
- Private fields are only visible to registered users with read access
- Public visitors (on public trees) cannot see private data
- Flexible system - can mark any field as private

### Rule 6: Subtree Permissions

- Subtree permission applies to:
  - The root individual
  - All descendants (children, grandchildren, etc.)
  - All families where root or descendants are members
  - All individuals connected to descendants

- Subtree permission does NOT apply to:
  - Ancestors of the root individual
  - Siblings of the root individual (unless they share a family)

---

## Permission Rules Summary

### The Core Rule

**When user U is linked to individual I in tree T:**
- ✅ **Read access to entire tree T** - Can view all individuals, families, and relationships
- ✅ **Write access to individual I** - Can edit their own record
- ✅ **Write access to subtree rooted at I** - Can edit all descendants and their families
- ❌ **No write access to rest of tree** - Cannot edit ancestors, siblings, or unrelated individuals

### Additional Permission Features

✅ **Access Requests:** Users can request write access to subtrees they don't have access to  
✅ **Tree Maintainers:** Users with superuser access to specific trees (can grant permissions, edit anything)  
✅ **Website Owner:** Single user with read/write access to all trees  
✅ **Public/Private Trees:** 
   - Public: Anyone can view (read-only), but cannot edit
   - Private: Only registered users with read access can view  
✅ **Private Data:** Some fields can be marked private (only visible to registered users with read access)

### All Questions Resolved

✅ **Tree-Level Read:** User gets read access to entire tree (simplifies model)  
✅ **Sibling Permissions:** Covered by tree-level read (no explicit permissions needed)  
✅ **Family Permissions:** Write on families in subtree, read on all others (via tree-level read)  
✅ **Permission Inheritance:** Subtree permissions cascade down, not up  
✅ **Access Requests:** Users can request additional permissions via maintainers  
✅ **Private Data:** Flexible system to mark any field as private

### 4. Permission Inheritance

**Question:** Should permissions cascade down the tree?

**Decision:** ✅ **Subtree permissions cascade down, not up**

**Rules:**
- ✅ **Subtree permissions cascade DOWN** (descendants inherit)
  - If user has `write` on subtree rooted at I1, all descendants get `write`
  - This is the core of the subtree permission model
  
- ❌ **Permissions do NOT cascade UP** (ancestors don't inherit)
  - If user has `write` on I1, ancestors do NOT get write
  - Ancestors get `read` only (separate rule)
  
- ✅ **Family permissions apply to all members**
  - If user has `write` on family F1, they can edit all members (husband, wife, children)
  - This is because families are atomic units in GEDCOM

**Implementation:**
- When checking permission on descendant, check if it's in any subtree the user has permission on
- When checking permission on ancestor, check tree-level read (covers all ancestors)
- When checking permission on family member, check family permission first, then subtree, then tree-level read

---

## Database Connection

### Environment Variables

```bash
# Frontend database (separate from Go API)
DATABASE_URL=postgres://user:password@localhost:5432/ligneous_frontend?sslmode=disable

# Go API database (for reference, not used by frontend)
GO_API_DATABASE_URL=postgres://user:password@localhost:5432/ligneous_graphs?sslmode=disable
```

### Migration Strategy

1. Use Prisma for schema management
2. Create migrations for each table
3. Seed initial data (if needed)
4. Keep migrations in version control

---

## Summary

### Tables Needed

1. ✅ `users` - User accounts
2. ✅ `sessions` - User sessions (JWT tokens)
3. ✅ `trees` - Tree metadata (maps tree_id → file_id)
4. ✅ `user_individual_links` - Links users to individuals
5. ✅ `permissions` - Flexible permission system

### Permission Model

- **Tree-level**: Owner has admin, others need explicit permission
- **Individual-level**: Can grant specific permissions
- **Family-level**: Can grant specific permissions
- **Subtree-level**: Cascades to descendants
- **User-Individual Link**: Automatically grants write on individual + subtree

### Next Steps

1. ✅ Schema designed
2. ⏳ Create Prisma schema
3. ⏳ Create migrations
4. ⏳ Implement permission check logic
5. ⏳ Test permission scenarios

---

## Appendix: Complete Schema SQL

## Summary of Tables

1. **users** - User accounts (includes website owner flag)
2. **sessions** - JWT token sessions
3. **trees** - Tree metadata (includes public/private flag)
4. **user_individual_links** - Links users to individuals in trees
5. **permissions** - Flexible permission system
6. **tree_maintainers** - Users with superuser access to specific trees
7. **access_requests** - Users requesting write access to subtrees
8. **private_data** - Fields marked as private (only visible to registered users)

See separate file for complete CREATE TABLE statements with all constraints, indexes, and triggers.

