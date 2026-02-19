# Existing Codebase Analysis for Family Tree Visualization

**Date:** 2026-01-23  
**Purpose:** Analyze what already exists in the codebase that we can leverage for family tree visualization

---

## Executive Summary

The codebase already has **significant infrastructure** we can reuse:
- ✅ **Mycelia Facets** for data fetching (`useGedcomIndividuals`, `useGedcomGraph`)
- ✅ **API Proxy Routes** for tree/individual data
- ✅ **Ancestors/Descendants Endpoints** already implemented
- ✅ **Mini Pedigree Component** (simple SVG-based preview)
- ✅ **Tree Card Component** with basic visualization
- ✅ **API Response Structures** documented
- ⚠️ **No d3.js or Konva.js** yet installed
- ⚠️ **No full tree visualization** components

---

## 1. Mycelia Facets (Data Fetching Layer)

### ✅ `useGedcomIndividuals` Facet
**Location:** `/mycelia/facets/gedcom/individuals.js`

**What it provides:**
- `getIndividual(fileId, xref)` - Get single person
- `getIndividuals(fileId, params)` - List individuals
- `getParents(fileId, xref)` - Get parents
- `getChildren(fileId, xref)` - Get children
- `getSiblings(fileId, xref)` - Get siblings
- `getSpouses(fileId, xref)` - Get spouses
- `searchIndividuals(fileId, query)` - Search individuals

**How to use:**
```javascript
const gedcomIndividuals = useFacet('gedcomIndividuals');
const person = await gedcomIndividuals.getIndividual(fileId, xref);
const parents = await gedcomIndividuals.getParents(fileId, xref);
```

**What we can reuse:**
- ✅ All relationship queries (parents, children, siblings, spouses)
- ✅ Individual data fetching
- ✅ Search functionality
- ✅ Event system for reactive updates

---

### ✅ `useGedcomGraph` Facet
**Location:** `/mycelia/facets/gedcom/graph.js`

**What it provides:**
- `getAncestors(fileId, xref, maxGenerations)` - Get ancestors
- `getDescendants(fileId, xref, maxGenerations)` - Get descendants
- `getRelationship(fileId, xref1, xref2)` - Get relationship between two people
- `getPaths(fileId, xref1, xref2)` - Get paths between two people

**How to use:**
```javascript
const gedcomGraph = useFacet('gedcomGraph');
const ancestors = await gedcomGraph.getAncestors(fileId, xref, 5);
const descendants = await gedcomGraph.getDescendants(fileId, xref, 3);
```

**What we can reuse:**
- ✅ **Ancestors endpoint** - Perfect for pedigree charts!
- ✅ **Descendants endpoint** - For descendant trees
- ✅ **Generation parameter** - Already supports max generations
- ✅ **Event system** - `gedcomGraph:ancestors:loaded` events

**API Response Structure:**
```json
{
  "data": {
    "ancestors": [
      {
        "xref": "@I0083@",
        "name": "Ulfat Shirley /Khan/",
        "generation": 1,  // 1 = parents, 2 = grandparents
        "birth_date": "3 JUN 1935",
        "death_date": "25 APR 2004",
        "has_parents": true,
        "parents_count": 2
      }
    ],
    "meta": { "total": 3 }
  }
}
```

**Key insight:** The `generation` field in ancestors is **exactly what we need** for slot-based positioning!

---

### ✅ `useGedcomFamilies` Facet
**Location:** `/mycelia/facets/gedcom/families.js`

**What it provides:**
- `getFamilies(fileId, params)` - List families
- `getFamily(fileId, xref)` - Get specific family

**What we can reuse:**
- ✅ Family data for building relationships
- ✅ Husband/wife/children structure

---

## 2. API Infrastructure

### ✅ Proxy Route System
**Location:** `/app/api/trees/[id]/[...path]/route.js`

**What it does:**
- Proxies all requests to Go API
- Handles authentication
- Maps `treeId` → `fileId`
- Handles permissions

**Example routes:**
- `/api/trees/{treeId}/individuals/{xref}` → Go API
- `/api/trees/{treeId}/individuals/{xref}/ancestors` → Go API
- `/api/trees/{treeId}/individuals/{xref}/descendants` → Go API

**What we can reuse:**
- ✅ **No need to build API client** - already exists!
- ✅ **Tree ID mapping** - handled automatically
- ✅ **Authentication** - handled automatically
- ✅ **Permission checking** - handled automatically

**Key insight:** We can use the Mycelia facets OR call the proxy routes directly. Facets are preferred for consistency.

---

### ✅ Direct API Client (Alternative)
**Location:** `/lib/go-api.js`

**What it provides:**
- `getAncestors(fileId, xref, maxGenerations)`
- `getDescendants(fileId, xref, maxGenerations)`
- `getIndividual(fileId, xref)`
- `getFamily(fileId, xref)`
- `getRelationship(fileId, xref1, xref2)`

**What we can reuse:**
- ✅ Direct fetch functions if we don't want to use Mycelia
- ✅ Already handles error cases
- ✅ Already handles response parsing

---

## 3. Existing Components

### ✅ `TreeCard` Component
**Location:** `/components/trees/TreeCard.js`

**What it does:**
- Displays tree information
- Shows mini pedigree preview (3 generations)
- Uses SVG for simple connectors

**Key features:**
- `MiniPedigree` component - Simple 3-generation visualization
- `PersonBox` component - Person card rendering
- SVG-based connectors (simple lines)

**What we can reuse:**
- ✅ **PersonBox styling** - Color scheme, layout
- ✅ **MiniPedigree structure** - As reference for simple visualization
- ⚠️ **Not suitable for full tree** - Too simple, SVG-based

**Code snippet:**
```javascript
// MiniPedigree uses SVG lines
<svg>
  <line x1="50%" y1="72%" x2="50%" y2="50%" />
  <line x1="25%" y1="50%" x2="75%" y2="50%" />
</svg>
```

**What we can learn:**
- Color scheme: `var(--color-tree-male)`, `var(--color-tree-female)`
- Person box structure
- Simple connector pattern

---

### ✅ `GlobalSearch` Component
**Location:** `/components/search/GlobalSearch.js`

**What it does:**
- Search across trees, people, places
- Uses Mycelia facets for data

**What we can reuse:**
- ✅ Search patterns
- ✅ UI patterns for displaying results

---

## 4. API Response Structures

### ✅ Documented in `API_RESPONSE_STRUCTURES.md`

**Ancestors Response:**
```json
{
  "data": {
    "ancestors": [
      {
        "xref": "@I0083@",
        "name": "Ulfat Shirley /Khan/",
        "generation": 1,  // KEY: Generation number!
        "birth_date": "3 JUN 1935",
        "death_date": "25 APR 2004",
        "sex": "F",
        "has_parents": true,
        "parents_count": 2
      }
    ],
    "meta": { "total": 3 }
  }
}
```

**Key fields we need:**
- ✅ `generation` - Perfect for slot calculation!
- ✅ `xref` - Person identifier
- ✅ `name` - Display name
- ✅ `birth_date`, `death_date` - For card display
- ✅ `sex` - For gender-based styling
- ✅ `has_parents` - To know if we can go further up

**What we can reuse:**
- ✅ **Response structure** - Already matches our needs
- ✅ **Generation field** - Critical for layout!
- ✅ **Metadata** - Total counts, etc.

---

## 5. Utilities & Helpers

### ✅ GEDCOM API Utilities
**Location:** `/mycelia/utils/gedcom-api.js`

**What it provides:**
- `createEmitEvent()` - Event emission
- `createEmitStateChange()` - State change events
- `handleApiError()` - Error handling
- `createLoadingUpdater()` - Loading state management
- `buildQueryString()` - Query string building

**What we can reuse:**
- ✅ Error handling patterns
- ✅ Loading state management
- ✅ Event emission patterns

---

## 6. Styling & Theme

### ✅ CSS Variables
**From `TreeCard.js`:**
- `var(--color-tree-male)` - Male person color
- `var(--color-tree-female)` - Female person color
- `var(--color-tree-line)` - Connector line color
- `var(--color-accent)` - Accent color
- `var(--color-bg-tertiary)` - Background color
- `var(--color-text-secondary)` - Text color

**What we can reuse:**
- ✅ **Color scheme** - Already defined
- ✅ **Theme consistency** - Use existing variables
- ✅ **Dark mode support** - Via CSS variables

---

## 7. What's Missing

### ❌ d3.js
- Not installed
- Need to add: `npm install d3 @types/d3`

### ❌ Konva.js
- Not installed
- Need to add: `npm install konva @types/konva`

### ❌ Full Tree Visualization
- Only `MiniPedigree` exists (3 generations, SVG)
- No full pedigree chart component
- No descendant chart component
- No interactive tree visualization

### ❌ Tree Layout Algorithms
- No `TreeLayout.ts` implementation
- No `PositionCalculator.ts` implementation
- No `ConnectorGenerator.ts` implementation

### ❌ Konva Rendering
- No `KonvaRenderer.ts`
- No `CardRenderer.ts`
- No `ConnectorRenderer.ts`

### ❌ Tree Visualization Hooks
- No `useFamilyTree.ts` hook
- No `useTreeData.ts` hook
- No `useTreeLayout.ts` hook

---

## 8. Integration Strategy

### Option 1: Use Mycelia Facets (Recommended)
**Pros:**
- ✅ Consistent with existing codebase
- ✅ Event-driven updates
- ✅ Built-in error handling
- ✅ Loading states

**How:**
```javascript
const gedcomGraph = useFacet('gedcomGraph');
const ancestors = await gedcomGraph.getAncestors(fileId, xref, generations);
```

### Option 2: Use Direct API Client
**Pros:**
- ✅ Simpler (no Mycelia dependency)
- ✅ Direct control

**How:**
```javascript
import { getAncestors } from '@/lib/api/go-api';
const ancestors = await getAncestors(fileId, xref, generations);
```

### Option 3: Use Proxy Routes Directly
**Pros:**
- ✅ Uses Next.js API routes
- ✅ Handles tree ID mapping

**How:**
```javascript
const response = await fetch(`/api/trees/${treeId}/individuals/${xref}/ancestors?max_generations=${generations}`);
```

**Recommendation:** Use **Option 1 (Mycelia Facets)** for consistency.

---

## 9. Data Transformation Needs

### Current API Response Format:
```json
{
  "ancestors": [
    {
      "xref": "@I0083@",
      "name": "Ulfat Shirley /Khan/",
      "generation": 1,
      "birth_date": "3 JUN 1935",
      "sex": "F"
    }
  ]
}
```

### What We Need for Tree Layout:
```typescript
interface PositionedNode {
  person: Person
  position: { x: number, y: number }
  generation: number
  slot: number  // Need to calculate from generation + position
  parents?: PositionedNode[]
  children?: PositionedNode[]
}
```

### Transformation Required:
1. **Add root person** - API only returns ancestors, need to add root
2. **Calculate slots** - From generation + position in generation
3. **Build relationships** - Link parents to children
4. **Add positions** - Calculate x, y from slot/generation

**Where to do this:**
- Create `utils/treeDataTransform.ts` in `family-tree-vis/`

---

## 10. Component Integration Points

### Existing Page Structure:
```
/app/
  /dashboard/     - User dashboard
  /explore/       - Browse trees
  /search/        - Search
  /upload/        - Upload GEDCOM
```

### Where to Add Tree Visualization:
```
/app/
  /trees/
    /[treeId]/
      /pedigree/
        /[personId]/
          page.tsx  ← New: Pedigree chart page
      /descendants/
        /[personId]/
          page.tsx  ← New: Descendant chart page
      /family/
        /[personId]/
          page.tsx  ← New: Family tree page
```

### Or as Component:
```
/components/
  /trees/
    /TreeCard.js          ← Exists
    /PedigreeChart.jsx    ← New: Full pedigree component
    /FamilyTreeView.jsx   ← New: Main tree viewer
```

---

## 11. Reusable Patterns

### ✅ Event-Driven Updates
**Pattern from Mycelia:**
```javascript
useEffect(() => {
  if (!listeners) return;
  
  const handleAncestorsLoaded = (event) => {
    setAncestors(event.body.ancestors);
  };
  
  listeners.on('gedcomGraph:ancestors:loaded', handleAncestorsLoaded);
  return () => listeners.off('gedcomGraph:ancestors:loaded', handleAncestorsLoaded);
}, [listeners]);
```

**What we can reuse:**
- ✅ Event subscription pattern
- ✅ Reactive updates when data changes

---

### ✅ Loading State Pattern
**Pattern from facets:**
```javascript
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

try {
  setLoading(true);
  const data = await facet.getAncestors(...);
  setData(data);
} catch (err) {
  setError(err);
} finally {
  setLoading(false);
}
```

**What we can reuse:**
- ✅ Loading/error state management
- ✅ Try/catch patterns

---

### ✅ Component Structure Pattern
**From TreeCard:**
```javascript
'use client';  // Required for Mycelia hooks

export default function Component({ props }) {
  const facet = useFacet('facetName');
  // ... component logic
}
```

**What we can reuse:**
- ✅ `'use client'` directive pattern
- ✅ Mycelia hook usage
- ✅ Component structure

---

## 12. Summary: What We Have vs. What We Need

### ✅ What We Have (Can Reuse):

| Component | Status | Location |
|-----------|--------|----------|
| **Data Fetching** | ✅ Complete | `useGedcomGraph.getAncestors()` |
| **API Proxy** | ✅ Complete | `/app/api/trees/[id]/[...path]` |
| **Ancestors Endpoint** | ✅ Complete | Returns `generation` field |
| **Descendants Endpoint** | ✅ Complete | Returns descendants |
| **Relationship Queries** | ✅ Complete | Parents, children, siblings, spouses |
| **Error Handling** | ✅ Complete | `handleApiError()` utility |
| **Loading States** | ✅ Complete | Facet loading patterns |
| **Event System** | ✅ Complete | Mycelia events |
| **Color Scheme** | ✅ Complete | CSS variables |
| **Mini Pedigree** | ✅ Exists | Simple SVG preview |

### ❌ What We Need (To Build):

| Component | Status | Location |
|-----------|--------|----------|
| **d3.js** | ❌ Not installed | Need to add |
| **Konva.js** | ❌ Not installed | Need to add |
| **Tree Layout** | ❌ Missing | `core/TreeLayout.ts` |
| **Position Calculator** | ❌ Missing | `core/PositionCalculator.ts` |
| **Connector Generator** | ❌ Missing | `core/ConnectorGenerator.ts` |
| **Konva Renderer** | ❌ Missing | `renderers/KonvaRenderer.ts` |
| **Card Renderer** | ❌ Missing | `renderers/CardRenderer.ts` |
| **Connector Renderer** | ❌ Missing | `renderers/ConnectorRenderer.ts` |
| **Zoom Handler** | ❌ Missing | `interactions/ZoomHandler.ts` |
| **Tree Hook** | ❌ Missing | `hooks/useFamilyTree.ts` |
| **Data Transform** | ❌ Missing | `utils/treeDataTransform.ts` |
| **React Components** | ❌ Missing | `components/FamilyTreeCanvas.tsx` |

---

## 13. Recommended Approach

### Phase 1: Leverage Existing Infrastructure
1. **Use `useGedcomGraph.getAncestors()`** for data
2. **Use existing API proxy** (no need to build new API client)
3. **Use existing error/loading patterns** from facets
4. **Use existing color scheme** from CSS variables

### Phase 2: Build New Components
1. **Install d3.js and Konva.js**
2. **Build layout calculation** (can use existing `generation` field from API!)
3. **Build rendering** (Konva.js)
4. **Build interactions** (zoom, pan, click)

### Phase 3: Integration
1. **Create React components** using Mycelia facets
2. **Create Next.js pages** for tree visualization routes
3. **Integrate with existing UI** (dashboard, explore, etc.)

---

## 14. Key Insights

1. **API Already Returns `generation` Field:**
   - This is **perfect** for slot-based positioning!
   - Generation 1 = parents, Generation 2 = grandparents, etc.
   - We can calculate slots directly from generation + position

2. **Mycelia Facets Are Ready:**
   - `getAncestors()` and `getDescendants()` already exist
   - Event system for reactive updates
   - Error handling built-in

3. **No Need to Build API Client:**
   - Proxy routes handle everything
   - Tree ID → File ID mapping automatic
   - Authentication/permissions handled

4. **Mini Pedigree as Reference:**
   - Shows simple SVG connector pattern
   - Shows person box styling
   - Can use as inspiration for full implementation

5. **Color Scheme Exists:**
   - `--color-tree-male`, `--color-tree-female` already defined
   - Theme-aware (dark mode support)

---

## 15. Next Steps

1. **Install dependencies:**
   ```bash
   npm install d3 konva
   npm install -D @types/d3 @types/konva
   ```

2. **Create data transformation utility:**
   - Transform API response to tree format
   - Add root person
   - Calculate slots from generations

3. **Build layout calculation:**
   - Use d3.js for flexible layout
   - Or implement TNG-style slot positioning
   - Use existing `generation` field from API

4. **Build rendering:**
   - Konva.js for canvas rendering
   - Reuse color scheme from CSS variables
   - Reuse person box styling from MiniPedigree

5. **Integrate with Mycelia:**
   - Use `useGedcomGraph` facet
   - Subscribe to events
   - Handle loading/error states

---

This analysis shows we have **excellent infrastructure** already in place. We mainly need to:
- Add d3.js and Konva.js
- Build the visualization components
- Transform API data to tree format
- Integrate everything together

The hard parts (API, data fetching, authentication) are already done! 🎉

