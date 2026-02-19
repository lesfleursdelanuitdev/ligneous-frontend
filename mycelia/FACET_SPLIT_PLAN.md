# Go API Facet Split Plan

## Overview
Split the monolithic `go-api.js` facet into smaller, focused facets following the Single Responsibility Principle.

## Current State
- **1 large facet** (`useGoAPI`) with 450+ lines
- Handles files, individuals, families, and relationships
- Mixed concerns and responsibilities

## Proposed Structure

### 1. **useGedcomFiles** - File Management
**Purpose:** Handle GEDCOM file upload, validation, and management

**State:**
```javascript
{
  loading: false,
  error: null,
  currentFile: null,
  files: []
}
```

**Methods:**
- `uploadGedcom(file, name)` - Upload GEDCOM file
- `getFileInfo(fileId)` - Get file metadata
- `listFiles()` - List all uploaded files
- `deleteFile(fileId)` - Delete a file
- `validateFile(fileId)` - Validate a file
- `getState()` - Get current state
- `clearError()` - Clear error state

**Events:**
- `gedcomFiles:file:uploaded` - File uploaded successfully
- `gedcomFiles:file:deleted` - File deleted
- `gedcomFiles:file:validated` - File validated
- `gedcomFiles:stateChanged` - State changed
- `gedcomFiles:error` - Error occurred

---

### 2. **useIndividuals** - Individual Queries
**Purpose:** Query and manage individuals within a GEDCOM file

**State:**
```javascript
{
  loading: false,
  error: null,
  individuals: [],
  currentIndividual: null,
  parents: [],
  children: [],
  siblings: [],
  spouses: []
}
```

**Methods:**
- `getIndividuals(fileId, params)` - List individuals with filters
- `getIndividual(fileId, xref)` - Get specific individual
- `searchIndividuals(fileId, query)` - Advanced search
- `getParents(fileId, xref)` - Get parents
- `getChildren(fileId, xref)` - Get children
- `getSiblings(fileId, xref)` - Get siblings
- `getSpouses(fileId, xref)` - Get spouses
- `getState()` - Get current state
- `clearError()` - Clear error state

**Events:**
- `individuals:loaded` - Individuals loaded
- `individuals:individual:loaded` - Single individual loaded
- `individuals:search:complete` - Search completed
- `individuals:stateChanged` - State changed
- `individuals:error` - Error occurred

---

### 3. **useFamilies** - Family Queries
**Purpose:** Query and manage family records within a GEDCOM file

**State:**
```javascript
{
  loading: false,
  error: null,
  families: [],
  currentFamily: null
}
```

**Methods:**
- `getFamilies(fileId, params)` - List families with filters
- `getFamily(fileId, xref)` - Get specific family
- `getState()` - Get current state
- `clearError()` - Clear error state

**Events:**
- `families:loaded` - Families loaded
- `families:family:loaded` - Single family loaded
- `families:stateChanged` - State changed
- `families:error` - Error occurred

---

### 4. **useGedcomGraph** - Relationship & Graph Analytics
**Purpose:** Handle relationship queries, ancestors, descendants, and graph analytics

**State:**
```javascript
{
  loading: false,
  error: null,
  relationship: null,
  ancestors: [],
  descendants: [],
  paths: [],
  metrics: null,
  centrality: [],
  mostConnected: []
}
```

**Methods:**
- `getRelationship(fileId, xref1, xref2)` - Get relationship between two individuals
- `getAncestors(fileId, xref, maxGen)` - Get ancestors
- `getDescendants(fileId, xref, maxGen)` - Get descendants
- `getPaths(fileId, xref1, xref2)` - Find paths between individuals
- `getMetrics(fileId)` - Get graph metrics (diameter, density, etc.)
- `getCentrality(fileId, type)` - Get centrality measures
- `getMostConnected(fileId, limit, type)` - Get most connected individuals
- `getState()` - Get current state
- `clearError()` - Clear error state

**Events:**
- `gedcomGraph:relationship:calculated` - Relationship calculated
- `gedcomGraph:ancestors:loaded` - Ancestors loaded
- `gedcomGraph:descendants:loaded` - Descendants loaded
- `gedcomGraph:metrics:calculated` - Metrics calculated
- `gedcomGraph:stateChanged` - State changed
- `gedcomGraph:error` - Error occurred

---

### 5. **useGedcomDuplicates** - Duplicate Detection
**Purpose:** Find and manage duplicate individuals across files

**State:**
```javascript
{
  loading: false,
  error: null,
  duplicates: [],
  comparisonResults: null
}
```

**Methods:**
- `findDuplicates(fileId, threshold)` - Find duplicates within a file
- `compareFiles(fileId1, fileId2, threshold)` - Compare two files for duplicates
- `getState()` - Get current state
- `clearError()` - Clear error state

**Events:**
- `gedcomDuplicates:found` - Duplicates found
- `gedcomDuplicates:comparison:complete` - File comparison complete
- `gedcomDuplicates:stateChanged` - State changed
- `gedcomDuplicates:error` - Error occurred

---

### 6. **useGedcomEvents** - GEDCOM Event Handling *(Future)*
**Purpose:** Query and manage GEDCOM events (BIRT, DEAT, MARR, etc.)

**Note:** This facet is planned for future expansion when we need to handle event-specific queries.

**State:**
```javascript
{
  loading: false,
  error: null,
  events: [],
  currentEvent: null
}
```

---

### 7. **useGedcomNotes** - Notes Handling *(Future)*
**Purpose:** Query and manage notes attached to individuals/families

**Note:** This facet is planned for future expansion.

**State:**
```javascript
{
  loading: false,
  error: null,
  notes: [],
  currentNote: null
}
```

---

## Shared Infrastructure

### Shared Utilities (`mycelia/utils/gedcom-api.js`)
**Purpose:** Common functions shared across all GEDCOM facets

**Functions:**
- `createEmitEvent(listeners)` - Create emitEvent function
- `createEmitStateChange(listeners, facetName, state)` - Create emitStateChange function
- `createApiRequest(GO_API_URL, defaultOptions)` - Create API request wrapper
- `handleApiError(error, action, emitEvent)` - Standardized error handling

**Example:**
```javascript
export const createEmitEvent = (listeners) => {
  return (eventType, body) => {
    if (listeners && listeners.hasListeners()) {
      listeners.emit(eventType, {
        type: eventType,
        body
      });
    }
  };
};

export const createApiRequest = (baseURL) => {
  return async (path, options = {}) => {
    const response = await fetch(`${baseURL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API request failed');
    }

    return await response.json();
  };
};
```

---

## Configuration

All facets will read from the same configuration:

```javascript
// system.builder.js
.config('goAPI', {
  baseURL: goApiUrl,
  timeout: 30000
})
```

---

## Benefits of This Split

### 1. **Single Responsibility**
- Each facet has a clear, focused purpose
- Easier to understand and maintain

### 2. **Better Testing**
- Test each facet in isolation
- Smaller test suites per facet
- Easier to mock dependencies

### 3. **Improved Performance**
- Only load/use the facets you need
- Smaller bundle sizes for specific features
- Better code splitting

### 4. **Cleaner State Management**
- Each facet manages its own state
- No state pollution between concerns
- Easier to debug

### 5. **Better Developer Experience**
- Clear API surface for each concern
- Better autocomplete/IntelliSense
- Easier to find relevant methods

### 6. **Scalability**
- Easy to add new facets (events, notes, places)
- Can evolve facets independently
- Better for team collaboration

---

## Migration Strategy

### Phase 1: Create Shared Utilities
1. Create `mycelia/utils/gedcom-api.js` with shared functions
2. Test utilities independently

### Phase 2: Create Core Facets
1. `useGedcomFiles` - Most critical, handles uploads
2. `useIndividuals` - Second most used
3. `useFamilies` - Works with individuals
4. `useGedcomGraph` - Advanced features

### Phase 3: Create Additional Facets
1. `useGedcomDuplicates` - Specialized feature
2. `useGedcomEvents` - Future expansion
3. `useGedcomNotes` - Future expansion

### Phase 4: Update System Builder
1. Add all new facets to `system.builder.js`
2. Keep old `useGoAPI` for backward compatibility initially
3. Update components to use new facets
4. Remove old `useGoAPI` once migration is complete

### Phase 5: Documentation & Testing
1. Update component examples
2. Create test suites for each facet
3. Update documentation

---

## File Structure

```
mycelia/
├── utils/
│   └── gedcom-api.js          # Shared utilities
├── facets/
│   ├── auth.js                # Existing
│   ├── gedcom-files.js        # New
│   ├── individuals.js         # New
│   ├── families.js            # New
│   ├── gedcom-graph.js        # New
│   ├── gedcom-duplicates.js   # New
│   ├── gedcom-events.js       # Future
│   ├── gedcom-notes.js        # Future
│   └── go-api.js              # Legacy (to be removed)
├── system.builder.js
└── __tests__/
    ├── gedcom-files.test.js
    ├── individuals.test.js
    ├── families.test.js
    └── gedcom-graph.test.js
```

---

## Example Component Usage

### Before (Monolithic)
```javascript
const goAPI = useFacet('goAPI');
const files = await goAPI.uploadGedcom(file, name);
const individuals = await goAPI.getIndividuals(fileId);
const ancestors = await goAPI.getAncestors(fileId, xref);
```

### After (Focused Facets)
```javascript
const gedcomFiles = useFacet('gedcomFiles');
const individuals = useFacet('individuals');
const gedcomGraph = useFacet('gedcomGraph');

const files = await gedcomFiles.uploadGedcom(file, name);
const individualsList = await individuals.getIndividuals(fileId);
const ancestors = await gedcomGraph.getAncestors(fileId, xref);
```

---

## Next Steps

1. ✅ Create this plan document
2. ⏳ Create shared utilities (`gedcom-api.js`)
3. ⏳ Implement `useGedcomFiles` facet
4. ⏳ Implement `useIndividuals` facet
5. ⏳ Implement `useFamilies` facet
6. ⏳ Implement `useGedcomGraph` facet
7. ⏳ Implement `useGedcomDuplicates` facet
8. ⏳ Update `system.builder.js`
9. ⏳ Update components to use new facets
10. ⏳ Create test suites
11. ⏳ Remove legacy `useGoAPI`

---

## Questions & Considerations

1. **Should we keep backward compatibility?**
   - Option A: Keep `useGoAPI` as a facade that uses new facets internally
   - Option B: Deprecate immediately and update all components
   - **Recommendation:** Option A for smoother transition

2. **Should facets depend on each other?**
   - Example: Should `useIndividuals` depend on `useGedcomFiles`?
   - **Recommendation:** No direct dependencies, use events for communication

3. **How to handle shared state?**
   - Example: Current file context
   - **Recommendation:** Use events to broadcast file changes, each facet maintains its own state

4. **Error handling strategy?**
   - Should errors be centralized or per-facet?
   - **Recommendation:** Per-facet errors with optional global error handler via listeners

