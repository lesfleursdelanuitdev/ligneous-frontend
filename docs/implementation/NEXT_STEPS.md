# Next Steps - Implementation Roadmap

**Date:** 2026-01-23  
**Status:** Phase 1 Complete - Ready for Database Setup

---

## ✅ What We've Completed

### Phase 1: Foundation ✅

1. **✅ Next.js Project Setup**
   - JavaScript (not TypeScript)
   - Tailwind CSS
   - Mycelia Plugin System integrated
   - Port 4000 configured

2. **✅ Database Schema**
   - Prisma schema with 8 tables
   - Multiple tree owners support
   - Website owner (superuser) support
   - Permission system designed

3. **✅ Permission System**
   - Permission checking utilities (`lib/permissions.js`)
   - Public/private tree logic
   - Unauthenticated user support
   - Website owner priority check

4. **✅ Authentication**
   - API routes: register, login, logout, me
   - useAuth Mycelia facet
   - Login/Register UI pages
   - JWT token management
   - Session management

5. **✅ Testing**
   - Test suite for useAuth (20 tests passing)
   - Vitest configured

6. **✅ Seed Script**
   - Website owner creation script
   - Username: `monalig`, Password: `Oscar890!`

---

## 🚀 Immediate Next Steps

### Step 1: Database Setup & Migration

**Prerequisites:**
- PostgreSQL database server running
- Database `ligneous_frontend` created (or will be created by Prisma)

**Commands:**
```bash
cd /apps/ligneous-frontend

# 1. Create database (if not exists)
createdb ligneous_frontend

# 2. Update .env.local with database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/ligneous_frontend?sslmode=disable"
# JWT_SECRET="your-secret-key-change-in-production"

# 3. Run migrations
npx prisma migrate dev --name init

# 4. Generate Prisma client
npx prisma generate

# 5. Run seed script to create website owner
npm run db:seed
```

**Expected Result:**
- All 8 tables created in database
- Website owner user created (monalig)

---

### Step 2: Test Authentication End-to-End

**Test the complete authentication flow:**

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Test registration:**
   - Visit `http://localhost:4000/register`
   - Create a new user account
   - Verify user is created in database

3. **Test login:**
   - Visit `http://localhost:4000/login`
   - Login with created account
   - Verify JWT token is stored
   - Verify user state in Mycelia facet

4. **Test website owner:**
   - Login with `monalig` / `Oscar890!`
   - Verify `isWebsiteOwner` flag is true
   - Verify superuser access works

5. **Test logout:**
   - Click logout
   - Verify token is removed
   - Verify user state is cleared

---

## 📋 Phase 2: Tree Management

### 2.1 Tree API Routes

**Create Next.js API routes:**

- `GET /api/trees` - List user's trees
  - Filter by owner, collaborator
  - Include public trees (for unauthenticated users)
  - Check permissions

- `POST /api/trees` - Create tree
  - Validate input
  - Create tree record in database
  - Upload GEDCOM file to Go API
  - Map `tree_id` → `file_id`
  - Add creator as primary owner
  - Auto-add website owner (if exists)

- `GET /api/trees/[id]` - Get tree details
  - Check read permission (public/private)
  - Return tree metadata
  - Include owner/maintainer info

- `PUT /api/trees/[id]` - Update tree
  - Check write permission (owner/maintainer)
  - Update tree metadata
  - Validate ownership

- `DELETE /api/trees/[id]` - Delete tree
  - Check owner permission (only owners can delete)
  - Delete from database
  - Optionally delete from Go API

- `GET /api/trees/[id]/owners` - Get tree owners
- `POST /api/trees/[id]/owners` - Add owner (owner-only)
- `DELETE /api/trees/[id]/owners/[userId]` - Remove owner (owner-only)
- `GET /api/trees/[id]/maintainers` - Get maintainers
- `POST /api/trees/[id]/maintainers` - Add maintainer (owner/maintainer)
- `DELETE /api/trees/[id]/maintainers/[userId]` - Remove maintainer (owner/maintainer)

**Dependencies:**
- Permission checking (`lib/permissions.js`)
- Go API integration (for file upload)
- Authentication middleware

---

### 2.2 Go API Integration

**Create proxy routes to Go API:**

- `POST /api/go/upload` - Upload GEDCOM file
  - Proxy to Go API `/api/files/upload`
  - Return `file_id`

- `GET /api/go/trees/[treeId]/metadata` - Get tree metadata
  - Get `file_id` from database
  - Proxy to Go API `/api/files/[fileId]/metadata`
  - Return metadata

- `GET /api/go/trees/[treeId]/individuals` - Get individuals
  - Get `file_id` from database
  - Proxy to Go API `/api/files/[fileId]/individuals`
  - Apply permission filtering

**Go API Base URL:**
- Default: `http://localhost:8090`
- Configurable via `GO_API_URL` environment variable

---

### 2.3 Tree Mycelia Facet

**Create `useTrees` facet:**

```javascript
// mycelia/facets/trees.js
export const useTrees = createHook({
  // State: trees[], currentTree, loading, error
  // Actions: listTrees(), getTree(), createTree(), updateTree(), deleteTree()
});
```

**Features:**
- Reactive state management
- Tree CRUD operations
- Permission checking
- Event emission (tree:created, tree:updated, etc.)

---

### 2.4 Tree Management UI

**Create UI pages:**

- `/trees` - Tree list page
  - Show user's trees
  - Show public trees (if unauthenticated)
  - Filter/search
  - Create tree button

- `/trees/[id]` - Tree detail page
  - Tree metadata
  - Owner/maintainer list
  - Permission management (if owner/maintainer)
  - Tree settings

- `/trees/new` - Create tree page
  - Upload GEDCOM file
  - Set tree name/description
  - Set public/private
  - Submit to API

---

## 📋 Phase 3: Collaboration & Permissions

### 3.1 User-Individual Linking

- API routes for linking users to individuals
- UI for managing links
- Automatic permission granting

### 3.2 Access Requests

- API routes for access requests
- UI for requesting access
- UI for reviewing requests (owners/maintainers)

### 3.3 Permission Management

- API routes for granting/revoking permissions
- UI for permission management
- Subtree permission visualization

---

## 🎯 Recommended Order

1. **✅ Database Setup** (Step 1 above)
2. **✅ Test Authentication** (Step 2 above)
3. **Tree API Routes** (Phase 2.1)
4. **Go API Integration** (Phase 2.2)
5. **Tree Mycelia Facet** (Phase 2.3)
6. **Tree Management UI** (Phase 2.4)
7. **Collaboration Features** (Phase 3)

---

## 🔧 Configuration Checklist

Before proceeding, ensure:

- [ ] PostgreSQL database is running
- [ ] Database `ligneous_frontend` exists or can be created
- [ ] `.env.local` has correct `DATABASE_URL`
- [ ] `.env.local` has `JWT_SECRET` set
- [ ] `.env.local` has `GO_API_URL` set (for Phase 2)
- [ ] Go API is running on port 8090 (for Phase 2)

---

## 📝 Notes

- **Database Migration:** First migration will create all tables. If you have existing data, you'll need a migration script.
- **Go API:** Must be running for Phase 2 (tree management)
- **Testing:** Test each phase before moving to the next
- **Documentation:** Update documentation as you implement features

---

**Status:** Ready to start database setup! 🚀


