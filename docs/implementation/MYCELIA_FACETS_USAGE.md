# Mycelia Facets Usage Guide

This guide explains how to use the Mycelia facets in your React components.

## Available Facets

| Facet | Kind | Description |
|-------|------|-------------|
| `auth` | `auth` | User authentication (login, logout, register) |
| `gedcomFiles` | `gedcomFiles` | File upload, validation, listing |
| `gedcomIndividuals` | `gedcomIndividuals` | Query individuals, search, relationships |
| `gedcomFamilies` | `gedcomFamilies` | Query family records |
| `gedcomGraph` | `gedcomGraph` | Graph operations (ancestors, descendants, paths) |
| `gedcomDuplicates` | `gedcomDuplicates` | Find duplicate individuals |
| `listeners` | `listeners` | Event subscription system |

## Basic Usage

### 1. Import the `useFacet` Hook

```javascript
'use client';

import { useFacet } from 'mycelia-kernel-plugin/react';
```

### 2. Access a Facet in Your Component

```javascript
export default function MyComponent() {
  const gedcomFiles = useFacet('gedcomFiles');
  const gedcomIndividuals = useFacet('gedcomIndividuals');
  const auth = useFacet('auth');
  
  // Check if facet is ready
  if (!gedcomFiles) {
    return <div>Loading...</div>;
  }
  
  // Use facet methods
  const handleUpload = async (file) => {
    const result = await gedcomFiles.uploadGedcom(file, 'My Tree');
    console.log('Uploaded:', result);
  };
  
  return <div>...</div>;
}
```

## Facet Methods Reference

### `gedcomFiles` Facet

```javascript
const gedcomFiles = useFacet('gedcomFiles');

// Upload a GEDCOM file
const result = await gedcomFiles.uploadGedcom(file, 'Tree Name');
// Returns: { fileId: string, metadata: object }

// Get file info
const fileInfo = await gedcomFiles.getFileInfo(fileId);

// List all files
const files = await gedcomFiles.listFiles();

// Validate a file
const validation = await gedcomFiles.validateFile(fileId);
// Returns: { valid: boolean, errors: [], summary: { individuals, families, sources } }

// Delete a file
await gedcomFiles.deleteFile(fileId);

// Get current state
const state = gedcomFiles.getState();
// Returns: { loading, error, currentFile, files }

// Clear error
gedcomFiles.clearError();
```

### `gedcomIndividuals` Facet

```javascript
const gedcomIndividuals = useFacet('gedcomIndividuals');

// Get all individuals (paginated)
const result = await gedcomIndividuals.getIndividuals(fileId, { page: 1, limit: 50 });
// Returns: { individuals: [], meta: { total, page, limit } }

// Get single individual
const individual = await gedcomIndividuals.getIndividual(fileId, '@I123@');

// Search individuals
const results = await gedcomIndividuals.searchIndividuals(fileId, {
  query: 'John Smith',
  filters: { birth_year: 1900 }
});

// Get relationships
const parents = await gedcomIndividuals.getParents(fileId, '@I123@');
const children = await gedcomIndividuals.getChildren(fileId, '@I123@');
const siblings = await gedcomIndividuals.getSiblings(fileId, '@I123@');
const spouses = await gedcomIndividuals.getSpouses(fileId, '@I123@');

// Clear search results
gedcomIndividuals.clearSearchResults();

// Get state
const state = gedcomIndividuals.getState();
// Returns: { loading, error, individuals, currentIndividual, searchResults, relationships }
```

### `gedcomFamilies` Facet

```javascript
const gedcomFamilies = useFacet('gedcomFamilies');

// Get all families (paginated)
const result = await gedcomFamilies.getFamilies(fileId, { page: 1, limit: 50 });

// Get single family
const family = await gedcomFamilies.getFamily(fileId, '@F123@');

// Get state
const state = gedcomFamilies.getState();
// Returns: { loading, error, families, currentFamily, meta }
```

### `gedcomGraph` Facet

```javascript
const gedcomGraph = useFacet('gedcomGraph');

// Get relationship between two individuals
const relationship = await gedcomGraph.getRelationship(fileId, '@I1@', '@I2@');

// Get ancestors (with generations limit)
const ancestors = await gedcomGraph.getAncestors(fileId, '@I123@', 5);

// Get descendants (with generations limit)
const descendants = await gedcomGraph.getDescendants(fileId, '@I123@', 5);

// Find shortest path between two individuals
const path = await gedcomGraph.getPaths(fileId, '@I1@', '@I2@');

// Get tree metrics
const metrics = await gedcomGraph.getMetrics(fileId);
// Returns: { individuals, families, generations, etc. }

// Get centrality scores
const centrality = await gedcomGraph.getCentrality(fileId, 'degree');
// Types: 'degree', 'betweenness', 'closeness'

// Get most connected individuals
const connected = await gedcomGraph.getMostConnected(fileId, 10);

// Get state
const state = gedcomGraph.getState();
```

### `gedcomDuplicates` Facet

```javascript
const gedcomDuplicates = useFacet('gedcomDuplicates');

// Find duplicates within a file
const duplicates = await gedcomDuplicates.findDuplicates(fileId, 0.8);
// minScore: 0.0 to 1.0 (default 0.8)

// Compare two files
const comparison = await gedcomDuplicates.compareFiles(fileId1, fileId2, 0.8);

// Get state
const state = gedcomDuplicates.getState();
// Returns: { loading, error, duplicates, comparisonResults }
```

### `auth` Facet

```javascript
const auth = useFacet('auth');

// Login
await auth.login(email, password);

// Register
await auth.register({ username, email, password, name });

// Logout
await auth.logout();

// Get current user
const user = await auth.getCurrentUser();

// Check auth state
const state = auth.getState();
// Returns: { isAuthenticated, user, loading, error }
```

## Event Listening

Use the `listeners` facet to subscribe to events:

```javascript
const listeners = useFacet('listeners');

useEffect(() => {
  if (!listeners) return;

  // Define the handler function
  const handleFileUploaded = (event) => {
    console.log('File uploaded!', event.body);
  };

  // Subscribe to events
  listeners.on('gedcomFiles:file:uploaded', handleFileUploaded);

  // Cleanup using listeners.off() - must pass the same handler reference
  return () => {
    listeners.off('gedcomFiles:file:uploaded', handleFileUploaded);
  };
}, [listeners]);
```

**Important**: The `listeners.on()` method does NOT return an unsubscribe function. You must use `listeners.off(eventType, handler)` to unsubscribe, passing the exact same handler function reference.

### Available Events

#### gedcomFiles Events
- `gedcomFiles:stateChanged` - State changed
- `gedcomFiles:file:uploaded` - File uploaded successfully
- `gedcomFiles:file:deleted` - File deleted
- `gedcomFiles:file:validated` - File validation complete
- `gedcomFiles:error` - Error occurred

#### gedcomIndividuals Events
- `gedcomIndividuals:stateChanged`
- `gedcomIndividuals:loaded` - Individuals list loaded
- `gedcomIndividuals:individual:loaded` - Single individual loaded
- `gedcomIndividuals:search:complete` - Search completed
- `gedcomIndividuals:parents:loaded`
- `gedcomIndividuals:children:loaded`
- `gedcomIndividuals:siblings:loaded`
- `gedcomIndividuals:spouses:loaded`
- `gedcomIndividuals:error`

#### gedcomFamilies Events
- `gedcomFamilies:stateChanged`
- `gedcomFamilies:loaded`
- `gedcomFamilies:family:loaded`
- `gedcomFamilies:error`

#### gedcomGraph Events
- `gedcomGraph:stateChanged`
- `gedcomGraph:relationship:loaded`
- `gedcomGraph:ancestors:loaded`
- `gedcomGraph:descendants:loaded`
- `gedcomGraph:paths:found`
- `gedcomGraph:metrics:calculated`
- `gedcomGraph:centrality:calculated`
- `gedcomGraph:mostConnected:loaded`
- `gedcomGraph:error`

#### auth Events
- `auth:stateChanged`
- `auth:login:success`
- `auth:login:error`
- `auth:logout:success`
- `auth:register:success`
- `auth:register:error`

## Complete Example Component

```javascript
'use client';

import { useState, useEffect } from 'react';
import { useFacet } from 'mycelia-kernel-plugin/react';

export default function FamilyTreeViewer({ fileId }) {
  const gedcomIndividuals = useFacet('gedcomIndividuals');
  const gedcomGraph = useFacet('gedcomGraph');
  const listeners = useFacet('listeners');

  const [individuals, setIndividuals] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [ancestors, setAncestors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load individuals on mount
  useEffect(() => {
    if (!gedcomIndividuals || !fileId) return;

    const loadData = async () => {
      try {
        const result = await gedcomIndividuals.getIndividuals(fileId, { limit: 100 });
        setIndividuals(result.individuals);
      } catch (error) {
        console.error('Failed to load individuals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [gedcomIndividuals, fileId]);

  // Subscribe to events
  useEffect(() => {
    if (!listeners) return;

    const handleAncestorsLoaded = (event) => {
      setAncestors(event.body.ancestors || []);
    };

    listeners.on('gedcomGraph:ancestors:loaded', handleAncestorsLoaded);

    return () => {
      listeners.off('gedcomGraph:ancestors:loaded', handleAncestorsLoaded);
    };
  }, [listeners]);

  // Load ancestors when person selected
  const handleSelectPerson = async (xref) => {
    if (!gedcomGraph) return;

    const person = await gedcomIndividuals.getIndividual(fileId, xref);
    setSelectedPerson(person);

    const ancestorData = await gedcomGraph.getAncestors(fileId, xref, 3);
    setAncestors(ancestorData);
  };

  if (loading) {
    return <div>Loading tree...</div>;
  }

  return (
    <div className="flex gap-4">
      {/* Individuals List */}
      <div className="w-1/3 border rounded-lg p-4">
        <h2 className="font-bold mb-4">Individuals ({individuals.length})</h2>
        <ul className="space-y-2">
          {individuals.map((person) => (
            <li 
              key={person.xref}
              onClick={() => handleSelectPerson(person.xref)}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded"
            >
              {person.name || 'Unknown'}
            </li>
          ))}
        </ul>
      </div>

      {/* Selected Person Details */}
      <div className="w-2/3 border rounded-lg p-4">
        {selectedPerson ? (
          <div>
            <h2 className="text-xl font-bold">{selectedPerson.name}</h2>
            <p className="text-gray-500">Born: {selectedPerson.birth_date || 'Unknown'}</p>
            <p className="text-gray-500">Died: {selectedPerson.death_date || 'Unknown'}</p>
            
            <h3 className="font-bold mt-4">Ancestors</h3>
            <ul>
              {ancestors.map((ancestor, i) => (
                <li key={i} style={{ marginLeft: `${ancestor.generation * 20}px` }}>
                  Gen {ancestor.generation}: {ancestor.name}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-500">Select a person to view details</p>
        )}
      </div>
    </div>
  );
}
```

## Tips & Best Practices

1. **Always check if facet is ready**: Facets may be `null` during initial render.

2. **Use loading states**: Facet methods are async, always handle loading states.

3. **Handle errors gracefully**: Wrap facet calls in try/catch.

4. **Clean up subscriptions**: Always return unsubscribe functions in useEffect.

5. **Use getState() for synchronous reads**: When you need current state without async.

6. **Prefer events for reactive updates**: Subscribe to events for real-time updates.

