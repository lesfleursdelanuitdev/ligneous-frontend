# Mycelia Integration Analysis for Family Tree Visualization

**Date:** 2026-01-23  
**Purpose:** Determine how to integrate family tree visualization with Mycelia facet system

---

## Executive Summary

**Recommendation:** Create a **`useFamilyTreeVisualizer`** facet that:
1. **Uses existing facets** (`useGedcomGraph`, `useGedcomIndividuals`) for data
2. **Manages visualization-specific state** (layout, zoom, selected person, generations)
3. **Coordinates tree data fetching** and caching
4. **Provides reactive updates** when data or visualization state changes

This follows the Mycelia pattern: **facets for state management**, **components for presentation**.

---

## 1. Current Mycelia Facet Pattern

### 1.1 Facet Structure

**Existing facets follow this pattern:**
```javascript
export const useGedcomGraph = createHook({
  kind: 'gedcomGraph',
  version: '1.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,
  
  fn: (ctx, api, subsystem) => {
    const state = { ...initialState };
    const listeners = subsystem.find('listeners');
    
    // Helper functions
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'gedcomGraph', getState);
    
    // API methods
    const getAncestors = async (fileId, xref, maxGen) => { ... };
    
    // Return API
    return {
      getAncestors,
      getState,
      clearError
    };
  }
});
```

### 1.2 Facet Responsibilities

**Facets handle:**
- ✅ **Data fetching** from API
- ✅ **State management** (loading, error, data)
- ✅ **Event emission** for reactive updates
- ✅ **Error handling**

**Facets do NOT handle:**
- ❌ **UI rendering** (that's for React components)
- ❌ **Visual calculations** (that's for utility functions)
- ❌ **Canvas/Canvas rendering** (that's for Konva components)

---

## 2. What the Family Tree Visualizer Needs

### 2.1 Data Requirements

**From existing facets:**
- ✅ `useGedcomGraph.getAncestors(fileId, xref, maxGenerations)` - Get ancestors
- ✅ `useGedcomGraph.getDescendants(fileId, xref, maxGenerations)` - Get descendants
- ✅ `useGedcomIndividuals.getIndividual(fileId, xref)` - Get individual details
- ✅ `useGedcomIndividuals.getParents(fileId, xref)` - Get parents
- ✅ `useGedcomIndividuals.getChildren(fileId, xref)` - Get children
- ✅ `useGedcomIndividuals.getSpouses(fileId, xref)` - Get spouses

**Data we need to fetch:**
- Ancestors for pedigree chart
- Individual details for each person in the tree
- Family relationships for connectors

### 2.2 State Requirements

**Visualization-specific state:**
```javascript
{
  // Current view state
  rootPersonXref: null,        // Current root person
  generations: 4,               // Number of generations to show
  viewType: 'pedigree',        // 'pedigree' | 'descendant' | 'family'
  
  // Layout options
  layout: {
    orientation: 'vertical',   // 'vertical' | 'horizontal'
    style: 'standard',         // 'standard' | 'compact' | 'box'
    boxWidth: 200,
    boxHeight: 80,
    nodeSeparation: 250,
    levelSeparation: 150
  },
  
  // Viewport state
  viewport: {
    zoom: 1.0,
    panX: 0,
    panY: 0
  },
  
  // Selection state
  selectedPerson: null,         // Currently selected person xref
  highlightedPersons: [],       // Array of highlighted xrefs
  
  // Tree data (cached)
  treeData: null,               // Calculated tree with positions
  treeLayout: null,             // Layout calculation result
  
  // Loading/error
  loading: false,
  error: null
}
```

### 2.3 Functionality Requirements

**Methods needed:**
- `loadTree(fileId, rootXref, options)` - Load and calculate tree
- `setRootPerson(xref)` - Change root person
- `setGenerations(count)` - Change number of generations
- `setLayout(options)` - Update layout options
- `setViewport(zoom, panX, panY)` - Update viewport
- `selectPerson(xref)` - Select a person
- `highlightPersons(xrefs)` - Highlight multiple persons
- `zoomToPerson(xref)` - Zoom and pan to person
- `resetView()` - Reset zoom/pan
- `getState()` - Get current state
- `clearError()` - Clear error state

**Events to emit:**
- `familyTreeVisualizer:tree:loaded` - Tree data loaded
- `familyTreeVisualizer:rootPerson:changed` - Root person changed
- `familyTreeVisualizer:generations:changed` - Generations changed
- `familyTreeVisualizer:person:selected` - Person selected
- `familyTreeVisualizer:viewport:changed` - Viewport changed
- `familyTreeVisualizer:stateChanged` - State changed

---

## 3. Architecture Options

### Option 1: Pure Component (No Facet)

**Approach:** React component uses existing facets directly

**Pros:**
- ✅ Simpler - no new facet needed
- ✅ Direct access to data facets
- ✅ Less abstraction

**Cons:**
- ❌ Visualization state scattered across component
- ❌ No centralized state management
- ❌ Harder to share state between components
- ❌ No reactive updates for visualization state
- ❌ Difficult to persist/viewport state

**Verdict:** ❌ **Not recommended** - Loses benefits of Mycelia's reactive state management

---

### Option 2: Facet for State Only

**Approach:** Facet manages visualization state, component handles data fetching

**Pros:**
- ✅ Centralized state management
- ✅ Reactive updates
- ✅ Can share state between components

**Cons:**
- ❌ Component still needs to coordinate data fetching
- ❌ Data fetching logic in component (not reusable)
- ❌ Harder to cache tree data

**Verdict:** ⚠️ **Partially good** - Better than Option 1, but incomplete

---

### Option 3: Full Facet (Recommended)

**Approach:** Facet manages both state AND coordinates data fetching

**Pros:**
- ✅ Centralized state management
- ✅ Reactive updates
- ✅ Can share state between components
- ✅ Coordinates data fetching from multiple facets
- ✅ Can cache tree data
- ✅ Clean separation: facet = state/logic, component = rendering
- ✅ Follows Mycelia pattern

**Cons:**
- ⚠️ More code to write
- ⚠️ Need to coordinate with existing facets

**Verdict:** ✅ **Recommended** - Best alignment with Mycelia architecture

---

## 4. Recommended Implementation: `useFamilyTreeVisualizer`

### 4.1 Facet Structure

```javascript
export const useFamilyTreeVisualizer = createHook({
  kind: 'familyTreeVisualizer',
  version: '1.0.0',
  required: ['listeners', 'gedcomGraph', 'gedcomIndividuals'],
  attach: true,
  source: import.meta.url,
  
  fn: (ctx, api, subsystem) => {
    // Get required facets
    const listeners = subsystem.find('listeners');
    const graph = subsystem.find('gedcomGraph');
    const individuals = subsystem.find('gedcomIndividuals');
    
    // Initial state
    const state = {
      loading: false,
      error: null,
      rootPersonXref: null,
      generations: 4,
      viewType: 'pedigree',
      layout: { /* ... */ },
      viewport: { /* ... */ },
      selectedPerson: null,
      highlightedPersons: [],
      treeData: null,
      treeLayout: null
    };
    
    // Helper functions
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'familyTreeVisualizer', getState);
    
    // Methods
    const loadTree = async (fileId, rootXref, options = {}) => {
      // 1. Fetch ancestors using graph facet
      // 2. Fetch individual details using individuals facet
      // 3. Calculate tree layout (calls utility function with d3.js)
      // 4. Update state with calculated positions
      // 5. Emit events
    };
    
    return {
      loadTree,
      setRootPerson,
      setGenerations,
      setLayout,
      setViewport,
      selectPerson,
      highlightPersons,
      zoomToPerson,
      resetView,
      getState,
      clearError
    };
  }
});
```

### 4.2 How It Uses Existing Facets

**Data fetching coordination:**
```javascript
const loadTree = async (fileId, rootXref, options = {}) => {
  setLoading(true);
  
  try {
    // Use graph facet for ancestors
    const ancestors = await graph.getAncestors(
      fileId, 
      rootXref, 
      options.generations || state.generations
    );
    
    // Use individuals facet for root person details
    const rootPerson = await individuals.getIndividual(fileId, rootXref);
    
    // Fetch details for all ancestors
    const personDetails = await Promise.all(
      ancestors.map(anc => individuals.getIndividual(fileId, anc.xref))
    );
    
    // Calculate tree layout (using d3.js utility function)
    // Import the utility function (keeps d3.js logic separate)
    const { calculateTreeLayout } = await import('../../core/TreeLayout.js');
    const treeLayout = calculateTreeLayout(ancestors, rootPerson, options);
    
    // Update state with calculated positions
    state.treeData = { ancestors, rootPerson, personDetails };
    state.treeLayout = treeLayout;  // Contains x, y positions for all nodes
    state.rootPersonXref = rootXref;
    
    setLoading(false);
    emitEvent('familyTreeVisualizer:tree:loaded', { rootXref, treeLayout });
    emitStateChange();
    
    return treeLayout;
  } catch (error) {
    handleApiError(error, state, emitEvent, emitStateChange, 'loadTree');
    throw error;
  }
};
```

### 4.3 Component Usage

**React component uses the facet:**
```javascript
function PedigreeChart({ fileId, rootXref }) {
  const visualizer = useFacet('familyTreeVisualizer');
  const [state, setState] = useState(null);
  
  // Listen to state changes
  useListener('familyTreeVisualizer:stateChanged', () => {
    setState(visualizer.getState());
  });
  
  // Load tree on mount
  useEffect(() => {
    visualizer.loadTree(fileId, rootXref);
  }, [fileId, rootXref]);
  
  // Render with Konva
  return (
    <KonvaStage>
      {state?.treeLayout && (
        <TreeRenderer 
          layout={state.treeLayout}
          onPersonClick={(xref) => visualizer.selectPerson(xref)}
        />
      )}
    </KonvaStage>
  );
}
```

---

## 5. Benefits of Facet Approach

### 5.1 Reactive State Management

**Multiple components can use the same state:**
```javascript
// Component 1: Main chart
function PedigreeChart() {
  const visualizer = useFacet('familyTreeVisualizer');
  const state = visualizer.getState();
  // Render chart
}

// Component 2: Controls panel
function TreeControls() {
  const visualizer = useFacet('familyTreeVisualizer');
  const state = visualizer.getState();
  
  return (
    <select 
      value={state.generations}
      onChange={(e) => visualizer.setGenerations(parseInt(e.target.value))}
    >
      {/* ... */}
    </select>
  );
}

// Component 3: Person details panel
function PersonDetails() {
  const visualizer = useFacet('familyTreeVisualizer');
  const state = visualizer.getState();
  
  // Automatically updates when person is selected
  return <div>{state.selectedPerson && /* show details */}</div>;
}
```

**All components stay in sync automatically!**

### 5.2 Data Caching

**Facet can cache tree data:**
```javascript
const loadTree = async (fileId, rootXref, options) => {
  // Check cache first
  const cacheKey = `${fileId}-${rootXref}-${options.generations}`;
  if (state.treeCache?.[cacheKey]) {
    state.treeData = state.treeCache[cacheKey];
    emitStateChange();
    return state.treeData;
  }
  
  // Fetch and cache
  const treeData = await fetchTreeData(fileId, rootXref, options);
  state.treeCache = state.treeCache || {};
  state.treeCache[cacheKey] = treeData;
  // ...
};
```

### 5.3 State Persistence

**Can persist viewport state:**
```javascript
// Save viewport to localStorage
const setViewport = (zoom, panX, panY) => {
  state.viewport = { zoom, panX, panY };
  localStorage.setItem('treeViewport', JSON.stringify(state.viewport));
  emitStateChange();
};

// Restore on load
const restoreViewport = () => {
  const saved = localStorage.getItem('treeViewport');
  if (saved) {
    state.viewport = JSON.parse(saved);
    emitStateChange();
  }
};
```

---

## 6. Integration with Existing Facets

### 6.1 Dependency Chain

```
useFamilyTreeVisualizer
  ├── uses: useGedcomGraph (for ancestors/descendants)
  ├── uses: useGedcomIndividuals (for person details)
  └── uses: listeners (for events)

React Components
  └── uses: useFamilyTreeVisualizer (for visualization state)
```

### 6.2 Event Flow

**Data flow:**
1. Component calls `visualizer.loadTree(fileId, rootXref)`
2. Facet calls `graph.getAncestors()` and `individuals.getIndividual()`
3. Facet calculates tree layout
4. Facet updates state and emits `familyTreeVisualizer:tree:loaded`
5. Component listens to event and re-renders

**User interaction flow:**
1. User clicks person in chart
2. Component calls `visualizer.selectPerson(xref)`
3. Facet updates state and emits `familyTreeVisualizer:person:selected`
4. All listening components update (chart highlights, details panel shows info)

---

## 7. Implementation Plan

### Phase 1: Basic Facet Structure
1. Create `useFamilyTreeVisualizer` facet
2. Define state structure
3. Implement basic methods (`loadTree`, `setRootPerson`, `getState`)

### Phase 2: Data Integration
1. Integrate with `useGedcomGraph` for ancestors
2. Integrate with `useGedcomIndividuals` for person details
3. Implement tree data fetching coordination

### Phase 3: Layout Calculation
1. Integrate d3.js tree layout calculation
2. Store layout results in state
3. Emit events when layout changes

### Phase 4: Viewport Management
1. Implement zoom/pan state
2. Add viewport methods (`setViewport`, `zoomToPerson`, `resetView`)
3. Optional: Persist viewport to localStorage

### Phase 5: Selection & Highlighting
1. Implement person selection
2. Implement highlighting
3. Emit events for UI updates

---

## 8. File Structure

```
mycelia/
├── facets/
│   └── gedcom/
│       ├── graph.js              # Existing: ancestors/descendants
│       ├── individuals.js        # Existing: person details
│       └── family-tree-visualizer.js  # NEW: visualization state
│
family-tree-vis/
├── components/
│   └── PedigreeChart.jsx         # Uses useFamilyTreeVisualizer
├── core/
│   ├── TreeLayout.ts             # d3.js layout calculations
│   └── ConnectorGenerator.ts    # Connector path calculations
└── renderers/
    └── KonvaRenderer.ts          # Konva rendering
```

---

## 9. Example Usage

### 9.1 Basic Usage

```javascript
import { useFacet } from '@/mycelia/MyceliaProvider';

function PedigreeChart({ fileId, rootXref }) {
  const visualizer = useFacet('familyTreeVisualizer');
  
  useEffect(() => {
    visualizer.loadTree(fileId, rootXref, {
      generations: 4,
      viewType: 'pedigree'
    });
  }, [fileId, rootXref]);
  
  const state = visualizer.getState();
  
  if (state.loading) return <Loading />;
  if (state.error) return <Error error={state.error} />;
  
  return (
    <KonvaStage>
      <TreeRenderer layout={state.treeLayout} />
    </KonvaStage>
  );
}
```

### 9.2 With Controls

```javascript
function TreeView({ fileId, rootXref }) {
  const visualizer = useFacet('familyTreeVisualizer');
  const state = visualizer.getState();
  
  return (
    <div>
      <TreeControls 
        generations={state.generations}
        onGenerationsChange={(n) => visualizer.setGenerations(n)}
        onZoomIn={() => visualizer.setViewport(state.viewport.zoom * 1.2, ...)}
        onZoomOut={() => visualizer.setViewport(state.viewport.zoom * 0.8, ...)}
      />
      <PedigreeChart fileId={fileId} rootXref={rootXref} />
      <PersonDetails selectedPerson={state.selectedPerson} />
    </div>
  );
}
```

---

## 10. Conclusion

**Yes, create `useFamilyTreeVisualizer` facet!**

**Reasons:**
1. ✅ Follows Mycelia pattern (facets for state management)
2. ✅ Coordinates data from multiple existing facets
3. ✅ Provides reactive state management
4. ✅ Enables state sharing between components
5. ✅ Supports caching and persistence
6. ✅ Clean separation: facet = logic, component = rendering

**The facet should:**
- Use existing facets (`useGedcomGraph`, `useGedcomIndividuals`) for data
- Manage visualization-specific state (layout, viewport, selection)
- Coordinate tree data fetching and layout calculation
- Emit events for reactive updates
- Provide methods for UI interactions

**The component should:**
- Use the facet for state and methods
- Handle Konva rendering
- Listen to facet events for updates
- Call facet methods on user interactions

---

## 10. Where to Compute Positions with d3.js

### 10.1 Answer: Yes, in the Facet (via Utility Function)

**Architecture:**
```
Facet (useFamilyTreeVisualizer)
  ├── Fetches data from other facets
  ├── Calls utility function for d3.js calculation
  ├── Stores calculated positions in state
  └── Emits events with layout data

Utility Function (TreeLayout.ts)
  ├── Pure function: takes data, returns positions
  ├── Uses d3.js for layout calculation
  ├── No state management
  └── Testable independently

Component (PedigreeChart)
  ├── Gets layout from facet state
  ├── Renders with Konva
  └── No calculations
```

### 10.2 Why in the Facet?

**Reasons:**
1. ✅ **State Management** - Layout positions are part of visualization state
2. ✅ **Caching** - Facet can cache calculated layouts
3. ✅ **Coordination** - Facet coordinates data fetching + calculation
4. ✅ **Reactive Updates** - When layout changes, facet emits events
5. ✅ **Multiple Components** - Multiple components can use same layout
6. ✅ **Separation of Concerns** - Facet = state/logic, Utility = calculation, Component = rendering

### 10.3 Implementation Pattern

**Facet calls utility:**
```javascript
// In facet: family-tree-visualizer.js
import { calculateTreeLayout } from '../../core/TreeLayout.js';

const loadTree = async (fileId, rootXref, options = {}) => {
  // 1. Fetch data
  const ancestors = await graph.getAncestors(fileId, rootXref, options.generations);
  const rootPerson = await individuals.getIndividual(fileId, rootXref);
  
  // 2. Calculate positions (calls utility)
  const treeLayout = calculateTreeLayout({
    ancestors,
    rootPerson,
    generations: options.generations || state.generations,
    layout: options.layout || state.layout
  });
  
  // 3. Store in state
  state.treeLayout = treeLayout;  // Contains {nodes: [{x, y, data}], links: [...]}
  
  // 4. Emit event
  emitEvent('familyTreeVisualizer:tree:loaded', { treeLayout });
};
```

**Utility function (pure calculation):**
```typescript
// In utility: core/TreeLayout.ts
import * as d3 from 'd3';

export function calculateTreeLayout({ ancestors, rootPerson, generations, layout }) {
  // Build d3 hierarchy
  const root = d3.hierarchy(rootPerson, d => getParents(d, ancestors));
  
  // Calculate positions with d3.tree()
  const tree = d3.tree()
    .nodeSize([layout.nodeSeparation, layout.levelSeparation])
    .separation((a, b) => 1);
  
  tree(root);
  
  // Extract positions
  const nodes = root.descendants().map(d => ({
    x: d.x,
    y: d.y,
    data: d.data,
    depth: d.depth
  }));
  
  // Calculate connectors
  const links = createConnectors(nodes, ancestors);
  
  return { nodes, links };
}
```

**Component uses facet state:**
```javascript
// In component: PedigreeChart.jsx
function PedigreeChart({ fileId, rootXref }) {
  const visualizer = useFacet('familyTreeVisualizer');
  const state = visualizer.getState();
  
  // Layout already calculated by facet!
  const { nodes, links } = state.treeLayout || { nodes: [], links: [] };
  
  // Just render with Konva
  return (
    <KonvaStage>
      {links.map(link => <KonvaLine points={link.points} />)}
      {nodes.map(node => <PersonCard x={node.x} y={node.y} data={node.data} />)}
    </KonvaStage>
  );
}
```

### 10.4 Benefits of This Approach

**Facet manages calculation:**
- ✅ Layout is part of visualization state
- ✅ Can cache layouts (avoid recalculating)
- ✅ Can recalculate when options change
- ✅ Coordinates data + calculation in one place

**Utility function is pure:**
- ✅ Testable independently
- ✅ Reusable in other contexts
- ✅ No side effects
- ✅ Easy to swap d3.js for other layout algorithm

**Component is simple:**
- ✅ Just renders what facet provides
- ✅ No calculation logic
- ✅ Focused on presentation

### 10.5 Updated Conclusion

**The facet should:**
- Use existing facets (`useGedcomGraph`, `useGedcomIndividuals`) for data
- **Call utility function for d3.js position calculation**
- Manage visualization-specific state (layout, viewport, selection)
- Store calculated positions in state
- Coordinate tree data fetching and layout calculation
- Emit events for reactive updates
- Provide methods for UI interactions

**The utility function should:**
- Be a pure function (no state)
- Use d3.js for layout calculations
- Take data, return positions
- Be testable independently

**The component should:**
- Use the facet for state and methods
- Get calculated positions from facet state
- Handle Konva rendering
- Listen to facet events for updates
- Call facet methods on user interactions

**Architecture Summary:**
- **Facet** = State management + Data coordination + Calls utility for calculation
- **Utility** = Pure d3.js calculation function
- **Component** = Rendering with Konva

This architecture provides a clean, maintainable, and reactive solution that fits perfectly with the Mycelia ecosystem.

