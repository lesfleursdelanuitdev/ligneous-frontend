# Permission Rule - User-Individual Link

**Date:** 2026-01-23  
**Status:** Final Decision

---

## The Rule

**When user U is linked to individual I in tree T:**

1. ✅ **Read access to entire tree T**
   - Can view ALL individuals, families, and relationships in T
   - Can query ancestors, siblings, descendants, and unrelated individuals
   - Can view all families and relationships

2. ✅ **Write access to individual I**
   - Can edit their own record (I)
   - Can modify I's name, birth date, death date, etc.

3. ✅ **Write access to subtree rooted at I**
   - Can edit all descendants of I (children, grandchildren, etc.)
   - Can edit families where I or descendants are members
   - Can edit individuals connected to descendants (spouses via families)

4. ❌ **No write access to rest of tree**
   - Cannot edit ancestors of I
   - Cannot edit siblings of I
   - Cannot edit unrelated individuals
   - Cannot edit families outside the subtree

---

## Implementation

### SQL Permissions

When user links to individual:

```sql
-- 1. Create user-individual link
INSERT INTO user_individual_links (user_id, tree_id, individual_xref, verified)
VALUES ('user-uuid', 'tree-uuid', 'I1', TRUE);

-- 2. Grant permissions (3 permissions total)
INSERT INTO permissions (user_id, tree_id, resource_type, resource_id, permission_type)
VALUES 
  -- Read on entire tree
  ('user-uuid', 'tree-uuid', 'tree', 'tree', 'read'),
  -- Write on individual
  ('user-uuid', 'tree-uuid', 'individual', 'I1', 'write'),
  -- Write on subtree
  ('user-uuid', 'tree-uuid', 'subtree', 'I1', 'write');
```

**That's it!** No need to:
- Query Go API for ancestors (tree-level read covers them)
- Query Go API for siblings (tree-level read covers them)
- Grant individual permissions on each ancestor/sibling (tree-level read covers everything)
- Grant permissions on families outside subtree (tree-level read covers them)

---

## Benefits

1. **Simpler:** Only 3 permissions instead of potentially hundreds
2. **Faster:** No need to query Go API when creating link
3. **Clearer:** Easy to understand what user can do
4. **Performant:** Tree-level read is fast to check

---

## Example: Monica Links to I1 in T1

### What Monica Can Do

**✅ Read (Entire Tree):**
- View I1 (herself)
- View all ancestors of I1
- View all siblings of I1
- View all descendants of I1
- View all unrelated individuals
- View all families
- Query any relationship

**✅ Write (I1 and Subtree Only):**
- Edit I1 (her own record)
- Edit all descendants of I1
- Edit families containing I1 or descendants

**❌ Cannot Write:**
- Ancestors of I1
- Siblings of I1
- Unrelated individuals
- Families outside subtree

---

## Permission Check Examples

### Example 1: Can Monica read I1's parent (I10)?

```javascript
hasPermission('monica-uuid', 't1-uuid', 'individual', 'I10', 'read')
// Step 1: Not owner → continue
// Step 2: No explicit permission on I10 → continue
// Step 3: Not in subtree → continue
// Step 4: Check tree-level permission → ✅ Found: read on tree
// Result: ✅ TRUE
```

### Example 2: Can Monica edit I1's parent (I10)?

```javascript
hasPermission('monica-uuid', 't1-uuid', 'individual', 'I10', 'write')
// Step 1: Not owner → continue
// Step 2: No explicit permission on I10 → continue
// Step 3: Not in subtree → continue
// Step 4: Check tree-level permission → ❌ Tree-level is read, not write
// Result: ❌ FALSE
```

### Example 3: Can Monica edit I1's child (I5)?

```javascript
hasPermission('monica-uuid', 't1-uuid', 'individual', 'I5', 'write')
// Step 1: Not owner → continue
// Step 2: No explicit permission on I5 → continue
// Step 3: Check subtree permissions → ✅ I5 is descendant of I1 (subtree root)
// Result: ✅ TRUE
```

---

## Summary

**The Rule:**
- Read entire tree
- Write only on linked individual and subtree

**Implementation:**
- 3 permissions: tree read, individual write, subtree write
- No Go API queries needed
- Simple and performant

**Status:** ✅ Final decision, ready for implementation

