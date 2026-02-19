# Facets Update Summary

**Date:** January 28, 2026  
**Status:** ✅ ALL FACETS UPDATED

---

## 🎯 Overview

Updated all three remaining facets to match actual Go API response structures:
- ✅ `families.js`
- ✅ `graph.js`
- ✅ `duplicates.js`

---

## 📦 families.js Updates

### Changes Made

#### 1. getFamilies - Improved Meta Data Handling
```javascript
// BEFORE
const familiesData = data.data;
state.families = familiesData.families || [];

// AFTER
const familiesData = data.data || {};
// API returns {data: {families: [...], meta: {...}}}
state.families = familiesData.families || [];
emitEvent('gedcomFamilies:loaded', { 
  count: state.families.length,
  total: familiesData.meta?.total  // Added total count
});
```

**Why:** Added total count from meta data to events for better tracking.

#### 2. getFamily - Already Correct ✅
No changes needed - already correctly parsing flat `data` object.

---

## 📊 graph.js Updates

### Changes Made

#### 1. Initial State - Fixed centrality and paths Types
```javascript
// BEFORE
paths: [],
centrality: [],

// AFTER
paths: null,        // Single path object, not array
centrality: {},     // Map of xref -> score, not array
```

**Why:** Match actual API response types.

---

#### 2. getPaths - Parse shortest_path Object
```javascript
// BEFORE
state.paths = data.data || [];

// AFTER
// API returns {data: {shortest_path: {nodes: [...], length: N, type: "..."}}}
state.paths = data.data?.shortest_path || null;
```

**Why:** API returns a single path object with `nodes`, `length`, and `type` properties.

**API Response:**
```json
{
  "data": {
    "shortest_path": {
      "nodes": ["@I0087@", "@I0144@"],
      "length": 2,
      "type": "mixed"
    }
  }
}
```

---

#### 3. getAncestors - Parse ancestors Array
```javascript
// BEFORE
state.ancestors = data.data || [];

// AFTER
// API returns {data: {ancestors: [...], meta: {...}}}
const ancestorsData = data.data || {};
state.ancestors = ancestorsData.ancestors || [];
```

**Why:** API wraps ancestors in nested object with meta data.

**API Response:**
```json
{
  "data": {
    "ancestors": [
      {
        "xref": "@I0083@",
        "name": "Ulfat Shirley /Khan/",
        "generation": 1,
        ...
      }
    ],
    "meta": {
      "total": 3
    }
  }
}
```

---

#### 4. getDescendants - Parse descendants Array
```javascript
// BEFORE
state.descendants = data.data || [];

// AFTER
// API returns {data: {descendants: [...], meta: {...}}}
const descendantsData = data.data || {};
state.descendants = descendantsData.descendants || [];
```

**Why:** Same structure as ancestors - wrapped with meta data.

---

#### 5. getCentrality - Handle Flat Map
```javascript
// BEFORE
state.centrality = data.data || [];
emitEvent('gedcomGraph:centrality:calculated', { type, count: state.centrality.length });

// AFTER
// API returns flat map: {data: {"@I0001@": 4, "@I0002@": 8, ...}}
state.centrality = data.data || {};
const count = Object.keys(state.centrality).length;
emitEvent('gedcomGraph:centrality:calculated', { type, count });
```

**Why:** API returns a flat object mapping XREFs to centrality scores, not an array.

**API Response:**
```json
{
  "data": {
    "@I0000@": 4,
    "@I0001@": 4,
    "@I0002@": 8,
    "@I0087@": 5,
    "@I0484@": 10
  }
}
```

---

#### 6. Other Methods - Already Correct ✅
- `getRelationship` - ✅ Already parsing flat `data` object
- `getMostConnected` - ✅ Already parsing flat `data` array
- `getMetrics` - ⚠️ Endpoint has timeout issues (kept as-is)

---

## 🔍 duplicates.js Updates

### Changes Made

#### 1. findDuplicates - Parse matches Array & Fix Parameter Name
```javascript
// BEFORE
const findDuplicates = async (fileId, threshold = 0.8) => {
  body: JSON.stringify({ threshold })
  ...
  state.duplicates = data.data || [];

// AFTER
const findDuplicates = async (fileId, minScore = 0.8) => {
  body: JSON.stringify({ min_score: minScore })
  ...
  // API returns {data: {matches: [...], meta: {...}}}
  const duplicatesData = data.data || {};
  state.duplicates = duplicatesData.matches || [];
```

**Why:** 
1. API expects `min_score`, not `threshold`
2. Results are in `data.matches`, not flat `data`
3. Added meta data to events

**API Response:**
```json
{
  "data": {
    "matches": [
      {
        "individual1": {"xref": "@I0838@", "name": "..."},
        "individual2": {"xref": "@I0924@", "name": "..."},
        "similarity_score": 0.0,
        "confidence": "exact",
        "matching_fields": ["birth_date", "sex"],
        "differences": ["name"],
        "breakdown": {...}
      }
    ],
    "meta": {
      "total_matches": 157,
      "threshold": 0.8
    }
  }
}
```

---

#### 2. compareFiles - Fix Request Body & Parse Response
```javascript
// BEFORE
const compareFiles = async (fileId1, fileId2, threshold = 0.8) => {
  body: JSON.stringify({
    file_id_1: fileId1,
    file_id_2: fileId2,
    threshold
  })
  ...
  state.comparisonResults = data.data;

// AFTER
const compareFiles = async (fileId1, fileId2, minScore = 0.8) => {
  body: JSON.stringify({
    file_id1: fileId1,    // Changed from file_id_1
    file_id2: fileId2,    // Changed from file_id_2
    min_score: minScore   // Changed from threshold
  })
  ...
  // API returns {data: {matches: [...], meta: {...}}}
  const comparisonData = data.data || {};
  state.comparisonResults = comparisonData;
```

**Why:**
1. API expects `file_id1` and `file_id2` (no underscores in middle)
2. API expects `min_score`, not `threshold`
3. Store full comparison data (matches + meta)

---

## 📋 Complete Changes Summary

### families.js
| Change | Type | Impact |
|--------|------|--------|
| Added meta.total to events | Enhancement | Better tracking |

### graph.js
| Change | Type | Impact |
|--------|------|--------|
| Fixed paths type (array → object) | Bug Fix | Critical |
| Fixed centrality type (array → object) | Bug Fix | Critical |
| Parse ancestors.ancestors | Bug Fix | Critical |
| Parse descendants.descendants | Bug Fix | Critical |
| Parse paths.shortest_path | Bug Fix | Critical |
| Added meta data to events | Enhancement | Better tracking |

### duplicates.js
| Change | Type | Impact |
|--------|------|--------|
| threshold → minScore parameter | Bug Fix | Critical |
| threshold → min_score in API | Bug Fix | Critical |
| file_id_1 → file_id1 | Bug Fix | Critical |
| file_id_2 → file_id2 | Bug Fix | Critical |
| Parse matches array | Bug Fix | Critical |
| Added meta data to events | Enhancement | Better tracking |

---

## 🔧 Technical Details

### Response Parsing Patterns

#### Pattern 1: Nested Array with Meta
```javascript
const data = data.data || {};
state.items = data.items || [];
// Access: data.items, data.meta
```

**Used in:**
- families.getFamilies
- graph.getAncestors
- graph.getDescendants
- duplicates.findDuplicates
- duplicates.compareFiles

---

#### Pattern 2: Flat Object
```javascript
state.item = data.data;
// Access: data directly
```

**Used in:**
- families.getFamily
- graph.getRelationship
- graph.getMetrics

---

#### Pattern 3: Nested Object
```javascript
state.item = data.data?.propertyName || null;
// Access: data.propertyName
```

**Used in:**
- graph.getPaths (data.shortest_path)

---

#### Pattern 4: Flat Map/Dictionary
```javascript
state.map = data.data || {};
const count = Object.keys(state.map).length;
// Access: data["@I0001@"], data["@I0002@"], etc.
```

**Used in:**
- graph.getCentrality

---

#### Pattern 5: Flat Array
```javascript
state.items = data.data || [];
// Access: data[0], data[1], etc.
```

**Used in:**
- graph.getMostConnected

---

## 📊 API Parameter Names

### Standardized Parameter Names
| Facet Method | Old Parameter | New Parameter | API Field |
|--------------|---------------|---------------|-----------|
| findDuplicates | `threshold` | `minScore` | `min_score` |
| compareFiles | `threshold` | `minScore` | `min_score` |
| compareFiles | n/a | n/a | `file_id1` (not `file_id_1`) |
| compareFiles | n/a | n/a | `file_id2` (not `file_id_2`) |

**Why:** Match Go API's expected parameter names.

---

## ✅ Validation Checklist

Before testing:
- [x] families.js - Updated meta handling
- [x] graph.js - Fixed all response parsing
- [x] graph.js - Fixed state types
- [x] duplicates.js - Fixed parameter names
- [x] duplicates.js - Fixed response parsing
- [x] All events include proper metadata
- [x] All state updates match API responses

---

## 🧪 Testing Status

### Unit Tests
- ⏳ Need to update mocks to match new response structures

### Integration Tests
- ⏳ Need to create for families, graph, duplicates
- ✅ Files integration tests - passing
- ✅ Individuals integration tests - passing

---

## 🎯 Next Steps

1. ✅ **Create Integration Tests**
   - families.integration.test.js
   - graph.integration.test.js
   - duplicates.integration.test.js

2. ✅ **Run Integration Tests**
   - Verify all endpoints with real API
   - Confirm response parsing
   - Check state management

3. ✅ **Update Unit Tests**
   - Update mocks to match new structures
   - Fix any broken assertions

4. ✅ **Update EVENTS.md**
   - Document new event payloads
   - Include meta data fields

---

## 📈 Expected Results

After these updates:
- ✅ All facets correctly parse API responses
- ✅ State matches actual API data structures
- ✅ Events include useful meta data
- ✅ Parameters match API expectations
- ✅ Ready for frontend UI integration

---

## 🎓 Key Learnings

### 1. Always Test API First
Don't assume response structures - test actual endpoints before writing code.

### 2. Watch for Nested Wrapping
Many endpoints wrap results: `{data: {items: [...], meta: {...}}}`

### 3. Field Name Conventions
- API uses snake_case: `min_score`, `file_id1`
- Not always consistent: `file_id1` (not `file_id_1`)

### 4. Type Mismatches
- Centrality returns object (map), not array
- Paths returns single object, not array

### 5. Parameter Naming
- Use JavaScript camelCase in function signatures: `minScore`
- Convert to snake_case for API: `min_score`

---

**Last Updated:** January 28, 2026  
**Status:** ✅ COMPLETE - Ready for Testing  
**Next:** Create integration tests

