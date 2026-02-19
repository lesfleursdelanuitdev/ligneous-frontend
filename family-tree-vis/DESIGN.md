# Family Tree Visualization - Design Document

**Date:** 2026-01-23  
**Purpose:** Design the architecture and components for family tree visualization using d3.js + Konva.js

---

## Executive Summary

We need to create a family tree visualization component that:
1. **Uses d3.js** for tree layout calculations (positioning nodes)
2. **Uses Konva.js** for canvas-based rendering (drawing on canvas)
3. **Recreates TNG's pedigree chart style** with T-junction connectors
4. **Integrates with Next.js/React** architecture
5. **Fetches data from Go API** via existing proxy routes

---

## Folder Structure

```
family-tree-vis/
├── DESIGN.md                    # This file
├── components/                  # React components
│   ├── FamilyTreeCanvas.tsx    # Main React wrapper component
│   ├── PedigreeChart.tsx       # Pedigree-specific chart component
│   └── TreeControls.tsx        # UI controls (zoom, generations, etc.)
├── core/                       # Core visualization logic
│   ├── TreeLayout.ts           # d3.js tree layout calculations
│   ├── ConnectorGenerator.ts   # T-junction connector calculations
│   ├── PositionCalculator.ts   # TNG-style slot-based positioning
│   └── TreeStore.ts            # State management for tree data
├── renderers/                   # Konva.js rendering
│   ├── KonvaRenderer.ts        # Main Konva rendering engine
│   ├── CardRenderer.ts         # Person card rendering
│   ├── ConnectorRenderer.ts    # Connector line rendering
│   └── LayerManager.ts         # Konva layer management
├── interactions/                # User interactions
│   ├── ZoomHandler.ts          # Zoom/pan handling
│   ├── ClickHandler.ts         # Click events on cards
│   └── HoverHandler.ts         # Hover effects
├── types/                       # TypeScript type definitions
│   ├── TreeData.ts             # Data structures
│   ├── Layout.ts                # Layout-related types
│   └── Render.ts                # Rendering-related types
├── utils/                       # Utility functions
│   ├── treeDataTransform.ts    # Transform API data to tree format
│   ├── calculations.ts         # Math utilities (slot calculations, etc.)
│   └── constants.ts            # Configuration constants
└── hooks/                       # React hooks
    ├── useFamilyTree.ts        # Main hook for tree visualization
    ├── useTreeData.ts          # Data fetching hook
    └── useTreeLayout.ts        # Layout calculation hook
```

---

## Component Breakdown

### 1. React Components Layer

#### `FamilyTreeCanvas.tsx`
**Purpose:** Main React component that wraps the Konva canvas

**Responsibilities:**
- Initialize Konva Stage
- Handle React lifecycle (mount/unmount)
- Pass props to core visualization
- Handle window resize
- Integrate with Next.js routing

**Props:**
```typescript
interface FamilyTreeCanvasProps {
  treeId: string
  personId?: string        // Root person for pedigree
  generations?: number     // Number of generations to show
  mode?: 'pedigree' | 'descendant' | 'family'
  onPersonClick?: (personId: string) => void
  onPersonHover?: (personId: string) => void
}
```

**Dependencies:**
- `useFamilyTree` hook
- `KonvaRenderer`
- `TreeLayout`

---

#### `PedigreeChart.tsx`
**Purpose:** Pedigree-specific chart (ancestor tree)

**Responsibilities:**
- Configure pedigree-specific layout
- Handle generation controls
- Display pedigree-specific UI

**Props:**
```typescript
interface PedigreeChartProps {
  treeId: string
  personId: string
  generations?: number
  maxGenerations?: number
}
```

---

#### `TreeControls.tsx`
**Purpose:** UI controls for tree manipulation

**Responsibilities:**
- Generation selector
- Zoom controls (+/- buttons)
- Fit-to-view button
- Reset view button
- Display mode toggle

**Features:**
- Slider for generations
- Zoom level indicator
- Pan/zoom reset

---

### 2. Core Logic Layer

#### `TreeLayout.ts`
**Purpose:** Calculate tree node positions using d3.js

**Responsibilities:**
- Use `d3.tree()` for hierarchical layout
- Calculate node positions (x, y)
- Handle both pedigree (ancestors) and descendant layouts
- Support custom spacing configurations

**Key Functions:**
```typescript
function calculateTreeLayout(
  rootPerson: Person,
  direction: 'ancestors' | 'descendants',
  generations: number,
  config: LayoutConfig
): TreeLayoutResult

function calculateSlotPositions(
  rootPerson: Person,
  generations: number,
  config: TNGStyleConfig
): SlotPosition[]
```

**Dependencies:**
- d3.js (`d3.tree`, `d3.hierarchy`)
- `PositionCalculator` for TNG-style positioning

---

#### `PositionCalculator.ts`
**Purpose:** TNG-style slot-based positioning (alternative to d3.tree)

**Responsibilities:**
- Calculate slot numbers (binary tree structure)
- Calculate horizontal positions (generation-based)
- Calculate vertical positions (complex math from TNG)
- Handle box sizing per generation

**Key Functions:**
```typescript
function calculateSlotNumber(person: Person, rootPerson: Person): number

function calculateHorizontalPosition(
  generation: number,
  config: TNGConfig
): number

function calculateVerticalPosition(
  slot: number,
  generation: number,
  maxHeight: number,
  config: TNGConfig
): number

function calculateMaxHeight(
  generations: number,
  config: TNGConfig
): number
```

**Algorithm:**
- Slot-based numbering (slot 1 = root, slot 2 = father, slot 3 = mother, etc.)
- Horizontal: `leftIndent + (generation - 1) * (boxWidth + boxHsep)`
- Vertical: Complex calculation ensuring parent-child alignment

---

#### `ConnectorGenerator.ts`
**Purpose:** Generate T-junction connector paths

**Responsibilities:**
- Calculate connector line segments
- Generate T-junction paths (3 segments: left horizontal, vertical, right horizontal)
- Handle parent-child connections
- Handle spouse connections (horizontal lines)

**Key Functions:**
```typescript
function generateConnectors(
  nodes: PositionedNode[],
  config: ConnectorConfig
): Connector[]

function generateTJunction(
  child: PositionedNode,
  parents: PositionedNode[],
  config: ConnectorConfig
): TJunctionPath

function generateSpouseConnector(
  spouse1: PositionedNode,
  spouse2: PositionedNode,
  config: ConnectorConfig
): HorizontalLine
```

**Connector Types:**
1. **T-Junction (Parent-Child):**
   - Left horizontal line (from child to junction point)
   - Vertical line (from junction to parent midpoint)
   - Right horizontal lines (from parent midpoint to each parent)

2. **Horizontal (Spouse):**
   - Straight line between spouses

---

#### `TreeStore.ts`
**Purpose:** State management for tree data and visualization state

**Responsibilities:**
- Store tree data (people, families, relationships)
- Store layout calculations
- Store rendering state (zoom level, pan position)
- Handle data updates

**State Structure:**
```typescript
interface TreeStoreState {
  // Data
  people: Map<string, Person>
  families: Map<string, Family>
  relationships: Relationship[]
  
  // Layout
  layout: TreeLayout | null
  positions: Map<string, Position>
  
  // View state
  zoom: number
  pan: { x: number, y: number }
  generations: number
  
  // Rendering state
  selectedPerson: string | null
  hoveredPerson: string | null
}
```

---

### 3. Rendering Layer (Konva.js)

#### `KonvaRenderer.ts`
**Purpose:** Main Konva rendering engine

**Responsibilities:**
- Initialize Konva Stage and Layers
- Coordinate rendering of cards and connectors
- Handle canvas updates
- Manage render loop

**Key Functions:**
```typescript
class KonvaRenderer {
  constructor(container: HTMLElement, config: RenderConfig)
  
  render(tree: TreeLayout, connectors: Connector[]): void
  updateCards(cards: PositionedCard[]): void
  updateConnectors(connectors: Connector[]): void
  clear(): void
  
  // Transformations
  setZoom(level: number): void
  setPan(x: number, y: number): void
  fitToView(treeBounds: Bounds): void
}
```

**Layer Structure:**
- `backgroundLayer` - Background elements
- `connectorsLayer` - Connector lines (rendered first, behind cards)
- `cardsLayer` - Person cards (rendered on top)
- `overlayLayer` - UI overlays, tooltips, etc.

---

#### `CardRenderer.ts`
**Purpose:** Render person cards using Konva shapes

**Responsibilities:**
- Create Konva Group for each person card
- Render card background (rectangle)
- Render person name (text)
- Render dates/places (text)
- Handle card styling (colors, fonts per generation)
- Handle card interactions (click, hover)

**Key Functions:**
```typescript
function createCardGroup(
  person: Person,
  position: Position,
  generation: number,
  config: CardConfig
): Konva.Group

function updateCardPosition(
  card: Konva.Group,
  newPosition: Position,
  animated: boolean
): void

function styleCardByGeneration(
  card: Konva.Group,
  generation: number,
  config: CardConfig
): void
```

**Card Structure:**
- `Konva.Group` (container)
  - `Konva.Rect` (background)
  - `Konva.Text` (name)
  - `Konva.Text` (birth date)
  - `Konva.Text` (death date)
  - Optional: `Konva.Image` (photo)

---

#### `ConnectorRenderer.ts`
**Purpose:** Render connector lines using Konva

**Responsibilities:**
- Create Konva Line shapes for connectors
- Handle T-junction rendering (3 line segments)
- Handle horizontal spouse connectors
- Animate connector appearance
- Style connectors (color, width)

**Key Functions:**
```typescript
function createConnectorLine(
  connector: Connector,
  config: ConnectorConfig
): Konva.Line

function createTJunction(
  tJunction: TJunctionPath,
  config: ConnectorConfig
): Konva.Line[]

function animateConnector(
  line: Konva.Line,
  duration: number
): void
```

**Connector Rendering:**
- T-junctions: 3 separate `Konva.Line` objects (or 1 path with multiple segments)
- Spouse connectors: 1 `Konva.Line` object
- Use `Konva.Line` with `points` array for path definition

---

#### `LayerManager.ts`
**Purpose:** Manage Konva layers and rendering order

**Responsibilities:**
- Create and organize layers
- Manage layer z-index/order
- Handle layer updates
- Optimize rendering (batch draws)

**Layer Order (bottom to top):**
1. Background layer
2. Connectors layer
3. Cards layer
4. Overlay layer (tooltips, UI)

---

### 4. Interactions Layer

#### `ZoomHandler.ts`
**Purpose:** Handle zoom and pan interactions

**Responsibilities:**
- Mouse wheel zoom
- Pinch zoom (touch)
- Drag to pan
- Programmatic zoom (fit-to-view, zoom-to-person)
- Zoom limits (min/max)

**Key Functions:**
```typescript
class ZoomHandler {
  constructor(stage: Konva.Stage, config: ZoomConfig)
  
  setupZoom(): void
  setupPan(): void
  zoomTo(level: number, center?: Point): void
  panTo(x: number, y: number): void
  fitToBounds(bounds: Bounds): void
  reset(): void
}
```

**Implementation:**
- Use Konva's `stage.scale()` and `stage.position()`
- Handle wheel events on stage
- Handle drag events on stage
- Calculate zoom center point (mouse position)

---

#### `ClickHandler.ts`
**Purpose:** Handle click events on cards

**Responsibilities:**
- Detect clicks on person cards
- Emit click events to React
- Handle double-click (navigate to person)
- Handle right-click (context menu)

**Key Functions:**
```typescript
function setupCardClicks(
  cards: Konva.Group[],
  onCardClick: (personId: string) => void
): void
```

---

#### `HoverHandler.ts`
**Purpose:** Handle hover effects on cards

**Responsibilities:**
- Show tooltip on hover
- Highlight card on hover
- Show relationship lines on hover
- Animate hover effects

**Key Functions:**
```typescript
function setupCardHover(
  cards: Konva.Group[],
  onHover: (personId: string | null) => void
): void

function showTooltip(
  card: Konva.Group,
  person: Person,
  position: Point
): void
```

---

### 5. Data Layer

#### `treeDataTransform.ts`
**Purpose:** Transform API data to tree visualization format

**Responsibilities:**
- Convert API person data to `Person` type
- Convert API family data to `Family` type
- Build relationship graph
- Handle missing data gracefully

**Key Functions:**
```typescript
function transformAPIData(
  apiData: APIPerson[],
  apiFamilies: APIFamily[]
): TreeData

function buildRelationshipGraph(
  people: Person[],
  families: Family[]
): RelationshipGraph
```

**Data Transformation:**
- API → Internal format
- Handle parent-child relationships
- Handle spouse relationships
- Handle multiple marriages
- Handle missing parents

---

#### `useTreeData.ts`
**Purpose:** React hook for fetching tree data

**Responsibilities:**
- Fetch person data from API
- Fetch family data from API
- Fetch ancestors/descendants
- Handle loading states
- Handle errors
- Cache data

**Hook Signature:**
```typescript
function useTreeData(
  treeId: string,
  personId?: string,
  options?: DataOptions
): {
  data: TreeData | null
  loading: boolean
  error: Error | null
  refetch: () => void
}
```

**API Integration:**
- Use existing API proxy routes
- Fetch from `/api/trees/{treeId}/individuals/{personId}/ancestors`
- Fetch from `/api/trees/{treeId}/individuals/{personId}/descendants`
- Use Mycelia `useAPI` hook if available

---

### 6. Hooks Layer

#### `useFamilyTree.ts`
**Purpose:** Main React hook for family tree visualization

**Responsibilities:**
- Coordinate all visualization logic
- Manage state (data, layout, rendering)
- Handle updates
- Expose API to React components

**Hook Signature:**
```typescript
function useFamilyTree(
  treeId: string,
  personId: string,
  options?: TreeOptions
): {
  // Data
  data: TreeData | null
  loading: boolean
  error: Error | null
  
  // Layout
  layout: TreeLayout | null
  
  // Rendering
  renderer: KonvaRenderer | null
  
  // Interactions
  zoom: number
  pan: { x: number, y: number }
  setZoom: (level: number) => void
  setPan: (x: number, y: number) => void
  fitToView: () => void
  reset: () => void
  
  // Configuration
  generations: number
  setGenerations: (n: number) => void
}
```

**Internal Flow:**
1. Fetch data (`useTreeData`)
2. Calculate layout (`TreeLayout`)
3. Generate connectors (`ConnectorGenerator`)
4. Initialize renderer (`KonvaRenderer`)
5. Render tree
6. Handle interactions

---

#### `useTreeLayout.ts`
**Purpose:** Hook for layout calculations

**Responsibilities:**
- Calculate tree layout when data changes
- Handle layout algorithm selection (d3.tree vs TNG-style)
- Cache layout calculations
- Handle layout updates

---

### 7. Types Layer

#### `TreeData.ts`
**Purpose:** Type definitions for tree data

**Types:**
```typescript
interface Person {
  id: string
  name: string
  birthDate?: string
  deathDate?: string
  birthPlace?: string
  deathPlace?: string
  sex?: 'M' | 'F' | 'U'
  // ... other fields
}

interface Family {
  id: string
  husbandId?: string
  wifeId?: string
  childrenIds: string[]
  marriageDate?: string
  // ... other fields
}

interface Relationship {
  type: 'parent' | 'child' | 'spouse' | 'sibling'
  from: string
  to: string
}
```

---

#### `Layout.ts`
**Purpose:** Type definitions for layout

**Types:**
```typescript
interface Position {
  x: number
  y: number
}

interface PositionedNode {
  person: Person
  position: Position
  generation: number
  slot?: number
}

interface TreeLayout {
  nodes: PositionedNode[]
  bounds: Bounds
  dimensions: { width: number, height: number }
}

interface Connector {
  id: string
  type: 't-junction' | 'horizontal' | 'vertical'
  path: Point[]
  source: string
  target: string[]
}
```

---

#### `Render.ts`
**Purpose:** Type definitions for rendering

**Types:**
```typescript
interface RenderConfig {
  cardWidth: number
  cardHeight: number
  cardSpacing: { horizontal: number, vertical: number }
  connectorWidth: number
  connectorColor: string
  // ... styling options
}

interface CardConfig {
  width: number
  height: number
  backgroundColor: string
  textColor: string
  fontSize: number
  // ... styling
}
```

---

### 8. Utils Layer

#### `calculations.ts`
**Purpose:** Mathematical utility functions

**Functions:**
```typescript
function calculateSlotNumber(
  person: Person,
  rootPerson: Person,
  generation: number
): number

function calculateMaxHeight(
  generations: number,
  boxHeight: number,
  boxVsep: number
): number

function calculateVerticalSeparation(
  generation: number,
  maxHeight: number,
  boxHeight: number
): number

function getMidpoint(
  point1: Point,
  point2: Point
): Point
```

---

#### `constants.ts`
**Purpose:** Configuration constants

**Constants:**
```typescript
export const DEFAULT_CONFIG = {
  // Layout
  nodeSeparation: 250,
  levelSeparation: 150,
  maxGenerations: 10,
  
  // Cards
  cardWidth: 200,
  cardHeight: 80,
  cardHsep: 50,
  cardVsep: 30,
  
  // Connectors
  connectorWidth: 2,
  connectorColor: '#000000',
  
  // Zoom
  minZoom: 0.1,
  maxZoom: 4,
  defaultZoom: 1,
  
  // TNG-style
  leftIndent: 50,
  boxHeightShift: -2,
  // ... more TNG config
}
```

---

## Data Flow

```
1. React Component (FamilyTreeCanvas)
   ↓
2. useFamilyTree Hook
   ↓
3. useTreeData Hook → API → Transform Data
   ↓
4. TreeLayout → Calculate Positions (d3.js)
   ↓
5. ConnectorGenerator → Generate Connectors
   ↓
6. KonvaRenderer → Render on Canvas (Konva.js)
   ↓
7. ZoomHandler/ClickHandler → Handle Interactions
   ↓
8. Update State → Re-render
```

---

## Integration Points

### 1. API Integration
- Use existing `/api/trees/{treeId}/individuals/{personId}/ancestors` endpoint
- Use existing `/api/trees/{treeId}/individuals/{personId}/descendants` endpoint
- Use existing `/api/trees/{treeId}/individuals/{personId}` endpoint
- Use Mycelia `useAPI` hook if available

### 2. Next.js Integration
- Create page route: `/app/trees/[treeId]/pedigree/[personId]/page.tsx`
- Use Next.js dynamic routes
- Handle loading states with Next.js Suspense
- Use Next.js Image for person photos

### 3. React Integration
- Client component (`'use client'`)
- Use React hooks for state management
- Use React refs for Konva Stage container
- Use React effects for lifecycle management

---

## Dependencies

### Required Packages
```json
{
  "d3": "^7.9.0",           // Tree layout calculations
  "konva": "^9.2.0",        // Canvas rendering
  "react-konva": "^18.2.10" // React integration (optional)
}
```

### Optional Packages
- `@types/d3` - TypeScript types for d3.js
- `@types/konva` - TypeScript types for Konva.js

---

## Configuration Options

### Layout Modes
1. **d3.tree Layout** - Automatic hierarchical layout
2. **TNG-style Layout** - Slot-based positioning (matches TNG exactly)

### Rendering Modes
1. **Pedigree** - Ancestor tree (upward)
2. **Descendant** - Descendant tree (downward)
3. **Family** - Full family tree (both directions)

### Connector Styles
1. **T-junction** - TNG-style (3 segments)
2. **Curved** - Smooth curves (family-chart style)
3. **Straight** - Direct lines

---

## Performance Considerations

### Optimization Strategies
1. **Virtual Rendering** - Only render visible nodes
2. **Layer Caching** - Cache Konva layers when possible
3. **Batch Updates** - Use `stage.batchDraw()` for multiple updates
4. **Debounce Interactions** - Debounce zoom/pan events
5. **Lazy Loading** - Load additional generations on demand

### Memory Management
- Clean up Konva objects on unmount
- Remove event listeners
- Clear caches when data changes

---

## Testing Strategy

### Unit Tests
- `PositionCalculator` - Test slot calculations
- `ConnectorGenerator` - Test connector path generation
- `calculations.ts` - Test math utilities

### Integration Tests
- `TreeLayout` - Test layout with sample data
- `KonvaRenderer` - Test rendering output
- `useFamilyTree` - Test hook behavior

### E2E Tests
- Full tree rendering
- User interactions (zoom, pan, click)
- Data fetching and updates

---

## Future Enhancements

1. **Fan Chart** - Circular pedigree layout
2. **Timeline View** - Time-based visualization
3. **Relationship Path** - Highlight path between two people
4. **Export** - Export as image/PDF
5. **Print** - Print-friendly layout
6. **Mobile Support** - Touch gestures, responsive layout
7. **Accessibility** - Keyboard navigation, screen reader support

---

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Set up folder structure
- [ ] Install dependencies (d3.js, Konva.js)
- [ ] Create type definitions
- [ ] Create data transformation utilities
- [ ] Create basic React component structure

### Phase 2: Layout Calculation
- [ ] Implement `TreeLayout` with d3.js
- [ ] Implement `PositionCalculator` (TNG-style)
- [ ] Test layout calculations
- [ ] Create layout configuration system

### Phase 3: Connector Generation
- [ ] Implement `ConnectorGenerator`
- [ ] Test T-junction calculations
- [ ] Test spouse connector calculations
- [ ] Create connector styling system

### Phase 4: Rendering
- [ ] Implement `KonvaRenderer`
- [ ] Implement `CardRenderer`
- [ ] Implement `ConnectorRenderer`
- [ ] Test rendering output

### Phase 5: Interactions
- [ ] Implement `ZoomHandler`
- [ ] Implement `ClickHandler`
- [ ] Implement `HoverHandler`
- [ ] Test user interactions

### Phase 6: Integration
- [ ] Create `useFamilyTree` hook
- [ ] Integrate with API
- [ ] Create React components
- [ ] Create Next.js page route

### Phase 7: Polish
- [ ] Add animations
- [ ] Add tooltips
- [ ] Add controls UI
- [ ] Optimize performance
- [ ] Add error handling

---

## Key Design Decisions

1. **Separation of Concerns:**
   - d3.js for calculations only
   - Konva.js for rendering only
   - React for UI and state management

2. **Layout Algorithm:**
   - Support both d3.tree (flexible) and TNG-style (precise)
   - Allow switching between algorithms

3. **Rendering Strategy:**
   - Canvas-based (Konva) for performance
   - Layer-based organization for clarity
   - Batch updates for efficiency

4. **State Management:**
   - React hooks for component state
   - Local state for visualization state
   - API state via existing Mycelia hooks

5. **Data Flow:**
   - Unidirectional: API → Transform → Layout → Render
   - Clear separation between data and presentation

---

## Questions to Resolve

1. **Should we use `react-konva`?**
   - Pros: Better React integration, easier state management
   - Cons: Additional dependency, potential performance overhead
   - **Decision:** Start with vanilla Konva, consider react-konva if needed

2. **How to handle large trees?**
   - Virtual rendering?
   - Progressive loading?
   - Level-of-detail (LOD)?
   - **Decision:** Start simple, optimize later

3. **Should we support both layout algorithms?**
   - d3.tree for flexibility
   - TNG-style for exact match
   - **Decision:** Yes, make it configurable

4. **How to handle missing data?**
   - Show placeholder cards?
   - Skip missing parents?
   - **Decision:** Show placeholders with "Unknown" labels

---

This design provides a comprehensive blueprint for implementing the family tree visualization component. Each module has clear responsibilities and interfaces, making the implementation straightforward and maintainable.

