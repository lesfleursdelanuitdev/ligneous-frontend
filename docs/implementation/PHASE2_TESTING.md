# Phase 2 Testing Guide

## Overview

This document describes the test cases for Phase 2 implementations:
1. Password Reset Flow
2. User Content System
3. Token Expiration Configuration

---

## Test Files Created

### 1. Password Reset Utilities Tests
**File:** `lib/auth/__tests__/password-reset.test.js`

**Tests:**
- ✅ Token generation (secure, 24-hour expiration)
- ✅ Token verification (valid, expired, used, inactive user)
- ✅ Mark token as used
- ✅ Email sending (development logging)

### 2. User Content Permissions Tests
**File:** `lib/permissions/__tests__/user-content.test.js`

**Tests:**
- ✅ View permissions (creator, public, private, followers_only, collaborators_only)
- ✅ Edit permissions (only creator)
- ✅ Delete permissions (only creator)
- ✅ Unauthenticated user handling

### 3. User Content Facet Tests
**File:** `mycelia/facets/__tests__/user-content.test.js`

**Tests:**
- ✅ Initial state
- ✅ Get content (authenticated and unauthenticated)
- ✅ Create content (requires authentication)
- ✅ Update content
- ✅ Delete content
- ✅ Error handling

### 4. Password Reset API Tests
**File:** `app/api/auth/password-reset/__tests__/password-reset.test.js`

**Tests:**
- ✅ Request reset (missing email, non-existent user, existing user, inactive user)
- ✅ Reset password (missing token, short password, invalid token, valid token)

---

## Running Tests

### Run All Tests
```bash
cd /apps/ligneous-frontend
npm test
```

### Run Specific Test Suite
```bash
# Password reset utilities
npm test lib/auth/__tests__/password-reset.test.js

# User content permissions
npm test lib/permissions/__tests__/user-content.test.js

# User content facet
npm test mycelia/facets/__tests__/user-content.test.js

# Password reset API
npm test app/api/auth/password-reset/__tests__/password-reset.test.js
```

### Watch Mode
```bash
npm run test:watch
```

### UI Mode
```bash
npm run test:ui
```

---

## Manual Testing

### Password Reset Flow

1. **Request Password Reset:**
   ```bash
   curl -X POST http://localhost:4000/api/auth/password-reset/request \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com"}'
   ```

2. **Check Console:** Reset URL should be logged

3. **Reset Password:**
   ```bash
   curl -X POST http://localhost:4000/api/auth/password-reset/reset \
     -H "Content-Type: application/json" \
     -d '{"token": "reset-token-from-email", "newPassword": "newpass123"}'
   ```

4. **Verify:** Login with new password should work

### User Content System

1. **Create Content:**
   ```bash
   curl -X POST http://localhost:4000/api/user-content \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "contentType": "post",
       "title": "Test Post",
       "content": "Test content",
       "visibility": "public"
     }'
   ```

2. **Get Content:**
   ```bash
   curl http://localhost:4000/api/user-content?privacy=public
   ```

3. **Update Content:**
   ```bash
   curl -X PUT http://localhost:4000/api/user-content/CONTENT_ID \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"title": "Updated Title"}'
   ```

4. **Delete Content:**
   ```bash
   curl -X DELETE http://localhost:4000/api/user-content/CONTENT_ID \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## Test Coverage

### Password Reset
- ✅ Token generation
- ✅ Token verification
- ✅ Token expiration
- ✅ Token reuse prevention
- ✅ Inactive user handling
- ✅ Email sending (placeholder)
- ✅ Password hashing
- ✅ Session revocation

### User Content
- ✅ Permission checking (all visibility levels)
- ✅ Content creation
- ✅ Content retrieval (with filtering)
- ✅ Content updates
- ✅ Content deletion (soft delete)
- ✅ Authentication requirements
- ✅ Error handling

---

## Integration Testing

### End-to-End Password Reset

1. User requests password reset
2. Token is generated and stored
3. Email is sent (logged in dev)
4. User clicks reset link
5. User enters new password
6. Password is updated
7. All sessions are revoked
8. User can login with new password

### End-to-End User Content

1. User creates content with `public` visibility
2. Unauthenticated user can view content
3. User creates content with `private` visibility
4. Only creator can view content
5. User creates content with `followers_only` visibility
6. Follower can view, non-follower cannot
7. User updates content (only creator can)
8. User deletes content (only creator can)

---

## Known Issues

### Email Service
- ⚠️ Email sending is placeholder (logs to console)
- ⚠️ Need to configure email service for production

### Collaborators Only
- ⚠️ `collaborators_only` visibility not fully implemented
- ⚠️ Returns `false` for all users (placeholder)

---

## Next Steps

1. ✅ Run test suite to verify all tests pass
2. ⏳ Configure email service for password reset
3. ⏳ Implement `collaborators_only` visibility check
4. ⏳ Add integration tests with real database
5. ⏳ Add E2E tests with Playwright/Cypress

