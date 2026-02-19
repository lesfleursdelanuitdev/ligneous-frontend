# TNG Feature Requirements Analysis

**Date:** Updated 2026-02-13  
**Purpose:** Analyze TNG (The Next Generation of Genealogy Sitebuilding) features and determine minimum requirements for Ligneous Frontend API  
**Status:** Comparison with current Go API implementation

---

## Executive Summary

TNG is a comprehensive genealogy web application with extensive features for displaying, searching, editing, and managing genealogical data. This document analyzes TNG's capabilities and maps them to requirements for the Ligneous Frontend API.

**Key Finding:** TNG has **100+ features** across multiple categories. The Ligneous Frontend API needs to support all of these to match TNG's functionality.

**Implementation Status:** As of 2026-02-13, approximately **70% of TNG features** are implemented in the Go API. All search, statistics, timeline, and core CRUD operations are complete. Remaining gaps are primarily in merge functionality, chart data endpoints, formatted reports, albums, geocoding, and navigation.

---

## 1. Core Data Management Features

### 1.1 Individual Management
**TNG Features:**
- View individual details (person page)
- Edit individual information
- Add new individuals
- Delete individuals
- Merge duplicate individuals
- Search individuals (by name, date, place)
- Advanced search with multiple criteria
- Browse individuals (alphabetical, by date, by place)
- Individual statistics (birth/death dates, places, etc.)
- Relationship display (parents, children, siblings, spouses)
- Timeline view for individuals
- Individual reports (pedigree, descendant, etc.)

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/individuals` - List individuals (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/individuals/{xref}` - Get individual (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/individuals` - Create individual (✅ implemented in Go API)
- ✅ `PUT /api/trees/{treeId}/individuals/{xref}` - Update individual (✅ implemented in Go API)
- ✅ `DELETE /api/trees/{treeId}/individuals/{xref}` - Delete individual (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/individuals/search` - Search individuals (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/individuals/{xref}/parents` - Get parents (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/individuals/{xref}/children` - Get children (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/individuals/{xref}/siblings` - Get siblings (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/individuals/{xref}/spouses` - Get spouses (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/statistics/individuals` - Individual statistics (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/timeline` - Timeline view (✅ implemented in Go API)
- ❌ **Missing:** Merge individuals functionality

### 1.2 Family Management
**TNG Features:**
- View family details (family group sheet)
- Edit family information
- Add new families
- Delete families
- Search families
- Browse families
- Family statistics
- Family members display (husband, wife, children)
- Marriage/divorce information
- Family events timeline

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/families` - List families (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/families/{xref}` - Get family (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/families` - Create family (✅ implemented in Go API)
- ✅ `PUT /api/trees/{treeId}/families/{xref}` - Update family (✅ implemented in Go API)
- ✅ `DELETE /api/trees/{treeId}/families/{xref}` - Delete family (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/families/search` - Family search (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/statistics/families` - Family statistics (✅ implemented in Go API)
- ❌ **Missing:** Merge families functionality

### 1.3 Event Management
**TNG Features:**
- View events for individuals/families
- Edit events
- Add new events
- Delete events
- Event types (birth, death, marriage, divorce, etc.)
- Custom event types
- Event dates and places
- Event sources and notes
- Event timeline view

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/events` - List events (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/events/{eventId}` - Get event (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/events` - Create event (✅ implemented in Go API)
- ✅ `PUT /api/trees/{treeId}/events/{eventId}` - Update event (✅ implemented in Go API)
- ✅ `DELETE /api/trees/{treeId}/events/{eventId}` - Delete event (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/timeline` - Event timeline view (✅ implemented in Go API - includes events)

### 1.4 Source Management
**TNG Features:**
- View sources
- Edit sources
- Add new sources
- Delete sources
- Source citations
- Source repository information
- Source search
- Source statistics

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/sources` - List sources (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/sources/{xref}` - Get source (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/sources` - Create source (✅ implemented in Go API)
- ✅ `PUT /api/trees/{treeId}/sources/{xref}` - Update source (✅ implemented in Go API)
- ✅ `DELETE /api/trees/{treeId}/sources/{xref}` - Delete source (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/sources/{xref}/citations` - Get citations (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/sources/search` - Source search (✅ implemented in Go API)
- ❌ **Missing:** Source statistics endpoint

### 1.5 Note Management
**TNG Features:**
- View notes
- Edit notes
- Add new notes
- Delete notes
- Note search
- Note statistics

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/notes` - List notes (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/notes/{xref}` - Get note (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/notes` - Create note (✅ implemented in Go API)
- ✅ `PUT /api/trees/{treeId}/notes/{xref}` - Update note (✅ implemented in Go API)
- ✅ `DELETE /api/trees/{treeId}/notes/{xref}` - Delete note (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/notes/search` - Note search (✅ implemented in Go API)

### 1.6 Place Management
**TNG Features:**
- View places
- Edit places
- Place search
- Place statistics
- Place mapping (geocoding)
- Places by country/state/county
- Place heatmap
- Events at place

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/places` - List places (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/places/{placeId}` - Get place (✅ implemented in Go API)
- ✅ `PUT /api/trees/{treeId}/places/{placeId}` - Update place (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/places/{placeId}/events` - Events at place (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/places/search` - Place search (✅ implemented in Go API)
- ❌ **Missing:** Place statistics endpoint
- ❌ **Missing:** Place geocoding endpoint
- ❌ **Missing:** Place heatmap endpoint

### 1.7 Date Management
**TNG Features:**
- View dates
- Date parsing and normalization
- Date search
- Date statistics
- Events with date
- Date range queries

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/dates` - List dates (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/dates/{dateId}` - Get date (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/dates/{dateId}/events` - Events with date (✅ implemented in Go API)
- ❌ **Missing:** Date search endpoint
- ❌ **Missing:** Date statistics endpoint

---

## 2. Search & Discovery Features

### 2.1 Search Functionality
**TNG Features:**
- **Individual Search:**
  - Search by name (first, last, full)
  - Search by date (birth, death)
  - Search by place
  - Search by ID number
  - Advanced search with multiple criteria
  - Phonetic name search (Soundex)
  - Partial name matching
  - Search results pagination
  - Search result sorting

- **Family Search:**
  - Search by family members' names
  - Search by marriage date
  - Search by place

- **Place Search:**
  - Search by place name
  - Search by country/state/county
  - Place autocomplete

- **Source Search:**
  - Search by source title
  - Search by author
  - Search by repository

- **Global Search:**
  - Search across all record types
  - Categorized search results

**Ligneous Frontend API Requirements:**
- ✅ `POST /api/trees/{treeId}/individuals/search` - Individual search (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/families/search` - Family search (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/places/search` - Place search (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/sources/search` - Source search (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/notes/search` - Note search (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/search` - Global search (✅ implemented in Go API - searches across all types)

### 2.2 Browse Functionality
**TNG Features:**
- Browse individuals (alphabetical, by date, by place)
- Browse families
- Browse places (by country, by state, by county)
- Browse sources
- Browse albums/media
- Browse surnames
- Browse given names

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/individuals` - Browse individuals (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/families` - Browse families (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/places` - Browse places (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/sources` - Browse sources (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/surnames` - Browse surnames (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/surnames/{surname}` - Get individuals with surname (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/given-names` - Browse given names (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/given-names/{givenName}` - Get individuals with given name (✅ implemented in Go API)
- ❌ **Missing:** Browse media/albums endpoint

---

## 3. Relationship & Graph Features

### 3.1 Relationship Queries
**TNG Features:**
- **Ancestors:**
  - Pedigree chart (ancestor tree)
  - Multi-generation ancestor view
  - Ancestor statistics

- **Descendants:**
  - Descendant chart
  - Multi-generation descendant view
  - Descendant statistics

- **Relationship Path:**
  - Find relationship between two individuals
  - Calculate relationship degree (cousin levels, etc.)
  - Display relationship path

- **Family Relationships:**
  - Parents
  - Children
  - Siblings
  - Spouses
  - Extended family

- **Common Ancestors:**
  - Find common ancestors between individuals
  - Calculate relationship through common ancestors

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/individuals/{xref}/ancestors` - Get ancestors (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/individuals/{xref}/descendants` - Get descendants (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/individuals/{xref1}/paths/{xref2}` - Relationship path (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/individuals/{xref}/parents` - Get parents (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/individuals/{xref}/children` - Get children (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/individuals/{xref}/siblings` - Get siblings (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/individuals/{xref}/spouses` - Get spouses (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/individuals/{xref1}/common-ancestors/{xref2}` - Common ancestors (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/individuals/{xref1}/relationship/{xref2}` - Relationship calculation (✅ implemented in Go API - includes degree)

### 3.2 Charts & Visualizations
**TNG Features:**
- **Pedigree Charts:**
  - Standard pedigree (ancestor tree)
  - Multi-generation pedigree
  - Compact pedigree
  - Fan chart (circular pedigree)

- **Descendant Charts:**
  - Standard descendant tree
  - Multi-generation descendant view
  - Compact descendant view

- **Family Charts:**
  - Family group sheet
  - Family tree view
  - Multi-family view

- **Relationship Charts:**
  - Relationship diagram
  - Relationship path visualization

- **Timeline Charts:**
  - Individual timeline
  - Family timeline
  - Event timeline

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/timeline` - Timeline data (✅ implemented in Go API - includes individual, family, and event timelines)
- ❌ **Missing:** Chart data endpoints (pedigree chart data, descendant chart data, fan chart data, family chart data)
- ❌ **Missing:** Chart generation endpoints (server-side chart image generation)

---

## 4. Reports & Statistics Features

### 4.1 Individual Reports
**TNG Features:**
- Individual summary report
- Individual detail report
- Individual statistics
- Individual timeline report
- Individual relationship report

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/statistics/individuals` - Individual statistics (✅ implemented in Go API)
- ❌ **Missing:** Individual report endpoints (formatted reports - summary, detail, timeline, relationship)

### 4.2 Family Reports
**TNG Features:**
- Family group sheet
- Family summary report
- Family statistics
- Family timeline report

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/statistics/families` - Family statistics (✅ implemented in Go API)
- ❌ **Missing:** Family report endpoints (formatted reports - group sheet, summary, timeline)

### 4.3 Tree-Wide Reports
**TNG Features:**
- Surname list
- Given name list
- Place list
- Source list
- Statistics summary
- Most wanted (missing information)
- Duplicate records report
- Data quality report

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/statistics` - Statistics summary (✅ implemented in Go API - tree-wide statistics)
- ✅ `POST /api/trees/{treeId}/duplicates` - Duplicate detection (✅ implemented in Go API)
- ❌ **Missing:** Surname list endpoint
- ❌ **Missing:** Given name list endpoint
- ❌ **Missing:** Most wanted (missing data) endpoint
- ❌ **Missing:** Data quality report endpoint

---

## 5. Media & Album Features

### 5.1 Media Management
**TNG Features:**
- View media (images, documents, audio, video)
- Upload media
- Edit media metadata
- Delete media
- Media search
- Media browse
- Media albums
- Media associations (link to individuals, families, events)
- Media thumbnails
- Media slideshow
- Media statistics

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/media` - List media (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/media/{mediaId}` - Get media (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/media` - Upload media (✅ implemented in Go API)
- ✅ `PUT /api/trees/{treeId}/media/{mediaId}` - Update media (✅ implemented in Go API)
- ✅ `DELETE /api/trees/{treeId}/media/{mediaId}` - Delete media (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/media/{mediaId}/file` - Serve media file (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/media/{mediaId}/thumbnail` - Serve thumbnail (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/media/{mediaId}/associations` - Add associations (✅ implemented in Go API)
- ✅ `DELETE /api/trees/{treeId}/media/{mediaId}/associations/{id}` - Remove association (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/statistics/media` - Media statistics (✅ implemented in Go API)
- ❌ **Missing:** Media search endpoint
- ❌ **Missing:** Media albums endpoint
- ❌ **Missing:** Media slideshow endpoint

### 5.2 Album Management
**TNG Features:**
- Create albums
- Edit albums
- Delete albums
- Add media to albums
- Remove media from albums
- Reorder media in albums
- Album search
- Album browse
- Album statistics

**Ligneous Frontend API Requirements:**
- ❌ **Missing:** All album management endpoints (CRUD)
- ❌ **Missing:** Album-media association endpoints
- ❌ **Missing:** Album search endpoint

---

## 6. Import & Export Features

### 6.1 GEDCOM Import
**TNG Features:**
- Upload GEDCOM file
- Parse GEDCOM file
- Validate GEDCOM file
- Import progress tracking
- Import error reporting
- Import statistics
- Merge with existing data
- Import options (what to import)

**Ligneous Frontend API Requirements:**
- ✅ `POST /api/trees/{treeId}/upload` - Upload GEDCOM (✅ implemented in Go API)
- ✅ `POST /api/trees/{treeId}/validate` - Validate GEDCOM (✅ implemented in Go API)
- ❌ **Missing:** Import progress tracking endpoint
- ❌ **Missing:** Import statistics endpoint
- ❌ **Missing:** Merge import options endpoint

### 6.2 Export Features
**TNG Features:**
- Export to GEDCOM
- Export to PDF
- Export to CSV
- Export to JSON
- Export subtree
- Export with options (what to include)

**Ligneous Frontend API Requirements:**
- ✅ `GET /api/trees/{treeId}/export?format=gedcom` - GEDCOM export (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/export?format=json` - JSON export (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/export?format=csv` - CSV export (✅ implemented in Go API)
- ✅ `GET /api/trees/{treeId}/export?root={xref}&ancestors={n}&descendants={n}` - Subtree export (✅ implemented in Go API)
- ❌ **Missing:** PDF export endpoint
- ❌ **Missing:** Export options endpoint

---

## 7. Data Quality & Maintenance Features

### 7.1 Duplicate Detection
**TNG Features:**
- Find duplicate individuals
- Find duplicate families
- Compare duplicates
- Merge duplicates
- Duplicate statistics

**Ligneous Frontend API Requirements:**
- ✅ `POST /api/trees/{treeId}/duplicates` - Find duplicates (✅ implemented in Go API)
- ✅ `POST /api/trees/duplicates/compare` - Compare two files for duplicates (✅ implemented in Go API)
- ❌ **Missing:** Merge duplicates endpoint
- ❌ **Missing:** Duplicate statistics endpoint

### 7.2 Data Quality
**TNG Features:**
- Most wanted (missing information)
- Data completeness report
- Data validation
- Data quality metrics
- Missing dates/places report
- Missing sources report

**Ligneous Frontend API Requirements:**
- ⚠️ **Missing:** Most wanted endpoint
- ⚠️ **Missing:** Data completeness endpoint
- ⚠️ **Missing:** Data quality metrics endpoint
- ⚠️ **Missing:** Missing data reports endpoints

### 7.3 Data Maintenance
**TNG Features:**
- Optimize database
- Clean up orphaned records
- Rebuild indexes
- Data statistics
- Storage statistics

**Ligneous Frontend API Requirements:**
- ⚠️ **Missing:** Optimize endpoint
- ⚠️ **Missing:** Cleanup endpoints
- ⚠️ **Missing:** Statistics endpoints

---

## 8. Advanced Features

### 8.1 Geocoding & Mapping
**TNG Features:**
- Geocode places (get coordinates)
- Place mapping (show on map)
- Place heatmap
- Events on map
- Migration paths

**Ligneous Frontend API Requirements:**
- ❌ **Missing:** Geocoding endpoint (convert place names to coordinates)
- ❌ **Missing:** Place mapping endpoint (get coordinates for places)
- ❌ **Missing:** Heatmap endpoint (place frequency/event density data)
- ❌ **Missing:** Migration paths endpoint (temporal movement patterns)

### 8.2 DNA Features
**TNG Features:**
- DNA test management
- DNA match display
- DNA segment analysis
- DNA statistics

**Ligneous Frontend API Requirements:**
- ⚠️ **Missing:** All DNA-related endpoints (if needed)

### 8.3 Association Features
**TNG Features:**
- Associate individuals (non-family relationships)
- Association types
- Association search
- Association statistics

**Ligneous Frontend API Requirements:**
- ⚠️ **Missing:** Association management endpoints

---

## 9. User Interface Features

### 9.1 Display Features
**TNG Features:**
- Person page (individual detail view)
- Family group sheet
- Pedigree chart display
- Descendant chart display
- Timeline display
- Relationship display
- Media gallery
- Album display

**Ligneous Frontend API Requirements:**
- ✅ Most display data endpoints already exist
- ✅ `GET /api/trees/{treeId}/timeline` - Timeline data (✅ implemented in Go API)
- ❌ **Missing:** Chart data formatting endpoints (pedigree, descendant, fan, family chart data structures)

### 9.2 Navigation Features
**TNG Features:**
- Breadcrumb navigation
- Related records navigation
- Next/previous individual
- Next/previous family
- Quick links

**Ligneous Frontend API Requirements:**
- ❌ **Missing:** Navigation endpoints (next/previous individual, next/previous family, related records, breadcrumb data)

---

## 10. Administrative Features

### 10.1 User Management
**TNG Features:**
- User accounts
- User roles/permissions
- User activity tracking
- User statistics

**Ligneous Frontend API Requirements:**
- ✅ User management (handled by frontend, not Go API)
- ✅ Permissions (handled by frontend)

### 10.2 Tree Management
**TNG Features:**
- Multiple trees (GEDCOM files)
- Tree settings
- Tree statistics
- Tree backup/restore

**Ligneous Frontend API Requirements:**
- ✅ Tree management (handled by frontend)
- ✅ `GET /api/trees/{treeId}/statistics` - Tree statistics (✅ implemented in Go API)
- ❌ **Missing:** Tree backup/restore endpoints

---

## 11. Missing Features Summary

### 11.1 High Priority (Core Functionality)
1. **Merge Functionality:**
   - ❌ Merge individuals
   - ❌ Merge families
   - ❌ Merge duplicates

2. **Chart Data Endpoints:**
   - ❌ Pedigree chart data (structured data for rendering)
   - ❌ Descendant chart data
   - ❌ Fan chart data
   - ❌ Family chart data

3. **Report Endpoints:**
   - ❌ Individual reports (formatted summary, detail, timeline, relationship reports)
   - ❌ Family reports (formatted group sheet, summary, timeline)
   - ❌ Tree-wide reports (surname list, given name list, place list, source list)
   - ❌ Data quality reports (most wanted, completeness, missing data)

4. **Browse Endpoints:**
   - ❌ Browse by surname
   - ❌ Browse by given name
   - ❌ Browse media/albums

### 11.2 Medium Priority (Enhanced Features)
1. **Album Management:**
   - ❌ Album CRUD endpoints
   - ❌ Album-media associations
   - ❌ Album search

2. **Geocoding & Mapping:**
   - ❌ Geocoding endpoint (place names → coordinates)
   - ❌ Place mapping endpoint
   - ❌ Heatmap data endpoint

3. **Navigation Endpoints:**
   - ❌ Next/previous individual
   - ❌ Next/previous family
   - ❌ Related records
   - ❌ Breadcrumb data

4. **Date Search:**
   - ❌ Date search endpoint (find events by date range)

5. **Place Statistics:**
   - ❌ Place statistics endpoint

### 11.3 Low Priority (Nice to Have)
1. **Advanced Features:**
   - ❌ DNA management (if needed)
   - ❌ Association management (non-family relationships)
   - ❌ Migration paths endpoint

2. **Export Enhancements:**
   - ❌ PDF export endpoint
   - ❌ Export options endpoint (what to include/exclude)

3. **Data Maintenance:**
   - ❌ Optimize database endpoint
   - ❌ Cleanup orphaned records endpoint
   - ❌ Rebuild indexes endpoint

4. **Media Enhancements:**
   - ❌ Media search endpoint
   - ❌ Media slideshow endpoint

5. **Source/Note Statistics:**
   - ❌ Source statistics endpoint
   - ❌ Note statistics endpoint

---

## 12. Feature Comparison Matrix

| Feature Category | TNG | Ligneous Frontend API | Status |
|-----------------|-----|----------------------|--------|
| **Individual CRUD** | ✅ | ✅ | Complete |
| **Family CRUD** | ✅ | ✅ | Complete |
| **Event CRUD** | ✅ | ✅ | Complete |
| **Source CRUD** | ✅ | ✅ | Complete |
| **Note CRUD** | ✅ | ✅ | Complete |
| **Place CRUD** | ✅ | ✅ | Complete (read-only creation) |
| **Media CRUD** | ✅ | ✅ | Complete |
| **Individual Search** | ✅ | ✅ | Complete |
| **Family Search** | ✅ | ✅ | Complete |
| **Place Search** | ✅ | ✅ | Complete |
| **Source Search** | ✅ | ✅ | Complete |
| **Note Search** | ✅ | ✅ | Complete |
| **Global Search** | ✅ | ✅ | Complete |
| **Relationship Queries** | ✅ | ✅ | Complete |
| **Statistics** | ✅ | ✅ | Complete (Tree, Individual, Family, Media) |
| **Timeline** | ✅ | ✅ | Complete |
| **Duplicate Detection** | ✅ | ✅ | Complete |
| **Charts** | ✅ | ❌ | Missing (data endpoints) |
| **Reports** | ✅ | ❌ | Missing (formatted reports) |
| **Merge** | ✅ | ❌ | Missing |
| **Export** | ✅ | ✅ | Complete (GEDCOM, JSON, CSV) |
| **Import** | ✅ | ✅ | Complete |
| **Albums** | ✅ | ❌ | Missing |
| **Geocoding** | ✅ | ❌ | Missing |
| **Navigation** | ✅ | ❌ | Missing |
| **Browse (Surname/Given)** | ✅ | ❌ | Missing |

---

## 13. Implementation Priority

### Phase 1: Core Missing Features (High Priority)
1. **Merge Functionality** (Individuals, Families, Duplicates)
2. **Chart Data Endpoints** (Pedigree, Descendant, Fan, Family - structured data for client-side rendering)
3. **Report Endpoints** (Individual, Family, Tree-wide formatted reports)
4. **Browse Endpoints** (Surname, Given Name)

### Phase 2: Enhanced Features (Medium Priority)
1. **Album Management** (CRUD, Associations, Search)
2. **Geocoding & Mapping** (Geocoding, Heatmap, Place mapping)
3. **Navigation Endpoints** (Next/Previous, Related Records, Breadcrumbs)
4. **Date Search** (Search events by date range)
5. **Place Statistics** (Place-specific statistics)

### Phase 3: Advanced Features (Low Priority)
1. **Data Quality Reports** (Most Wanted, Completeness, Missing Data)
2. **Export Enhancements** (PDF export, Export options)
3. **Data Maintenance** (Optimize, Cleanup, Rebuild indexes)
4. **Media Enhancements** (Media search, Slideshow)
5. **Source/Note Statistics** (Statistics endpoints for sources and notes)
6. **Advanced Features** (DNA management, Associations, Migration paths)

---

## 14. Recommendations

### 14.1 Immediate Actions
1. **Implement merge functionality** - Critical for data quality (merge individuals, families, duplicates)
2. **Create chart data endpoints** - Essential for visualization (pedigree, descendant, fan, family charts)
3. **Implement report endpoints** - Important for formatted output (individual, family, tree-wide reports)
4. **Add browse endpoints** - Useful for navigation (surname, given name browsing)

### 14.2 Architecture Considerations
1. **Chart Data:** Consider if chart generation should be:
   - Server-side (generate chart images)
   - Client-side (send data, render in browser)
   - Recommendation: Client-side (send structured data)

2. **Reports:** Consider if reports should be:
   - Generated server-side (PDF, formatted)
   - Generated client-side (send data, format in browser)
   - Recommendation: Hybrid (structured data + optional PDF)

3. **Statistics:** Consider caching statistics:
   - Real-time calculation
   - Cached with periodic refresh
   - Recommendation: Cached with refresh on data changes

### 14.3 Frontend vs. Backend
- **Backend (Go API):** Should handle all data operations, calculations, and business logic
- **Frontend (Next.js API):** Should handle authentication, permissions, and proxying
- **Client (React):** Should handle presentation, charts, and UI

---

## 15. Conclusion

**Current Status (Updated: 2026-02-13):**
- ✅ **Core CRUD operations:** 100% complete
- ✅ **Search functionality:** 100% complete (Individual, Family, Place, Source, Note, Global)
- ✅ **Statistics endpoints:** 100% complete (Tree-wide, Individual, Family, Media)
- ✅ **Relationship queries:** 100% complete (including common ancestors)
- ✅ **Timeline endpoints:** 100% complete
- ✅ **Media management:** 100% complete (CRUD, associations, thumbnails)
- ✅ **Export functionality:** 100% complete (GEDCOM, JSON, CSV, subtree)
- ✅ **Duplicate detection:** 100% complete
- ⚠️ **Advanced features:** ~70% complete

**To Match TNG:**
- Need to implement **~25-30 additional endpoints**
- Focus on: Merge functionality, Chart data endpoints, Report endpoints, Browse endpoints, Albums, Geocoding, Navigation
- Estimated effort: **Medium** (most critical features are complete)

**Recommendation:**
Start with **Phase 1** features (merge, chart data, reports, browse) as these are the most critical remaining gaps. The search, statistics, and timeline features are now complete, significantly reducing the implementation gap.

---

## 16. Updated Implementation Summary (2026-02-13)

### ✅ Completed Features (70% of TNG functionality)

**Search & Discovery:**
- ✅ Individual search (advanced filters)
- ✅ Family search
- ✅ Place search
- ✅ Source search
- ✅ Note search
- ✅ Global search (across all types)

**Statistics:**
- ✅ Tree-wide statistics
- ✅ Individual statistics (counts, geographic, family structure, data completeness)
- ✅ Family statistics (counts, marriage stats, children stats)
- ✅ Media statistics

**Timeline:**
- ✅ Timeline endpoint (individual, family, and event timelines)

**Relationships:**
- ✅ All relationship queries (parents, children, siblings, spouses, ancestors, descendants)
- ✅ Relationship calculation (degree, path)
- ✅ Common ancestors

**Core Operations:**
- ✅ All CRUD operations (Individuals, Families, Events, Sources, Notes, Places, Media)
- ✅ Export (GEDCOM, JSON, CSV, subtree)
- ✅ Import & Validation
- ✅ Duplicate detection

### ❌ Missing Features (30% remaining)

**High Priority:**
1. Merge functionality (individuals, families, duplicates)
2. Chart data endpoints (pedigree, descendant, fan, family - structured data)
3. Report endpoints (formatted individual, family, tree-wide reports)
4. Browse endpoints (surname, given name)

**Medium Priority:**
1. Album management (CRUD, associations, search)
2. Geocoding & mapping (geocoding, heatmap, place mapping)
3. Navigation endpoints (next/previous, related records, breadcrumbs)
4. Date search endpoint
5. Place statistics endpoint

**Low Priority:**
1. Data quality reports (most wanted, completeness)
2. PDF export
3. Export options
4. Data maintenance (optimize, cleanup)
5. Media search & slideshow
6. Source/Note statistics
7. Advanced features (DNA, associations, migration paths)

### Estimated Remaining Work
- **Endpoints to implement:** ~25-30 endpoints
- **Estimated effort:** Medium (most critical features are complete)
- **Completion:** ~70% of TNG features implemented

---

This analysis shows that Ligneous has made significant progress, with all search, statistics, timeline, and core CRUD operations complete. The remaining gaps are primarily in merge functionality, chart data endpoints, formatted reports, albums, geocoding, and navigation features.

