# Library Utilities

This directory contains server-side and client-side utility functions organized by domain.

## Structure

```
lib/
├── api.js                  # Client-side API utilities (authFetch for Next.js API routes)
├── auth.js                 # Server-side auth utilities (hashPassword, verifyToken, etc.)
├── database/               # Database utilities
│   └── prisma.js          # Prisma client
├── permissions/            # Permission utilities
│   └── index.js           # Permission checking functions
├── tree-access.js         # Tree access utilities
├── middleware.js          # Middleware utilities
└── index.js               # Central export
│
│   Note: 
│   - Client-side token management: useAuth Mycelia facet
│   - Go API communication: Mycelia facets (useGedcomFiles, useGedcomIndividuals, etc.)
├── permissions/          # Permission checking utilities
│   └── index.js          # Re-exports from permissions.js
├── database/             # Database utilities
│   └── prisma.js         # Prisma client
├── tree-access.js        # Tree access utilities
├── middleware.js         # Middleware utilities
└── index.js              # Central export for all utilities
```

## Usage

### Server-side (API routes)
```javascript
import { prisma } from '@/lib/database/prisma';
import { hashPassword, verifyToken } from '@/lib/auth/server';
import { hasPermission } from '@/lib/permissions';
```

### Client-side (React components)
```javascript
// For Next.js API routes (not Go API)
import { authFetch } from '@/lib/api/client';

// For Go API, use Mycelia facets instead:
import { useFacet } from '@/mycelia/MyceliaProvider';
const gedcomFiles = useFacet('gedcomFiles');
const individuals = useFacet('gedcomIndividuals');
const graph = useFacet('gedcomGraph');

// Use facets for Go API communication
await gedcomFiles.uploadGedcom(file, name);
await individuals.getIndividual(fileId, xref);
await graph.getAncestors(fileId, xref, generations);
```

### Central import (recommended)
```javascript
import { prisma, hashPassword, authFetch } from '@/lib';
```

## Notes

- **Server-side utilities** (`auth/server.js`, `database/prisma.js`) can only be used in API routes and server components
- **Client-side utilities** (`api/client.js`) are for Next.js API routes only
- **Go API communication**: Use Mycelia facets instead of direct API calls:
  - `useGedcomFiles` - File operations
  - `useGedcomIndividuals` - Individual queries
  - `useGedcomGraph` - Graph/relationship queries
  - `useGedcomFamilies` - Family queries
  - etc.
- The central `lib/index.js` exports everything, but be careful about server/client boundaries

