# Endpoint Implementation Locations

**Date:** 2026-01-23  
**Purpose:** Clarify which endpoints are implemented in Go API vs Frontend, and how the proxy pattern works

---

## Architecture Overview

### The Two-Layer Pattern

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js API Routes - Port 4000)             │
│  - Authentication & Authorization                        │
│  - Tree ID → File ID Mapping                            │
│  - Proxy to Go API                                      │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP Proxy
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Go API (Port 8090)                                     │
│  - All GEDCOM Data Operations                           │
│  - Search Logic                                           │
│  - Statistics Calculations                               │
│  - Graph Operations                                      │
└─────────────────────────────────────────────────────────┘
```

**Key Principle:** 
- **Go API** = All data operations and business logic
- **Frontend** = Authentication, permissions, and proxying (no business logic)

---

## 1. Search Endpoints

### 1.1 Family Search

**Go API Implementation:**
- **Location:** `ligneous-gedcom-api/internal/handlers/families.go`
- **Endpoint:** `POST /api/v1/files/{file_id}/families/search`
- **What to Implement:**
  - New handler function: `handleSearchFamilies()`
  - Extend query builder to support family queries
  - Filter by husband/wife names (via graph relationships)
  - Filter by marriage/divorce events
  - Filter by children count
  - Return paginated results

**Frontend Implementation:**
- **Location:** Already handled by catch-all proxy!
- **Endpoint:** `POST /api/trees/{treeId}/families/search`
- **What to Do:** 
  - ✅ **Nothing!** The existing proxy route (`app/api/trees/[id]/[...path]/route.js`) automatically handles this
  - The proxy will:
    1. Authenticate user
    2. Check permissions
    3. Map `treeId` → `file_id`
    4. Forward to Go API: `POST /api/v1/files/{file_id}/families/search`
    5. Return response

**Request Flow:**
```
Client → POST /api/trees/abc123/families/search
  ↓
Frontend Proxy (authenticates, maps treeId → fileId)
  ↓
Go API → POST /api/v1/files/{file_id}/families/search
  ↓
Returns results
```

---

### 1.2 Place Search

**Go API Implementation:**
- **Location:** `ligneous-gedcom-api/internal/handlers/places.go`
- **Endpoint:** `POST /api/v1/files/{file_id}/places/search`
- **What to Implement:**
  - New handler function: `handleSearchPlaces()`
  - Query `gedcom_places_v2` table directly (not via graph)
  - Use PostgreSQL full-text search or `LIKE` queries
  - Filter by name, country, state, county, city
  - Join with events to count event associations
  - Return paginated results

**Frontend Implementation:**
- **Location:** Already handled by catch-all proxy!
- **Endpoint:** `POST /api/trees/{treeId}/places/search`
- **What to Do:** ✅ **Nothing!** Proxy handles it automatically

---

### 1.3 Source Search

**Go API Implementation:**
- **Location:** `ligneous-gedcom-api/internal/handlers/sources.go` (or create new file)
- **Endpoint:** `POST /api/v1/files/{file_id}/sources/search`
- **What to Implement:**
  - New handler function: `handleSearchSources()`
  - Query `gedcom_sources_v2` table directly
  - Use PostgreSQL full-text search for title/author
  - Filter by title, author, publication, repository
  - Join with citations to count citations
  - Return paginated results

**Frontend Implementation:**
- **Location:** Already handled by catch-all proxy!
- **Endpoint:** `POST /api/trees/{treeId}/sources/search`
- **What to Do:** ✅ **Nothing!** Proxy handles it automatically

---

### 1.4 Note Search

**Go API Implementation:**
- **Location:** `ligneous-gedcom-api/internal/handlers/notes.go`
- **Endpoint:** `POST /api/v1/files/{file_id}/notes/search`
- **What to Implement:**
  - New handler function: `handleSearchNotes()`
  - Query `gedcom_notes_v2` table directly
  - Use PostgreSQL full-text search (`tsvector`, `tsquery`)
  - Filter by content, type, associated entity
  - Join with junction tables for entity filtering
  - Return paginated results

**Frontend Implementation:**
- **Location:** Already handled by catch-all proxy!
- **Endpoint:** `POST /api/trees/{treeId}/notes/search`
- **What to Do:** ✅ **Nothing!** Proxy handles it automatically

---

### 1.5 Global Search

**Go API Implementation:**
- **Location:** `ligneous-gedcom-api/internal/handlers/search.go` (new file)
- **Endpoint:** `POST /api/v1/files/{file_id}/search`
- **What to Implement:**
  - New handler function: `handleGlobalSearch()`
  - Execute multiple searches in parallel (goroutines):
    - Search individuals by name
    - Search families by member names
    - Search places by name
    - Search sources by title/author
    - Search notes by content
  - Aggregate and rank results
  - Return categorized response with limits per type

**Frontend Implementation:**
- **Location:** Already handled by catch-all proxy!
- **Endpoint:** `POST /api/trees/{treeId}/search`
- **What to Do:** ✅ **Nothing!** Proxy handles it automatically

---

## 2. Statistics Endpoints

### 2.1 Individual Statistics

**Go API Implementation:**
- **Location:** `ligneous-gedcom-api/internal/handlers/statistics.go` (new file)
- **Endpoint:** `GET /api/v1/files/{file_id}/statistics/individuals`
- **What to Implement:**
  - New handler function: `handleIndividualStatistics()`
  - Query graph for relationship statistics
  - Query database for demographic/geographic statistics
  - Use aggregation queries (COUNT, GROUP BY, AVG)
  - Calculate:
    - Demographics (sex, living status, age distribution)
    - Geographic (top birth/death places)
    - Family structure (children, spouses)
    - Data completeness (missing dates, places, media)
  - Cache results (optional, with TTL)

**Frontend Implementation:**
- **Location:** Already handled by catch-all proxy!
- **Endpoint:** `GET /api/trees/{treeId}/statistics/individuals`
- **What to Do:** ✅ **Nothing!** Proxy handles it automatically

---

### 2.2 Family Statistics

**Go API Implementation:**
- **Location:** `ligneous-gedcom-api/internal/handlers/statistics.go`
- **Endpoint:** `GET /api/v1/files/{file_id}/statistics/families`
- **What to Implement:**
  - New handler function: `handleFamilyStatistics()`
  - Query families table and join with events
  - Calculate marriage/divorce statistics
  - Aggregate geographic data from places
  - Calculate:
    - Family counts (with/without children)
    - Marriage statistics (year range, average age)
    - Geographic (marriage places)
    - Data completeness

**Frontend Implementation:**
- **Location:** Already handled by catch-all proxy!
- **Endpoint:** `GET /api/trees/{treeId}/statistics/families`
- **What to Do:** ✅ **Nothing!** Proxy handles it automatically

---

### 2.3 Tree-Wide Statistics

**Go API Implementation:**
- **Location:** `ligneous-gedcom-api/internal/handlers/statistics.go`
- **Endpoint:** `GET /api/v1/files/{file_id}/statistics`
- **What to Implement:**
  - New handler function: `handleTreeStatistics()`
  - Aggregate data from multiple tables
  - Use graph metrics for tree structure
  - Calculate data quality metrics
  - Query events for activity statistics
  - Calculate:
    - Overall counts (individuals, families, events, etc.)
    - Tree structure (root individuals, disconnected components)
    - Data quality (completeness, duplicates, orphans)
    - Activity (most active periods, places, sources)
  - **Cache results** (this is expensive!)

**Frontend Implementation:**
- **Location:** Already handled by catch-all proxy!
- **Endpoint:** `GET /api/trees/{treeId}/statistics`
- **What to Do:** ✅ **Nothing!** Proxy handles it automatically

---

### 2.4 Media Statistics

**Go API Implementation:**
- **Location:** `ligneous-gedcom-api/internal/handlers/statistics.go`
- **Endpoint:** `GET /api/v1/files/{file_id}/statistics/media`
- **What to Implement:**
  - New handler function: `handleMediaStatistics()`
  - Query media table and junction tables
  - Calculate file sizes from storage
  - Aggregate by type and association
  - Calculate:
    - Media counts (by type, by association)
    - Storage metrics (total size, average size)
    - Usage patterns (orphaned media, most associated)

**Frontend Implementation:**
- **Location:** Already handled by catch-all proxy!
- **Endpoint:** `GET /api/trees/{treeId}/statistics/media`
- **What to Do:** ✅ **Nothing!** Proxy handles it automatically

---

## 3. Summary: What Goes Where

### ✅ Go API (ligneous-gedcom-api) - Implement These

**All Business Logic:**
1. **Search Handlers:**
   - `handleSearchFamilies()` in `families.go`
   - `handleSearchPlaces()` in `places.go`
   - `handleSearchSources()` in `sources.go` (or new file)
   - `handleSearchNotes()` in `notes.go`
   - `handleGlobalSearch()` in `search.go` (new file)

2. **Statistics Handlers:**
   - `handleIndividualStatistics()` in `statistics.go` (new file)
   - `handleFamilyStatistics()` in `statistics.go`
   - `handleTreeStatistics()` in `statistics.go`
   - `handleMediaStatistics()` in `statistics.go`

3. **Route Registration:**
   - Add routes in `file_by_id.go` or main router
   - Map paths to handler functions

**File Structure:**
```
ligneous-gedcom-api/
├── internal/
│   └── handlers/
│       ├── families.go          (add search handler)
│       ├── places.go            (add search handler)
│       ├── sources.go           (add search handler or create new)
│       ├── notes.go             (add search handler)
│       ├── search.go            (new - global search)
│       └── statistics.go        (new - all statistics)
```

---

### ✅ Frontend (ligneous-frontend) - Already Done!

**No Implementation Needed!**

The catch-all proxy route (`app/api/trees/[id]/[...path]/route.js`) automatically handles:
- ✅ Authentication
- ✅ Permission checking
- ✅ Tree ID → File ID mapping
- ✅ Request/response proxying
- ✅ All HTTP methods (GET, POST, PUT, DELETE, etc.)

**How It Works:**
1. Client calls: `POST /api/trees/{treeId}/families/search`
2. Proxy intercepts: `/api/trees/[id]/[...path]`
3. Proxy:
   - Authenticates user
   - Checks permissions
   - Maps `treeId` → `file_id` (from database)
   - Forwards to: `POST /api/v1/files/{file_id}/families/search`
4. Go API processes and returns results
5. Proxy returns response to client

**The proxy already supports:**
- ✅ All paths under `/api/trees/{treeId}/...`
- ✅ All HTTP methods
- ✅ Request body forwarding (JSON, FormData, etc.)
- ✅ Query string forwarding
- ✅ Response forwarding

---

## 4. Implementation Checklist

### Phase 1: Go API - Search Endpoints

- [ ] **Family Search**
  - [ ] Add `handleSearchFamilies()` to `families.go`
  - [ ] Extend query builder for family queries
  - [ ] Add route: `POST /api/v1/files/{file_id}/families/search`
  - [ ] Test with sample data

- [ ] **Place Search**
  - [ ] Add `handleSearchPlaces()` to `places.go`
  - [ ] Implement PostgreSQL queries
  - [ ] Add route: `POST /api/v1/files/{file_id}/places/search`
  - [ ] Test with sample data

- [ ] **Global Search**
  - [ ] Create `search.go` file
  - [ ] Implement `handleGlobalSearch()` with parallel queries
  - [ ] Add route: `POST /api/v1/files/{file_id}/search`
  - [ ] Test with sample data

### Phase 2: Go API - Statistics Endpoints

- [ ] **Statistics Infrastructure**
  - [ ] Create `statistics.go` file
  - [ ] Set up caching mechanism (optional)

- [ ] **Individual Statistics**
  - [ ] Implement `handleIndividualStatistics()`
  - [ ] Add route: `GET /api/v1/files/{file_id}/statistics/individuals`
  - [ ] Test calculations

- [ ] **Tree-Wide Statistics**
  - [ ] Implement `handleTreeStatistics()`
  - [ ] Add route: `GET /api/v1/files/{file_id}/statistics`
  - [ ] Implement caching
  - [ ] Test with large trees

### Phase 3: Frontend - Testing Only

- [ ] **Test Proxy Routes**
  - [ ] Test: `POST /api/trees/{treeId}/families/search`
  - [ ] Test: `POST /api/trees/{treeId}/places/search`
  - [ ] Test: `POST /api/trees/{treeId}/search`
  - [ ] Test: `GET /api/trees/{treeId}/statistics`
  - [ ] Verify authentication works
  - [ ] Verify permissions work
  - [ ] Verify tree_id → file_id mapping works

- [ ] **Update Frontend Components** (if needed)
  - [ ] Add search UI components
  - [ ] Add statistics display components
  - [ ] Update Mycelia facets (if needed)

---

## 5. Key Insights

### ✅ The Proxy Pattern is Powerful

The catch-all proxy route means:
- **No frontend code needed** for new GEDCOM endpoints
- Just implement in Go API
- Proxy automatically handles routing

### ✅ Separation of Concerns

- **Go API:** Pure data operations, no auth/permissions
- **Frontend:** Auth, permissions, tree management, proxying

### ✅ Path Mapping

The proxy automatically maps:
```
/api/trees/{treeId}/individuals/search
  ↓
/api/v1/files/{file_id}/individuals/search
```

No manual mapping needed!

---

## 6. Example: Adding Family Search

### Step 1: Go API Implementation

**File:** `ligneous-gedcom-api/internal/handlers/families.go`

```go
// Add this function
func (h *Handlers) handleSearchFamilies(w http.ResponseWriter, r *http.Request, metadata *storage.FileMetadata) {
    // 1. Get graph
    graph := metadata.Graph
    if graph == nil {
        graph = metadata.GetGraphHybrid()
    }
    
    // 2. Parse request body
    var req FamilySearchRequest
    decoder := json.NewDecoder(r.Body)
    if err := decoder.Decode(&req); err != nil {
        WriteErrorResponse(w, http.StatusBadRequest, "INVALID_REQUEST", ...)
        return
    }
    
    // 3. Build query
    qb := query.NewQueryFromGraph(graph)
    filterQuery := qb.FilterFamilies() // New method
    
    // 4. Apply filters
    if req.Filters.HusbandName != "" {
        filterQuery = filterQuery.ByHusbandName(req.Filters.HusbandName)
    }
    // ... more filters
    
    // 5. Execute and return
    results, err := filterQuery.Execute()
    // ... format response
}
```

**File:** `ligneous-gedcom-api/internal/handlers/file_by_id.go`

```go
// Add route in HandleFileByID function
case "families":
    if len(parts) > 2 && parts[2] == "search" {
        if r.Method == http.MethodPost {
            h.handleSearchFamilies(w, r, metadata)
        }
    }
    // ... existing family routes
```

### Step 2: Frontend - Nothing!

The proxy already handles it. Just test:

```bash
curl -X POST http://localhost:4000/api/trees/{treeId}/families/search \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"filters": {"husband_name": "John"}}'
```

---

## 7. Conclusion

**Implementation Summary:**

1. **Go API:** Implement all search and statistics handlers
2. **Frontend:** ✅ Already done! Proxy handles everything automatically

**Key Takeaway:**
The frontend proxy is a **transparent gateway**. Once you implement endpoints in Go API, they're automatically available through the frontend proxy with authentication and permissions already handled.

**Next Steps:**
1. Implement search handlers in Go API
2. Implement statistics handlers in Go API
3. Test through frontend proxy
4. Build UI components to consume the endpoints

No frontend API route code needed! 🎉

