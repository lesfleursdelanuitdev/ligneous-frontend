# Pending Features Summary

**Date:** 2026-02-13  
**Status:** Phase 2 Complete - Planning Next Features

---

## ✅ Recently Completed

### Phase 1 (Authentication & Authorization)
- ✅ **Subtree Permissions** - Full implementation with Go API integration
- ✅ **Token Refresh Mechanism** - Auto-refresh with 15-minute access tokens

### Phase 2 (User Features)
- ✅ **Password Reset Flow** - Complete with email integration (placeholder)
- ✅ **User Content System** - CRUD with privacy controls (public, followers, collaborators, private)
- ✅ **Token Expiration Configuration** - Configurable via environment variables

**Status:** All Phase 1 & 2 features are complete and tested ✅

---

## 🚨 High Priority Features

### 1. Email Service Integration
**Priority:** CRITICAL - Required for password reset to work in production

**What's Needed:**
- Integrate with email service (SendGrid, AWS SES, Mailgun, etc.)
- Replace placeholder `sendPasswordResetEmail()` function
- Create email templates (password reset, welcome, notifications)
- Configure email service credentials

**Estimated Time:** 4-6 hours

**Status:** ⏳ Not Started

**Dependencies:**
- Email service account
- Email templates

---

### 2. Collaborative Features Implementation

**Priority:** HIGH - Foundation for user collaboration

**Schemas Exist:** ✅ All database tables created

**What's Needed:**

#### 2.1 Comments System
- **Entities:** Individuals, Families, Events, Sources, Media, Places, Trees, Notes
- **Features:**
  - Threaded replies
  - Edit/Delete own comments
  - Mentions (@username)
  - Links to other entities
  - Attachments
  - Reactions (like, helpful, etc.)
- **API Routes:** CRUD for comments
- **Mycelia Facet:** `useComments`

**Estimated Time:** 12-16 hours

#### 2.2 Discussion Threads
- **Features:**
  - Tree-level or topic-based discussions
  - Threaded posts
  - Watchers/notifications
  - Pinned threads
  - Locked threads
- **API Routes:** CRUD for threads and posts
- **Mycelia Facet:** `useDiscussionThreads`

**Estimated Time:** 12-16 hours

#### 2.3 Suggestions System
- **Features:**
  - Propose data changes (individuals, families, events, etc.)
  - Approval workflow
  - Review/approve/reject suggestions
  - Track suggestion history
- **API Routes:** CRUD for suggestions
- **Mycelia Facet:** `useSuggestions`

**Estimated Time:** 12-16 hours

#### 2.4 Research Notes
- **Features:**
  - Private, shared, or public notes
  - Link to entities (individuals, families, etc.)
  - Rich text formatting
  - Attachments
  - Tags
- **API Routes:** CRUD for research notes
- **Mycelia Facet:** `useResearchNotes`

**Estimated Time:** 8-12 hours

#### 2.5 Direct Messaging
- **Features:**
  - Direct messages between users
  - Group messaging
  - Message threads
  - Read receipts
  - File attachments
- **API Routes:** CRUD for messages and groups
- **Mycelia Facet:** `useMessaging`

**Estimated Time:** 16-20 hours

**Total Estimated Time:** 60-80 hours (all collaborative features)

**Status:** ⏳ Not Started (Schemas exist, implementation needed)

**Dependencies:**
- Notification system (for mentions, replies, etc.)
- User content system (✅ Complete)

---

### 3. Missing Go API Endpoints

**Priority:** HIGH - Required for TNG feature parity

**Note:** These are backend (Go API) endpoints, not frontend work

#### 3.1 Merge Functionality
- **What:** Merge duplicate individuals, families, and other entities
- **Endpoints Needed:**
  - `POST /api/v1/files/{file_id}/individuals/merge`
  - `POST /api/v1/files/{file_id}/families/merge`
  - `POST /api/v1/files/{file_id}/duplicates/merge`
- **Features:**
  - Preview merge (show what will be merged)
  - Conflict resolution
  - Merge history/audit trail

**Estimated Time:** 20-30 hours (Go API work)

**Status:** ⏳ Not Started

#### 3.2 Chart Data Endpoints
- **What:** Structured data for client-side chart rendering
- **Endpoints Needed:**
  - `GET /api/v1/files/{file_id}/charts/pedigree/{xref}` - Pedigree chart data
  - `GET /api/v1/files/{file_id}/charts/descendant/{xref}` - Descendant chart data
  - `GET /api/v1/files/{file_id}/charts/fan/{xref}` - Fan chart data
  - `GET /api/v1/files/{file_id}/charts/family/{xref}` - Family group chart data
- **Response:** Structured JSON with positions, relationships, connectors

**Estimated Time:** 16-24 hours (Go API work)

**Status:** ⏳ Not Started

#### 3.3 Report Endpoints
- **What:** Formatted reports (individual, family, tree-wide)
- **Endpoints Needed:**
  - `GET /api/v1/files/{file_id}/reports/individual/{xref}` - Individual report
  - `GET /api/v1/files/{file_id}/reports/family/{xref}` - Family report
  - `GET /api/v1/files/{file_id}/reports/tree` - Tree-wide report
- **Formats:** JSON (structured), PDF (optional)

**Estimated Time:** 12-16 hours (Go API work)

**Status:** ⏳ Not Started

#### 3.4 Browse Endpoints
- **What:** Browse surnames and given names alphabetically
- **Endpoints Needed:**
  - `GET /api/v1/files/{file_id}/browse/surnames` - Browse surnames
  - `GET /api/v1/files/{file_id}/browse/given-names` - Browse given names
- **Status:** ⚠️ Partially implemented (endpoints may exist but need verification)

**Estimated Time:** 4-8 hours (Go API work)

**Status:** ⏳ Needs Verification

**Total Estimated Time:** 52-78 hours (Go API work)

---

## 🔧 Medium Priority Features

### 4. Infrastructure Improvements

#### 4.1 Permission Caching
- **What:** Cache permission results to improve performance
- **Implementation:**
  - Redis or in-memory cache
  - Invalidate on permission changes
  - Cache subtree descendant lists (already done)
- **Estimated Time:** 4-6 hours

**Status:** ⏳ Not Started

#### 4.2 Security Improvements
- **What:**
  - Move refresh token to httpOnly cookie (more secure than localStorage)
  - Add CSRF protection
  - Add rate limiting on login/register
  - Add account lockout after failed attempts
- **Estimated Time:** 8-12 hours

**Status:** ⏳ Not Started

#### 4.3 Notification System
- **What:** Real-time notifications for:
  - Access request approvals/rejections
  - Comments and replies
  - Mentions
  - Discussion thread updates
  - Suggestions
  - Messages
- **Implementation:**
  - WebSocket or Server-Sent Events
  - Notification preferences
  - Notification history
- **Estimated Time:** 16-24 hours

**Status:** ⏳ Not Started

**Dependencies:**
- Collaborative features (for notification types)

---

### 5. UI/UX Improvements

#### 5.1 Session Management UI
- **What:** View and revoke active sessions
- **Pages:**
  - `/settings/sessions` - List all sessions
  - Revoke individual sessions
  - Revoke all sessions
- **Estimated Time:** 4-6 hours

**Status:** ⏳ Not Started

#### 5.2 Permission Management UI
- **What:** Grant/revoke permissions through UI
- **Pages:**
  - `/trees/{id}/permissions` - Manage tree permissions
  - Grant/revoke individual, family, subtree permissions
- **Estimated Time:** 8-12 hours

**Status:** ⏳ Not Started

#### 5.3 Tree Owner/Maintainer Management UI
- **What:** Manage tree owners and maintainers
- **Pages:**
  - `/trees/{id}/owners` - Manage owners
  - `/trees/{id}/maintainers` - Manage maintainers
- **Estimated Time:** 6-8 hours

**Status:** ⏳ Not Started

#### 5.4 Better Error Messages
- **What:** User-friendly error messages
- **Implementation:**
  - Contextual error messages
  - Error recovery suggestions
  - Better validation messages
- **Estimated Time:** 4-6 hours

**Status:** ⏳ Not Started

#### 5.5 Loading States
- **What:** Consistent loading indicators
- **Implementation:**
  - Skeleton loaders
  - Progress indicators
  - Optimistic updates
- **Estimated Time:** 4-6 hours

**Status:** ⏳ Not Started

**Total Estimated Time:** 26-38 hours

---

### 6. Additional Go API Endpoints (Medium Priority)

#### 6.1 Album Management
- **What:** CRUD for albums, associations, search
- **Status:** ⚠️ Partially implemented (frontend has albums, need to verify Go API)

**Estimated Time:** 8-12 hours (Go API work)

#### 6.2 Geocoding & Mapping
- **What:**
  - Geocoding (address to coordinates)
  - Heatmap (density of events by location)
  - Place mapping (show places on map)
- **Endpoints Needed:**
  - `POST /api/v1/files/{file_id}/places/geocode`
  - `GET /api/v1/files/{file_id}/places/heatmap`
  - `GET /api/v1/files/{file_id}/places/map`
- **Estimated Time:** 16-24 hours (Go API work)

**Status:** ⏳ Not Started

#### 6.3 Navigation Endpoints
- **What:** Next/previous, related records, breadcrumbs
- **Endpoints Needed:**
  - `GET /api/v1/files/{file_id}/individuals/{xref}/next`
  - `GET /api/v1/files/{file_id}/individuals/{xref}/previous`
  - `GET /api/v1/files/{file_id}/individuals/{xref}/related`
  - `GET /api/v1/files/{file_id}/individuals/{xref}/breadcrumbs`
- **Estimated Time:** 8-12 hours (Go API work)

**Status:** ⏳ Not Started

#### 6.4 Date Search Endpoint
- **What:** Search events by date range
- **Endpoint Needed:**
  - `POST /api/v1/files/{file_id}/events/search` (with date range)
- **Estimated Time:** 4-6 hours (Go API work)

**Status:** ⏳ Not Started

#### 6.5 Place Statistics Endpoint
- **What:** Statistics for places (event counts, etc.)
- **Endpoint Needed:**
  - `GET /api/v1/files/{file_id}/statistics/places`
- **Estimated Time:** 4-6 hours (Go API work)

**Status:** ⏳ Not Started

**Total Estimated Time:** 40-60 hours (Go API work)

---

## 📊 Low Priority Features

### 7. Advanced Features

#### 7.1 Data Quality Reports
- **What:**
  - Most wanted (missing data)
  - Completeness reports
  - Data quality scores
- **Estimated Time:** 12-16 hours (Go API work)

**Status:** ⏳ Not Started

#### 7.2 Export Enhancements
- **What:**
  - PDF export
  - Export options (format, fields, etc.)
- **Estimated Time:** 8-12 hours (Go API work)

**Status:** ⏳ Not Started

#### 7.3 Data Maintenance
- **What:**
  - Optimize database
  - Cleanup orphaned records
  - Rebuild indexes
- **Estimated Time:** 8-12 hours (Go API work)

**Status:** ⏳ Not Started

#### 7.4 Media Enhancements
- **What:**
  - Media search
  - Slideshow functionality
- **Estimated Time:** 8-12 hours (Go API work)

**Status:** ⏳ Not Started

#### 7.5 Source/Note Statistics
- **What:** Statistics endpoints for sources and notes
- **Estimated Time:** 4-6 hours (Go API work)

**Status:** ⏳ Not Started

#### 7.6 Advanced Features
- **What:**
  - DNA management
  - Associations
  - Migration paths
- **Estimated Time:** 20-30 hours (Go API work)

**Status:** ⏳ Not Started

**Total Estimated Time:** 60-88 hours (Go API work)

---

## 📋 Recommended Implementation Order

### Option A: Complete Collaborative Features (Recommended)

**Focus:** Enable user collaboration and engagement

1. ✅ Email service integration (4-6 hours) - **CRITICAL**
2. ✅ Comments system (12-16 hours)
3. ✅ Discussion threads (12-16 hours)
4. ✅ Suggestions system (12-16 hours)
5. ✅ Research notes (8-12 hours)
6. ✅ Notification system (16-24 hours)
7. ✅ Direct messaging (16-20 hours)

**Timeline:** 3-4 weeks

**Benefits:**
- Users can collaborate on trees
- Rich discussion and feedback
- Data quality improvements through suggestions
- Better user engagement

---

### Option B: Complete Go API Endpoints

**Focus:** Match TNG feature parity

1. ✅ Merge functionality (20-30 hours)
2. ✅ Chart data endpoints (16-24 hours)
3. ✅ Report endpoints (12-16 hours)
4. ✅ Browse endpoints (4-8 hours)
5. ✅ Geocoding & mapping (16-24 hours)
6. ✅ Navigation endpoints (8-12 hours)

**Timeline:** 3-4 weeks

**Benefits:**
- Complete TNG feature parity
- Better visualization capabilities
- Improved navigation
- Geographic features

---

### Option C: Infrastructure & Polish

**Focus:** Improve performance, security, and UX

1. ✅ Permission caching (4-6 hours)
2. ✅ Security improvements (8-12 hours)
3. ✅ Session management UI (4-6 hours)
4. ✅ Permission management UI (8-12 hours)
5. ✅ Better error messages (4-6 hours)
6. ✅ Loading states (4-6 hours)

**Timeline:** 1-2 weeks

**Benefits:**
- Better performance
- More secure
- Better user experience
- Easier to manage

---

## 🎯 My Recommendation

**Start with Option A (Collaborative Features) + Email Service:**

1. **Email service integration** (4-6 hours) - **CRITICAL** - Enables password reset
2. **Comments system** (12-16 hours) - Foundation for collaboration
3. **Notification system** (16-24 hours) - Required for collaborative features
4. **Discussion threads** (12-16 hours) - Tree-level discussions
5. **Suggestions system** (12-16 hours) - Data quality improvements

**Total:** ~56-78 hours (2-3 weeks)

**Why:**
- Email service is critical for production
- Collaborative features enable user engagement
- Foundation for future features
- High user value

**After This:**
- Move to Go API endpoints (merge, charts, reports)
- Add remaining collaborative features (research notes, messaging)
- Infrastructure improvements

---

## 📊 Summary Statistics

### Frontend Features
- **High Priority:** ~60-80 hours (collaborative features)
- **Medium Priority:** ~26-38 hours (UI/UX improvements)
- **Infrastructure:** ~28-42 hours (caching, security, notifications)
- **Total Frontend:** ~114-160 hours (3-4 weeks)

### Backend (Go API) Features
- **High Priority:** ~52-78 hours (merge, charts, reports, browse)
- **Medium Priority:** ~40-60 hours (albums, geocoding, navigation)
- **Low Priority:** ~60-88 hours (advanced features)
- **Total Backend:** ~152-226 hours (4-6 weeks)

### Combined
- **Total Estimated Time:** ~266-386 hours (7-10 weeks)
- **Current Completion:** ~70% of TNG features
- **Remaining:** ~30% of TNG features

---

## 🚀 Next Immediate Steps

1. **Email Service Integration** (4-6 hours) - **CRITICAL**
   - Set up email service account
   - Integrate with password reset
   - Create email templates

2. **Comments System** (12-16 hours)
   - Implement API routes
   - Create Mycelia facet
   - Build UI components

3. **Notification System** (16-24 hours)
   - Set up WebSocket/SSE
   - Create notification types
   - Build notification UI

---

## ❓ Questions to Consider

1. **Do we have an email service account?** (Required for password reset)
2. **What's the priority: collaboration or feature parity?**
3. **Do we need real-time notifications?** (WebSocket vs polling)
4. **Should we focus on frontend or backend first?**
5. **Are there any critical bugs to fix first?**

---

## 📝 Notes

- All collaborative feature schemas exist in database
- Password reset and user content system are complete
- Subtree permissions and token refresh are complete
- Go API has ~70% of TNG features implemented
- Frontend has comprehensive UI component library
- Mycelia facet system is well-established

