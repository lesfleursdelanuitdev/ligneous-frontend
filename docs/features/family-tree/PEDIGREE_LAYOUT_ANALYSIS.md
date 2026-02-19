# Pedigree Chart Layout Analysis

**Date:** 2026-01-23  
**Purpose:** Analyze `pedigree.php` layout algorithm and determine how to recreate it using Konva.js and d3.js

---

## Executive Summary

The `pedigree.php` file uses a **mathematically precise positioning system** based on:
- **Slot-based numbering** (binary tree structure)
- **Generation-based calculations** (powers of 2)
- **Absolute positioning** with complex vertical/horizontal offset math
- **Connector lines** that connect parent-child relationships

To recreate this in the frontend, we need to:
1. **Replicate the mathematical positioning algorithm**
2. **Render boxes** (person cards) at calculated positions
3. **Draw connector lines** between related boxes
4. **Handle popups/interactions** for additional information

---

## 1. Understanding the TNG Pedigree Layout Algorithm

### 1.1 Slot-Based Numbering System

The pedigree uses a **binary tree slot system**:

```
Generation 1: Slot 1 (root person)
Generation 2: Slot 2 (father), Slot 3 (mother)
Generation 3: Slot 4 (paternal grandfather), Slot 5 (paternal grandmother), Slot 6 (maternal grandfather), Slot 7 (maternal grandmother)
Generation 4: Slots 8-15
...and so on
```

**Formula:**
- Father of slot `n` = slot `n * 2`
- Mother of slot `n` = slot `n * 2 + 1`
- Maximum slots = `2^generations`

**Example (3 generations):**
- Slot 1 → Person
- Slot 2 → Father (1 * 2)
- Slot 3 → Mother (1 * 2 + 1)
- Slot 4 → Paternal Grandfather (2 * 2)
- Slot 5 → Paternal Grandmother (2 * 2 + 1)
- Slot 6 → Maternal Grandfather (3 * 2)
- Slot 7 → Maternal Grandmother (3 * 2 + 1)

### 1.2 Horizontal Positioning

**Formula from `pedigree.php` (line 268):**
```php
$offsetH = $pedigree['leftindent'] + ( $generation - 1 ) * ( $pedigree['boxwidth'] + $pedigree['boxHsep'] );
```

**Translation:**
- Generation 1: `leftIndent` pixels from left
- Generation 2: `leftIndent + (boxWidth + boxHsep)` pixels
- Generation 3: `leftIndent + 2 * (boxWidth + boxHsep)` pixels
- etc.

**Key Points:**
- Each generation is offset to the **right** by a fixed amount
- All boxes in the same generation have the **same horizontal position**
- Horizontal spacing is constant between generations

### 1.3 Vertical Positioning (Complex Math)

This is the most complex part. The algorithm ensures that:
1. Boxes in each generation are evenly spaced vertically
2. Parent boxes align properly with their children
3. The entire tree fits within a calculated maximum height

**Step 1: Calculate Maximum Height (line 209)**
```php
$pedigree['maxheight'] = pow( 2, ( $generations - 1 ) ) * ( 
    ( $pedigree['boxheight'] + ( $pedigree['boxheightshift'] * ( $generations - 1 ) ) ) + 
    $pedigree['boxVsep'] 
);
```

**Translation:**
- `maxHeight = 2^(generations - 1) * (boxHeight + boxHeightShift * (generations - 1) + boxVsep)`
- This calculates the total vertical space needed for the **last generation**
- Accounts for box shrinking (`boxHeightShift`)

**Step 2: Calculate Vertical Separation (line 274)**
```php
$sepV = intval ( $pedigree['maxheight'] - ( pow( 2, ( $generation - 1 ) ) * $boxheighttouse ) ) / pow( 2, ( $generation - 1 ) ) ;
```

**Translation:**
- `sepV = (maxHeight - (2^(generation - 1) * boxHeight)) / 2^(generation - 1)`
- This calculates the **vertical spacing between boxes** in the current generation
- Ensures proper alignment with child boxes

**Step 3: Calculate Base Vertical Offset (line 278)**
```php
$offsetV = ( $pedigree['maxheight'] - $pedigree['boxVsep'] - ( pow( 2, ( $generation - 1 ) ) * ( $boxheighttouse + $sepV ) - $sepV ) ) / 2;
```

**Translation:**
- Calculates the **starting vertical position** for the first box in this generation
- Centers the generation vertically within the available space

**Step 4: Calculate Final Vertical Position (line 282)**
```php
$offsetV = intval ( $pedigree['borderwidth'] + ( $slot - pow( 2, ( $generation - 1 ) ) ) * ( $boxheighttouse + $sepV ) + $offsetV ) ;
```

**Translation:**
- `offsetV = borderWidth + (slot - 2^(generation - 1)) * (boxHeight + sepV) + baseOffset`
- This positions the **specific box** based on its slot number
- Linear equation: each slot is offset by `(boxHeight + sepV)` pixels

**Example (3 generations, slot 2 = father):**
- Generation 2, slot 2
- `baseOffset = (maxHeight - boxVsep - (2^1 * (boxHeight + sepV) - sepV)) / 2`
- `finalOffset = borderWidth + (2 - 2^1) * (boxHeight + sepV) + baseOffset`
- `finalOffset = borderWidth + 0 * (boxHeight + sepV) + baseOffset`
- So slot 2 is at the top of generation 2

### 1.4 Box Properties

**Box Height (line 260):**
- Shrinks by generation: `boxHeight + (boxHeightShift * (generation - 1))`
- Generation 1: full height
- Generation 2: slightly smaller
- Generation 3: even smaller
- etc.

**Box Color (line 288):**
- Shifts by generation: `getColor(generation - 1)`
- Each generation gets a slightly different shade
- Can shift toward white or black

**Font Size (lines 295-300):**
- Names: `boxNameSize + (generation - 1) * nameSizeShift`
- Dates: `boxDateSize + (generation - 1) * dateSizeShift`
- Minimum: 7pt

### 1.5 Connector Lines

The pedigree draws **three types of connector lines**:

**1. Left Horizontal Line (line 353):**
- Connects box to parent junction point
- Only for generation > 1
- Position: `(offsetH - halfHorzSep, vertBoxStart)`
- Size: `(halfHorzSep + 2, lineWidth)`

**2. Right Horizontal Line (line 358):**
- Connects box to child junction point
- Only for generation < max generations
- Position: `(offsetH + boxWidth, vertBoxStart)`
- Size: `(halfHorzSep + 1, lineWidth)`

**3. Vertical Line (lines 362-369):**
- Connects parent pair to child
- Different for father (slot % 2 == 0) vs mother (slot % 2 != 0)
- **Father:** Line goes **down** from junction
- **Mother:** Line goes **up** from junction
- Position and height calculated based on `sepV` and `boxHeight`

**Junction Point:**
- Vertical center of box: `offsetV + boxHeight / 2`
- Horizontal: `offsetH - halfHorzSep` (left) or `offsetH + boxWidth` (right)

---

## 2. Recreating with Konva.js

### 2.1 Why Konva.js?

**Konva.js Advantages:**
- ✅ **Canvas-based rendering** - Fast, scalable
- ✅ **Object-oriented API** - Easy to manipulate individual boxes/lines
- ✅ **Built-in transformations** - Scaling, rotation, etc.
- ✅ **Event handling** - Click, hover, drag
- ✅ **Layering** - Z-index management
- ✅ **Performance** - Good for many objects

**Best For:**
- Rendering boxes (Rect + Text)
- Drawing connector lines (Line)
- Handling interactions (onClick, onMouseEnter)
- Managing the entire canvas

### 2.2 Konva.js Implementation Strategy

**Structure:**
```
Stage (container)
  └── Layer (main layer)
      ├── Group (connector lines) - rendered first
      │   ├── Line (horizontal connectors)
      │   └── Line (vertical connectors)
      └── Group (person boxes) - rendered on top
          ├── Rect (box background)
          ├── Text (name)
          ├── Text (dates - optional)
          └── Circle (photo placeholder)
```

**Positioning Algorithm:**
1. **Pre-calculate all positions** using the PHP formulas
2. **Create a data structure** mapping slots to positions:
   ```javascript
   const positions = {
     1: { x: leftIndent, y: calculatedY, generation: 1, slot: 1 },
     2: { x: leftIndent + boxWidth + boxHsep, y: calculatedY, generation: 2, slot: 2 },
     // ... etc
   };
   ```

3. **Render in two passes:**
   - **Pass 1:** Draw all connector lines (behind boxes)
   - **Pass 2:** Draw all boxes (on top)

**Box Rendering:**
```javascript
// For each slot
const box = new Konva.Group({
  x: positions[slot].x,
  y: positions[slot].y,
});

// Background
const rect = new Konva.Rect({
  width: boxWidth,
  height: boxHeight,
  fill: getColor(generation),
  stroke: borderColor,
  strokeWidth: borderWidth,
  shadowBlur: shadowOffset,
  shadowColor: shadowColor,
  cornerRadius: rounded ? 4 : 0,
});

// Name text
const nameText = new Konva.Text({
  text: person.name,
  fontSize: nameFontSize,
  fontFamily: 'Arial',
  fill: textColor,
  align: boxAlign,
  padding: cellPad,
});

box.add(rect);
box.add(nameText);
layer.add(box);
```

**Connector Lines:**
```javascript
// Horizontal line (left side, connecting to parent)
if (generation > 1) {
  const hLine = new Konva.Line({
    points: [
      offsetH - halfHorzSep, vertBoxStart,
      offsetH, vertBoxStart
    ],
    stroke: borderColor,
    strokeWidth: lineWidth,
  });
  connectorLayer.add(hLine);
}

// Vertical line (connecting parent pair to child)
if (generation > 1) {
  if (slot % 2 === 0) {
    // Father - line goes down
    const vLine = new Konva.Line({
      points: [
        offsetH - halfHorzSep, vertBoxStart,
        offsetH - halfHorzSep, vertBoxStart + (sepV + boxHeight) / 2
      ],
      stroke: borderColor,
      strokeWidth: lineWidth,
    });
  } else {
    // Mother - line goes up
    const vLine = new Konva.Line({
      points: [
        offsetH - halfHorzSep, vertBoxStart - (sepV + boxHeight) / 2,
        offsetH - halfHorzSep, vertBoxStart
      ],
      stroke: borderColor,
      strokeWidth: lineWidth,
    });
  }
}
```

**Advantages of Konva.js Approach:**
- ✅ Precise pixel-level control
- ✅ Matches PHP positioning exactly
- ✅ Easy to add interactions (hover, click)
- ✅ Can add animations/transitions
- ✅ Good performance for static charts

---

## 3. Recreating with d3.js

### 3.1 Why d3.js?

**d3.js Advantages:**
- ✅ **Data-driven** - Bind data to DOM/canvas elements
- ✅ **Powerful layouts** - Tree, force, etc. (though we won't use these)
- ✅ **SVG rendering** - Vector graphics, scalable
- ✅ **Transitions** - Smooth animations
- ✅ **Selections** - Powerful element manipulation

**Best For:**
- Data binding and transformation
- SVG rendering (if preferred over canvas)
- Complex data transformations
- Animations and transitions

### 3.2 d3.js Implementation Strategy

**Structure:**
```javascript
// Create SVG container
const svg = d3.select('#pedigree-container')
  .append('svg')
  .attr('width', maxWidth)
  .attr('height', maxHeight);

// Create groups for organization
const connectorGroup = svg.append('g').attr('class', 'connectors');
const boxGroup = svg.append('g').attr('class', 'boxes');
```

**Data Binding:**
```javascript
// Prepare data array
const pedigreeData = [
  { slot: 1, generation: 1, person: {...}, x: calculatedX, y: calculatedY },
  { slot: 2, generation: 2, person: {...}, x: calculatedX, y: calculatedY },
  // ... etc
];

// Bind and render boxes
const boxes = boxGroup.selectAll('.person-box')
  .data(pedigreeData)
  .enter()
  .append('g')
  .attr('class', 'person-box')
  .attr('transform', d => `translate(${d.x}, ${d.y})`);

// Add rectangle
boxes.append('rect')
  .attr('width', d => getBoxWidth(d.generation))
  .attr('height', d => getBoxHeight(d.generation))
  .attr('fill', d => getColor(d.generation))
  .attr('stroke', borderColor)
  .attr('stroke-width', borderWidth);

// Add text
boxes.append('text')
  .attr('x', cellPad)
  .attr('y', cellPad + fontSize)
  .attr('font-size', d => getNameFontSize(d.generation))
  .text(d => d.person.name);
```

**Connector Lines:**
```javascript
// Calculate connector data
const connectors = calculateConnectors(pedigreeData);

// Draw horizontal lines
connectorGroup.selectAll('.h-line')
  .data(connectors.horizontal)
  .enter()
  .append('line')
  .attr('x1', d => d.x1)
  .attr('y1', d => d.y1)
  .attr('x2', d => d.x2)
  .attr('y2', d => d.y2)
  .attr('stroke', borderColor)
  .attr('stroke-width', lineWidth);

// Draw vertical lines
connectorGroup.selectAll('.v-line')
  .data(connectors.vertical)
  .enter()
  .append('line')
  .attr('x1', d => d.x1)
  .attr('y1', d => d.y1)
  .attr('x2', d => d.x2)
  .attr('y2', d => d.y2)
  .attr('stroke', borderColor)
  .attr('stroke-width', lineWidth);
```

**Advantages of d3.js Approach:**
- ✅ Data-driven (easier to update when data changes)
- ✅ SVG (scalable, can be exported)
- ✅ Powerful selection API
- ✅ Built-in transitions
- ⚠️ More complex for precise pixel positioning
- ⚠️ SVG can be slower than canvas for many elements

---

## 4. Hybrid Approach (Recommended)

### 4.1 Why Hybrid?

**Best of Both Worlds:**
- **d3.js** for data transformation and calculations
- **Konva.js** for precise rendering and interactions

### 4.2 Implementation Strategy

**Step 1: Use d3.js for Data Preparation**
```javascript
// Transform tree data into slot-based structure
function buildPedigreeData(rootPerson, generations) {
  const data = [];
  let slot = 1;
  
  function traverse(person, generation, slot) {
    if (generation > generations) return;
    
    // Calculate position using PHP formulas
    const x = calculateX(generation);
    const y = calculateY(generation, slot);
    
    data.push({
      slot,
      generation,
      person,
      x,
      y,
      boxWidth: getBoxWidth(generation),
      boxHeight: getBoxHeight(generation),
      color: getColor(generation),
    });
    
    // Recurse to parents
    if (person.father) {
      traverse(person.father, generation + 1, slot * 2);
    }
    if (person.mother) {
      traverse(person.mother, generation + 1, slot * 2 + 1);
    }
  }
  
  traverse(rootPerson, 1, 1);
  return data;
}
```

**Step 2: Use Konva.js for Rendering**
```javascript
// Use the data from d3.js to render with Konva.js
function renderPedigree(pedigreeData) {
  const stage = new Konva.Stage({
    container: 'pedigree-container',
    width: maxWidth,
    height: maxHeight,
  });
  
  const connectorLayer = new Konva.Layer();
  const boxLayer = new Konva.Layer();
  
  // Render connectors first
  renderConnectors(connectorLayer, pedigreeData);
  
  // Render boxes on top
  renderBoxes(boxLayer, pedigreeData);
  
  stage.add(connectorLayer);
  stage.add(boxLayer);
}
```

---

## 5. Key Mathematical Formulas to Replicate

### 5.1 Position Calculations

**Horizontal Position:**
```javascript
function calculateX(generation) {
  return leftIndent + (generation - 1) * (boxWidth + boxHsep);
}
```

**Vertical Position:**
```javascript
function calculateY(generation, slot) {
  // Step 1: Calculate max height
  const maxHeight = Math.pow(2, generations - 1) * (
    boxHeight + (boxHeightShift * (generations - 1)) + boxVsep
  );
  
  // Step 2: Calculate box height for this generation
  const boxHeightForGen = boxHeight + (boxHeightShift * (generation - 1));
  
  // Step 3: Calculate vertical separation
  const sepV = Math.floor(
    (maxHeight - (Math.pow(2, generation - 1) * boxHeightForGen)) / 
    Math.pow(2, generation - 1)
  );
  
  // Step 4: Calculate base offset
  const baseOffset = (
    maxHeight - boxVsep - 
    (Math.pow(2, generation - 1) * (boxHeightForGen + sepV) - sepV)
  ) / 2;
  
  // Step 5: Calculate final position
  return Math.floor(
    borderWidth + 
    (slot - Math.pow(2, generation - 1)) * (boxHeightForGen + sepV) + 
    baseOffset
  );
}
```

### 5.2 Connector Line Calculations

**Horizontal Line (Left):**
```javascript
function getLeftHorizontalLine(slot, generation, x, y, boxHeight) {
  if (generation === 1) return null;
  
  const vertBoxStart = y + Math.floor(boxHeight / 2) - Math.floor(lineWidth / 2);
  const halfHorzSep = Math.floor(boxHsep / 2);
  
  return {
    x1: x - halfHorzSep,
    y1: vertBoxStart,
    x2: x,
    y2: vertBoxStart,
  };
}
```

**Horizontal Line (Right):**
```javascript
function getRightHorizontalLine(slot, generation, x, y, boxHeight, boxWidth) {
  if (generation === maxGenerations) return null;
  
  const vertBoxStart = y + Math.floor(boxHeight / 2) - Math.floor(lineWidth / 2);
  const halfHorzSep = Math.floor(boxHsep / 2);
  
  return {
    x1: x + boxWidth,
    y1: vertBoxStart,
    x2: x + boxWidth + halfHorzSep + 1,
    y2: vertBoxStart,
  };
}
```

**Vertical Line:**
```javascript
function getVerticalLine(slot, generation, x, y, boxHeight, sepV) {
  if (generation === 1) return null;
  
  const vertBoxStart = y + Math.floor(boxHeight / 2) - Math.floor(lineWidth / 2);
  const halfHorzSep = Math.floor(boxHsep / 2);
  
  if (slot % 2 === 0) {
    // Father - line goes down
    return {
      x1: x - halfHorzSep,
      y1: vertBoxStart,
      x2: x - halfHorzSep,
      y2: vertBoxStart + Math.floor((sepV + boxHeight) / 2),
    };
  } else {
    // Mother - line goes up
    return {
      x1: x - halfHorzSep,
      y1: vertBoxStart - Math.floor((sepV + boxHeight) / 2),
      x2: x - halfHorzSep,
      y2: vertBoxStart,
    };
  }
}
```

---

## 6. Configuration Parameters (from pedconfig.php)

These need to be replicated as constants or configuration:

```javascript
const PEDIGREE_CONFIG = {
  // Box dimensions
  boxWidth: 120,
  boxHeight: 60,
  boxHeightShift: -2,  // How much box shrinks per generation
  boxHsep: 20,         // Horizontal separation between generations
  boxVsep: 10,         // Vertical separation (base)
  
  // Positioning
  leftIndent: 50,
  borderWidth: 2,
  
  // Colors
  boxColor: '#E8E8E8',
  borderColor: '#000000',
  shadowColor: '#888888',
  shadowOffset: 2,
  colorShift: 5,       // Percentage color shift per generation
  
  // Typography
  boxNameSize: 9,
  nameSizeShift: -0.5,
  boxDateSize: 8,
  dateSizeShift: -0.3,
  
  // Connectors
  lineWidth: 2,
  
  // Display
  usePopups: true,
  cellPad: 5,
  boxAlign: 'left',
  rounded: false,
};
```

---

## 7. Implementation Recommendations

### 7.1 Library Choice

**Recommendation: Use Konva.js for the main rendering**

**Reasons:**
1. **Precise positioning** - Matches PHP's absolute positioning exactly
2. **Performance** - Canvas is faster than SVG for many elements
3. **Interactions** - Built-in event handling for hover/click
4. **Simplicity** - More straightforward for this use case

**d3.js can be used for:**
- Data transformation (tree → slot-based structure)
- Helper functions (color calculations, font size calculations)
- But **not** for the main rendering

### 7.2 File Structure

```
/apps/ligneous-frontend/app/test-pedigree/
  └── page.js                    # Public test page (no auth)
      └── Uses: PedigreeChart component

/apps/ligneous-frontend/components/
  └── pedigree/
      ├── PedigreeChart.js       # Main component
      ├── usePedigreeLayout.js   # Hook for position calculations
      ├── PedigreeBox.js         # Individual box component
      ├── PedigreeConnectors.js  # Connector lines
      └── pedigreeConfig.js      # Configuration constants
```

### 7.3 Data Structure

**Dummy Data Format:**
```javascript
const dummyData = {
  slot: 1,
  generation: 1,
  person: {
    xref: '@I001@',
    name: 'John Doe',
    birthDate: '1850',
    deathDate: '1920',
    sex: 'M',
  },
  father: {
    slot: 2,
    generation: 2,
    person: {
      xref: '@I002@',
      name: 'Father Doe',
      // ...
    },
    father: { /* ... */ },
    mother: { /* ... */ },
  },
  mother: {
    slot: 3,
    generation: 2,
    person: {
      xref: '@I003@',
      name: 'Mother Smith',
      // ...
    },
    father: { /* ... */ },
    mother: { /* ... */ },
  },
};
```

### 7.4 Rendering Flow

1. **Transform tree data** → slot-based flat array
2. **Calculate all positions** using PHP formulas
3. **Create Konva Stage** with calculated dimensions
4. **Render connectors** (lines) in first layer
5. **Render boxes** (rects + text) in second layer
6. **Add interactions** (hover, click for popups)

---

## 8. Key Challenges

### 8.1 Vertical Positioning Complexity

**Challenge:** The vertical positioning math is complex and interdependent.

**Solution:**
- Calculate `maxHeight` first (depends on all generations)
- Then calculate `sepV` for each generation (depends on maxHeight)
- Finally calculate individual box positions

**Order matters!** Must calculate in this sequence.

### 8.2 Connector Line Alignment

**Challenge:** Lines must connect exactly at box centers and junction points.

**Solution:**
- Calculate `vertBoxStart = y + boxHeight / 2 - lineWidth / 2`
- This gives the vertical center of the box
- Use this for all connector calculations

### 8.3 Box Shrinking

**Challenge:** Boxes shrink by generation, but connectors must still align.

**Solution:**
- Use `boxHeightForGen = boxHeight + (boxHeightShift * (generation - 1))`
- Use this calculated height for positioning, not the base height
- Account for shrinking in `sepV` calculation

### 8.4 Color Shifting

**Challenge:** Colors shift by generation, but must stay within RGB bounds.

**Solution:**
- Replicate `getColor()` function exactly
- Clamp RGB values to 0-255
- Handle positive/negative color shifts

---

## 9. Testing Strategy

### 9.1 Visual Comparison

1. **Generate test data** with known structure
2. **Render with PHP** (reference)
3. **Render with Konva.js** (implementation)
4. **Compare side-by-side** - boxes should align exactly

### 9.2 Mathematical Verification

1. **Calculate positions** for each slot
2. **Verify formulas** match PHP output
3. **Check connector endpoints** align with box centers
4. **Validate** that all boxes fit within calculated dimensions

### 9.3 Edge Cases

- **Single generation** (just root person)
- **Two generations** (root + parents)
- **Many generations** (6+ generations)
- **Missing parents** (some slots empty)
- **Different box sizes** (test shrinking)

---

## 10. Next Steps

1. **Install Konva.js** (if not already installed)
2. **Create test page** at `/app/test-pedigree/page.js`
3. **Implement position calculator** (replicate PHP math)
4. **Create dummy data** generator
5. **Implement box renderer** (Konva Rect + Text)
6. **Implement connector renderer** (Konva Lines)
7. **Add interactions** (hover, click)
8. **Test and refine** positioning

---

## 11. Conclusion

The TNG pedigree layout uses a **sophisticated mathematical positioning system** that can be exactly replicated in JavaScript. The key is:

1. **Understanding the slot-based numbering** (binary tree)
2. **Replicating the position calculations** (especially vertical)
3. **Using Konva.js for precise rendering** (canvas-based)
4. **Drawing connectors correctly** (aligning with box centers)

**Konva.js is the better choice** for this because:
- It matches PHP's absolute positioning approach
- Canvas rendering is fast and precise
- Built-in event handling for interactions
- Easier to match exact pixel positions

**d3.js can be useful** for:
- Data transformation helpers
- But not for the main rendering

The implementation should be **mathematically identical** to the PHP version to ensure visual consistency.

