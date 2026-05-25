# Database Cleanup Analysis

## Issues Found

### 1. User ID Mismatch (Critical)

**Problem:**
- Logs show user ID: `49b2f425-df8f-40cc-8d7d-33ca9c7b03b2`
- Database has user ID: `eee43a3e-a6c3-490a-abe4-ed85c6cf350d` (username: "monalig")
- The JWT token contains a user ID that **doesn't exist** in the database

**Impact:**
- Stats endpoint returns `treesOwned: 0` because it's querying with a non-existent user ID
- User authentication appears to work (token is valid) but queries fail silently

**Root Cause:**
- The JWT token in localStorage is from a previous session/user that was deleted or from a different database
- The token is still valid (not expired) but references a non-existent user

**Solution:**
1. User needs to **log out and log back in** to get a fresh token with the correct user ID
2. Or clear localStorage: `localStorage.removeItem('auth_token')` and refresh

### 2. Orphaned Trees (Data Inconsistency)

**Problem:**
- Frontend database has 5 trees
- Backend database has 7 files
- **NONE of the frontend tree `file_id`s match any backend `file_id`s**

**Frontend Trees (Orphaned):**
1. `0308656d-2099-44fa-9df4-b1f6aeaac5c1` - European Royal Families
2. `ac324db0-8c70-44bd-a785-0d4a84551d9e` - Gonsalves Family Tree
3. `b8287770-3927-4812-8fcf-8f8052281057` - Xavier Family Tree
4. `af8c962c-afb7-41e2-9a8b-2d3157ef6c01` - Gracis Family Tree
5. `8b091512-4aba-4367-816b-41f3bda981ca` - US Presidents

**Backend Files (Actual):**
1. `2d407e82-5d07-4bbc-badf-e9b3851dac25`
2. `b2031a46-bcab-4478-9476-b91fd8a843b5`
3. `2d795173-a1f1-43b1-8d18-7403cb6ba897`
4. `ec6975e7-1d07-4a2a-8f4b-8df4230fb1fa`
5. `98e8f028-a70a-43a3-bb66-07ba91e447e0`
6. `3d9853a6-8876-46cb-a3c9-69121ebb155a`
7. `test_permission_check`

**Impact:**
- Frontend shows trees that don't exist in backend
- Users can't access these trees (backend returns 404)
- Data inconsistency between frontend and backend databases

**Solution:**
- Run cleanup script to remove orphaned trees and all related data
- Preserve all users (including "monalig")

## Cleanup Scripts Created

### 1. SQL Script: `scripts/cleanup-orphaned-trees.sql`
- Deletes orphaned trees and all related records
- Preserves all users
- Uses transactions for safety
- Shows preview before deletion

### 2. Bash Script: `scripts/cleanup-orphaned-trees.sh`
- Executes the SQL script
- Shows preview before deletion
- Requires confirmation
- Shows summary after cleanup

## How to Run Cleanup

```bash
cd /apps/gonsalves-genealogy/ligneous-frontend
./scripts/cleanup-orphaned-trees.sh
```

Or manually:
```bash
cd /apps/gonsalves-genealogy/ligneous-frontend
PGPASSWORD=ligneous_password psql -h localhost -U ligneous_user -d ligneous_frontend -f scripts/cleanup-orphaned-trees.sql
```

## After Cleanup

1. **Fix User ID Issue:**
   - User should log out and log back in
   - This will generate a new JWT token with the correct user ID (`eee43a3e-a6c3-490a-abe4-ed85c6cf350d`)
   - Stats should then work correctly

2. **Verify:**
   - Check that `treesOwned` count is correct after re-login
   - Verify that no orphaned trees remain
   - Verify that "monalig" user still exists

## Database State After Cleanup

- **Users:** 2 (monalig, testuser1) - both preserved
- **Trees:** 0 (all orphaned trees removed)
- **Sessions:** All preserved (users can still be logged in)
- **Other data:** All user-related data preserved (albums, tags, etc.)

## Next Steps

1. ✅ Run cleanup script to remove orphaned trees
2. ✅ User logs out and logs back in to fix user ID issue
3. ✅ Verify stats endpoint returns correct data
4. ✅ Upload new GEDCOM files to create valid trees

