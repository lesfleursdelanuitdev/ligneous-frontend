# Ligneous Frontend Architecture

**Date:** 2026-01-23  
**Status:** Simplified architecture with gateway built into frontend

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              Frontend (Next.js) - Port 4000                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Components (UI)                               │   │
│  │  - Pages, components, layouts                         │   │
│  └───────────────────────┬──────────────────────────────┘   │
│                          │                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Mycelia Plugin System (Domain Logic)                │   │
│  │  - useAuth, useTrees, useAPI facets                 │   │
│  └───────────────────────┬──────────────────────────────┘   │
│                          │                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js API Routes (/api/*) - Gateway               │   │
│  │  - Authentication endpoints                           │   │
│  │  - Tree management endpoints                         │   │
│  │  - Proxy to GEDCOM lib API                           │   │
│  └───────────────────────┬──────────────────────────────┘   │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              GEDCOM Lib API (ligneous-gedcom-lib-api)        │
│  - Port 8091                                                 │
│  - File processing, parsing, queries                        │
│  - Source of truth for GEDCOM data                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. Gateway Built into Frontend

**Decision:** Use Next.js API routes instead of separate gateway service

**Benefits:**
- ✅ Simpler architecture (one service instead of two)
- ✅ No separate port needed
- ✅ Easier deployment
- ✅ API routes run on same port as frontend
- ✅ Better for development (single dev server)

**Trade-offs:**
- ⚠️ Frontend and gateway are coupled (but that's fine for this project)
- ⚠️ Can't scale gateway independently (acceptable for MVP)

### 2. Mycelia Plugin System for Domain Logic

**Decision:** Use Mycelia Plugin System for business logic, React for UI

**Benefits:**
- ✅ Separation of concerns (domain logic vs. UI)
- ✅ Event-driven architecture
- ✅ Reusable facets
- ✅ Testable domain logic

### 3. Next.js API Routes as Gateway

**Decision:** Use Next.js API routes for authentication, tree management, and proxying

**Structure:**
```
app/api/
├── auth/
│   ├── register/route.js    # POST /api/auth/register
│   └── login/route.js       # POST /api/auth/login
├── trees/
│   ├── route.js              # GET /api/trees, POST /api/trees
│   └── [id]/
│       ├── route.js          # GET /api/trees/:id, PUT, DELETE
│       ├── collaborators/route.js
│       └── proxy/[...path]/route.js  # Proxy to Go API
└── ...
```

---

## Request Flow

### Client-Side Request

1. **React Component** calls Mycelia facet (e.g., `useTrees`)
2. **Mycelia Facet** makes HTTP request to Next.js API route
3. **Next.js API Route** handles request:
   - Authenticates user (JWT)
   - Checks permissions
   - Maps tree_id → file_id
   - Proxies to Go API (if needed)
4. **Response** flows back through the chain

### Example: Get Tree Individuals

```
User clicks "View Individuals"
  ↓
React Component: useTrees().getIndividuals(treeId)
  ↓
HTTP: GET /api/trees/{treeId}/individuals
  ↓
Next.js API Route: app/api/trees/[id]/individuals/route.js
  ↓
1. Verify JWT token
2. Check user can access tree
3. Lookup tree_id → file_id
4. Proxy: GET http://localhost:8091/api/v1/files/{file_id}/individuals
  ↓
Go API returns individuals
  ↓
API Route returns to client
  ↓
Mycelia facet updates state
  ↓
React component re-renders
```

---

## Port Configuration

### Current Setup

- **Frontend + API Routes:** Port `4000`
- **GEDCOM lib API:** Port `8091` (ligneous-gedcom-lib-api)

### Environment Variables

**`.env.local`:**
```bash
# Go API URL (for server-side proxying)
LIB_API_URL=http://localhost:8091

# Frontend API base URL (for client-side requests)
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## Database

The frontend will need a database for:
- User accounts
- Tree ownership
- Collaborators
- User-individual links

**Options:**
1. **SQLite** (simplest for development)
2. **PostgreSQL** (production-ready, same as Go API uses)
3. **Prisma** (ORM, works with both)

**Recommendation:** Start with SQLite for development, migrate to PostgreSQL for production.

---

## Next Steps

1. ✅ Port configuration updated
2. ⏳ Create Next.js API route structure
3. ⏳ Implement authentication API routes
4. ⏳ Implement tree management API routes
5. ⏳ Implement Go API proxy routes
6. ⏳ Set up database (Prisma + SQLite)
7. ⏳ Create Mycelia facets (useAuth, useTrees, useAPI)

---

## Comparison: Old vs. New Architecture

### Old Architecture (Separate Gateway)

```
Frontend (4000) → Gateway (5000) → GEDCOM lib API (8091)
```

**Issues:**
- Two services to run
- Two ports to manage
- More complex deployment
- Gateway project was too complex

### New Architecture (Built-in Gateway)

```
Frontend + API Routes (4000) → GEDCOM lib API (8091)
```

**Benefits:**
- One service to run
- One port to manage
- Simpler deployment
- Easier development

---

## Migration Notes

Since we're not using the separate `ligneous-gedcom-gateway` project:

1. ✅ Port configuration updated to use Next.js API routes
2. ✅ Environment variables updated
3. ⏳ Need to create API route structure
4. ⏳ Need to implement authentication
5. ⏳ Need to implement tree management
6. ⏳ Need to implement Go API proxy

The separate gateway project can be archived or deleted - we're building a simpler version directly in the frontend.


