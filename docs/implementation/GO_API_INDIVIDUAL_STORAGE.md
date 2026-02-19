# Go API Individual Storage Analysis

**Date:** 2026-01-23  
**Purpose:** Understand how the Go API stores individuals in the database

---

## Key Finding: Individuals Use XREF, Not UUID

**Answer:** No, individuals do NOT have unique UUIDs. They use **XREF (cross-reference)** identifiers from the GEDCOM file itself.

---

## Individual Identification

### XREF (Cross-Reference)

Individuals are identified by their **XREF** (cross-reference), which is:
- A string identifier from the GEDCOM file (e.g., "I1", "I2", "I10")
- Part of the GEDCOM 5.5.1 standard
- Unique within a file, but NOT globally unique
- Used in all API endpoints: `/api/v1/files/{file_id}/individuals/{xref}`

### Example from Code

From `internal/handlers/individuals.go`:

```go
func (h *Handlers) individualToJSON(indi *types.IndividualRecord, graph *query.Graph) map[string]interface{} {
    data := map[string]interface{}{
        "xref": indi.XrefID(),  // Returns string like "I1", "I2"
        "name": indi.GetName(),
    }
    // ...
}
```

### API Endpoints

All individual endpoints use `xref`:
- `GET /api/v1/files/{file_id}/individuals/{xref}` - Get individual by xref
- `GET /api/v1/files/{file_id}/individuals/{xref}/parents` - Get parents
- `GET /api/v1/files/{file_id}/individuals/{xref}/children` - Get children
- etc.

---

## Storage Architecture

### Hybrid Storage (PostgreSQL + BadgerDB)

The Go API uses a **hybrid storage** approach:

1. **In-Memory Graph** (fast, for immediate queries)
   - Built immediately after file upload
   - Stored in `FileMetadata.Graph`
   - Used for all API queries

2. **Persistent Graph** (PostgreSQL + BadgerDB)
   - Built in background after upload response
   - Stored via `SaveGraphToHybridStorage()`
   - Uses `BuildGraphHybridPostgres()` from the `query` package
   - Graph structure persisted, not individual records as separate rows

### Graph Structure

The graph is stored as a **graph structure**, not as individual database rows:
- Nodes represent individuals and families
- Edges represent relationships
- The graph is persisted as a whole, not as individual records

### Database Usage

From `internal/storage/graph_persistence.go`:

```go
builtGraph, graphErr := query.BuildGraphHybridPostgres(
    tree,
    fileID,
    badgerPath,
    databaseURL,
    nil, // Use default config
)
```

The database stores:
- Graph metadata and structure
- Relationships between individuals
- NOT individual records as separate rows with UUIDs

---

## Implications for Frontend Schema

### Current Frontend Schema

Our frontend schema uses:
- `user_individual_links.individual_xref` - String like "I1", "I2"
- `permissions.resource_id` - String like "I1" for individuals
- `access_requests.resource_id` - String like "I1" for subtrees

### ✅ This is Correct!

Our schema is **already correct** because:
1. ✅ We use `individual_xref` (string) to reference individuals
2. ✅ We use `tree_id` + `individual_xref` to uniquely identify individuals
3. ✅ We don't need UUIDs - xref is sufficient within a tree
4. ✅ XREF is the standard GEDCOM identifier

### Uniqueness

**Within a tree:** XREF is unique (e.g., "I1" appears only once per tree)  
**Across trees:** XREF is NOT unique (multiple trees can have "I1")  
**Solution:** Use `tree_id` + `individual_xref` as composite key

---

## Database Schema Comparison

### Go API Database
- Stores graph structure (nodes, edges)
- Uses `file_id` to identify files
- Uses `xref` to identify individuals within a file
- No individual UUIDs

### Frontend Database
- Stores user management and permissions
- Uses `tree_id` to identify trees (maps to Go API's `file_id`)
- Uses `individual_xref` to identify individuals (maps to Go API's `xref`)
- No individual UUIDs needed ✅

---

## Conclusion

**No changes needed to our schema!**

Our frontend schema correctly uses:
- `individual_xref` (VARCHAR) instead of UUID
- `tree_id` + `individual_xref` for uniqueness
- This matches the Go API's approach perfectly

The Go API does NOT use UUIDs for individuals - it uses XREF strings from the GEDCOM file, which is exactly what our schema expects.


