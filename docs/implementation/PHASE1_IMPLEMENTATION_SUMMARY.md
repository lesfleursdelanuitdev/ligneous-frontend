# Phase 1 Implementation Summary

## Overview

Phase 1 implementation includes:
1. **Subtree Permissions** - Implemented `isInSubtree()` function with Go API integration
2. **Token Refresh Mechanism** - Implemented refresh token pattern with auto-refresh

---

## 1. Subtree Permissions

### Files Created/Modified

**New Files:**
- `lib/subtree.js` - Subtree utility functions

**Modified Files:**
- `lib/permissions/index.js` - Updated `isInSubtree()` function

### Implementation Details

#### `lib/subtree.js`

**Functions:**
- `getSubtreeDescendants(fileId, subtreeRootXref, useCache)` - Fetches descendants from Go API with caching
- `getFamilyMembers(fileId, familyXref)` - Gets family members (husband, wife, children)
- `clearSubtreeCache(fileId, subtreeRootXref)` - Clears cache (for testing or data updates)

**Features:**
- ✅ In-memory caching (5-minute TTL)
- ✅ Error handling (returns empty array on error)
- ✅ Handles both individual and family XREFs

#### `lib/permissions/index.js`

**Updated Function:**
- `isInSubtree(resourceId, subtreeRootXref, treeId)` - Now fully implemented

**Logic:**
1. Maps `treeId` to `fileId`
2. Fetches descendants of subtree root from Go API
3. For individuals: Direct XREF check
4. For families: Checks if any family member is in descendants

**Go API Endpoint Used:**
- `GET /api/v1/files/{file_id}/individuals/{xref}/descendants`
- `GET /api/v1/files/{file_id}/families/{xref}` (for family members)

### Testing

**To Test:**
1. Create a user with subtree permission on an individual
2. Try to access a descendant of that individual
3. Verify permission check works correctly

---

## 2. Token Refresh Mechanism

### Files Created/Modified

**New Files:**
- `app/api/auth/refresh/route.js` - Refresh token endpoint

**Modified Files:**
- `prisma/schema.prisma` - Added `refreshTokenHash` and `refreshExpiresAt` to Session
- `lib/auth.js` - Added `generateRefreshToken()` and `hashRefreshToken()` functions
- `app/api/auth/login/route.js` - Now generates refresh tokens
- `app/api/auth/register/route.js` - Now generates refresh tokens
- `mycelia/facets/auth.js` - Added auto-refresh logic

### Implementation Details

#### Database Schema Changes

**Session Table:**
```prisma
model Session {
  // ... existing fields
  refreshTokenHash String?   @unique @map("refresh_token_hash") @db.VarChar(255)
  refreshExpiresAt DateTime? @map("refresh_expires_at") @db.Timestamptz(6)
  // ... indexes
}
```

#### Token Lifecycle

**Access Token:**
- **Lifetime:** 15 minutes
- **Storage:** localStorage (`auth_token`)
- **Usage:** API requests

**Refresh Token:**
- **Lifetime:** 7 days
- **Storage:** localStorage (`auth_refresh_token`)
- **Usage:** Refresh access token

#### API Endpoints

**POST /api/auth/refresh**
- **Input:** `{ refreshToken: string }`
- **Output:** `{ token: string }` (new access token)
- **Error:** 401 if invalid/expired refresh token

#### Client-Side Auto-Refresh

**Auth Facet (`mycelia/facets/auth.js`):**

**New Functions:**
- `refreshAccessToken()` - Manually refresh access token
- `setupTokenRefresh()` - Setup automatic refresh (every 10 minutes)
- `clearTokenRefresh()` - Clear refresh interval

**Auto-Refresh Logic:**
- Refreshes token every 10 minutes (before 15-minute expiration)
- Automatically logs out user if refresh fails
- Setup on login/register
- Cleared on logout

**Storage:**
- Access token: `localStorage.getItem('auth_token')`
- Refresh token: `localStorage.getItem('auth_refresh_token')`

### Migration Required

**Database Migration:**
```sql
ALTER TABLE sessions 
ADD COLUMN refresh_token_hash VARCHAR(255) UNIQUE,
ADD COLUMN refresh_expires_at TIMESTAMPTZ(6);

CREATE INDEX idx_sessions_refresh_token_hash ON sessions(refresh_token_hash);
CREATE INDEX idx_sessions_refresh_expires_at ON sessions(refresh_expires_at);
CREATE INDEX idx_sessions_user_refresh ON sessions(user_id, is_revoked, refresh_expires_at);
```

**To Apply:**
```bash
cd /apps/ligneous-frontend
npx prisma migrate dev --name add_refresh_tokens
```

**Note:** If migration fails due to permissions, apply SQL manually as `postgres` user.

### Testing

**To Test:**
1. Login/Register - Verify both tokens are returned
2. Wait 15 minutes - Verify auto-refresh works
3. Manually call `refreshAccessToken()` - Verify manual refresh works
4. Use expired refresh token - Verify 401 error
5. Logout - Verify tokens are cleared

---

## Configuration

### Environment Variables

**No new environment variables required** - Uses existing JWT configuration.

### Token Expiration

**Access Token:** 15 minutes (hardcoded in `generateToken()`)
**Refresh Token:** 7 days (hardcoded in login/register routes)

**To Change:**
- Access token: Update `expiresIn` in `lib/auth.js` `generateToken()`
- Refresh token: Update `refreshExpiresAt` calculation in login/register routes

---

## Breaking Changes

### ⚠️ Access Token Expiration Changed

**Before:** 7 days (from `JWT_EXPIRES_IN` env var)
**After:** 15 minutes (hardcoded)

**Impact:**
- Users will need to re-login if they have existing sessions
- New sessions will use 15-minute access tokens with 7-day refresh tokens

**Migration Path:**
- Existing sessions will continue to work until they expire (7 days)
- New logins will use the new token system

---

## Next Steps

### Phase 2 (Next Sprint)
1. Password Reset - Email-based password reset flow
2. User Content System - User-owned content with privacy controls

### Enhancements (Future)
1. Move refresh token to httpOnly cookie (more secure)
2. Add token rotation (generate new refresh token on each refresh)
3. Add refresh token revocation UI
4. Add session management UI

---

## Summary

✅ **Subtree Permissions:** Fully implemented with Go API integration and caching
✅ **Token Refresh:** Fully implemented with auto-refresh mechanism

**Status:** Phase 1 Complete ✅

**Estimated Time:** 4-6 hours (actual: ~5 hours)

