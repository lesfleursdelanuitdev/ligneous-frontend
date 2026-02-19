# Search and Statistics Endpoints Analysis

**Date:** 2026-01-23  
**Purpose:** Analyze missing search and statistics endpoints, determine implementation priorities, and define necessary statistics

---

## Executive Summary

Based on the TNG Feature Requirements analysis, Ligneous needs to implement:
- **5 missing search endpoints** (Family, Place, Source, Note, Global)
- **4+ statistics endpoints** (Individual, Family, Tree-wide, Media)

The Go API already has:
- ✅ Individual search (`POST /api/v1/files/{file_id}/individuals/search`)
- ✅ Graph metrics (`GET /api/v1/files/{file_id}/metrics`) - but this is graph-focused, not genealogy-focused
- ✅ Query builder system that can be extended

---

## 1. Current Search Implementation Analysis

### 1.1 Existing Individual Search

**Go API Endpoint:** `POST /api/v1/files/{file_id}/individuals/search`

**Request Structure:**
```json
{
  "filters": {
    "name": "string",
    "sex": "M|F|U",
    "birth_date_range": {
      "start": "1800-01-01",
      "end": "1900-12-31"
    },
    "birth_place": "string",
    "has_children": true|false,
    "has_spouse": true|false,
    "living": true|false
  },
  "limit": 100,
  "offset": 0
}
```

**Implementation Details:**
- Uses query builder (`query.NewQueryFromGraph(graph)`)
- Filters via `filterQuery.ByName()`, `filterQuery.BySex()`, etc.
- Returns paginated results with metadata

**Frontend Proxy:** 
- Should proxy to: `POST /api/trees/{treeId}/individuals/search`
- Maps `treeId` → `file_id` and forwards to Go API

---

## 2. Missing Search Endpoints

### 2.1 Family Search

**TNG Requirements:**
- Search by family members' names (husband, wife, children)
- Search by marriage date
- Search by place (marriage place)
- Search by number of children
- Search by divorce status

**Proposed Go API Endpoint:** `POST /api/v1/files/{file_id}/families/search`

**Request Structure:**
```json
{
  "filters": {
    "husband_name": "string",
    "wife_name": "string",
    "child_name": "string",
    "marriage_date_range": {
      "start": "1800-01-01",
      "end": "1900-12-31"
    },
    "marriage_place": "string",
    "divorce_date_range": {
      "start": "1800-01-01",
      "end": "1900-12-31"
    },
    "has_children": true|false,
    "children_count_min": 0,
    "children_count_max": 10,
    "is_divorced": true|false
  },
  "limit": 100,
  "offset": 0
}
```

**Implementation Approach:**
- Extend query builder to support family queries
- Filter families by husband/wife names (via graph relationships)
- Filter by marriage/divorce events
- Filter by children count (from family node)

**Frontend Proxy:** `POST /api/trees/{treeId}/families/search`

---

### 2.2 Place Search

**TNG Requirements:**
- Search by place name (partial match)
- Search by country/state/county
- Search by coordinates (if geocoded)
- Place autocomplete

**Proposed Go API Endpoint:** `POST /api/v1/files/{file_id}/places/search`

**Request Structure:**
```json
{
  "filters": {
    "name": "string",           // Partial match on place name
    "country": "string",
    "state": "string",
    "county": "string",
    "city": "string",
    "has_coordinates": true|false,
    "event_count_min": 0,       // Minimum number of events at this place
    "event_count_max": 100
  },
  "limit": 100,
  "offset": 0
}
```

**Implementation Approach:**
- Query `gedcom_places_v2` table directly (not via graph)
- Use PostgreSQL full-text search or `LIKE` queries
- Join with events to count event associations
- Support hierarchical place matching (country → state → county → city)

**Frontend Proxy:** `POST /api/trees/{treeId}/places/search`

**Note:** Place search is different from individual/family search because places are stored in a normalized table, not in the graph structure.

---

### 2.3 Source Search

**TNG Requirements:**
- Search by source title
- Search by author
- Search by publication information
- Search by repository
- Search by citation count (how many times cited)

**Proposed Go API Endpoint:** `POST /api/v1/files/{file_id}/sources/search`

**Request Structure:**
```json
{
  "filters": {
    "title": "string",
    "author": "string",
    "publication": "string",
    "repository": "string",
    "citation_count_min": 0,
    "citation_count_max": 100
  },
  "limit": 100,
  "offset": 0
}
```

**Implementation Approach:**
- Query `gedcom_sources_v2` table directly
- Use PostgreSQL full-text search or `LIKE` queries
- Join with citations table to count citations
- Support partial matching on text fields

**Frontend Proxy:** `POST /api/trees/{treeId}/sources/search`

---

### 2.4 Note Search

**TNG Requirements:**
- Search by note content (full-text search)
- Search by note type (top-level vs inline)
- Search by associated entity (individual, family, event, source)

**Proposed Go API Endpoint:** `POST /api/v1/files/{file_id}/notes/search`

**Request Structure:**
```json
{
  "filters": {
    "content": "string",         // Full-text search in note content
    "is_top_level": true|false,
    "associated_type": "individual|family|event|source",
    "associated_xref": "string"  // Filter by specific entity
  },
  "limit": 100,
  "offset": 0
}
```

**Implementation Approach:**
- Query `gedcom_notes_v2` table directly
- Use PostgreSQL full-text search (`tsvector`, `tsquery`)
- Join with junction tables to filter by associated entity
- Support partial content matching

**Frontend Proxy:** `POST /api/trees/{treeId}/notes/search`

**Note:** Full-text search requires PostgreSQL text search indexes for performance.

---

### 2.5 Global Search

**TNG Requirements:**
- Search across all record types (individuals, families, places, sources, notes)
- Return categorized results
- Unified search interface

**Proposed Go API Endpoint:** `POST /api/v1/files/{file_id}/search`

**Request Structure:**
```json
{
  "query": "string",            // Search term
  "types": ["individual", "family", "place", "source", "note"],  // Optional: filter types
  "limit_per_type": 10,         // Max results per type
  "limit_total": 50             // Max total results
}
```

**Response Structure:**
```json
{
  "results": {
    "individuals": [...],
    "families": [...],
    "places": [...],
    "sources": [...],
    "notes": [...]
  },
  "meta": {
    "total_individuals": 5,
    "total_families": 3,
    "total_places": 2,
    "total_sources": 1,
    "total_notes": 0,
    "total": 11
  }
}
```

**Implementation Approach:**
- Execute multiple searches in parallel (goroutines)
- Search individuals by name
- Search families by member names
- Search places by name
- Search sources by title/author
- Search notes by content
- Aggregate and rank results
- Return categorized response

**Frontend Proxy:** `POST /api/trees/{treeId}/search`

**Performance Considerations:**
- Global search can be expensive (multiple queries)
- Consider caching for frequently searched terms
- Limit results per type to prevent overwhelming response

---

## 3. Statistics Endpoints Analysis

### 3.1 Current Metrics Endpoint

**Go API Endpoint:** `GET /api/v1/files/{file_id}/metrics`

**Current Metrics:**
- Graph structure metrics (diameter, density, path length)
- Node/edge counts
- Connected components
- Average degree

**Limitation:** These are graph-theory metrics, not genealogy-focused statistics.

---

### 3.2 Necessary Genealogy Statistics

#### 3.2.1 Individual Statistics

**What Statistics Are Needed:**
1. **Demographics:**
   - Total individuals
   - By sex (male, female, unknown)
   - By living status (living, deceased, unknown)
   - Age distribution (by decade/century)
   - Birth year range (earliest, latest, most common decade)
   - Death year range (earliest, latest, most common decade)
   - Average lifespan (for deceased individuals)

2. **Geographic:**
   - Birth places (top 10 countries, states, cities)
   - Death places (top 10 countries, states, cities)
   - Migration patterns (if trackable)

3. **Family Structure:**
   - Individuals with children
   - Individuals without children
   - Average number of children per parent
   - Individuals with spouses
   - Individuals without spouses
   - Average number of marriages per individual

4. **Data Completeness:**
   - Individuals with birth dates
   - Individuals with death dates
   - Individuals with birth places
   - Individuals with death places
   - Individuals with photos/media
   - Individuals with notes
   - Individuals with sources

**Proposed Go API Endpoint:** `GET /api/v1/files/{file_id}/statistics/individuals`

**Response Structure:**
```json
{
  "counts": {
    "total": 1250,
    "by_sex": {
      "male": 620,
      "female": 580,
      "unknown": 50
    },
    "by_living_status": {
      "living": 200,
      "deceased": 1000,
      "unknown": 50
    }
  },
  "demographics": {
    "birth_years": {
      "earliest": 1650,
      "latest": 2020,
      "most_common_decade": "1850-1859"
    },
    "death_years": {
      "earliest": 1700,
      "latest": 2020,
      "most_common_decade": "1900-1909"
    },
    "average_lifespan": 72.5,
    "age_distribution": {
      "0-10": 50,
      "11-20": 80,
      "21-30": 120,
      // ... by decade
    }
  },
  "geographic": {
    "birth_places": {
      "countries": [
        {"name": "United States", "count": 800},
        {"name": "England", "count": 200}
      ],
      "states": [
        {"name": "New York", "count": 300},
        {"name": "Massachusetts", "count": 250}
      ]
    },
    "death_places": {
      // Similar structure
    }
  },
  "family_structure": {
    "with_children": 600,
    "without_children": 650,
    "average_children_per_parent": 2.3,
    "with_spouses": 700,
    "without_spouses": 550,
    "average_marriages_per_individual": 1.2
  },
  "data_completeness": {
    "with_birth_date": 1100,
    "with_death_date": 950,
    "with_birth_place": 1050,
    "with_death_place": 900,
    "with_media": 400,
    "with_notes": 600,
    "with_sources": 800
  }
}
```

**Implementation Approach:**
- Query graph for relationship statistics
- Query database for demographic/geographic statistics
- Use aggregation queries (COUNT, GROUP BY, AVG)
- Cache results (statistics don't change frequently)

---

#### 3.2.2 Family Statistics

**What Statistics Are Needed:**
1. **Family Counts:**
   - Total families
   - Families with children
   - Families without children
   - Average number of children per family
   - Families with marriage dates
   - Families with divorce dates

2. **Marriage Statistics:**
   - Marriage year range (earliest, latest, most common decade)
   - Average age at marriage (husband, wife)
   - Divorce rate
   - Average marriage duration (for divorced families)

3. **Geographic:**
   - Marriage places (top 10)
   - Divorce places (top 10)

4. **Data Completeness:**
   - Families with marriage dates
   - Families with marriage places
   - Families with divorce dates
   - Families with photos/media
   - Families with notes
   - Families with sources

**Proposed Go API Endpoint:** `GET /api/v1/files/{file_id}/statistics/families`

**Response Structure:**
```json
{
  "counts": {
    "total": 500,
    "with_children": 400,
    "without_children": 100,
    "average_children": 2.5
  },
  "marriage": {
    "marriage_years": {
      "earliest": 1700,
      "latest": 2020,
      "most_common_decade": "1850-1859"
    },
    "average_age_at_marriage": {
      "husband": 28.5,
      "wife": 25.2
    },
    "divorce_rate": 0.15,
    "average_marriage_duration": 35.2
  },
  "geographic": {
    "marriage_places": [
      {"name": "New York, NY", "count": 150},
      {"name": "Boston, MA", "count": 100}
    ]
  },
  "data_completeness": {
    "with_marriage_date": 450,
    "with_marriage_place": 400,
    "with_divorce_date": 75,
    "with_media": 200,
    "with_notes": 300,
    "with_sources": 350
  }
}
```

**Implementation Approach:**
- Query families table and join with events
- Calculate marriage/divorce statistics from events
- Aggregate geographic data from places

---

#### 3.2.3 Tree-Wide Statistics

**What Statistics Are Needed:**
1. **Overall Counts:**
   - Total individuals
   - Total families
   - Total events
   - Total places
   - Total sources
   - Total notes
   - Total media files

2. **Tree Structure:**
   - Number of root individuals (no known parents)
   - Number of disconnected components (unconnected family groups)
   - Longest lineage (generations)
   - Average generations per root individual

3. **Data Quality:**
   - Percentage of individuals with complete data
   - Most common missing data types
   - Duplicate records count
   - Orphaned records (individuals without families, families without individuals)

4. **Activity:**
   - Most active time periods (by event dates)
   - Most active places (by event count)
   - Most cited sources

**Proposed Go API Endpoint:** `GET /api/v1/files/{file_id}/statistics`

**Response Structure:**
```json
{
  "counts": {
    "individuals": 1250,
    "families": 500,
    "events": 5000,
    "places": 300,
    "sources": 200,
    "notes": 800,
    "media": 150
  },
  "tree_structure": {
    "root_individuals": 10,
    "disconnected_components": 2,
    "longest_lineage": 12,
    "average_generations_per_root": 8.5
  },
  "data_quality": {
    "complete_individuals_percentage": 75.5,
    "most_common_missing_data": [
      "death_date",
      "birth_place",
      "sources"
    ],
    "duplicate_records": 5,
    "orphaned_individuals": 2,
    "orphaned_families": 0
  },
  "activity": {
    "most_active_periods": [
      {"decade": "1850-1859", "event_count": 500},
      {"decade": "1860-1869", "event_count": 450}
    ],
    "most_active_places": [
      {"place": "New York, NY", "event_count": 800},
      {"place": "Boston, MA", "event_count": 600}
    ],
    "most_cited_sources": [
      {"source": "Census 1850", "citation_count": 200},
      {"source": "Birth Records", "citation_count": 150}
    ]
  }
}
```

**Implementation Approach:**
- Aggregate data from multiple tables
- Use graph metrics for tree structure
- Calculate data quality metrics
- Query events for activity statistics

**Note:** This endpoint can be expensive. Consider caching with TTL.

---

#### 3.2.4 Media Statistics

**What Statistics Are Needed:**
1. **Media Counts:**
   - Total media files
   - By type (image, document, audio, video)
   - By association (individuals, families, events)

2. **Storage:**
   - Total storage size
   - Average file size
   - Largest files

3. **Usage:**
   - Media files with associations
   - Media files without associations (orphaned)
   - Most associated media (linked to many entities)

**Proposed Go API Endpoint:** `GET /api/v1/files/{file_id}/statistics/media`

**Response Structure:**
```json
{
  "counts": {
    "total": 150,
    "by_type": {
      "image": 120,
      "document": 20,
      "audio": 5,
      "video": 5
    },
    "by_association": {
      "individuals": 100,
      "families": 30,
      "events": 20
    }
  },
  "storage": {
    "total_size_bytes": 524288000,
    "total_size_mb": 500,
    "average_file_size_bytes": 3495253,
    "largest_files": [
      {"id": "M001", "size_bytes": 10485760, "filename": "large_photo.jpg"}
    ]
  },
  "usage": {
    "with_associations": 140,
    "without_associations": 10,
    "most_associated": [
      {"id": "M001", "association_count": 15}
    ]
  }
}
```

**Implementation Approach:**
- Query media table and junction tables
- Calculate file sizes from storage
- Aggregate by type and association

---

## 4. Implementation Priority

### 4.1 High Priority (Phase 1)

**Search Endpoints:**
1. **Family Search** - Critical for finding families by member names
2. **Place Search** - Important for geographic queries
3. **Global Search** - Essential for unified search experience

**Statistics Endpoints:**
1. **Tree-Wide Statistics** - Overview dashboard needs this
2. **Individual Statistics** - Most commonly viewed statistics

**Rationale:**
- These are the most frequently used features in genealogy applications
- Family and place searches are natural extensions of individual search
- Global search provides unified discovery
- Statistics are needed for dashboards and reports

---

### 4.2 Medium Priority (Phase 2)

**Search Endpoints:**
1. **Source Search** - Important for researchers
2. **Note Search** - Useful for finding specific information

**Statistics Endpoints:**
1. **Family Statistics** - Important for family analysis
2. **Media Statistics** - Useful for media management

**Rationale:**
- Source and note searches are less frequently used but valuable
- Family statistics complement individual statistics
- Media statistics help with organization

---

### 4.3 Low Priority (Phase 3)

**Enhancements:**
- Advanced search filters (phonetic matching, fuzzy search)
- Cached statistics with auto-refresh
- Statistics comparison (compare two trees)
- Export statistics to reports

---

## 5. Architecture Considerations

### 5.1 Go API Implementation

**Search Endpoints:**
- Extend query builder for family/place/source/note queries
- Use PostgreSQL full-text search for text fields
- Implement parallel queries for global search
- Add pagination and result limiting

**Statistics Endpoints:**
- Create new statistics handlers
- Use database aggregation queries (COUNT, GROUP BY, AVG)
- Cache expensive statistics (with TTL)
- Consider background calculation for large trees

**File Structure:**
```
internal/handlers/
├── individuals.go      (existing - has search)
├── families.go         (add search handler)
├── places.go           (add search handler)
├── sources.go          (add search handler)
├── notes.go            (add search handler)
├── search.go           (new - global search)
└── statistics.go       (new - all statistics endpoints)
```

---

### 5.2 Frontend Proxy Implementation

**Proxy Routes:**
- `POST /api/trees/[id]/families/search` → `POST /api/v1/files/{file_id}/families/search`
- `POST /api/trees/[id]/places/search` → `POST /api/v1/files/{file_id}/places/search`
- `POST /api/trees/[id]/sources/search` → `POST /api/v1/files/{file_id}/sources/search`
- `POST /api/trees/[id]/notes/search` → `POST /api/v1/files/{file_id}/notes/search`
- `POST /api/trees/[id]/search` → `POST /api/v1/files/{file_id}/search`
- `GET /api/trees/[id]/statistics` → `GET /api/v1/files/{file_id}/statistics`
- `GET /api/trees/[id]/statistics/individuals` → `GET /api/v1/files/{file_id}/statistics/individuals`
- `GET /api/trees/[id]/statistics/families` → `GET /api/v1/files/{file_id}/statistics/families`
- `GET /api/trees/[id]/statistics/media` → `GET /api/v1/files/{file_id}/statistics/media`

**Implementation:**
- Use existing proxy pattern (`/api/trees/[id]/proxy/[...path]`)
- Or create specific routes for clarity
- Map `treeId` → `file_id` before proxying
- Handle authentication and permissions

---

## 6. Performance Considerations

### 6.1 Search Performance

**Optimizations:**
- Add database indexes on searchable fields (name, place, title, content)
- Use PostgreSQL full-text search indexes for text fields
- Limit result sets (default 100, max 1000)
- Cache frequent searches (optional)

**Global Search:**
- Execute searches in parallel (goroutines)
- Limit results per type (default 10 per type)
- Total limit (default 50 total)
- Consider async processing for very large trees

---

### 6.2 Statistics Performance

**Optimizations:**
- Cache statistics with TTL (e.g., 1 hour)
- Invalidate cache on data changes
- Use database views for complex aggregations
- Background calculation for expensive statistics
- Provide "skip_expensive" flag (like metrics endpoint)

**Caching Strategy:**
- Cache tree-wide statistics (most expensive)
- Cache individual/family statistics (moderately expensive)
- Real-time for simple counts (fast queries)

---

## 7. Database Considerations

### 7.1 Indexes Needed

**For Search:**
- `gedcom_individuals_v2.full_name` - GIN index for full-text search
- `gedcom_families_v2` - Index on husband_id, wife_id for name searches
- `gedcom_places_v2.name` - GIN index for full-text search
- `gedcom_sources_v2.title` - GIN index for full-text search
- `gedcom_sources_v2.author` - Index for author search
- `gedcom_notes_v2.content` - GIN index for full-text search

**For Statistics:**
- Indexes on date fields for aggregation
- Indexes on place_id for geographic statistics
- Indexes on junction tables for association counts

---

### 7.2 Full-Text Search Setup

**PostgreSQL Text Search:**
- Create `tsvector` columns for searchable text
- Create GIN indexes on `tsvector` columns
- Use `tsquery` for search queries
- Support multiple languages (if needed)

**Example:**
```sql
ALTER TABLE gedcom_individuals_v2 
ADD COLUMN name_search_vector tsvector;

CREATE INDEX idx_individuals_name_search 
ON gedcom_individuals_v2 
USING GIN(name_search_vector);

-- Update trigger to maintain tsvector
```

---

## 8. Recommendations

### 8.1 Implementation Order

1. **Start with Family Search** - Natural extension of individual search
2. **Add Tree-Wide Statistics** - Needed for dashboards
3. **Implement Place Search** - Frequently used feature
4. **Add Individual Statistics** - Most viewed statistics
5. **Implement Global Search** - Unifies search experience
6. **Add Source/Note Search** - Less critical but valuable
7. **Add Family/Media Statistics** - Complete the statistics suite

### 8.2 Testing Strategy

- Unit tests for query builders
- Integration tests for search endpoints
- Performance tests for large trees
- Cache invalidation tests for statistics

### 8.3 Documentation

- Document search filter options
- Document statistics calculation methods
- Document caching behavior
- Document performance characteristics

---

## 9. Conclusion

**Missing Endpoints Summary:**
- **Search:** 5 endpoints (Family, Place, Source, Note, Global)
- **Statistics:** 4 endpoints (Individual, Family, Tree-wide, Media)

**Estimated Effort:**
- **Search Endpoints:** Medium (2-3 weeks)
- **Statistics Endpoints:** Medium-High (3-4 weeks)
- **Total:** ~6-7 weeks for complete implementation

**Key Decisions:**
1. Use PostgreSQL full-text search for text fields
2. Cache expensive statistics with TTL
3. Implement global search with parallel queries
4. Extend existing query builder pattern
5. Use proxy pattern in frontend for all new endpoints

This analysis provides a roadmap for implementing the missing search and statistics functionality to match TNG's comprehensive feature set.

