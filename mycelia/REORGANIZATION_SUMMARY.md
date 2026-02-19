# Mycelia Facets Reorganization - Complete! ✅

## Overview
Reorganized GEDCOM facets into a dedicated subfolder with consistent naming and centralized exports.

## Changes Made

### 1. ✅ Created `facets/gedcom/` Subfolder
All GEDCOM-related facets are now organized under `mycelia/facets/gedcom/`

### 2. ✅ Renamed Facets for Consistency
- `useIndividuals` → **`useGedcomIndividuals`** (kind: `gedcomIndividuals`)
- `useFamilies` → **`useGedcomFamilies`** (kind: `gedcomFamilies`)
- All other facets already had the `Gedcom` prefix

### 3. ✅ Created Central Export (`index.js`)
All GEDCOM facets can now be imported from a single location:

```javascript
// Before (multiple imports from different files)
import { useGedcomFiles } from './facets/gedcom-files.js';
import { useIndividuals } from './facets/individuals.js';
import { useFamilies } from './facets/families.js';
import { useGedcomGraph } from './facets/gedcom-graph.js';
import { useGedcomDuplicates } from './facets/gedcom-duplicates.js';

// After (single import)
import {
  useGedcomFiles,
  useGedcomIndividuals,
  useGedcomFamilies,
  useGedcomGraph,
  useGedcomDuplicates
} from './facets/gedcom/index.js';
```

### 4. ✅ Updated System Builder
**File:** `system.builder.js`

**Changes:**
- Updated imports to use new `gedcom/index.js`
- Updated facet registration to use renamed facets
- Cleaner, more maintainable import structure

```javascript
import {
  useGedcomFiles,
  useGedcomIndividuals,
  useGedcomFamilies,
  useGedcomGraph,
  useGedcomDuplicates
} from './facets/gedcom/index.js';

// ...

.use(useGedcomFiles)
.use(useGedcomIndividuals)
.use(useGedcomFamilies)
.use(useGedcomGraph)
.use(useGedcomDuplicates)
```

### 5. ✅ Created Events Documentation
**File:** `EVENTS.md`

A comprehensive reference documenting:
- All events emitted by each facet
- Event naming conventions
- Event payload structures
- Usage examples with `useListener`
- Best practices for event handling

---

## New File Structure

```
mycelia/
├── utils/
│   └── gedcom-api.js           # Shared utilities
├── facets/
│   ├── auth.js                 # Authentication facet
│   └── gedcom/                 # ✅ NEW SUBFOLDER
│       ├── index.js            # ✅ Central export
│       ├── files.js            # useGedcomFiles
│       ├── individuals.js      # useGedcomIndividuals (renamed)
│       ├── families.js         # useGedcomFamilies (renamed)
│       ├── graph.js            # useGedcomGraph
│       └── duplicates.js       # useGedcomDuplicates
├── system.builder.js           # ✅ Updated
├── MyceliaProvider.js
├── EVENTS.md                   # ✅ NEW - Events reference
├── FACET_SPLIT_PLAN.md
├── FACET_SPLIT_COMPLETE.md
├── REORGANIZATION_SUMMARY.md   # ✅ This document
└── README.md                   # ✅ Needs update
```

---

## Facet Name Changes

| Old Name | New Name | Facet Kind | File |
|----------|----------|------------|------|
| `useIndividuals` | `useGedcomIndividuals` | `gedcomIndividuals` | `facets/gedcom/individuals.js` |
| `useFamilies` | `useGedcomFamilies` | `gedcomFamilies` | `facets/gedcom/families.js` |
| `useGedcomFiles` | `useGedcomFiles` | `gedcomFiles` | `facets/gedcom/files.js` |
| `useGedcomGraph` | `useGedcomGraph` | `gedcomGraph` | `facets/gedcom/graph.js` |
| `useGedcomDuplicates` | `useGedcomDuplicates` | `gedcomDuplicates` | `facets/gedcom/duplicates.js` |

---

## Event Name Updates

### Individuals Events
All `individuals:*` events are now `gedcomIndividuals:*`:

| Old Event Name | New Event Name |
|----------------|----------------|
| `individuals:loaded` | `gedcomIndividuals:loaded` |
| `individuals:individual:loaded` | `gedcomIndividuals:individual:loaded` |
| `individuals:search:complete` | `gedcomIndividuals:search:complete` |
| `individuals:parents:loaded` | `gedcomIndividuals:parents:loaded` |
| `individuals:children:loaded` | `gedcomIndividuals:children:loaded` |
| `individuals:siblings:loaded` | `gedcomIndividuals:siblings:loaded` |
| `individuals:spouses:loaded` | `gedcomIndividuals:spouses:loaded` |
| `individuals:stateChanged` | `gedcomIndividuals:stateChanged` |
| `individuals:error` | `gedcomIndividuals:error` |

### Families Events
All `families:*` events are now `gedcomFamilies:*`:

| Old Event Name | New Event Name |
|----------------|----------------|
| `families:loaded` | `gedcomFamilies:loaded` |
| `families:family:loaded` | `gedcomFamilies:family:loaded` |
| `families:stateChanged` | `gedcomFamilies:stateChanged` |
| `families:error` | `gedcomFamilies:error` |

---

## Usage Examples

### Importing Facets

```javascript
// Option 1: Named imports (recommended)
import {
  useGedcomFiles,
  useGedcomIndividuals,
  useGedcomFamilies
} from './facets/gedcom/index.js';

// Option 2: Import all as namespace
import * as gedcomFacets from './facets/gedcom/index.js';
// Use: gedcomFacets.useGedcomFiles, etc.

// Option 3: Default import (all facets as object)
import gedcomFacets from './facets/gedcom/index.js';
// Use: gedcomFacets.useGedcomFiles, etc.
```

### Using Renamed Facets in Components

```javascript
'use client';

import { useFacet } from 'mycelia-kernel-plugin/react';

export default function MyComponent() {
  // Use renamed facets
  const gedcomIndividuals = useFacet('gedcomIndividuals');
  const gedcomFamilies = useFacet('gedcomFamilies');
  
  const handleLoad = async (fileId) => {
    // Updated method calls (no changes needed - same API)
    const individuals = await gedcomIndividuals.getIndividuals(fileId);
    const families = await gedcomFamilies.getFamilies(fileId);
  };
  
  return <div>...</div>;
}
```

### Listening to Renamed Events

```javascript
import { useListener } from 'mycelia-kernel-plugin/react';

function MyComponent() {
  // Updated event names
  useListener('gedcomIndividuals:loaded', (event) => {
    console.log(`Loaded ${event.body.count} individuals`);
  });

  useListener('gedcomFamilies:loaded', (event) => {
    console.log(`Loaded ${event.body.count} families`);
  });

  return <div>...</div>;
}
```

---

## Benefits of Reorganization

### 1. ✅ Better Organization
- All GEDCOM facets in one place
- Easier to find related functionality
- Clearer project structure

### 2. ✅ Consistent Naming
- All GEDCOM facets have `Gedcom` prefix
- Event names match facet names
- Easier to distinguish GEDCOM vs other facets

### 3. ✅ Single Import Point
- One import statement for all GEDCOM facets
- Reduces import clutter
- Easier to maintain

### 4. ✅ Scalability
- Easy to add new GEDCOM facets (events, notes, places)
- Clear pattern for organizing domain-specific facets
- Can create similar folders for other domains (e.g., `facets/ui/`)

### 5. ✅ Better Documentation
- `EVENTS.md` provides complete event reference
- Clear event naming conventions
- Examples for all event types

---

## Migration Guide

### If You Have Existing Code

#### Step 1: Update imports
```javascript
// OLD
import { useIndividuals } from './mycelia/facets/individuals.js';
import { useFamilies } from './mycelia/facets/families.js';

// NEW
import {
  useGedcomIndividuals,
  useGedcomFamilies
} from './mycelia/facets/gedcom/index.js';
```

#### Step 2: Update useFacet calls
```javascript
// OLD
const individuals = useFacet('individuals');
const families = useFacet('families');

// NEW
const gedcomIndividuals = useFacet('gedcomIndividuals');
const gedcomFamilies = useFacet('gedcomFamilies');
```

#### Step 3: Update event listeners
```javascript
// OLD
useListener('individuals:loaded', handler);
useListener('families:loaded', handler);

// NEW
useListener('gedcomIndividuals:loaded', handler);
useListener('gedcomFamilies:loaded', handler);
```

#### Step 4: No API changes needed!
```javascript
// API methods remain the same
await gedcomIndividuals.getIndividuals(fileId);
await gedcomFamilies.getFamilies(fileId);
```

---

## Complete Facet Reference

### useGedcomFiles
**Kind:** `gedcomFiles`  
**File:** `facets/gedcom/files.js`  
**Purpose:** File upload, validation, and management

### useGedcomIndividuals
**Kind:** `gedcomIndividuals`  
**File:** `facets/gedcom/individuals.js`  
**Purpose:** Individual queries and immediate relationships  
**Note:** Renamed from `useIndividuals`

### useGedcomFamilies
**Kind:** `gedcomFamilies`  
**File:** `facets/gedcom/families.js`  
**Purpose:** Family record queries  
**Note:** Renamed from `useFamilies`

### useGedcomGraph
**Kind:** `gedcomGraph`  
**File:** `facets/gedcom/graph.js`  
**Purpose:** Advanced relationships and graph analytics

### useGedcomDuplicates
**Kind:** `gedcomDuplicates`  
**File:** `facets/gedcom/duplicates.js`  
**Purpose:** Duplicate detection and comparison

---

## Documentation Files

1. **`EVENTS.md`** - Complete event reference with examples
2. **`README.md`** - Usage guide (needs update)
3. **`FACET_SPLIT_PLAN.md`** - Original planning document
4. **`FACET_SPLIT_COMPLETE.md`** - Implementation summary
5. **`REORGANIZATION_SUMMARY.md`** - This document

---

## Testing Checklist

- [ ] Verify all imports resolve correctly
- [ ] Test each facet loads in the system
- [ ] Verify event names match documentation
- [ ] Test components using renamed facets
- [ ] Update any existing tests
- [ ] Update component examples in docs

---

## Next Steps

1. ✅ All facets reorganized and renamed
2. ✅ System builder updated
3. ✅ Events documented
4. ⏳ Update README.md with new structure
5. ⏳ Update component examples
6. ⏳ Test in browser
7. ⏳ Create test suites for renamed facets

---

**Reorganization Status:** ✅ Complete  
**Last Updated:** January 26, 2026  
**Version:** 2.0.0


