# New Features Summary

**Date:** 2026-01-23  
**Status:** Added to Schema Plan

---

## New Features Added

### 1. Access Requests

**Feature:** Users can request write access to subtrees they don't have access to.

**Implementation:**
- New table: `access_requests`
- Users can request write access to specific subtrees or individuals
- Maintainers can approve/reject requests
- When approved, permission is automatically granted

**Example:**
- User Monica wants to edit subtree rooted at I5 (her ancestor)
- She requests write access
- Maintainer approves
- Permission automatically granted

---

### 2. Tree Maintainers

**Feature:** Each tree has maintainers with superuser access.

**Implementation:**
- New table: `tree_maintainers`
- Maintainers have `admin` permission on the tree
- Can grant/revoke permissions, edit anything, manage the tree
- Multiple maintainers per tree allowed
- Tree owner is automatically a maintainer (implicit)

**Purpose:**
- Allow trusted users to manage trees
- Maintainers can approve access requests
- Maintainers can grant permissions to other users

---

### 3. Website Owner

**Feature:** Single user with read/write access to all trees.

**Implementation:**
- New field in `users` table: `is_website_owner`
- Only ONE user should have this flag set to TRUE
- Has read and write access to ALL trees
- Can manage all trees, users, and permissions

**Purpose:**
- System administrator
- Can manage everything on the website
- Useful for support and maintenance

---

### 4. Public/Private Trees

**Feature:** Trees can be public or private.

**Implementation:**
- Existing field in `trees` table: `is_public`
- **Public (`is_public = TRUE`):**
  - Anyone can view (read-only)
  - Cannot edit
  - Private data is hidden from public visitors
  - Registered users with read access can see private data
  
- **Private (`is_public = FALSE`):**
  - Only registered users with read access can view
  - Must have explicit permission or be linked to an individual

**Purpose:**
- Allow public genealogy research
- Protect sensitive family trees
- Control who can view trees

---

### 5. Private Data

**Feature:** Some data can be marked as private, only viewable to registered users.

**Implementation:**
- New table: `private_data`
- Can mark any field as private (e.g., birth date, death date, notes)
- Private fields are only visible to registered users with read access
- Public visitors (on public trees) cannot see private data

**Example Fields:**
- `birth_date`, `birth_place`
- `death_date`, `death_place`
- `notes`, `address`
- `occupation`, `education`
- Any custom field

**Purpose:**
- Protect sensitive information (e.g., living people's birth dates)
- Allow public trees while keeping some data private
- Flexible system - mark any field as private

---

## Permission Hierarchy (Updated)

Permissions are checked in this order:

1. **Website Owner** - Has access to all trees
2. **Tree Owner** - Has all permissions on their tree
3. **Tree Maintainer** - Has admin permissions on the tree
4. **Explicit permission** on the specific resource
5. **Subtree permission** (if resource is within a subtree)
6. **Tree-level permission** (if no specific permission)
7. **Public tree** (if tree is public, read-only for everyone, but private data hidden)
8. **Private tree** (if tree is private, must have explicit permission)

---

## Database Schema Changes

### New Tables:
1. `tree_maintainers` - Tree maintainers with superuser access
2. `access_requests` - Users requesting write access
3. `private_data` - Fields marked as private

### Modified Tables:
1. `users` - Added `is_website_owner` field
2. `trees` - `is_public` field clarified (already existed)

---

## Implementation Notes

### Access Requests Workflow:
1. User requests write access to subtree
2. Maintainer reviews request
3. Maintainer approves/rejects
4. If approved, permission automatically granted

### Private Data Workflow:
1. User marks field as private (e.g., birth_date)
2. Field is hidden from public visitors
3. Registered users with read access can see private data
4. Users with write access can edit private data

### Tree Maintainers Workflow:
1. Tree owner adds maintainer
2. Maintainer gets admin permissions
3. Maintainer can approve requests, grant permissions, edit anything

---

## Status

✅ All features added to schema plan  
✅ Ready for implementation  
✅ Documentation updated


