# Family-Chart Codebase Analysis

**Date:** 2026-01-23  
**Purpose:** Analyze how `family-chart` uses d3.js for positioning, creates connectors, and renders cards - to inform our implementation

---

## Executive Summary

`family-chart` is a sophisticated family tree visualization library that:
1. **Uses d3.tree()** for hierarchical layout calculations
2. **Creates connector paths** using custom link generation functions
3. **Renders cards** using d3's data-binding pattern with SVG or HTML

We can borrow the core concepts and adapt them for our TNG-style pedigree chart with Konva.js rendering.

---

## 1. D3.js Positioning System

### 1.1 Core Layout Algorithm (`calculate-tree.ts`)

**What it does:**
- Uses `d3.tree()` to calculate x,y positions for all nodes
- Handles both **ancestry** (parents) and **progeny** (children) sides separately
- Merges both sides into a unified tree structure
- Adjusts positions for spouses, siblings, and special cases

**Key Functions:**

#### `calculateTreePositions(datum, 'children' | 'parents', is_ancestry)`
- Creates a d3 hierarchy from the data
- Applies `d3.tree()` layout algorithm
- Returns array of positioned nodes with `x`, `y` coordinates

**How d3.tree() works:**
```typescript
const d3_tree = d3.tree<Datum>()
  .nodeSize([node_separation, level_separation])
  .separation(separation)

const root = d3.hierarchy<Datum>(datum, hierarchyGetter)
d3_tree(root)  // This calculates x,y positions
const tree = root.descendants()  // Get all nodes with positions
```

**What we can borrow:**
- ✅ Use `d3.hierarchy()` to build tree structure
- ✅ Use `d3.tree()` with `.nodeSize()` and `.separation()` for positioning
- ✅ Custom `separation()` function to control spacing
- ✅ Custom `hierarchyGetter` to define parent-child relationships

**What we need to adapt:**
- TNG uses **slot-based numbering** (1, 2, 3, 4...) instead of d3's automatic positioning
- TNG has **fixed generation-based positioning** (each generation at fixed x offset)
- We may need to **post-process** d3 positions to match TNG's slot system

### 1.2 Position Calculation Details

**Node Separation:**
- `node_separation`: Horizontal spacing between nodes (default: 250px)
- `level_separation`: Vertical spacing between generations (default: 150px)

**Separation Function:**
```typescript
function separation(a, b) {
  let offset = 1;
  if (!is_ancestry) {
    if (!sameParent(a, b)) offset += 0.25
    if (someSpouses(a, b)) offset += offsetOnPartners(a, b)
    if (sameParent(a, b) && !sameBothParents(a, b)) offset += 0.125
  }
  return offset
}
```

**What this does:**
- Adjusts spacing based on relationships
- Prevents overlaps
- Accounts for spouses and siblings

**For TNG-style pedigree:**
- We need **fixed spacing** per generation
- Each generation has predictable positions
- May not need complex separation logic

### 1.3 Merging Ancestry and Progeny

**Process:**
1. Calculate ancestry tree (parents) separately
2. Calculate progeny tree (children) separately
3. `levelOutEachSide()` - adjusts x positions to align
4. `mergeSides()` - combines both trees
5. `setupSpouses()` - positions spouses horizontally
6. `nodePositioning()` - final position adjustments

**What we can borrow:**
- Concept of calculating ancestry/progeny separately
- Merging logic
- Spouse positioning logic

**What's different for TNG:**
- TNG pedigree shows **only ancestry** (no descendants)
- Simpler structure: one root person, parents above, grandparents above that
- No need to merge two sides

### 1.4 Spouse Positioning

**How it works:**
```typescript
function setupSpouses(tree, node_separation) {
  // For each node with spouses
  const side = d.data.gender === "M" ? -1 : 1  // Female on right
  d.x += spouses.length/2 * node_separation * side
  
  spouses.forEach((sp_id, i) => {
    spouse.x = d.x - (node_separation * (i+1)) * side
    spouse.y = d.y  // Same generation level
  })
}
```

**What we can borrow:**
- Spouse positioning relative to main person
- Gender-based side assignment
- Multiple spouse handling

**For TNG:**
- TNG pedigree shows parents as a **pair** (father + mother)
- They're positioned together, not separately
- Connectors create T-junction between them

---

## 2. Connector Generation (`create-links.ts`)

### 2.1 Link Data Structure

**Link Interface:**
```typescript
interface Link {
  d: [number, number][]  // Path coordinates
  _d: () => [number, number][]  // Initial/hidden path
  curve: boolean  // Use curved or straight lines
  id: string  // Unique identifier
  depth: number
  is_ancestry: boolean
  source: TreeDatum | TreeDatum[]
  target: TreeDatum | TreeDatum[]
  spouse?: boolean
}
```

**What we can borrow:**
- Link data structure with path coordinates
- Separate initial/hidden paths for animations
- Curve vs. straight line flag

### 2.2 Link Creation Process

**Main Function: `createLinks(d: TreeDatum)`**

**Three types of links:**

#### A. Ancestry Links (Child → Parents)
```typescript
function handleAncestrySide(d) {
  const p1 = d.parents[0]
  const p2 = d.parents[1] || p1
  const p = {x: getMid(p1, p2, 'x'), y: getMid(p1, p2, 'y')}
  
  links.push({
    d: Link(d, p),  // Path from child to parent midpoint
    curve: true,
    source: d,
    target: [p1, p2]
  })
}
```

**What this does:**
- Finds midpoint between two parents
- Creates path from child to midpoint
- Uses curved line

**For TNG:**
- This is **exactly** what we need for T-junction connectors!
- Child connects to midpoint between father and mother
- Then horizontal line connects father and mother

#### B. Progeny Links (Parents → Child)
```typescript
function handleProgenySide(d) {
  d.children.forEach((child) => {
    const other_parent = otherParent(child, d) || d
    const parent_pos = {x: other_parent.sx, y: d.y}
    
    links.push({
      d: Link(child, parent_pos),
      curve: true,
      source: [d, other_parent],
      target: child
    })
  })
}
```

**What this does:**
- Connects from parent(s) to child
- Uses `sx` (spouse x position) for positioning
- Creates curved path

**For TNG:**
- Similar concept but simpler
- One child connects to parent pair midpoint

#### C. Spouse Links (Horizontal)
```typescript
function createSpouseLink(d, spouse) {
  return {
    d: [[d.x, d.y], [spouse.x, spouse.y]],
    curve: false,  // Straight line
    spouse: true
  }
}
```

**What this does:**
- Simple horizontal line between spouses
- No curve

**For TNG:**
- This is the **horizontal part** of the T-junction
- Connects father and mother horizontally

### 2.3 Path Generation Functions

**LinkVertical (for vertical trees):**
```typescript
function LinkVertical(d, p) {
  const hy = (d.y + (p.y - d.y) / 2)  // Midpoint y
  return [
    [d.x, d.y],      // Start at child
    [d.x, hy],       // Go up to midpoint
    [d.x, hy],       // (duplicate for curve)
    [p.x, hy],       // Go horizontal to parent midpoint
    [p.x, hy],       // (duplicate for curve)
    [p.x, p.y],      // Go up to parent
  ]
}
```

**What this creates:**
- L-shaped path: vertical, then horizontal, then vertical
- Perfect for T-junction style!

**LinkHorizontal (for horizontal trees):**
```typescript
function LinkHorizontal(d, p) {
  const hx = (d.x + (p.x - d.x) / 2)  // Midpoint x
  return [
    [d.x, d.y],      // Start
    [hx, d.y],       // Go right to midpoint
    [hx, d.y],       // (duplicate)
    [hx, p.y],       // Go down to parent level
    [hx, p.y],       // (duplicate)
    [p.x, p.y],      // Go right to parent
  ]
}
```

**What we can borrow:**
- ✅ Path point calculation logic
- ✅ L-shaped connector pattern
- ✅ Midpoint calculation for T-junctions

**For TNG:**
- TNG uses **three separate line segments**:
  1. Left horizontal (from box to junction)
  2. Vertical (from junction up/down)
  3. Right horizontal (from junction to parent midpoint)
- We can adapt the path generation to match TNG's exact style

### 2.4 Rendering Links (`view-links.ts`)

**How links are rendered:**
```typescript
function updateLinks(svg, tree, props) {
  // Collect all links
  const links_data = tree.data.reduce((acc, d) => {
    createLinks(d, tree.is_horizontal).forEach(l => acc[l.id] = l)
    return acc
  }, {})
  
  // Use d3 data binding
  const link = d3.select(svg)
    .select(".links_view")
    .selectAll("path.link")
    .data(links_data)
  
  // Enter/update/exit pattern
  link.enter().append("path")
  link.attr("d", createPath(d))
  link.exit().remove()
}

function createPath(d: Link) {
  const line = d3.line().curve(d3.curveMonotoneY)
  const lineCurve = d3.line().curve(d3.curveBasis)
  
  if (!d.curve) return line(d.d)  // Straight
  else return lineCurve(d.d)      // Curved
}
```

**What we can borrow:**
- ✅ Link collection logic
- ✅ Path string generation
- ✅ Curve application

**What we need to adapt:**
- Instead of SVG `<path>` elements, we'll use **Konva.js Line objects**
- Konva uses different path format (array of points, not SVG path string)
- We'll need to convert path coordinates to Konva Line points

---

## 3. Card Creation and Rendering

### 3.1 Card Data Structure

**TreeDatum (positioned node):**
```typescript
interface TreeDatum {
  data: Datum  // Original person data
  x: number    // Calculated x position
  y: number    // Calculated y position
  depth: number // Generation level
  parents?: TreeDatum[]
  children?: TreeDatum[]
  spouses?: TreeDatum[]
  // ... other properties
}
```

**What we can borrow:**
- Node data structure with positions
- Relationship references (parents, children, spouses)

### 3.2 Card Rendering (`view-cards-svg.ts`)

**How cards are rendered:**
```typescript
function updateCardsSvg(svg, tree, Card, props) {
  // d3 data binding pattern
  const card = d3.select(svg)
    .select(".cards_view")
    .selectAll("g.card_cont")
    .data(tree.data, d => d.data.id)
  
  // Enter: new cards
  const card_enter = card.enter()
    .append("g")
    .attr("class", "card_cont")
    .attr("transform", `translate(${d._x}, ${d._y})`)
    .style("opacity", 0)
  
  // Update: existing cards
  card.transition()
    .attr("transform", `translate(${d.x}, ${d.y})`)
    .style("opacity", 1)
  
  // Exit: removed cards
  card.exit()
    .transition()
    .style("opacity", 0)
    .remove()
  
  // Call Card function to render card content
  Card.call(this, d)
}
```

**What we can borrow:**
- ✅ Enter/update/exit pattern for animations
- ✅ Position-based rendering
- ✅ Transition animations

**What we need to adapt:**
- Instead of SVG `<g>` elements, we'll use **Konva Groups**
- Konva uses `x`, `y` properties, not `transform`
- Konva animations use different API

### 3.3 Card Component (`card-svg.ts`)

**Card creation function:**
```typescript
function CardSvg(d: TreeDatum) {
  // Create SVG group
  const card = d3.create('svg:g')
    .attr('class', `card ${gender_class}`)
    .attr('transform', `translate(${[-card_dim.w/2, -card_dim.h/2]})`)
  
  // Add card inner container
  card.append('g')
    .attr('class', 'card-inner')
    .attr('clip-path', 'url(#card_clip)')
  
  // Add card outline
  appendTemplate(CardBodyOutline({d, card_dim}).template, card.node())
  
  // Add card content (name, dates, etc.)
  appendTemplate(CardBody({d, card_dim, card_display}).template, card.node())
  
  // Add image if available
  if (props.img) appendElement(cardElements.cardImage(d, props), card.node())
  
  // Add click handler
  card.on("click", function(e) {
    props.onCardClick.call(this, e, d)
  })
}
```

**Card structure:**
- **Outer group**: Positioned at (x, y)
- **Inner group**: Clipped to card dimensions
- **Outline**: Border/shadow
- **Content**: Name, dates, image
- **Interactive**: Click handlers

**What we can borrow:**
- ✅ Card structure (outline, content, image)
- ✅ Dimension calculations
- ✅ Click handlers
- ✅ Gender-based styling

**What we need to adapt:**
- Instead of SVG groups, use **Konva Groups**
- Instead of SVG `<rect>`, use **Konva Rect**
- Instead of SVG `<text>`, use **Konva Text**
- Instead of SVG `<image>`, use **Konva Image**
- Clip paths work differently in Konva

### 3.4 Card Templates

**CardBodyOutline:**
- Creates rounded rectangle border
- Adds shadow effect
- Sets background color

**CardBody:**
- Renders person name
- Renders dates (birth, death)
- Renders places
- Applies text styling

**CardImage:**
- Renders person photo
- Falls back to gender icon if no photo
- Applies clipping mask

**What we can borrow:**
- ✅ Card layout structure
- ✅ Content organization
- ✅ Fallback logic (photo → icon)

**What we need to adapt:**
- Konva uses different shape APIs
- Text rendering is different
- Image loading is different

---

## 4. Integration Architecture

### 4.1 Data Flow

**family-chart flow:**
1. **Raw Data** → `calculateTree()` → **Tree with positions**
2. **Tree** → `createLinks()` → **Link data**
3. **Tree + Links** → `view()` → **SVG rendering**
4. **SVG** → d3 updates → **Animated transitions**

**Our adapted flow:**
1. **Raw Data** → `calculateTree()` (borrowed) → **Tree with positions**
2. **Tree** → `createLinks()` (borrowed) → **Link data**
3. **Tree + Links** → **Konva Renderer** → **Canvas rendering**
4. **Canvas** → Konva animations → **Animated transitions**

### 4.2 Key Adaptations Needed

#### A. Position Calculation
- ✅ **Keep:** d3.tree() for initial positioning
- ⚠️ **Adapt:** Post-process to match TNG slot system (if needed)
- ⚠️ **Adapt:** Fixed generation-based x positions

#### B. Connector Generation
- ✅ **Keep:** Link path calculation logic
- ✅ **Keep:** T-junction midpoint calculation
- ⚠️ **Adapt:** Convert to Konva Line format (array of points)
- ⚠️ **Adapt:** Match TNG's three-segment connector style

#### C. Card Rendering
- ✅ **Keep:** Card structure and layout
- ✅ **Keep:** Content organization
- ⚠️ **Adapt:** SVG → Konva shape conversion
- ⚠️ **Adapt:** d3 data binding → Konva object management

### 4.3 Rendering Strategy

**Option 1: Pure Konva (Recommended)**
- Use d3 for calculations only
- Render everything with Konva
- Pros: Better performance, easier to style
- Cons: Need to rewrite rendering code

**Option 2: Hybrid (d3 + Konva)**
- Use d3 for SVG rendering
- Convert SVG to canvas
- Pros: Less code to rewrite
- Cons: Performance overhead, harder to customize

**Recommendation: Option 1**
- Use d3.js **only** for tree layout calculations
- Use Konva.js **only** for rendering
- Clean separation of concerns

---

## 5. Implementation Plan

### 5.1 Phase 1: Position Calculation
1. **Borrow:** `calculateTree()` function structure
2. **Adapt:** For TNG pedigree (ancestry only, slot-based)
3. **Output:** Tree with x,y positions

### 5.2 Phase 2: Connector Generation
1. **Borrow:** `createLinks()` function
2. **Borrow:** `LinkVertical()` path calculation
3. **Adapt:** Convert to Konva Line format
4. **Adapt:** Match TNG's three-segment style

### 5.3 Phase 3: Card Rendering
1. **Borrow:** Card structure and layout
2. **Adapt:** SVG → Konva conversion
3. **Implement:** Card content (name, dates, image)
4. **Implement:** Click handlers and interactions

### 5.4 Phase 4: Integration
1. **Combine:** Position + Connectors + Cards
2. **Implement:** Konva Stage and Layers
3. **Implement:** Zoom/pan interactions
4. **Implement:** Animations

---

## 6. Key Takeaways

### What to Borrow from family-chart:
1. ✅ **d3.tree() layout algorithm** - Excellent for tree positioning
2. ✅ **Link path calculation** - Perfect for T-junction connectors
3. ✅ **Card structure** - Good organization and layout
4. ✅ **Data flow patterns** - Clean separation of concerns

### What to Adapt:
1. ⚠️ **Rendering system** - SVG → Konva conversion
2. ⚠️ **Position system** - May need TNG slot-based adjustments
3. ⚠️ **Connector style** - Match TNG's exact three-segment style
4. ⚠️ **Animation system** - d3 transitions → Konva animations

### What's Different for TNG:
1. **Pedigree only** - No descendants, simpler structure
2. **Fixed layout** - Generation-based positioning
3. **T-junction connectors** - Specific three-segment style
4. **Slot numbering** - Binary tree slot system (1, 2, 3, 4...)

---

## 7. Code Examples (Conceptual)

### 7.1 Position Calculation (Borrowed)
```typescript
// From family-chart
const d3_tree = d3.tree<Datum>()
  .nodeSize([node_separation, level_separation])
  .separation(separation)

const root = d3.hierarchy<Datum>(datum, hierarchyGetter)
d3_tree(root)
const tree = root.descendants()  // Has x, y positions
```

### 7.2 Connector Generation (Borrowed + Adapted)
```typescript
// Borrowed: Path calculation
function createTjunctionConnector(child, father, mother) {
  const midpoint = {
    x: (father.x + mother.x) / 2,
    y: (father.y + mother.y) / 2
  }
  
  // Adapted: Konva Line format
  return [
    {x: child.x, y: child.y},           // Start at child
    {x: child.x, y: midpoint.y},        // Vertical to junction
    {x: midpoint.x, y: midpoint.y},      // Horizontal to midpoint
    {x: father.x, y: midpoint.y},        // Horizontal to father
    {x: father.x, y: father.y},          // Vertical to father
    {x: mother.x, y: midpoint.y},        // Horizontal to mother
    {x: mother.x, y: mother.y}          // Vertical to mother
  ]
}
```

### 7.3 Card Rendering (Adapted)
```typescript
// Adapted: Konva Group instead of SVG g
function createCard(d: TreeDatum) {
  const group = new Konva.Group({
    x: d.x,
    y: d.y
  })
  
  // Card outline
  const rect = new Konva.Rect({
    width: card_dim.w,
    height: card_dim.h,
    fill: cardColor(d),
    stroke: 'black',
    strokeWidth: 2
  })
  
  // Card text
  const text = new Konva.Text({
    text: d.data.name,
    fontSize: 12,
    fill: 'black'
  })
  
  group.add(rect)
  group.add(text)
  return group
}
```

---

## Conclusion

`family-chart` provides an excellent foundation for our implementation:

1. **d3.js positioning** - We can use the same layout algorithm
2. **Connector generation** - The link creation logic is perfect for T-junctions
3. **Card structure** - The card organization is well-designed

The main adaptation needed is **rendering system conversion** from SVG (d3) to Canvas (Konva), which is straightforward since we're only borrowing the **calculation logic**, not the rendering code.

We can create a clean implementation that:
- Uses d3.js for **positioning calculations**
- Uses Konva.js for **rendering**
- Matches TNG's **pedigree style** exactly

