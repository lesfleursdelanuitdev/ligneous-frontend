# Mycelia Facets for Ligneous Frontend

This directory contains the Mycelia Kernel Plugin System configuration and facets for the Ligneous GEDCOM genealogy application.

## Architecture

The application uses **focused, single-responsibility facets** for better maintainability and scalability.

## Available Facets

### 1. Authentication (`auth`)
**Purpose:** User authentication and session management

**Usage:**
```javascript
const auth = useFacet('auth');
await auth.login(username, password);
await auth.register(userData);
await auth.logout();
const user = await auth.getCurrentUser();
```

---

### 2. GEDCOM Files (`gedcomFiles`)
**Purpose:** GEDCOM file upload, validation, and management

**Usage:**
```javascript
const gedcomFiles = useFacet('gedcomFiles');
const result = await gedcomFiles.uploadGedcom(file, 'My Tree');
const fileInfo = await gedcomFiles.getFileInfo(fileId);
const files = await gedcomFiles.listFiles();
await gedcomFiles.validateFile(fileId);
await gedcomFiles.deleteFile(fileId);
```

**Events:**
- `gedcomFiles:file:uploaded`
- `gedcomFiles:file:validated`
- `gedcomFiles:file:deleted`
- `gedcomFiles:stateChanged`

---

### 3. Individuals (`individuals`)
**Purpose:** Individual queries and immediate family relationships

**Usage:**
```javascript
const individuals = useFacet('individuals');
const list = await individuals.getIndividuals(fileId);
const person = await individuals.getIndividual(fileId, 'I1');
const results = await individuals.searchIndividuals(fileId, query);
const parents = await individuals.getParents(fileId, 'I1');
const children = await individuals.getChildren(fileId, 'I1');
const siblings = await individuals.getSiblings(fileId, 'I1');
const spouses = await individuals.getSpouses(fileId, 'I1');
```

**Events:**
- `individuals:loaded`
- `individuals:individual:loaded`
- `individuals:search:complete`
- `individuals:parents:loaded`
- `individuals:children:loaded`
- `individuals:siblings:loaded`
- `individuals:spouses:loaded`
- `individuals:stateChanged`

---

### 4. Families (`families`)
**Purpose:** Family record queries

**Usage:**
```javascript
const families = useFacet('families');
const list = await families.getFamilies(fileId);
const family = await families.getFamily(fileId, 'F1');
```

**Events:**
- `families:loaded`
- `families:family:loaded`
- `families:stateChanged`

---

### 5. GEDCOM Graph (`gedcomGraph`)
**Purpose:** Advanced relationships, ancestry, and graph analytics

**Usage:**
```javascript
const gedcomGraph = useFacet('gedcomGraph');
const relationship = await gedcomGraph.getRelationship(fileId, 'I1', 'I2');
const paths = await gedcomGraph.getPaths(fileId, 'I1', 'I2');
const ancestors = await gedcomGraph.getAncestors(fileId, 'I1', 5);
const descendants = await gedcomGraph.getDescendants(fileId, 'I1', 5);
const metrics = await gedcomGraph.getMetrics(fileId);
const centrality = await gedcomGraph.getCentrality(fileId, 'degree');
const mostConnected = await gedcomGraph.getMostConnected(fileId, 10);
```

**Events:**
- `gedcomGraph:relationship:calculated`
- `gedcomGraph:paths:found`
- `gedcomGraph:ancestors:loaded`
- `gedcomGraph:descendants:loaded`
- `gedcomGraph:metrics:calculated`
- `gedcomGraph:centrality:calculated`
- `gedcomGraph:mostConnected:loaded`
- `gedcomGraph:stateChanged`

---

### 6. GEDCOM Duplicates (`gedcomDuplicates`)
**Purpose:** Duplicate detection within and across files

**Usage:**
```javascript
const gedcomDuplicates = useFacet('gedcomDuplicates');
const duplicates = await gedcomDuplicates.findDuplicates(fileId, 0.8);
const comparison = await gedcomDuplicates.compareFiles(fileId1, fileId2, 0.8);
```

**Events:**
- `gedcomDuplicates:found`
- `gedcomDuplicates:comparison:complete`
- `gedcomDuplicates:stateChanged`

---

## Using Facets in Components

### Basic Usage
```javascript
'use client';

import { useFacet } from 'mycelia-kernel-plugin/react';

export default function MyComponent() {
  const gedcomFiles = useFacet('gedcomFiles');
  const individuals = useFacet('individuals');
  
  const handleUpload = async (file) => {
    const result = await gedcomFiles.uploadGedcom(file, 'My Tree');
    console.log('Uploaded:', result.fileId);
    
    // Now get individuals from that file
    const individualsList = await individuals.getIndividuals(result.fileId);
    console.log('Found individuals:', individualsList);
  };
  
  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

### Using Event Listeners
```javascript
import { useFacet, useListener } from 'mycelia-kernel-plugin/react';
import { useEffect, useState } from 'react';

export default function FileUploadStatus() {
  const [uploadStatus, setUploadStatus] = useState(null);
  
  // Listen to upload events
  useListener('gedcomFiles:file:uploaded', (event) => {
    setUploadStatus(`File uploaded: ${event.body.file.file_id}`);
  });
  
  useListener('gedcomFiles:error', (event) => {
    setUploadStatus(`Error: ${event.body.error}`);
  });
  
  return <div>{uploadStatus}</div>;
}
```

### Accessing Facet State
```javascript
const gedcomFiles = useFacet('gedcomFiles');
const state = gedcomFiles.getState();

console.log('Loading:', state.loading);
console.log('Error:', state.error);
console.log('Current File:', state.currentFile);
console.log('All Files:', state.files);
```

---

## Shared Utilities

All facets use shared utilities from `utils/gedcom-api.js`:

- `createEmitEvent()` - Event emission with defensive checks
- `createEmitStateChange()` - State change event emission
- `handleApiError()` - Consistent error handling
- `buildQueryString()` - URL query string builder
- `createLoadingUpdater()` - Loading state updater

---

## Configuration

All GEDCOM facets read from the `goAPI` configuration:

```javascript
// system.builder.js
.config('goAPI', {
  baseURL: process.env.NEXT_PUBLIC_GO_API_URL || 'http://localhost:8090',
  timeout: 30000
})
```

**Environment Variables:**
- `NEXT_PUBLIC_GO_API_URL` - Go API base URL (default: http://localhost:8090)
- `NEXT_PUBLIC_API_URL` - Next.js API routes URL (default: http://localhost:4000/api)

---

## File Structure

```
mycelia/
├── utils/
│   └── gedcom-api.js          # Shared utilities
├── facets/
│   ├── auth.js                # Authentication
│   ├── gedcom-files.js        # File management
│   ├── individuals.js         # Individual queries
│   ├── families.js            # Family queries
│   ├── gedcom-graph.js        # Graph analytics
│   └── gedcom-duplicates.js   # Duplicate detection
├── system.builder.js          # System configuration
├── MyceliaProvider.js         # React provider component
├── FACET_SPLIT_PLAN.md        # Planning document
├── FACET_SPLIT_COMPLETE.md    # Implementation summary
└── README.md                  # This file
```

---

## Testing

Example test structure:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { buildTestSystem } from './test-system.builder.js';

describe('useGedcomFiles', () => {
  let system, gedcomFiles;

  beforeEach(async () => {
    system = await buildTestSystem();
    gedcomFiles = system.find('gedcomFiles');
  });

  it('should upload a file', async () => {
    const result = await gedcomFiles.uploadGedcom(file, 'Test');
    expect(result.fileId).toBeDefined();
  });
});
```

---

## Best Practices

1. **Use the right facet for the job**
   - Don't use `gedcomGraph` for simple individual queries
   - Use `individuals` for immediate family, `gedcomGraph` for ancestry

2. **Listen to events for reactive updates**
   - Use `useListener` to react to facet events
   - Don't poll `getState()` repeatedly

3. **Handle errors gracefully**
   - All methods throw errors on failure
   - Use try-catch or error boundaries

4. **Clear state when appropriate**
   - Use `clearError()` after handling errors
   - Use `clearSearchResults()` when search context changes

5. **Check loading state**
   - Access `facet.getState().loading` before operations
   - Show loading indicators in UI

---

## Migration from Old `useGoAPI`

If you have old code using `useGoAPI`, here's how to migrate:

```javascript
// OLD
const goAPI = useFacet('goAPI');
await goAPI.uploadGedcom(file, name);
await goAPI.getIndividuals(fileId);
await goAPI.getAncestors(fileId, xref);

// NEW
const gedcomFiles = useFacet('gedcomFiles');
const individuals = useFacet('individuals');
const gedcomGraph = useFacet('gedcomGraph');

await gedcomFiles.uploadGedcom(file, name);
await individuals.getIndividuals(fileId);
await gedcomGraph.getAncestors(fileId, xref);
```

**Event names also changed:**
- `goapi:file:uploaded` → `gedcomFiles:file:uploaded`
- `goapi:stateChanged` → `gedcomFiles:stateChanged`, `individuals:stateChanged`, etc.
- `goapi:error` → `gedcomFiles:error`, `individuals:error`, etc.

---

## Future Enhancements

Planned facets for future expansion:

- **`useGedcomEvents`** - GEDCOM event handling (BIRT, DEAT, MARR, etc.)
- **`useGedcomNotes`** - Notes management
- **`useGedcomPlaces`** - Place/location queries with mapping
- **`useGedcomSources`** - Source citations and media
- **`useGedcomTimeline`** - Timeline and chronology views

---

## Support

For questions or issues:
1. Check the facet-specific documentation in `FACET_SPLIT_COMPLETE.md`
2. Review the implementation plan in `FACET_SPLIT_PLAN.md`
3. See usage examples in component files

---

**Last Updated:** January 26, 2026
**Version:** 1.0.0

