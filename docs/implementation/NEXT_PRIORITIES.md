# Next Priorities - What Should We Do Next?

**Date:** 2026-02-13  
**Status:** Phase 1 Complete - Planning Next Steps

---

## ✅ Recently Completed (Phase 1)

1. **Subtree Permissions** - Fully implemented with Go API integration
2. **Token Refresh Mechanism** - Auto-refresh with 15-minute access tokens

---

## 🚨 Immediate Actions Required

### 1. Apply Database Migration

**Priority:** CRITICAL - Required for token refresh to work

**Action:**
```bash
cd /apps/ligneous-frontend
npx prisma migrate dev --name add_refresh_tokens
```

**If migration fails due to permissions:**
- Apply SQL manually as `postgres` user
- See `PHASE1_IMPLEMENTATION_SUMMARY.md` for SQL

**Status:** ⏳ Pending

---

## 📋 Phase 2: High Priority Features

### 2. Password Reset Flow

**Priority:** HIGH - Essential for user account recovery

**What's Needed:**
- Database table: `PasswordResetToken`
- API routes: `/api/auth/password-reset/request` and `/api/auth/password-reset/reset`
- Email service integration (SendGrid, AWS SES, etc.)
- Frontend pages: `/forgot-password` and `/reset-password`

**Estimated Time:** 8-12 hours

**Status:** ⏳ Not Started

**Dependencies:**
- Email service account (SendGrid, AWS SES, etc.)
- Email templates

---

### 3. User Content System

**Priority:** HIGH - Enables user-generated content

**What's Needed:**
- Update schema: Add `PrivacyLevel` enum to `UserContent`
- Permission functions: `canViewContent()`, `canEditContent()`, `canDeleteContent()`
- API routes: CRUD with privacy filtering
- Mycelia facet: `useUserContent`

**Estimated Time:** 12-16 hours

**Status:** ⏳ Not Started (Schema exists, implementation needed)

**Dependencies:**
- Follow system (for FOLLOWERS privacy level)

---

## 🔧 Infrastructure & Polish

### 4. Test Phase 1 Implementations

**Priority:** HIGH - Ensure everything works

**What's Needed:**
- Test subtree permissions with real data
- Test token refresh (wait 15 minutes, verify auto-refresh)
- Test token refresh failure (expired refresh token)
- Test logout clears refresh interval

**Estimated Time:** 2-4 hours

**Status:** ⏳ Not Started

---

### 5. Fix Token Expiration Configuration

**Priority:** MEDIUM - Current access tokens are hardcoded to 15 minutes

**Issue:** 
- Access tokens are hardcoded to 15 minutes in `lib/auth.js`
- Should be configurable via environment variable
- May need to update existing sessions

**What's Needed:**
- Add `JWT_ACCESS_TOKEN_EXPIRES_IN` env var
- Update `generateToken()` to use config
- Document token expiration settings

**Estimated Time:** 1 hour

**Status:** ⏳ Not Started

---

### 6. Permission Caching

**Priority:** MEDIUM - Performance improvement

**Issue:**
- Permission checks query database every time
- No caching mechanism

**What's Needed:**
- Cache permission results (Redis or in-memory)
- Invalidate cache on permission changes
- Cache subtree descendant lists (already done)

**Estimated Time:** 4-6 hours

**Status:** ⏳ Not Started

---

## 🎨 Feature Development

### 7. Collaborative Features

**Priority:** MEDIUM - Based on existing schema

**What's Needed:**
- Comments system (schema exists)
- Discussion threads (schema exists)
- Suggestions system (schema exists)
- Research notes (schema exists)
- Direct messaging (schema exists)

**Estimated Time:** 40-60 hours (all features)

**Status:** ⏳ Not Started (Schemas exist, implementation needed)

**Dependencies:**
- User content system (for content sharing)
- Notification system

---

### 8. Missing Go API Endpoints

**Priority:** MEDIUM - Based on TNG requirements

**What's Needed:**
- Merge functionality (individuals, families, duplicates)
- Chart data endpoints (pedigree, descendant, fan, family)
- Report endpoints (formatted reports)
- Browse endpoints (surname, given name) - **Partially done**

**Estimated Time:** 20-30 hours

**Status:** ⏳ Not Started (Some endpoints may exist in Go API)

**Note:** These are Go API endpoints, not frontend work

---

## 🐛 Bug Fixes & Improvements

### 9. Security Improvements

**Priority:** MEDIUM - Security hardening

**What's Needed:**
- Move refresh token to httpOnly cookie (more secure than localStorage)
- Add CSRF protection
- Add rate limiting on login/register
- Add account lockout after failed attempts

**Estimated Time:** 8-12 hours

**Status:** ⏳ Not Started

---

### 10. UI/UX Improvements

**Priority:** LOW - Polish existing features

**What's Needed:**
- Session management UI (view/revoke sessions)
- Permission management UI (grant/revoke permissions)
- Tree owner/maintainer management UI
- Better error messages
- Loading states

**Estimated Time:** 16-24 hours

**Status:** ⏳ Not Started

---

## 📊 Recommended Order

### Option A: Complete Phase 2 First (Recommended)

**Focus:** Finish authentication improvements before moving to new features

1. ✅ Apply database migration (CRITICAL)
2. ✅ Test Phase 1 implementations
3. ✅ Password reset flow
4. ✅ User content system
5. ✅ Fix token expiration configuration

**Timeline:** 1-2 weeks

**Benefits:**
- Complete authentication system
- Users can recover accounts
- Users can create content
- Solid foundation for collaborative features

---

### Option B: Infrastructure First

**Focus:** Improve performance and security

1. ✅ Apply database migration
2. ✅ Test Phase 1 implementations
3. ✅ Permission caching
4. ✅ Security improvements
5. ✅ Token expiration configuration

**Timeline:** 1 week

**Benefits:**
- Better performance
- More secure
- Better user experience

---

### Option C: Feature Development

**Focus:** Build new features

1. ✅ Apply database migration
2. ✅ User content system
3. ✅ Comments system
4. ✅ Discussion threads
5. ✅ Suggestions system

**Timeline:** 2-3 weeks

**Benefits:**
- More features available
- Better collaboration
- More engaging for users

---

## 🎯 My Recommendation

**Start with Option A (Complete Phase 2):**

1. **Apply database migration** (30 minutes) - CRITICAL
2. **Test Phase 1** (2-4 hours) - Ensure everything works
3. **Password reset** (8-12 hours) - Essential feature
4. **User content system** (12-16 hours) - Foundation for collaboration
5. **Fix token config** (1 hour) - Quick win

**Total:** ~24-33 hours (1-2 weeks)

**Why:**
- Completes authentication system
- Enables user-generated content
- Provides foundation for collaborative features
- Addresses critical user needs (password recovery)

**After Phase 2:**
- Move to collaborative features
- Add missing API endpoints
- Improve security and performance

---

## 📝 Quick Wins (Can Do Anytime)

These are small tasks that can be done in parallel:

1. **Fix token expiration configuration** (1 hour)
2. **Add better error messages** (2-4 hours)
3. **Add loading states** (2-4 hours)
4. **Document API endpoints** (2-4 hours)
5. **Add unit tests** (ongoing)

---

## ❓ Questions to Consider

1. **Do we have an email service?** (Required for password reset)
   - SendGrid, AWS SES, Mailgun, etc.
   - Need to set up account and API keys

2. **What's the priority: features or infrastructure?**
   - Features: More user-facing functionality
   - Infrastructure: Better performance, security, scalability

3. **Do we need collaborative features now?**
   - Schema exists, but implementation is significant
   - Could wait until after Phase 2

4. **Are there any critical bugs?**
   - Should fix before adding new features

---

## 🚀 Next Immediate Step

**Apply the database migration:**

```bash
cd /apps/ligneous-frontend
npx prisma migrate dev --name add_refresh_tokens
```

This is **CRITICAL** - token refresh won't work without it.

---

## Summary

**Immediate:** Apply database migration, test Phase 1

**Next Sprint:** Complete Phase 2 (password reset + user content)

**Future:** Collaborative features, missing API endpoints, security improvements

**Total Estimated Time for Phase 2:** 24-33 hours (1-2 weeks)

