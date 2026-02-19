# Permission Model Documentation

**Date:** 2026-01-23  
**Status:** Current Implementation

---

## Permission Model Overview

### Public Trees

**Definition:** Trees with `isPublic = true`

**Read Access:**
- ✅ **Anyone** (including unauthenticated users) can READ
- ✅ No authentication required for read operations

**Write Access:**
- ✅ Only **registered users** with write access can EDIT
- ❌ Unauthenticated users **cannot** write
- ❌ Users without write permission **cannot** write

**Examples:**
- Unauthenticated visitor: Can view tree, cannot edit
- Registered user with read-only: Can view tree, cannot edit
- Registered user with write access: Can view and edit their subtree
- Tree owner: Can view and edit entire tree

### Private Trees

**Definition:** Trees with `isPublic = false`

**Read Access:**
- ✅ Only **registered users** with read access can READ
- ❌ Unauthenticated users **cannot** read
- ❌ Users without read permission **cannot** read

**Write Access:**
- ✅ Only **registered users** with write access can EDIT
- ❌ Unauthenticated users **cannot** write
- ❌ Users without write permission **cannot** write

**Examples:**
- Unauthenticated visitor: No access
- Registered user without permission: No access
- Registered user with read access: Can view tree, cannot edit
- Registered user with write access: Can view and edit their subtree
- Tree owner: Can view and edit entire tree

---

## User Permission Levels

### 1. Website Owner (Superuser)

- **Access:** Absolute access to **all trees**
- **Read:** ✅ All trees
- **Write:** ✅ All trees
- **Authentication:** Required
- **Priority:** Highest (checked first)

### 2. Tree Owner

- **Access:** Full read and write access to **entire tree**
- **Read:** ✅ Entire tree
- **Write:** ✅ Entire tree
- **Authentication:** Required
- **Priority:** Second (checked after website owner)

**Note:** Tree owners have **full read and write access** to the entire tree, not just a subtree.

### 3. Tree Maintainer

- **Access:** Admin access to **specific tree**
- **Read:** ✅ Entire tree
- **Write:** ✅ Entire tree
- **Authentication:** Required
- **Priority:** Third (checked after tree owner)

### 4. Most Users (Linked to Individual)

- **Access:** Read entire tree, write only to subtree
- **Read:** ✅ Entire tree (via tree-level read permission)
- **Write:** ✅ Only to their individual node and subtree rooted at that node
- **Authentication:** Required
- **Priority:** Checked via explicit permissions

**Example:** Monica linked to I1 in Tree T1
- Can read entire Tree T1
- Can write to I1 and all descendants of I1
- Cannot write to ancestors, siblings, or unrelated individuals

### 5. Users with Explicit Permissions

- **Access:** Based on granted permissions
- **Read/Write:** ✅ As specified in permissions table
- **Authentication:** Required
- **Priority:** Checked via explicit permissions

### 6. Unauthenticated Users

- **Access:** Public trees only (read-only)
- **Read:** ✅ Public trees only
- **Write:** ❌ No write access (authentication required)
- **Authentication:** Not required for public tree reads
- **Priority:** Lowest (only for public tree reads)

---

## Permission Check Priority

The `hasPermission()` function checks permissions in this order:

1. **Website Owner** (if authenticated) - Absolute access
2. **Tree Owner** (if authenticated) - Full read/write to entire tree
3. **Tree Maintainer** (if authenticated) - Admin access to tree
4. **Explicit Permission** (if authenticated) - Resource-specific permission
5. **Subtree Permission** (if authenticated) - Descendant-based permission
6. **Tree-level Permission** (if authenticated) - General tree access
7. **Public Tree** (anyone) - Read-only for public trees

**Important:** Write/delete/admin operations **always require authentication**.

---

## Access Requests

**All registered users** can request access to any part of a tree they don't have access to.

**Process:**
1. User creates an `AccessRequest` record
2. Request is reviewed by tree owners/maintainers
3. If approved, a `Permission` record is created
4. User gains the requested access

**Access Request Table:**
- `userId` - User requesting access
- `treeId` - Tree they want access to
- `resourceType` - Type of resource ('tree', 'individual', 'family', 'subtree')
- `resourceId` - Specific resource ID
- `permissionType` - Type of permission requested ('read', 'write', 'delete', 'admin')
- `status` - Request status ('pending', 'approved', 'rejected', 'cancelled')

---

## Permission Types

### Read Permission

**Allows:**
- View resource data
- Query relationships
- View graph structure

**Does NOT allow:**
- Edit resource data
- Delete resource
- Grant permissions

### Write Permission

**Allows:**
- All read permissions
- Edit resource data
- Create new resources in subtree (if subtree permission)

**Does NOT allow:**
- Delete resource (unless also has delete permission)
- Grant permissions (unless also has admin permission)

### Delete Permission

**Allows:**
- All write permissions
- Delete resource

**Does NOT allow:**
- Grant permissions (unless also has admin permission)

### Admin Permission

**Allows:**
- All delete permissions
- Grant/revoke permissions
- Change tree settings
- Delete tree

---

## Code Examples

### Check Permission (Authenticated User)

```javascript
import { hasPermission } from './lib/permissions.js';

// Check if user can read a tree
const canRead = await hasPermission(userId, treeId, 'tree', 'tree', 'read');

// Check if user can write to an individual
const canWrite = await hasPermission(userId, treeId, 'individual', 'I1', 'write');
```

### Check Permission (Unauthenticated User)

```javascript
import { hasPermission } from './lib/permissions.js';

// Check if unauthenticated user can read public tree
const canRead = await hasPermission(null, treeId, 'tree', 'tree', 'read');

// Unauthenticated users cannot write
const canWrite = await hasPermission(null, treeId, 'tree', 'tree', 'write'); // Always false
```

### Check if Tree is Public

```javascript
import { isPublicTree } from './lib/permissions.js';

const isPublic = await isPublicTree(treeId);
```

### Check if User is Tree Owner

```javascript
import { isTreeOwner } from './lib/permissions.js';

const isOwner = await isTreeOwner(userId, treeId);
```

---

## Summary

### Public Trees
- ✅ Anyone can read (including unauthenticated)
- ✅ Only registered users with write access can edit

### Private Trees
- ✅ Only registered users with read access can read
- ✅ Only registered users with write access can edit

### Most Users
- ✅ Read access to entire tree
- ✅ Write access only to subtree
- ✅ Can request access to parts they don't have

### Tree Owners
- ✅ Full read and write access to entire tree

### Access Requests
- ✅ All registered users can request access
- ✅ Requests reviewed by owners/maintainers

---

**Status:** ✅ Implementation complete and documented

