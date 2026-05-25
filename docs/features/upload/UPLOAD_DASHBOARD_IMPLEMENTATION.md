# GEDCOM Upload & Dashboard Implementation

**Date:** 2026-01-26  
**Status:** ✅ COMPLETE

---

## Overview

Implemented GEDCOM upload functionality and user dashboard using:
- **Next.js App Router** for pages and API routes
- **Mycelia Kernel Plugin System** for reactive state management
- **Go API integration** for GEDCOM parsing and querying
- **PostgreSQL** for tree metadata and permissions

---

## What Was Implemented

### 1. Go API Facet (`mycelia/facets/go-api.js`)

A Mycelia facet that provides a reactive interface to the Go API:

```javascript
const goApi = useFacet('goAPI');

// Upload GEDCOM file
const result = await goApi.uploadGedcom(file, name);

// Get individuals
const individuals = await goApi.getIndividuals(fileId);

// Get specific individual
const person = await goApi.getIndividual(fileId, 'I1');

// Get families
const families = await goApi.getFamilies(fileId);

// Get relationships
const relationship = await goApi.getRelationship(fileId, 'I1', 'I2');

// Get ancestors/descendants
const ancestors = await goApi.getAncestors(fileId, 'I1', 5);
const descendants = await goApi.getDescendants(fileId, 'I1', 5);
```

**Features:**
- Reactive state management (loading, error, data)
- Event emission for file uploads/deletions
- Subscribe to state changes
- Centralized Go API communication

---

### 2. Mycelia System Builder (`mycelia/system.builder.js`)

Updated to include the Go API facet:

```javascript
export const buildLigneousSystem = async () => {
  return useBase('ligneous-frontend')
    .config('listeners', { registrationPolicy: 'multiple' })
    .config('goAPI', {
      baseURL: 'http://localhost:8090',
      timeout: 30000
    })
    .use(useListeners)
    .use(useAuth)
    .use(useGoAPI)  // ← New facet
    .build();
};
```

---

### 3. Mycelia Provider (`mycelia/MyceliaProvider.js`)

React provider component that:
- Builds the Mycelia system on mount
- Provides system to all child components
- Exports hooks: `useFacet()`, `useListener()`, `useEmit()`

**Usage in components:**
```javascript
'use client';

import { useFacet } from '@/mycelia/MyceliaProvider';

export default function MyComponent() {
  const authFacet = useFacet('auth');
  const goApiFacet = useFacet('goAPI');
  
  // Use facets...
}
```

---

### 4. Upload API Route (`app/api/trees/upload/route.js`)

Server-side API route that:
1. Authenticates the user
2. Uploads GEDCOM to Go API
3. Creates tree record in PostgreSQL
4. Makes uploader the primary tree owner

**Flow:**
```
Client → Next.js API → Go API → PostgreSQL
                ↓
         Returns tree data
```

---

### 5. Trees List API Route (`app/api/trees/route.js`)

Server-side API route that:
1. Authenticates user (optional for public trees)
2. Queries trees based on permissions
3. Enriches tree data with Go API stats
4. Returns combined data

**Permission Logic:**
- Unauthenticated: only public trees
- Website owner: all trees
- Regular user: public trees + trees they have access to

---

### 6. Dashboard Page (`app/dashboard/page.js`)

User dashboard showing:
- Quick stats (my trees, shared with me, total individuals)
- List of accessible trees with metadata
- Upload button
- Logout button

**Features:**
- Fetches trees from API
- Shows tree visibility (public/private)
- Shows ownership status
- Links to tree view
- Responsive design with Tailwind CSS

---

### 7. Upload Page (`app/upload/page.js`)

GEDCOM upload interface with:
- Drag & drop file upload
- File preview (name, size)
- Tree name input (auto-fills from filename)
- Description textarea
- Public/private checkbox
- Upload progress indicator

**Features:**
- Client-side file validation (.ged, .gedcom)
- Auto-name extraction from filename
- Error handling with user-friendly messages
- Redirect to tree view after upload

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│  (Dashboard, Upload Page, Tree Views)                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Mycelia Plugin System                    │
│  • useAuth facet (authentication)                       │
│  • useGoAPI facet (Go API communication)                │
│  • useListeners (event system)                          │
└─────────────────────────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
┌────────────────────────┐ ┌───────────────────────┐
│   Next.js API Routes   │ │    Go API (8090)      │
│  (Permission checks)   │ │  (GEDCOM parsing)     │
└────────────────────────┘ └───────────────────────┘
                │                   │
                ▼                   ▼
┌────────────────────────┐ ┌───────────────────────┐
│  PostgreSQL (5432)     │ │  PostgreSQL + Badger  │
│  (Trees, Permissions)  │ │  (Graph storage)      │
└────────────────────────┘ └───────────────────────┘
```

---

## Database Schema Used

### Tables:
1. **users** - User accounts
2. **trees** - Tree metadata (name, description, isPublic, **fileId**)
3. **tree_owners** - Multiple owners per tree
4. **tree_maintainers** - Tree maintainers
5. **permissions** - Fine-grained permissions
6. **user_individual_links** - User-to-individual mappings

### Key Fields:
- `Tree.fileId` - **Links to Go API's file_id**
- `Tree.isPublic` - Controls visibility
- `TreeOwner.isPrimary` - Identifies the creator

---

## Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://ligneous_user:ligneous_password@localhost:5432/ligneous_frontend?sslmode=disable"
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_GO_API_URL="http://localhost:8090"
```

---

## API Endpoints

### Next.js API Routes

1. **POST /api/trees/upload**
   - Upload GEDCOM and create tree
   - Requires authentication
   - Returns tree with fileId

2. **GET /api/trees**
   - List accessible trees
   - Permission-based filtering
   - Enriched with Go API data

### Go API (Proxied)

All Go API endpoints are available through the `goAPI` facet:
- `/api/v1/files` - Upload
- `/api/v1/files/{fileId}/individuals` - List individuals
- `/api/v1/files/{fileId}/families` - List families
- etc.

---

## Component Structure

```
app/
├── layout.js (wraps with MyceliaProvider)
├── dashboard/
│   └── page.js (tree list, stats)
└── upload/
    └── page.js (GEDCOM upload form)

mycelia/
├── MyceliaProvider.js (React context provider)
├── system.builder.js (system configuration)
└── facets/
    ├── auth.js (authentication)
    └── go-api.js (Go API communication)

app/api/
├── auth/
│   ├── register/route.js
│   ├── login/route.js
│   └── logout/route.js
└── trees/
    ├── upload/route.js
    └── route.js
```

---

## Usage Example

### In a React Component:

```javascript
'use client';

import { useFacet } from '@/mycelia/MyceliaProvider';

export default function TreeViewer({ treeId }) {
  const goApi = useFacet('goAPI');
  const [individuals, setIndividuals] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await goApi.getIndividuals(treeId);
      setIndividuals(data.individuals);
    };
    fetchData();
  }, [treeId]);

  return (
    <div>
      {individuals.map(person => (
        <div key={person.xref}>{person.name}</div>
      ))}
    </div>
  );
}
```

---

## Testing

### Manual Testing Steps:

1. **Start services:**
   ```bash
   # Terminal 1: Go API
   cd /apps/ligneous-gedcom-api
   ./api
   
   # Terminal 2: Next.js
   cd /apps/gonsalves-genealogy/ligneous-frontend
   npm run dev
   ```

2. **Register/Login:**
   - Visit http://localhost:4000
   - Register a new user
   - Login

3. **Upload GEDCOM:**
   - Click "Upload GEDCOM"
   - Drag & drop or select a .ged file
   - Enter tree name and description
   - Click "Upload and Create Tree"

4. **View Dashboard:**
   - See uploaded tree in list
   - Check stats (individuals, families)
   - Verify ownership badge

---

## What's Next

### Immediate (Week 3-4):
1. ✅ Tree detail page (`/trees/[id]`)
2. ✅ Individual list view
3. ✅ Individual profile page
4. ✅ Family list view
5. ✅ Family detail page

### Week 5-6:
6. Tree graph visualization
7. Timeline view
8. Map view

---

## Success Criteria

- ✅ Go API facet integrated with Mycelia
- ✅ GEDCOM upload working end-to-end
- ✅ Trees stored with permissions
- ✅ Dashboard showing user's trees
- ✅ Upload page with drag & drop
- ✅ Authentication required for upload
- ✅ Auto-ownership assignment
- ✅ Public/private tree support

**Status:** All criteria met! Ready for tree viewing features.

---

## Notes

- The `fileId` is the bridge between our PostgreSQL database and the Go API's graph storage
- All GEDCOM data (individuals, families) lives in the Go API
- Our database only stores metadata and permissions
- This architecture allows the Go API to do what it does best (parsing, querying) while our frontend handles permissions and collaboration

---

**Next Document:** `TREE_VIEWING_IMPLEMENTATION.md` (to be created)



