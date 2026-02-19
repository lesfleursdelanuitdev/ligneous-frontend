# Go API Facet Implementation

**Date:** 2026-01-26  
**Status:** ✅ COMPLETE

---

## Overview

Implemented a Mycelia facet (`useGoAPI`) that provides a reactive interface to the Go API (ligneous-gedcom-api) for GEDCOM file parsing and querying.

---

## Architecture Decisions

### 1. **Listeners as Required Dependency**

```javascript
export const useGoAPI = createHook({
  kind: 'goAPI',
  version: '1.0.0',
  required: ['listeners'],  // ← Required dependency
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => { ... }
});
```

**Rationale:**
- Ensures listeners facet is installed and initialized before goAPI
- Guarantees event system is available for error/success notifications
- Follows explicit dependency declaration pattern

### 2. **Defensive Runtime Checks**

Even though `listeners` is required, we use defensive checks:

```javascript
const listenersFacet = subsystem.find('listeners');
if (listenersFacet && listenersFacet.hasListeners()) {
  listenersFacet.emit('goapi:file:uploaded', {
    type: 'goapi:file:uploaded',
    body: { file: fileMetadata }
  });
}
```

**Benefits:**
- **Explicit intent**: Code clearly shows it's using listeners
- **Defensive programming**: Extra safety layer
- **Runtime flexibility**: Works even if listeners disabled
- **Better error messages**: Clear what's missing if something breaks

### 3. **Event-Driven Architecture**

The facet emits events for:

| Event Type | When | Payload |
|------------|------|---------|
| `goapi:file:uploaded` | GEDCOM successfully uploaded | `{ file: fileMetadata }` |
| `goapi:file:deleted` | File successfully deleted | `{ fileId }` |
| `goapi:error` | Any operation fails | `{ error: string, action: string }` |

**Usage:**
```javascript
// In React components
import { useListener } from '@/mycelia/MyceliaProvider';

function TreeList() {
  useListener('goapi:file:uploaded', (message) => {
    console.log('New file uploaded:', message.body.file);
    // Refresh tree list, show notification, etc.
  });
  
  useListener('goapi:error', (message) => {
    console.error('Go API error:', message.body);
    // Show error notification
  });
}
```

---

## Facet Interface

### State Management

```javascript
const state = {
  loading: false,
  error: null,
  currentFile: null,
  individuals: [],
  families: [],
};
```

State is reactive via subscription pattern:

```javascript
const goApi = useFacet('goAPI');

// Subscribe to state changes
const unsubscribe = goApi.subscribe((newState) => {
  console.log('State changed:', newState);
});

// Get current state
const currentState = goApi.getState();
```

### Methods

#### File Operations

**`uploadGedcom(file, name)`**
- Uploads GEDCOM file to Go API
- Returns: `{ fileId, metadata }`
- Emits: `goapi:file:uploaded` on success

**`getFileInfo(fileId)`**
- Retrieves file metadata
- Returns: File info object

**`deleteFile(fileId)`**
- Deletes file from Go API
- Emits: `goapi:file:deleted` on success

#### Individual Queries

**`getIndividuals(fileId, params?)`**
- Lists individuals with optional filters
- Params: `{ limit, offset, name, sex, birth_year_min, etc. }`
- Returns: `{ individuals: [...], total, ... }`

**`getIndividual(fileId, xref)`**
- Gets specific individual by xref
- Returns: Individual object

#### Family Queries

**`getFamilies(fileId, params?)`**
- Lists families
- Returns: `{ families: [...], total, ... }`

**`getFamily(fileId, xref)`**
- Gets specific family by xref
- Returns: Family object

#### Relationship Queries

**`getRelationship(fileId, xref1, xref2)`**
- Calculates relationship between two individuals
- Returns: Relationship description

**`getAncestors(fileId, xref, maxGenerations?)`**
- Gets ancestors of an individual
- Default: 5 generations
- Returns: Ancestor tree

**`getDescendants(fileId, xref, maxGenerations?)`**
- Gets descendants of an individual
- Default: 5 generations
- Returns: Descendant tree

#### Utility Methods

**`getState()`**
- Returns current state snapshot

**`clearError()`**
- Clears error state

**`subscribe(listener)`**
- Subscribe to state changes
- Returns: Unsubscribe function

---

## System Configuration

### In `system.builder.js`

```javascript
import { useBase, useListeners } from 'mycelia-kernel-plugin';
import { useAuth } from './facets/auth.js';
import { useGoAPI } from './facets/go-api.js';

export const buildLigneousSystem = async () => {
  return useBase('ligneous-frontend')
    .config('listeners', { registrationPolicy: 'multiple' })
    .config('goAPI', {
      baseURL: 'http://localhost:8090',
      timeout: 30000
    })
    .use(useListeners)   // 1. Listeners first
    .use(useAuth)         // 2. Auth (optional dep on listeners)
    .use(useGoAPI)        // 3. Go API (required dep on listeners)
    .build();
};
```

**Dependency Order:**
1. `useListeners` - No dependencies
2. `useAuth` - Optional dependency on listeners
3. `useGoAPI` - **Required** dependency on listeners

---

## Usage Examples

### In React Components

#### Basic Usage

```javascript
'use client';

import { useFacet } from '@/mycelia/MyceliaProvider';

export default function TreeViewer({ treeId }) {
  const goApi = useFacet('goAPI');
  const [individuals, setIndividuals] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await goApi.getIndividuals(treeId, {
          limit: 100,
          offset: 0
        });
        setIndividuals(data.individuals);
      } catch (error) {
        console.error('Failed to fetch individuals:', error);
      }
    };
    
    fetchData();
  }, [treeId, goApi]);

  return (
    <div>
      {individuals.map(person => (
        <div key={person.xref}>{person.name}</div>
      ))}
    </div>
  );
}
```

#### With Event Listeners

```javascript
'use client';

import { useFacet, useListener } from '@/mycelia/MyceliaProvider';

export default function TreeList() {
  const goApi = useFacet('goAPI');
  const [trees, setTrees] = useState([]);

  // Listen for upload events
  useListener('goapi:file:uploaded', (message) => {
    console.log('New file uploaded!', message.body.file);
    // Refresh tree list
    fetchTrees();
  });

  // Listen for errors
  useListener('goapi:error', (message) => {
    toast.error(`Go API Error: ${message.body.error}`);
  });

  // ...
}
```

#### With State Subscription

```javascript
'use client';

import { useFacet } from '@/mycelia/MyceliaProvider';

export default function UploadStatus() {
  const goApi = useFacet('goAPI');
  const [state, setState] = useState(goApi.getState());

  useEffect(() => {
    const unsubscribe = goApi.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [goApi]);

  return (
    <div>
      {state.loading && <Spinner />}
      {state.error && <Error message={state.error} />}
    </div>
  );
}
```

---

## Error Handling

All methods follow the same error handling pattern:

1. Set `state.loading = true`
2. Set `state.error = null`
3. Execute operation
4. On success:
   - Update state with data
   - Set `state.loading = false`
   - Emit success event (if applicable)
   - Return data
5. On error:
   - Set `state.error = error.message`
   - Set `state.loading = false`
   - Emit error event
   - Throw error (allows component-level handling)

```javascript
try {
  const result = await goApi.uploadGedcom(file, name);
  // Success
} catch (error) {
  // Error already logged and emitted
  // Handle in component (show notification, etc.)
}
```

---

## Event Message Format

All events follow Mycelia message format:

```javascript
{
  type: 'goapi:file:uploaded',  // Event type (matches path)
  body: {                       // Event payload
    file: { ... }               // Event-specific data
  }
}
```

This format is compatible with Mycelia's listener system and can be used with:
- `useListener()` React hook
- `system.find('listeners').on()`
- Any Mycelia-compatible event handler

---

## Testing

### Manual Testing

```javascript
// In browser console (after system built)
const system = window.__myceliaSystem;
const goApi = system.find('goAPI');

// Test upload
const file = new File(['...'], 'test.ged');
const result = await goApi.uploadGedcom(file, 'Test Tree');
console.log('Upload result:', result);

// Test individuals
const individuals = await goApi.getIndividuals(result.fileId);
console.log('Individuals:', individuals);

// Test state
console.log('Current state:', goApi.getState());
```

### Unit Testing

```javascript
import { describe, it, expect, vi } from 'vitest';
import { buildLigneousSystem } from './system.builder.js';

describe('useGoAPI facet', () => {
  it('should emit events on upload', async () => {
    const system = await buildLigneousSystem();
    const goApi = system.find('goAPI');
    const listeners = system.find('listeners');
    
    const handler = vi.fn();
    listeners.on('goapi:file:uploaded', handler);
    
    // Mock fetch...
    await goApi.uploadGedcom(mockFile, 'Test');
    
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'goapi:file:uploaded',
        body: expect.objectContaining({
          file: expect.any(Object)
        })
      })
    );
  });
});
```

---

## Benefits of This Architecture

1. **Separation of Concerns**
   - Go API handles GEDCOM parsing/querying
   - Frontend handles permissions/UI
   - Facet bridges the two

2. **Event-Driven**
   - Loose coupling between components
   - Easy to add new listeners
   - Components react to data changes

3. **Reactive State**
   - Subscribe to state changes
   - Automatic UI updates
   - Centralized loading/error states

4. **Type Safety** (Future)
   - Can add TypeScript interfaces
   - JSDoc comments for IDE support

5. **Testable**
   - Mock Go API responses
   - Test event emission
   - Test state management

6. **Framework Agnostic**
   - Core logic in Mycelia facet
   - Can use with any framework
   - React bindings via MyceliaProvider

---

## Next Steps

1. ✅ Add more Go API endpoints as needed:
   - Search individuals
   - Get metrics
   - Get centrality
   - Duplicate detection

2. ✅ Add caching layer:
   - Cache individuals per tree
   - Cache family data
   - Invalidate on updates

3. ✅ Add optimistic updates:
   - Update UI immediately
   - Sync with Go API in background

4. ✅ Add batch operations:
   - Fetch multiple individuals at once
   - Parallel requests with Promise.all

---

## Files Modified

- ✅ `/mycelia/facets/go-api.js` - Main facet implementation
- ✅ `/mycelia/system.builder.js` - Added goAPI to system
- ✅ `/app/providers.js` - Already wraps with MyceliaProvider
- ✅ `/next.config.js` - Added GO_API_URL env var

---

## Success Criteria

- ✅ Facet declares listeners as required dependency
- ✅ Uses `subsystem.find()` for defensive checks
- ✅ Emits events for uploads, deletes, and errors
- ✅ Provides reactive state management
- ✅ All Go API methods implemented
- ✅ Integrated into system builder
- ✅ Compatible with React hooks

**Ready for dashboard and upload page testing!** 🚀



