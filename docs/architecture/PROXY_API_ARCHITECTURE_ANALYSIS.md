# Proxy API Architecture Analysis

**Date:** Current Session  
**Purpose:** Analyze why we have proxy APIs and determine optimal architecture

---

## Current Architecture

### Frontend (Next.js API Routes - Port 4000)
- Authentication endpoints (`/api/auth/*`)
- Tree management endpoints (`/api/trees/*`)
- User-specific endpoints (`/api/me/*`)
- Admin endpoints (`/api/admin/*`)
- **Proxy routes** (`/api/trees/[id]/proxy/*`)

### Backend (Go API - Port 8090)
- All GEDCOM data operations
- File operations
- Individual/Family/Event/Note/Source operations
- Graph operations
- Media operations
- Export operations

---

## The Key Question

**Why do we have proxy APIs? Shouldn't most endpoints be proxies unless they're dealing with users?**

---

## Analysis: What Should Be Where?

### ✅ **Frontend API Routes (Next.js) - User/Tree Management**

These MUST be in the frontend because they deal with the **frontend database**:

1. **User Authentication** (`/api/auth/*`)
   - `POST /api/auth/register` - Create user account
   - `POST /api/auth/login` - Authenticate user
   - `POST /api/auth/logout` - End session
   - `GET /api/auth/me` - Get current user
   - **Why:** Frontend database (users, sessions, JWT tokens)

2. **Tree Management** (`/api/trees/*`)
   - `GET /api/trees` - List user's trees
   - `POST /api/trees` - Create new tree
   - `GET /api/trees/[id]` - Get tree details
   - `PUT /api/trees/[id]` - Update tree
   - `DELETE /api/trees/[id]` - Delete tree
   - **Why:** Frontend database (trees, ownership, metadata)
   - **Key Function:** Maps `tree_id` → `file_id` for Go API

3. **Collaboration** (`/api/trees/[id]/collaborators/*`)
   - Add/remove collaborators
   - Permission management
   - **Why:** Frontend database (permissions, access control)

4. **User-Specific Data** (`/api/me/*`)
   - User statistics
   - User-individual links
   - **Why:** Frontend database (user data)

5. **Admin Operations** (`/api/admin/*`)
   - User management
   - Tree administration
   - **Why:** Frontend database (admin operations)

### ✅ **Should Be Proxied (Go API) - GEDCOM Data Operations**

These should ALL be proxies because they deal with **Go API's database**:

1. **File Operations**
   - `POST /api/trees/[id]/files` → `POST /api/v1/files`
   - `GET /api/trees/[id]/files` → `GET /api/v1/files`
   - `GET /api/trees/[id]/files/[file_id]` → `GET /api/v1/files/{file_id}`
   - `POST /api/trees/[id]/files/[file_id]/validate` → `POST /api/v1/files/{file_id}/validate`
   - `GET /api/trees/[id]/files/[file_id]/export` → `GET /api/v1/files/{file_id}/export`

2. **Individual Operations**
   - `GET /api/trees/[id]/individuals` → `GET /api/v1/files/{file_id}/individuals`
   - `GET /api/trees/[id]/individuals/[xref]` → `GET /api/v1/files/{file_id}/individuals/{xref}`
   - `POST /api/trees/[id]/individuals/search` → `POST /api/v1/files/{file_id}/individuals/search`
   - `GET /api/trees/[id]/individuals/[xref]/ancestors` → `GET /api/v1/files/{file_id}/individuals/{xref}/ancestors`
   - `GET /api/trees/[id]/individuals/[xref]/descendants` → `GET /api/v1/files/{file_id}/individuals/{xref}/descendants`
   - `GET /api/trees/[id]/individuals/[xref]/parents` → `GET /api/v1/files/{file_id}/individuals/{xref}/parents`
   - `GET /api/trees/[id]/individuals/[xref]/children` → `GET /api/v1/files/{file_id}/individuals/{xref}/children`
   - `GET /api/trees/[id]/individuals/[xref]/siblings` → `GET /api/v1/files/{file_id}/individuals/{xref}/siblings`
   - `GET /api/trees/[id]/individuals/[xref]/spouses` → `GET /api/v1/files/{file_id}/individuals/{xref}/spouses`
   - `GET /api/trees/[id]/individuals/[xref1]/path/[xref2]` → `GET /api/v1/files/{file_id}/individuals/{xref1}/path/{xref2}`
   - `POST /api/trees/[id]/individuals` → `POST /api/v1/files/{file_id}/individuals`
   - `PUT /api/trees/[id]/individuals/[xref]` → `PUT /api/v1/files/{file_id}/individuals/{xref}`
   - `DELETE /api/trees/[id]/individuals/[xref]` → `DELETE /api/v1/files/{file_id}/individuals/{xref}`

3. **Family Operations**
   - `GET /api/trees/[id]/families` → `GET /api/v1/files/{file_id}/families`
   - `GET /api/trees/[id]/families/[xref]` → `GET /api/v1/files/{file_id}/families/{xref}`
   - `POST /api/trees/[id]/families` → `POST /api/v1/files/{file_id}/families`
   - `PUT /api/trees/[id]/families/[xref]` → `PUT /api/v1/files/{file_id}/families/{xref}`
   - `DELETE /api/trees/[id]/families/[xref]` → `DELETE /api/v1/files/{file_id}/families/{xref}`

4. **Event Operations**
   - All event CRUD operations → Go API

5. **Note Operations**
   - All note CRUD operations → Go API

6. **Source Operations**
   - All source CRUD operations → Go API

7. **Place/Date Operations**
   - All place/date operations → Go API

8. **Graph Operations**
   - `GET /api/trees/[id]/graph/ancestors` → `GET /api/v1/files/{file_id}/individuals/{xref}/ancestors`
   - `GET /api/trees/[id]/graph/descendants` → `GET /api/v1/files/{file_id}/individuals/{xref}/descendants`
   - `GET /api/trees/[id]/graph/path` → `GET /api/v1/files/{file_id}/individuals/{xref1}/path/{xref2}`
   - `GET /api/trees/[id]/graph/metrics` → `GET /api/v1/files/{file_id}/metrics`
   - `GET /api/trees/[id]/graph/centrality` → `GET /api/v1/files/{file_id}/centrality`

9. **Duplicate Detection**
   - `POST /api/trees/[id]/duplicates` → `POST /api/v1/files/{file_id}/duplicates`

10. **Media Operations**
    - All media CRUD operations → Go API

11. **Edit History**
    - `GET /api/trees/[id]/edit-history` → `GET /api/v1/files/{file_id}/edit-history`

---

## The Proxy Pattern

### Current Approach (Specific Proxy Routes)

```
/api/trees/[id]/proxy/[...path]/route.js
```

**Issues:**
- Only handles specific paths
- Requires explicit route definitions
- Doesn't cover all endpoints
- More maintenance

### Better Approach (Catch-All Proxy)

**Pattern:** Most GEDCOM operations should use a catch-all proxy route:

```
/api/trees/[id]/[...path]/route.js
```

**Logic:**
1. Check if route is frontend-specific (collaborators, permissions, etc.)
2. If not, proxy to Go API with `file_id` mapping

**Benefits:**
- ✅ Single route handles all GEDCOM operations
- ✅ Automatic coverage of all Go API endpoints
- ✅ Less code to maintain
- ✅ Consistent pattern

---

## Recommended Architecture

### Frontend API Routes (Next.js)

**Explicit Routes (Frontend Database):**
```
/api/auth/*              # User authentication
/api/trees               # Tree CRUD (list, create)
/api/trees/[id]          # Tree details, update, delete
/api/trees/[id]/collaborators/*  # Collaborator management
/api/trees/[id]/permissions/*    # Permission management
/api/trees/[id]/upload   # Tree file upload (creates tree + file)
/api/me/*                # User-specific data
/api/admin/*             # Admin operations
```

**Catch-All Proxy Route (Go API):**
```
/api/trees/[id]/[...path]/route.js
```

**Proxy Logic:**
```javascript
// Pseudo-code
export async function GET(request, { params }) {
  const { id: treeId, path } = params;
  
  // 1. Authenticate user (JWT)
  const user = await authenticate(request);
  
  // 2. Check permissions (frontend database)
  const hasAccess = await checkTreeAccess(user.id, treeId);
  if (!hasAccess) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // 3. Map tree_id → file_id (frontend database)
  const fileId = await getFileIdFromTreeId(treeId);
  
  // 4. Build Go API URL
  const goApiUrl = `${process.env.GO_API_URL}/api/v1/files/${fileId}/${path.join('/')}`;
  
  // 5. Proxy request
  const response = await fetch(goApiUrl, {
    method: request.method,
    headers: {
      'Authorization': request.headers.get('Authorization'),
      'Content-Type': request.headers.get('Content-Type'),
    },
    body: request.body,
  });
  
  // 6. Return response
  return response;
}
```

---

## Why This Architecture?

### Separation of Concerns

**Frontend Database (PostgreSQL):**
- Users, sessions, JWT
- Trees (metadata, ownership)
- Permissions, collaborators
- User-individual links
- Access requests

**Go API Database (PostgreSQL):**
- GEDCOM files
- Individuals, families, events
- Notes, sources, places, dates
- Media files
- Edit logs
- Graph data

### Benefits

1. **Clear Boundaries:**
   - Frontend handles user/tree management
   - Go API handles GEDCOM data
   - No duplication of logic

2. **Single Source of Truth:**
   - GEDCOM data only in Go API
   - User/tree data only in frontend
   - No sync issues

3. **Simplified Frontend:**
   - Most routes are simple proxies
   - Only user/tree routes need custom logic
   - Less code to maintain

4. **Scalability:**
   - Go API can scale independently
   - Frontend can scale independently
   - Clear separation allows optimization

---

## Current vs. Recommended

### Current (Specific Routes)

```
/api/trees/[id]/individuals/route.js        # Explicit route
/api/trees/[id]/families/route.js          # Explicit route
/api/trees/[id]/events/route.js            # Explicit route
/api/trees/[id]/proxy/[...path]/route.js   # Catch-all for some
```

**Problems:**
- Need to create route for each endpoint type
- More code to maintain
- Easy to miss endpoints
- Inconsistent patterns

### Recommended (Catch-All Proxy)

```
/api/trees/[id]/[...path]/route.js  # Single catch-all route
```

**Benefits:**
- ✅ One route handles all GEDCOM operations
- ✅ Automatic coverage
- ✅ Less code
- ✅ Consistent pattern
- ✅ Easy to add new Go API endpoints (no frontend changes needed)

---

## Exception: Special Routes

Some routes might need special handling:

1. **File Upload** (`/api/trees/[id]/upload`)
   - Creates tree record (frontend DB)
   - Uploads file to Go API
   - Links tree to file
   - **Why:** Needs both databases

2. **Tree Statistics** (`/api/trees/[id]/stats`)
   - Combines tree metadata (frontend) + file stats (Go API)
   - **Why:** Needs data from both sources

3. **Permission-Aware Queries**
   - Some queries might need to filter based on permissions
   - **Why:** Frontend knows permissions, Go API doesn't

---

## Conclusion

**Yes, you're absolutely right!**

Most endpoints **should** be proxies. The frontend API routes should only handle:

1. **User authentication** (frontend database)
2. **Tree management** (frontend database)
3. **Permission checking** (frontend database)
4. **Tree-to-file mapping** (frontend database)

Everything else should be a **catch-all proxy** that:
- Authenticates the user
- Checks permissions
- Maps `tree_id` → `file_id`
- Proxies to Go API
- Returns the response

This architecture is:
- ✅ Simpler
- ✅ More maintainable
- ✅ More scalable
- ✅ Clearer separation of concerns

The current architecture with specific proxy routes is more complex than necessary. A single catch-all proxy route would be much cleaner and easier to maintain.

