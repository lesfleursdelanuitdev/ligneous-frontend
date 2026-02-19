# Codebase Refactoring & Reorganization Analysis

**Date:** Current Session  
**Purpose:** Analyze codebase structure and suggest refactoring opportunities

---

## Executive Summary

The codebase is well-organized overall, but there are several opportunities for improvement in:
1. **Documentation organization** (too many markdown files in root)
2. **Component structure** (could benefit from feature-based organization)
3. **API route organization** (could be more consistent)
4. **Utility organization** (some duplication between `lib/` and `mycelia/utils/`)
5. **Family tree visualization** (new module needs better integration)

---

## 1. Documentation Organization

### Current State
- **40+ markdown files** in the root directory
- Mix of analysis, implementation status, architecture decisions
- Hard to find relevant documentation

### Suggested Reorganization

```
ligneous-frontend/
├── docs/                          # NEW: Centralized documentation
│   ├── architecture/              # Architecture decisions
│   │   ├── ARCHITECTURE.md
│   │   ├── ARCHITECTURE_DECISION_AUTH.md
│   │   ├── PROXY_API_ARCHITECTURE_ANALYSIS.md
│   │   └── ACCESS_CONTROL_MODEL.md
│   ├── implementation/            # Implementation status & plans
│   │   ├── IMPLEMENTATION_PLAN.md
│   │   ├── IMPLEMENTATION_STATUS.md
│   │   ├── NEXT_STEPS.md
│   │   └── PROJECT_STATUS.md
│   ├── features/                  # Feature-specific docs
│   │   ├── search/               # Search & statistics
│   │   │   ├── SEARCH_AND_STATISTICS_ANALYSIS.md
│   │   │   └── ENDPOINT_IMPLEMENTATION_LOCATIONS.md
│   │   ├── family-tree/          # Family tree visualization
│   │   │   └── PEDIGREE_LAYOUT_ANALYSIS.md
│   │   └── upload/               # Upload & dashboard
│   │       └── UPLOAD_DASHBOARD_IMPLEMENTATION.md
│   ├── testing/                   # Testing documentation
│   │   ├── TESTING.md
│   │   ├── ALL_INTEGRATION_TESTS_COMPLETE.md
│   │   └── GRAPH_TESTING_COMPLETE.md
│   └── api/                       # API documentation
│       ├── API_RESPONSE_STRUCTURES.md
│       ├── API_ENDPOINT_ANALYSIS.md
│       └── TNG_FEATURE_REQUIREMENTS.md
├── README.md                      # Keep: Main entry point
└── SETUP.md                       # Keep: Quick setup guide
```

**Benefits:**
- Easier to find relevant documentation
- Clear categorization
- Better for onboarding new developers
- Can create a docs index/table of contents

---

## 2. Component Organization

### Current State
```
components/
├── dashboard/
├── layout/
├── notifications/
├── search/
├── theme/
├── trees/
└── index.js
```

### Suggested Improvement: Feature-Based Organization

```
components/
├── shared/                        # Reusable UI components
│   ├── Button/
│   ├── Card/
│   ├── Modal/
│   └── index.js
├── features/                      # Feature-specific components
│   ├── dashboard/
│   │   ├── ExploreTrees/
│   │   ├── RecentActivity/
│   │   └── PendingRequests/
│   ├── search/
│   │   └── GlobalSearch/
│   ├── trees/
│   │   └── TreeCard/
│   └── family-tree/               # NEW: Family tree components
│       ├── PedigreeChart/
│       ├── TreeControls/
│       └── PersonCard/
├── layout/                        # Layout components
│   ├── DashboardLayout/
│   ├── TopBar/
│   └── MobileNav/
└── index.js                       # Central exports
```

**Sample Structure:**
```javascript
// components/shared/Button/Button.jsx
export function Button({ children, variant, ...props }) {
  return <button className={`btn btn-${variant}`} {...props}>{children}</button>;
}

// components/shared/Button/index.js
export { Button } from './Button';

// components/index.js
export * from './shared';
export * from './features';
export * from './layout';
```

**Benefits:**
- Clear separation between shared and feature-specific components
- Easier to find components
- Better code splitting opportunities
- Aligns with Next.js App Router patterns

---

## 3. API Route Organization

### Current State
```
app/api/
├── admin/
├── auth/
├── me/
└── trees/
```

### Suggested Improvement: Consistent Structure

```
app/api/
├── v1/                            # API versioning
│   ├── auth/                      # Authentication
│   │   ├── login/
│   │   ├── register/
│   │   └── logout/
│   ├── users/                     # User management
│   │   ├── me/
│   │   └── [id]/
│   ├── trees/                     # Tree management
│   │   ├── [id]/
│   │   └── [id]/[...path]/       # Proxy to Go API
│   └── admin/                     # Admin routes
│       └── ...
└── health/                        # Health check (no version)
```

**Sample Route Structure:**
```javascript
// app/api/v1/trees/[id]/[...path]/route.js
// Handles: /api/v1/trees/{treeId}/individuals/{xref}
export async function GET(request, { params }) {
  const { id: treeId, path } = params;
  // Proxy logic
}

// app/api/v1/auth/login/route.js
// Handles: /api/v1/auth/login
export async function POST(request) {
  // Login logic
}
```

**Benefits:**
- API versioning support
- Consistent URL structure
- Easier to deprecate old versions
- Better for API documentation

---

## 4. Utility Organization

### Current State
- `lib/` - Server-side utilities (auth, API, permissions)
- `mycelia/utils/` - Mycelia-specific utilities
- Some duplication/overlap

### Suggested Consolidation

```
lib/
├── api/                           # API utilities
│   ├── client.js                  # Client-side API client
│   ├── server.js                  # Server-side API client
│   └── go-api.js                  # Go API client
├── auth/                          # Authentication utilities
│   ├── server.js                  # Server-side (hash, verify, JWT)
│   └── client.js                  # Client-side (token storage)
├── permissions/                   # Permission utilities
│   ├── check.js                   # Permission checking
│   └── tree-access.js             # Tree access control
└── prisma/                        # Database utilities
    └── client.js                  # Prisma client

mycelia/
└── utils/
    └── gedcom-api.js              # Mycelia-specific (event emitters, etc.)
```

**Sample Code:**
```javascript
// lib/api/client.js - Client-side API client
export class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async request(path, options = {}) {
    // Client-side request logic
  }
}

// lib/api/server.js - Server-side API client
export class ServerApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async request(path, options = {}) {
    // Server-side request logic (no cookies needed)
  }
}

// lib/api/go-api.js - Go API specific client
export class GoApiClient extends ApiClient {
  constructor() {
    super(process.env.NEXT_PUBLIC_GO_API_URL);
  }
  
  async getIndividuals(fileId, params) {
    return this.request(`/api/v1/files/${fileId}/individuals`, { params });
  }
}
```

**Benefits:**
- Clear separation of server vs client utilities
- Reduced duplication
- Better reusability
- Easier to test

---

## 5. Family Tree Visualization Integration

### Current State
- `family-tree-vis/` is a separate module
- Not fully integrated with component structure
- Types are in separate folder

### Suggested Integration

```
components/
└── features/
    └── family-tree/
        ├── charts/
        │   ├── PedigreeChart/
        │   ├── DescendantChart/
        │   └── FanChart/
        ├── controls/
        │   ├── TreeControls/
        │   └── ViewportControls/
        └── cards/
            └── PersonCard/

family-tree-vis/                  # Keep: Core logic
├── core/                         # Layout algorithms
│   ├── TreeLayout.js
│   └── ConnectorGenerator.js
├── renderers/                    # Rendering logic
│   └── KonvaRenderer.js
└── types/                        # Type definitions
    └── index.js
```

**Sample Integration:**
```javascript
// components/features/family-tree/charts/PedigreeChart/PedigreeChart.jsx
import { useFacet } from '@/mycelia/MyceliaProvider';
import { calculateTreeLayout } from '@/family-tree-vis/core/TreeLayout';
import { KonvaRenderer } from '@/family-tree-vis/renderers/KonvaRenderer';

export function PedigreeChart({ fileId, rootXref }) {
  const visualizer = useFacet('familyTreeVisualizer');
  // Component logic
}
```

**Benefits:**
- Better integration with component system
- Clear separation: components vs core logic
- Easier to find and use
- Follows established patterns

---

## 6. Mycelia Facet Organization

### Current State
```
mycelia/facets/
├── auth.js
└── gedcom/
    ├── index.js
    ├── files.js
    ├── individuals.js
    ├── families.js
    ├── graph.js
    ├── duplicates.js
    ├── dates.js
    ├── events.js
    ├── notes.js
    ├── places.js
    ├── sources.js
    └── family-tree-visualizer.js
```

### Suggested: Group by Domain

```
mycelia/facets/
├── auth.js                        # Authentication
├── gedcom/                        # GEDCOM data facets
│   ├── core/                      # Core data entities
│   │   ├── files.js
│   │   ├── individuals.js
│   │   ├── families.js
│   │   └── index.js
│   ├── relationships/             # Relationship queries
│   │   ├── graph.js
│   │   └── duplicates.js
│   ├── metadata/                  # Metadata facets
│   │   ├── dates.js
│   │   ├── events.js
│   │   ├── notes.js
│   │   ├── places.js
│   │   ├── sources.js
│   │   └── index.js
│   └── visualization/             # Visualization facets
│       ├── family-tree-visualizer.js
│       └── index.js
└── index.js                       # Main export
```

**Sample Export:**
```javascript
// mycelia/facets/gedcom/core/index.js
export { useGedcomFiles } from './files.js';
export { useGedcomIndividuals } from './individuals.js';
export { useGedcomFamilies } from './families.js';

// mycelia/facets/gedcom/index.js
export * from './core';
export * from './relationships';
export * from './metadata';
export * from './visualization';
```

**Benefits:**
- Logical grouping by domain
- Easier to understand relationships
- Better for large codebases
- Can lazy-load by domain

---

## 7. Hooks Organization

### Current State
- `hooks/` directory exists but unclear structure

### Suggested Structure

```
hooks/
├── mycelia/                       # Mycelia-specific hooks
│   ├── useFacet.js                # Facet access hook
│   └── useListener.js             # Event listener hook
├── api/                           # API hooks
│   └── useApi.js                  # Generic API hook
└── ui/                            # UI hooks
    ├── useTheme.js
    └── useModal.js
```

**Sample Hook:**
```javascript
// hooks/mycelia/useFacet.js
export function useFacet(facetName) {
  const system = useMyceliaSystem();
  return system.find(facetName);
}

// hooks/mycelia/useListener.js
export function useListener(eventType, callback) {
  const listeners = useFacet('listeners');
  useEffect(() => {
    const unsubscribe = listeners.on(eventType, callback);
    return unsubscribe;
  }, [eventType, callback]);
}
```

**Benefits:**
- Clear organization
- Reusable hooks
- Better discoverability
- Consistent patterns

---

## 8. Type Definitions

### Current State
- Types in `family-tree-vis/types/` (JSDoc)
- No centralized type definitions

### Suggested: Centralized Types

```
types/                             # NEW: Central type definitions
├── api/                           # API types
│   ├── individuals.js
│   ├── families.js
│   └── index.js
├── gedcom/                        # GEDCOM types
│   ├── individual.js
│   ├── family.js
│   └── index.js
├── visualization/                 # Visualization types
│   ├── tree.js
│   └── index.js
└── index.js                       # Main export
```

**Sample:**
```javascript
// types/gedcom/individual.js
/**
 * @typedef {Object} Individual
 * @property {string} xref
 * @property {string} [name]
 * @property {'M'|'F'|'U'} [gender]
 * ...
 */

// types/index.js
export * from './api';
export * from './gedcom';
export * from './visualization';
```

**Benefits:**
- Single source of truth for types
- Better IDE support
- Easier to maintain
- Can generate TypeScript definitions later

---

## 9. Testing Organization

### Current State
- Tests in `mycelia/facets/__tests__/`
- No clear structure for other tests

### Suggested Structure

```
__tests__/                         # Root test directory
├── unit/                          # Unit tests
│   ├── components/
│   ├── lib/
│   └── utils/
├── integration/                   # Integration tests
│   ├── api/
│   └── mycelia/
│       └── facets/
└── e2e/                           # End-to-end tests
    └── features/
```

**Benefits:**
- Clear test organization
- Easier to run specific test suites
- Better CI/CD integration
- Follows testing best practices

---

## 10. Configuration Management

### Current State
- Configuration scattered across files
- Environment variables used directly

### Suggested: Centralized Config

```
config/
├── index.js                       # Main config
├── api.js                         # API configuration
├── database.js                    # Database configuration
└── environment.js                 # Environment variables
```

**Sample:**
```javascript
// config/index.js
import { apiConfig } from './api.js';
import { dbConfig } from './database.js';
import { env } from './environment.js';

export const config = {
  api: apiConfig,
  database: dbConfig,
  env,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
};

// config/api.js
export const apiConfig = {
  goApi: {
    baseURL: process.env.NEXT_PUBLIC_GO_API_URL || 'http://localhost:8090',
    timeout: 30000,
  },
  nextApi: {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
    timeout: 30000,
  },
};
```

**Benefits:**
- Single source of truth for configuration
- Type-safe configuration
- Easier to test
- Better for different environments

---

## Priority Recommendations

### High Priority (Quick Wins)
1. **Move documentation to `docs/` folder** - Easy, high impact
2. **Organize components by feature** - Improves maintainability
3. **Consolidate utility functions** - Reduces duplication

### Medium Priority (Architectural Improvements)
4. **Reorganize Mycelia facets by domain** - Better scalability
5. **Centralize type definitions** - Better developer experience
6. **Improve API route structure** - Better for API versioning

### Low Priority (Nice to Have)
7. **Reorganize hooks** - Better organization
8. **Centralize configuration** - Better config management
9. **Improve test organization** - Better test structure

---

## Migration Strategy

### Phase 1: Documentation (1-2 hours)
1. Create `docs/` folder structure
2. Move markdown files to appropriate folders
3. Update any references
4. Create `docs/README.md` with index

### Phase 2: Components (2-4 hours)
1. Create `components/shared/` and `components/features/`
2. Move components to new structure
3. Update imports
4. Update `components/index.js`

### Phase 3: Utilities (2-3 hours)
1. Audit `lib/` and `mycelia/utils/`
2. Consolidate duplicate functions
3. Organize by domain
4. Update imports

### Phase 4: Facets (3-4 hours)
1. Create domain subfolders in `mycelia/facets/gedcom/`
2. Move facets to appropriate folders
3. Update exports
4. Update system builder

---

## Conclusion

The codebase is well-structured overall, but these refactorings would:
- **Improve maintainability** - Easier to find and modify code
- **Enhance scalability** - Better organization for growth
- **Better developer experience** - Clearer structure and patterns
- **Reduce technical debt** - Consolidate duplicated code

Start with high-priority items for quick wins, then gradually improve architecture.

