# Implementation Plan

**Date:** 2026-01-23  
**Status:** Planning - Ready to Start Implementation

---

## Current State

✅ **Completed:**
- Next.js project setup (JavaScript, Tailwind, Mycelia)
- Database schema designed (8 tables)
- Permission rules defined
- Architecture planned (Next.js API routes as gateway)
- Go API analysis complete (uses XREF, not UUIDs)

⏳ **Next:** Start implementation

---

## Implementation Phases

### Phase 1: Foundation (Database & Authentication)

**Goal:** Set up database and basic authentication

#### 1.1 Database Setup
- [ ] Choose ORM/query library (Prisma, Drizzle, or raw SQL)
- [ ] Create database migrations for all 8 tables:
  - `users`
  - `sessions`
  - `trees`
  - `user_individual_links`
  - `permissions`
  - `tree_maintainers`
  - `access_requests`
  - `private_data`
- [ ] Set up database connection (PostgreSQL)
- [ ] Create seed data (optional: test user, test tree)
- [ ] Test database connection

**Decisions needed:**
- **ORM choice:** Prisma (recommended) vs Drizzle vs raw SQL
  - Prisma: Easy migrations, type-safe, good DX
  - Drizzle: Lightweight, more control
  - Raw SQL: Full control, but more manual work
- **Database:** PostgreSQL (same as Go API, but separate database)

#### 1.2 Authentication API Routes
- [ ] `POST /api/auth/register` - User registration
  - Validate input (username, email, password)
  - Hash password (bcrypt)
  - Create user in database
  - Return JWT token
- [ ] `POST /api/auth/login` - User login
  - Validate credentials
  - Check password hash
  - Create session (store in database)
  - Return JWT token
- [ ] `POST /api/auth/logout` - User logout
  - Revoke session (mark as revoked)
- [ ] `GET /api/auth/me` - Get current user
  - Verify JWT token
  - Return user info
- [ ] JWT middleware for protected routes
  - Verify token
  - Extract user_id
  - Add to request context

**Dependencies:**
- JWT library (jsonwebtoken)
- bcrypt for password hashing
- Database connection

#### 1.3 Authentication Mycelia Facet
- [ ] Create `useAuth` facet
  - `register(username, email, password)`
  - `login(username, password)`
  - `logout()`
  - `getCurrentUser()`
  - `isAuthenticated()` - reactive state
  - `user` - reactive user object
- [ ] Store JWT token (localStorage or cookie)
- [ ] Auto-refresh token (if needed)
- [ ] Handle token expiration

**Dependencies:**
- API routes from 1.2
- Mycelia Plugin System

---

### Phase 2: Tree Management

**Goal:** Basic tree CRUD and ownership

#### 2.1 Tree API Routes
- [ ] `GET /api/trees` - List user's trees
  - Filter by owner, collaborator
  - Check permissions
- [ ] `POST /api/trees` - Create tree
  - Validate input
  - Create tree record
  - Upload file to Go API
  - Map tree_id → file_id
  - Set owner
- [ ] `GET /api/trees/[id]` - Get tree details
  - Check read permission
  - Return tree metadata
- [ ] `PUT /api/trees/[id]` - Update tree
  - Check write permission (owner/maintainer)
  - Update tree metadata
- [ ] `DELETE /api/trees/[id]` - Delete tree
  - Check admin permission (owner only)
  - Delete from database
  - Delete from Go API (optional)
- [ ] `GET /api/trees/[id]/metadata` - Get tree metadata from Go API
  - Proxy to Go API
  - Map file_id → tree_id

**Dependencies:**
- Authentication middleware
- Permission checking logic
- Go API integration

#### 2.2 Permission Checking Logic
- [ ] Create permission check functions:
  - `hasPermission(userId, treeId, resourceType, resourceId, permissionType)`
  - Check hierarchy: Website Owner → Tree Owner → Maintainer → Explicit → Subtree → Tree-level → Public
- [ ] Implement subtree detection
  - Check if individual is descendant of subtree root
  - Query Go API for graph structure
- [ ] Implement tree-level read check
- [ ] Implement public/private tree logic

**Dependencies:**
- Database queries
- Go API graph queries (for subtree detection)

#### 2.3 Tree Mycelia Facet
- [ ] Create `useTrees` facet
  - `listTrees()` - Get user's trees
  - `getTree(id)` - Get tree details
  - `createTree(name, file)` - Create tree
  - `updateTree(id, data)` - Update tree
  - `deleteTree(id)` - Delete tree
  - `getTreeMetadata(id)` - Get metadata from Go API
- [ ] Reactive state: `trees`, `currentTree`, `loading`, `error`

**Dependencies:**
- API routes from 2.1
- Mycelia Plugin System

---

### Phase 3: Go API Integration

**Goal:** Proxy requests to Go API and map tree_id → file_id

#### 3.1 Go API Proxy Routes
- [ ] `GET /api/trees/[id]/proxy/[...path]` - Generic proxy
  - Verify JWT
  - Check read permission
  - Map tree_id → file_id
  - Forward request to Go API
  - Return response
- [ ] Specific proxy routes (optional, for convenience):
  - `GET /api/trees/[id]/individuals` - List individuals
  - `GET /api/trees/[id]/individuals/[xref]` - Get individual
  - `GET /api/trees/[id]/families` - List families
  - `GET /api/trees/[id]/metrics` - Get metrics
  - etc.

**Dependencies:**
- HTTP client (axios or fetch)
- Tree lookup (tree_id → file_id)
- Permission checking

#### 3.2 Tree-File Mapping
- [ ] Store mapping: `trees.file_id` → Go API's file_id
- [ ] When creating tree:
  - Upload file to Go API
  - Get file_id from Go API response
  - Store in `trees.file_id`
- [ ] When proxying:
  - Lookup `trees.file_id` by `tree_id`
  - Use in Go API request

**Dependencies:**
- Go API file upload endpoint
- Database queries

---

### Phase 4: User-Individual Linking

**Goal:** Link users to individuals and grant permissions

#### 4.1 User-Individual Link API Routes
- [ ] `POST /api/trees/[id]/links` - Create link
  - Verify user owns link (or maintainer approves)
  - Create `user_individual_links` record
  - Grant automatic permissions:
    - Tree-level read
    - Individual write
    - Subtree write
- [ ] `GET /api/trees/[id]/links` - List links
  - Get user's links in tree
- [ ] `DELETE /api/trees/[id]/links/[linkId]` - Remove link
  - Revoke permissions
  - Delete link

**Dependencies:**
- Permission granting logic
- Database queries

#### 4.2 Permission Granting Logic
- [ ] `grantUserIndividualLinkPermissions(userId, treeId, individualXref)`
  - Grant tree-level read
  - Grant individual write
  - Grant subtree write
- [ ] `revokeUserIndividualLinkPermissions(userId, treeId, individualXref)`
  - Remove all three permissions

**Dependencies:**
- Database queries

#### 4.3 User-Individual Link Mycelia Facet
- [ ] Create `useUserLinks` facet
  - `createLink(treeId, individualXref)` - Create link
  - `listLinks(treeId)` - List user's links
  - `removeLink(linkId)` - Remove link

**Dependencies:**
- API routes from 4.1
- Mycelia Plugin System

---

### Phase 5: Advanced Features

**Goal:** Access requests, maintainers, private data

#### 5.1 Access Requests
- [ ] `POST /api/trees/[id]/access-requests` - Create request
- [ ] `GET /api/trees/[id]/access-requests` - List requests (maintainers only)
- [ ] `PUT /api/trees/[id]/access-requests/[id]` - Approve/reject
  - If approved: grant permission
- [ ] `DELETE /api/trees/[id]/access-requests/[id]` - Cancel request

#### 5.2 Tree Maintainers
- [ ] `POST /api/trees/[id]/maintainers` - Add maintainer
- [ ] `GET /api/trees/[id]/maintainers` - List maintainers
- [ ] `DELETE /api/trees/[id]/maintainers/[userId]` - Remove maintainer

#### 5.3 Private Data
- [ ] `POST /api/trees/[id]/private-data` - Mark field as private
- [ ] `GET /api/trees/[id]/private-data` - List private fields
- [ ] `DELETE /api/trees/[id]/private-data/[id]` - Remove private marking
- [ ] Filter private data in Go API responses (if needed)

---

### Phase 6: Frontend UI

**Goal:** Build user interface

#### 6.1 Authentication UI
- [ ] Login page (`/login`)
- [ ] Register page (`/register`)
- [ ] Logout button
- [ ] User profile page

#### 6.2 Tree Management UI
- [ ] Tree list page (`/trees`)
- [ ] Tree detail page (`/trees/[id]`)
- [ ] Create tree page (`/trees/new`)
- [ ] Tree settings page (`/trees/[id]/settings`)

#### 6.3 Individual Viewing UI
- [ ] Individual list (from Go API)
- [ ] Individual detail page
- [ ] Family tree visualization (future)

#### 6.4 Permission Management UI
- [ ] Link to individual UI
- [ ] Access request UI
- [ ] Maintainer management UI
- [ ] Collaborator management UI

---

## Implementation Order (Recommended)

### Week 1: Foundation
1. Database setup (Prisma + PostgreSQL)
2. Authentication API routes
3. Authentication Mycelia facet
4. Basic login/register UI

### Week 2: Tree Management
5. Tree API routes
6. Permission checking logic
7. Tree Mycelia facet
8. Tree list/create UI

### Week 3: Go API Integration
9. Go API proxy routes
10. Tree-file mapping
11. Individual viewing UI

### Week 4: User-Individual Linking
12. User-individual link API routes
13. Permission granting logic
14. User-individual link Mycelia facet
15. Linking UI

### Week 5: Advanced Features
16. Access requests
17. Tree maintainers
18. Private data

---

## Key Decisions Needed

### 1. ORM/Query Library
**Options:**
- **Prisma** (recommended)
  - ✅ Easy migrations
  - ✅ Type-safe queries
  - ✅ Good DX
  - ✅ Works with PostgreSQL
- **Drizzle**
  - ✅ Lightweight
  - ✅ More control
  - ⚠️ Less tooling
- **Raw SQL** (pg library)
  - ✅ Full control
  - ⚠️ More manual work
  - ⚠️ No type safety

**Recommendation:** Start with Prisma for faster development.

### 2. JWT Token Storage
**Options:**
- **HTTP-only cookie** (recommended)
  - ✅ More secure (XSS protection)
  - ✅ Automatic sending
  - ⚠️ CSRF protection needed
- **localStorage**
  - ✅ Easy to implement
  - ⚠️ XSS vulnerability
  - ⚠️ Manual token management

**Recommendation:** Use HTTP-only cookies for production, localStorage for MVP.

### 3. Subtree Detection
**Options:**
- **Query Go API** (recommended)
  - Use Go API's graph queries
  - Check if individual is descendant
- **Cache in database**
  - Store parent-child relationships
  - Faster, but needs sync

**Recommendation:** Query Go API for now, cache later if needed.

### 4. Database Setup
**Options:**
- **PostgreSQL** (recommended)
  - Same as Go API
  - Production-ready
- **SQLite** (development)
  - Easier for local dev
  - Migrate to PostgreSQL later

**Recommendation:** Use PostgreSQL from the start (same as Go API).

---

## Dependencies to Install

### Backend (API Routes)
- `prisma` - ORM
- `@prisma/client` - Prisma client
- `jsonwebtoken` - JWT tokens
- `bcrypt` - Password hashing
- `axios` - HTTP client (for Go API)
- `cookie` - Cookie parsing

### Frontend (Mycelia Facets)
- Already have: `mycelia-kernel-plugin`
- Already have: `axios`

---

## Testing Strategy

### Unit Tests
- Permission checking logic
- Permission granting logic
- Subtree detection

### Integration Tests
- API routes
- Database queries
- Go API proxy

### E2E Tests (Future)
- User registration → login → create tree → link to individual

---

## Next Immediate Steps

1. **Choose ORM** (Prisma recommended)
2. **Set up database** (PostgreSQL)
3. **Create migrations** (all 8 tables)
4. **Create authentication API routes** (register, login, logout)
5. **Create authentication Mycelia facet** (useAuth)
6. **Create basic login/register UI**

Start with Phase 1.1 (Database Setup) - this is the foundation for everything else.

