# Ligneous Frontend - Comprehensive Summary

**Date:** February 15, 2026  
**Framework:** Next.js 16 (App Router)  
**Port:** 4000  
**Status:** Production-Ready

This document provides a comprehensive overview of everything the frontend does, including all pages, components, Mycelia facets, API routes, and functionality.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Pages & Routes](#pages--routes)
5. [Mycelia Facets (Domain Logic)](#mycelia-facets-domain-logic)
6. [Next.js API Routes (Gateway)](#nextjs-api-routes-gateway)
7. [Components](#components)
8. [Database Integration](#database-integration)
9. [Features & Functionality](#features--functionality)
10. [State Management](#state-management)

---

## Architecture Overview

### Design Pattern: **Mycelia Plugin System**

The frontend uses a **domain-driven architecture** with the Mycelia Plugin System:

```
┌─────────────────────────────────────────────────────────┐
│              React Components (UI Layer)                │
│  - Pages, components, layouts                            │
│  - Presentation-only, no business logic                 │
└───────────────────────┬─────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────────┐
│         Mycelia Facets (Domain Logic Layer)              │
│  - useAuth, useGedcomFiles, useGedcomIndividuals, etc.   │
│  - Event-driven state management                         │
│  - Framework-agnostic business logic                      │
└───────────────────────┬─────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────────┐
│      Next.js API Routes (Gateway/Proxy Layer)           │
│  - /api/auth/* - Authentication                          │
│  - /api/trees/* - Tree management                       │
│  - /api/trees/[id]/[...path] - Proxy to Go API          │
│  - /api/albums/* - Album management                     │
│  - /api/tags/* - Tag management                         │
└───────────────────────┬─────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────────┐
│              Go API (Backend Service)                   │
│  - GEDCOM file processing                                │
│  - Graph operations                                      │
│  - Relationship queries                                  │
│  - Port 8090                                             │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Thin UI Layer**: React components are presentation-only
2. **Domain Logic in Facets**: All business logic in Mycelia facets
3. **Event-Driven**: Facets emit events, React listens and updates
4. **Gateway Pattern**: Next.js API routes proxy to Go API
5. **Multi-Tenant**: User authentication, tree ownership, permissions

---

## Technology Stack

### Core Framework
- **Next.js 16** - React framework with App Router
- **React 19.2.3** - UI library
- **JavaScript** (not TypeScript) - Language

### State Management
- **Mycelia Plugin System** - Domain logic and state management
- **Event-Driven Architecture** - Facets emit events, React listens

### Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **CSS Variables** - Theme system (dark mode support)

### HTTP Client
- **Axios** - HTTP requests
- **Next.js API Routes** - Server-side proxy to Go API

### Database
- **PostgreSQL** - Primary database (via Prisma ORM)
- **Prisma** - Database ORM and migrations

### Visualization
- **D3.js** - Data visualization library
- **Konva.js** - 2D canvas library
- **React-Konva** - React bindings for Konva

### Authentication
- **JWT** (jsonwebtoken) - Token-based authentication
- **bcrypt** - Password hashing

---

## Project Structure

```
ligneous-frontend/
├── app/                          # Next.js App Router
│   ├── page.js                   # Home page
│   ├── layout.js                 # Root layout
│   ├── providers.js              # MyceliaProvider wrapper
│   ├── (auth)/                   # Auth routes
│   │   ├── login/                # Login page
│   │   └── register/             # Registration page
│   ├── dashboard/                # Dashboard page
│   ├── upload/                   # GEDCOM upload page
│   ├── explore/                  # Explore public trees
│   ├── search/                   # Search page
│   ├── admin/                    # Admin pages
│   └── api/                      # Next.js API routes (gateway)
│       ├── auth/                 # Authentication endpoints
│       ├── trees/                # Tree management endpoints
│       ├── albums/               # Album management endpoints
│       ├── tags/                 # Tag management endpoints
│       └── me/                   # User profile endpoints
│
├── mycelia/                      # Mycelia Plugin System
│   ├── system.builder.js         # System builder (configures all facets)
│   ├── MyceliaProvider.js        # React provider component
│   └── facets/                   # Domain logic facets
│       ├── auth.js               # Authentication facet
│       ├── albums.js             # Album management facet
│       ├── tags.js               # Tag management facet
│       └── gedcom/               # GEDCOM-related facets
│           ├── core/             # Core data operations
│           │   ├── files.js      # File management
│           │   ├── individuals.js # Individual queries
│           │   ├── families.js  # Family queries
│           │   └── graph.js     # Graph operations
│           ├── metadata/         # Metadata operations
│           │   ├── dates.js      # Date queries
│           │   ├── events.js     # Event queries
│           │   ├── notes.js      # Note queries
│           │   ├── sources.js    # Source queries
│           │   └── places.js      # Place queries
│           ├── analysis/         # Analysis operations
│           │   └── duplicates.js # Duplicate detection
│           └── visualization/   # Visualization operations
│               └── family-tree-visualizer.js # Family tree visualization
│
├── components/                   # React components
│   ├── shared/                  # Reusable UI components
│   │   ├── theme/               # Theme components
│   │   └── notifications/       # Notification components
│   ├── features/                # Feature-specific components
│   │   ├── dashboard/           # Dashboard components
│   │   ├── search/              # Search components
│   │   ├── trees/               # Tree components
│   │   └── family-tree/        # Family tree visualization
│   └── layout/                  # Layout components
│
├── hooks/                       # React hooks (wrappers)
│   └── useRequireAuth.js        # Auth requirement hook
│
├── lib/                         # Utilities
│   ├── api/                     # API client utilities
│   ├── auth/                    # Auth utilities (server & client)
│   ├── database/                # Database utilities (Prisma)
│   └── permissions/             # Permission utilities
│
├── config/                      # Configuration
│   ├── environment.js           # Environment variables
│   ├── api.js                   # API configuration
│   ├── database.js              # Database configuration
│   └── auth.js                  # Auth configuration
│
├── prisma/                      # Prisma ORM
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
│
└── docs/                        # Documentation
    ├── architecture/            # Architecture docs
    ├── implementation/           # Implementation docs
    ├── features/                 # Feature docs
    ├── testing/                  # Testing docs
    └── api/                      # API docs
```

---

## Pages & Routes

### Public Pages

#### 1. Home Page (`/`)
**File:** `app/page.js`

**What it does:**
- Landing page for the application
- Shows welcome message
- Displays authentication status
- Links to login/register if not authenticated
- Shows logout button if authenticated

**Components Used:**
- Mycelia `useAuth` facet
- Next.js `Link` component

---

#### 2. Login Page (`/login`)
**File:** `app/login/page.js`

**What it does:**
- User authentication form
- Username/password input
- Error handling
- Redirects to dashboard on success

**Mycelia Facets Used:**
- `useAuth.login()`

**API Calls:**
- `POST /api/auth/login`

---

#### 3. Register Page (`/register`)
**File:** `app/register/page.js`

**What it does:**
- User registration form
- Username, email, password fields
- Password confirmation
- Error handling
- Redirects to login on success

**Mycelia Facets Used:**
- `useAuth.register()`

**API Calls:**
- `POST /api/auth/register`

---

### Authenticated Pages

#### 4. Dashboard (`/dashboard`)
**File:** `app/dashboard/page.js`

**What it does:**
- Main user dashboard
- Displays user statistics (trees owned, total individuals, collaborators, pending requests)
- Shows "My Trees" section
- Shows "Explore Public Trees" section
- Recent activity feed
- Quick actions (upload, search, connections)
- Admin panel (for superusers)

**Components Used:**
- `DashboardLayout`
- `ExploreTrees`
- `RecentActivity`
- `PendingRequests`
- `GlobalSearch`

**API Calls:**
- `GET /api/me/stats` - User statistics

**Features:**
- Responsive design (mobile/desktop)
- Dark mode support
- Superuser admin panel

---

#### 5. Upload Page (`/upload`)
**File:** `app/upload/page.js`

**What it does:**
- GEDCOM file upload interface
- Drag-and-drop file upload
- File validation
- Upload progress tracking
- Tree creation after upload
- Error handling

**Mycelia Facets Used:**
- `useGedcomFiles.uploadFile()`

**API Calls:**
- `POST /api/trees/upload` - Upload GEDCOM file

---

#### 6. Explore Page (`/explore`)
**Purpose:** Browse public family trees

**What it does:**
- Lists all public trees
- Search and filter trees
- Tree cards with previews
- Pagination

**Components Used:**
- `ExploreTrees`
- `TreeCard`

---

#### 7. Search Page (`/search`)
**Purpose:** Global search across trees

**What it does:**
- Search individuals, families, places, sources, notes
- Advanced filters
- Results display

**Mycelia Facets Used:**
- `useGedcomIndividuals`
- `useGedcomFamilies`
- `useGedcomPlaces`
- `useGedcomSources`
- `useGedcomNotes`

---

#### 8. Admin Pages (`/admin/*`)
**Purpose:** Administrative interface (superuser only)

**Pages:**
- `/admin/users` - User management
- `/admin/trees` - Tree management
- `/admin/requests` - Access request management

**Features:**
- User CRUD operations
- Tree management
- Access request approval/rejection

---

## Mycelia Facets (Domain Logic)

### Authentication Facet

**File:** `mycelia/facets/auth.js`  
**Hook:** `useAuth`

**What it does:**
- Manages user authentication state
- Handles login, logout, registration
- Token management (localStorage)
- User session management
- Emits authentication events

**Methods:**
- `login(username, password)` - Authenticate user
- `logout()` - Clear session
- `register(username, email, password)` - Create new user
- `getCurrentUser()` - Get current user info
- `getState()` - Get current auth state

**Events Emitted:**
- `auth:stateChanged` - When auth state changes
- `auth:login` - On successful login
- `auth:logout` - On logout

**API Endpoints Used:**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/logout`

---

### GEDCOM Core Facets

#### 1. Files Facet

**File:** `mycelia/facets/gedcom/core/files.js`  
**Hook:** `useGedcomFiles`

**What it does:**
- Manages GEDCOM file operations
- Upload, list, get info, delete files
- File validation
- File status tracking

**Methods:**
- `uploadFile(file, name)` - Upload GEDCOM file
- `listFiles()` - List all files
- `getFileInfo(fileID)` - Get file metadata
- `deleteFile(fileID)` - Delete file
- `validateFile(fileID)` - Validate GEDCOM structure

**Events Emitted:**
- `gedcomFiles:file:uploaded`
- `gedcomFiles:file:deleted`
- `gedcomFiles:stateChanged`

**API Endpoints Used:**
- `POST /api/trees/upload` → Proxies to `POST /api/v1/files`
- `GET /api/trees/[id]` → Proxies to `GET /api/v1/files/{file_id}`
- `DELETE /api/trees/[id]` → Proxies to `DELETE /api/v1/files/{file_id}`

---

#### 2. Individuals Facet

**File:** `mycelia/facets/gedcom/core/individuals.js`  
**Hook:** `useGedcomIndividuals`

**What it does:**
- Query individuals from GEDCOM files
- Search individuals
- Get individual details
- Get relationships (parents, children, siblings, spouses)
- Get ancestors/descendants

**Methods:**
- `listIndividuals(fileID, filters)` - List individuals with filters
- `getIndividual(fileID, xref)` - Get individual by XREF
- `searchIndividuals(fileID, query)` - Search individuals
- `getParents(fileID, xref)` - Get parents
- `getChildren(fileID, xref)` - Get children
- `getSiblings(fileID, xref)` - Get siblings
- `getSpouses(fileID, xref)` - Get spouses
- `getAncestors(fileID, xref, generations)` - Get ancestors
- `getDescendants(fileID, xref, generations)` - Get descendants

**Events Emitted:**
- `gedcomIndividuals:individual:loaded`
- `gedcomIndividuals:stateChanged`

**API Endpoints Used:**
- `GET /api/trees/[id]/individuals` → Proxies to `GET /api/v1/files/{file_id}/individuals`
- `GET /api/trees/[id]/individuals/[xref]` → Proxies to `GET /api/v1/files/{file_id}/individuals/{xref}`
- `POST /api/trees/[id]/individuals/search` → Proxies to `POST /api/v1/files/{file_id}/individuals/search`
- `GET /api/trees/[id]/individuals/[xref]/parents` → Proxies to `GET /api/v1/files/{file_id}/individuals/{xref}/parents`

---

#### 3. Families Facet

**File:** `mycelia/facets/gedcom/core/families.js`  
**Hook:** `useGedcomFamilies`

**What it does:**
- Query families from GEDCOM files
- Get family details
- Get family members (husband, wife, children)

**Methods:**
- `listFamilies(fileID, filters)` - List families
- `getFamily(fileID, xref)` - Get family by XREF

**API Endpoints Used:**
- `GET /api/trees/[id]/families` → Proxies to `GET /api/v1/files/{file_id}/families`
- `GET /api/trees/[id]/families/[xref]` → Proxies to `GET /api/v1/files/{file_id}/families/{xref}`

---

#### 4. Graph Facet

**File:** `mycelia/facets/gedcom/core/graph.js`  
**Hook:** `useGedcomGraph`

**What it does:**
- Graph analytics and metrics
- Relationship calculations
- Path finding between individuals
- Centrality measures

**Methods:**
- `getMetrics(fileID)` - Get graph metrics
- `getCentrality(fileID, type)` - Get centrality measures
- `getMostConnected(fileID, limit, type)` - Get most connected individuals
- `calculateRelationship(fileID, xref1, xref2)` - Calculate relationship
- `findPaths(fileID, xref1, xref2)` - Find paths between individuals

**API Endpoints Used:**
- `GET /api/trees/[id]/metrics` → Proxies to `GET /api/v1/files/{file_id}/metrics`
- `GET /api/trees/[id]/centrality` → Proxies to `GET /api/v1/files/{file_id}/centrality`
- `GET /api/trees/[id]/individuals/[xref1]/relationship/[xref2]` → Proxies to relationship endpoint

---

### GEDCOM Metadata Facets

#### 5. Dates Facet

**File:** `mycelia/facets/gedcom/metadata/dates.js`  
**Hook:** `useGedcomDates`

**What it does:**
- Query normalized dates
- Filter by year, type, calendar
- Get events associated with dates

**Methods:**
- `listDates(fileID, filters)` - List dates
- `getDate(fileID, dateID)` - Get date details
- `getDateEvents(fileID, dateID)` - Get events for a date

**API Endpoints Used:**
- `GET /api/trees/[id]/dates` → Proxies to Go API dates endpoints

---

#### 6. Events Facet

**File:** `mycelia/facets/gedcom/metadata/events.js`  
**Hook:** `useGedcomEvents`

**What it does:**
- Query events (birth, death, marriage, etc.)
- Filter by type, date, place
- Get event participants

**Methods:**
- `listEvents(fileID, filters)` - List events
- `getEvent(fileID, eventID)` - Get event details

**API Endpoints Used:**
- `GET /api/trees/[id]/events` → Proxies to Go API events endpoints

---

#### 7. Notes Facet

**File:** `mycelia/facets/gedcom/metadata/notes.js`  
**Hook:** `useGedcomNotes`

**What it does:**
- Query notes
- Search notes by content
- Get notes by owner (individual, family, event)

**Methods:**
- `listNotes(fileID, filters)` - List notes
- `getNote(fileID, xref)` - Get note by XREF
- `searchNotes(fileID, query)` - Search notes
- `getNotesByOwner(fileID, ownerType, ownerID)` - Get notes for owner

**API Endpoints Used:**
- `GET /api/trees/[id]/notes` → Proxies to Go API notes endpoints
- `POST /api/trees/[id]/notes/search` → Proxies to Go API search endpoint

---

#### 8. Sources Facet

**File:** `mycelia/facets/gedcom/metadata/sources.js`  
**Hook:** `useGedcomSources`

**What it does:**
- Query sources
- Get source citations
- Search sources

**Methods:**
- `listSources(fileID, filters)` - List sources
- `getSource(fileID, xref)` - Get source by XREF
- `getSourceCitations(fileID, xref)` - Get citations for source
- `searchSources(fileID, query)` - Search sources

**API Endpoints Used:**
- `GET /api/trees/[id]/sources` → Proxies to Go API sources endpoints

---

#### 9. Places Facet

**File:** `mycelia/facets/gedcom/metadata/places.js`  
**Hook:** `useGedcomPlaces`

**What it does:**
- Query normalized places
- Search places
- Get events at a place

**Methods:**
- `listPlaces(fileID, filters)` - List places
- `getPlace(fileID, placeID)` - Get place details
- `getPlaceEvents(fileID, placeID)` - Get events at place
- `searchPlaces(fileID, query)` - Search places

**API Endpoints Used:**
- `GET /api/trees/[id]/places` → Proxies to Go API places endpoints

---

### GEDCOM Analysis Facets

#### 10. Duplicates Facet

**File:** `mycelia/facets/gedcom/analysis/duplicates.js`  
**Hook:** `useGedcomDuplicates`

**What it does:**
- Find duplicate individuals within a file
- Compare two files for duplicates
- Fuzzy matching algorithms

**Methods:**
- `findDuplicates(fileID, options)` - Find duplicates in file
- `compareFiles(fileID1, fileID2, options)` - Compare two files

**API Endpoints Used:**
- `POST /api/trees/[id]/duplicates` → Proxies to `POST /api/v1/files/{file_id}/duplicates`
- `POST /api/duplicates/compare` → Proxies to `POST /api/v1/duplicates/compare`

---

### GEDCOM Visualization Facets

#### 11. Family Tree Visualizer Facet

**File:** `mycelia/facets/gedcom/visualization/family-tree-visualizer.js`  
**Hook:** `useFamilyTreeVisualizer`

**What it does:**
- Family tree visualization
- Layout calculations (using D3.js)
- Rendering (using Konva.js)
- Pedigree charts
- General family tree layouts

**Methods:**
- `calculateLayout(fileID, rootXref, options)` - Calculate node positions
- `generateConnectors(nodes, edges)` - Generate connector paths
- `renderTree(canvas, layout)` - Render tree to canvas

**Libraries Used:**
- D3.js - Layout calculations
- Konva.js - Canvas rendering

---

### Albums Facet

**File:** `mycelia/facets/albums.js`  
**Hook:** `useAlbums`

**What it does:**
- Album management (collections of media)
- Create, list, get, update, delete albums
- Share albums with users
- Add/remove media from albums

**Methods:**
- `createAlbum(name, description, isPublic)` - Create album
- `listAlbums(filters)` - List albums
- `getAlbum(albumID)` - Get album details
- `updateAlbum(albumID, updates)` - Update album
- `deleteAlbum(albumID)` - Delete album
- `addMedia(albumID, mediaID)` - Add media to album
- `removeMedia(albumID, mediaID)` - Remove media from album
- `shareAlbum(albumID, userId, permission)` - Share album

**Database Tables Used:**
- `albums` - Album records
- `album_media` - Album-media junction
- `album_shares` - Album sharing

**API Endpoints:**
- `GET /api/albums` - List albums
- `POST /api/albums` - Create album
- `GET /api/albums/[id]` - Get album
- `PUT /api/albums/[id]` - Update album
- `DELETE /api/albums/[id]` - Delete album
- `POST /api/albums/[id]/share/[userId]` - Share album
- `DELETE /api/albums/[id]/share/[userId]` - Unshare album

---

### Tags Facet

**File:** `mycelia/facets/tags.js`  
**Hook:** `useTags`

**What it does:**
- Universal tagging system
- Tag any entity type (media, event, individual, family, note, source, place, date)
- Global tags and user-specific tags
- Tag management (create, list, update, delete)
- Tag items (add/remove tags from entities)

**Methods:**
- `createTag(name, color, isGlobal)` - Create tag
- `listTags(filters)` - List tags
- `getTag(tagID)` - Get tag details
- `updateTag(tagID, updates)` - Update tag
- `deleteTag(tagID)` - Delete tag
- `tagEntity(entityType, entityID, tagID)` - Tag an entity
- `untagEntity(entityType, entityID, tagID)` - Remove tag from entity
- `getEntityTags(entityType, entityID)` - Get tags for entity
- `getTagItems(tagID)` - Get all items with tag

**Database Tables Used:**
- `tags` - Tag records
- `tag_items` - Entity-tag junction (polymorphic)

**API Endpoints:**
- `GET /api/tags` - List tags
- `POST /api/tags` - Create tag
- `GET /api/tags/[id]` - Get tag
- `PUT /api/tags/[id]` - Update tag
- `DELETE /api/tags/[id]` - Delete tag
- `GET /api/tags/[id]/items` - Get items with tag
- `POST /api/tags/[id]/items` - Tag an item
- `DELETE /api/tags/[id]/items` - Untag an item
- `GET /api/trees/[treeId]/entities/[entityType]/[entityId]/tags` - Get tags for entity
- `POST /api/trees/[treeId]/entities/[entityType]/[entityId]/tags` - Tag entity
- `DELETE /api/trees/[treeId]/entities/[entityType]/[entityId]/tags` - Untag entity

---

## Next.js API Routes (Gateway)

The frontend includes Next.js API routes that act as a gateway/proxy to the Go API. These routes handle:
- Authentication (JWT validation)
- Request proxying to Go API
- Response transformation
- Error handling

### Authentication Routes

**Location:** `app/api/auth/`

#### POST `/api/auth/register`
- Creates new user account
- Hashes password with bcrypt
- Stores user in PostgreSQL
- Returns JWT token

**Database Operations:**
- `INSERT INTO users` - Create user record

---

#### POST `/api/auth/login`
- Authenticates user
- Validates password
- Returns JWT token

**Database Operations:**
- `SELECT * FROM users WHERE username = $1` - Find user
- Password comparison with bcrypt

---

#### GET `/api/auth/me`
- Gets current user from JWT token
- Returns user information

**Database Operations:**
- `SELECT * FROM users WHERE id = $1` - Get user by ID

---

#### POST `/api/auth/logout`
- Logs out user (client-side token removal)
- Server-side session cleanup (if needed)

---

### Tree Management Routes

**Location:** `app/api/trees/`

#### POST `/api/trees/upload`
- Proxies to Go API: `POST /api/v1/files`
- Handles multipart file upload
- Creates tree record in PostgreSQL
- Links uploaded file to tree

**Database Operations:**
- `INSERT INTO trees` - Create tree record
- `INSERT INTO tree_files` - Link file to tree

---

#### GET `/api/trees`
- Lists all trees (with permissions)
- Filters by ownership, collaboration, public
- Returns tree metadata

**Database Operations:**
- `SELECT * FROM trees WHERE ...` - Query trees with permissions
- `SELECT * FROM tree_collaborators` - Get collaborators
- `SELECT * FROM tree_files` - Get file associations

---

#### GET `/api/trees/[id]`
- Gets tree metadata
- Checks permissions
- Proxies file info to Go API

**Database Operations:**
- `SELECT * FROM trees WHERE id = $1` - Get tree
- Permission checks via `tree_collaborators` table

---

#### PUT `/api/trees/[id]`
- Updates tree metadata (name, description, isPublic)
- Requires ownership or edit permission

**Database Operations:**
- `UPDATE trees SET ... WHERE id = $1` - Update tree

---

#### DELETE `/api/trees/[id]`
- Deletes tree and all associated data
- Requires ownership
- Cascades to Go API file deletion

**Database Operations:**
- `DELETE FROM trees WHERE id = $1` - Delete tree (CASCADE)

---

### Tree Proxy Routes

**Location:** `app/api/trees/[id]/[...path]/route.js`

#### All `/api/trees/[id]/*` routes
- **Universal proxy** to Go API
- Path: `/api/trees/[id]/individuals` → `GET /api/v1/files/{file_id}/individuals`
- Path: `/api/trees/[id]/families` → `GET /api/v1/files/{file_id}/families`
- Path: `/api/trees/[id]/statistics` → `GET /api/v1/files/{file_id}/statistics`
- Path: `/api/trees/[id]/export/gedcom` → `GET /api/v1/files/{file_id}/export/gedcom`
- And all other Go API endpoints

**What it does:**
- Extracts tree ID from path
- Gets file ID from `tree_files` table
- Proxies request to Go API with file ID
- Returns Go API response

**Database Operations:**
- `SELECT file_id FROM tree_files WHERE tree_id = $1` - Get file ID for tree

---

### Albums Routes

**Location:** `app/api/albums/`

#### GET `/api/albums`
- Lists albums (user's albums + shared albums)
- Filters by ownership, sharing

**Database Operations:**
- `SELECT * FROM albums WHERE owner_id = $1 OR id IN (SELECT album_id FROM album_shares WHERE user_id = $1)`

---

#### POST `/api/albums`
- Creates new album
- Sets owner to current user

**Database Operations:**
- `INSERT INTO albums` - Create album

---

#### GET `/api/albums/[id]`
- Gets album details
- Includes media items
- Checks permissions

**Database Operations:**
- `SELECT * FROM albums WHERE id = $1` - Get album
- `SELECT * FROM album_media WHERE album_id = $1` - Get media items

---

#### PUT `/api/albums/[id]`
- Updates album metadata
- Requires ownership

**Database Operations:**
- `UPDATE albums SET ... WHERE id = $1` - Update album

---

#### DELETE `/api/albums/[id]`
- Deletes album
- Requires ownership

**Database Operations:**
- `DELETE FROM albums WHERE id = $1` - Delete album (CASCADE)

---

#### POST `/api/albums/[id]/share/[userId]`
- Shares album with user
- Sets permission level

**Database Operations:**
- `INSERT INTO album_shares` - Share album

---

#### DELETE `/api/albums/[id]/share/[userId]`
- Unshares album from user

**Database Operations:**
- `DELETE FROM album_shares WHERE album_id = $1 AND user_id = $2`

---

### Tags Routes

**Location:** `app/api/tags/`

#### GET `/api/tags`
- Lists tags (global + user's tags)
- Filters by type, ownership

**Database Operations:**
- `SELECT * FROM tags WHERE is_global = true OR owner_id = $1`

---

#### POST `/api/tags`
- Creates new tag
- Sets owner (if not global)

**Database Operations:**
- `INSERT INTO tags` - Create tag

---

#### GET `/api/tags/[id]`
- Gets tag details
- Includes item count

**Database Operations:**
- `SELECT * FROM tags WHERE id = $1` - Get tag
- `SELECT COUNT(*) FROM tag_items WHERE tag_id = $1` - Count items

---

#### PUT `/api/tags/[id]`
- Updates tag metadata
- Requires ownership

**Database Operations:**
- `UPDATE tags SET ... WHERE id = $1` - Update tag

---

#### DELETE `/api/tags/[id]`
- Deletes tag
- Requires ownership
- Cascades to tag_items

**Database Operations:**
- `DELETE FROM tags WHERE id = $1` - Delete tag (CASCADE)

---

#### GET `/api/tags/[id]/items`
- Gets all items with tag
- Supports filtering by entity type

**Database Operations:**
- `SELECT * FROM tag_items WHERE tag_id = $1 [AND entity_type = $2]`

---

#### POST `/api/tags/[id]/items`
- Tags an item
- Creates tag_item record

**Database Operations:**
- `INSERT INTO tag_items` - Tag item

---

#### DELETE `/api/tags/[id]/items`
- Untags an item

**Database Operations:**
- `DELETE FROM tag_items WHERE tag_id = $1 AND entity_type = $2 AND entity_id = $3`

---

#### Entity Tag Routes

**Location:** `app/api/trees/[treeId]/entities/[entityType]/[entityId]/tags/`

#### GET `/api/trees/[treeId]/entities/[entityType]/[entityId]/tags`
- Gets all tags for an entity

**Database Operations:**
- `SELECT * FROM tag_items WHERE entity_type = $1 AND entity_id = $2`

---

#### POST `/api/trees/[treeId]/entities/[entityType]/[entityId]/tags`
- Tags an entity
- Creates tag_item record

**Database Operations:**
- `INSERT INTO tag_items` - Tag entity

---

#### DELETE `/api/trees/[treeId]/entities/[entityType]/[entityId]/tags`
- Untags an entity

**Database Operations:**
- `DELETE FROM tag_items WHERE tag_id = $1 AND entity_type = $2 AND entity_id = $3`

---

### User Profile Routes

**Location:** `app/api/me/`

#### GET `/api/me/stats`
- Gets user statistics
- Trees owned, total individuals, collaborators, pending requests

**Database Operations:**
- `SELECT COUNT(*) FROM trees WHERE owner_id = $1` - Trees owned
- `SELECT COUNT(*) FROM tree_collaborators WHERE user_id = $1` - Collaborations
- `SELECT COUNT(*) FROM access_requests WHERE user_id = $1 AND status = 'pending'` - Pending requests

---

## Components

### Shared Components

**Location:** `components/shared/`

#### Theme Components
- Theme provider
- Dark mode toggle
- CSS variable management

#### Notification Components
- Toast notifications
- Alert messages
- Error displays

---

### Feature Components

**Location:** `components/features/`

#### Dashboard Components
- `DashboardLayout` - Main dashboard layout
- `StatCard` - Statistics display card
- `RecentActivity` - Activity feed
- `PendingRequests` - Access request list
- `GlobalSearch` - Search bar component

#### Tree Components
- `TreeCard` - Tree display card with preview
- `ExploreTrees` - Tree listing component
- `TreeList` - Tree list with filters

#### Search Components
- `SearchBar` - Search input
- `SearchResults` - Results display
- `SearchFilters` - Filter controls

#### Family Tree Components
- `FamilyTreeView` - Main tree visualization
- `PedigreeChart` - Pedigree chart display
- `TreeControls` - Zoom, pan, filter controls

---

## Database Integration

### Prisma ORM

**Location:** `prisma/`

**Schema File:** `prisma/schema.prisma`

**Database Tables:**

1. **Users**
   - `id`, `username`, `email`, `password_hash`
   - `is_superuser`, `created_at`, `updated_at`

2. **Trees**
   - `id`, `name`, `description`, `is_public`
   - `owner_id` (FK → users)
   - `created_at`, `updated_at`

3. **Tree Files**
   - `tree_id` (FK → trees)
   - `file_id` (references Go API file_id)
   - Links trees to GEDCOM files

4. **Tree Collaborators**
   - `tree_id` (FK → trees)
   - `user_id` (FK → users)
   - `permission` (read, write, admin)
   - `created_at`

5. **Access Requests**
   - `id`, `tree_id`, `user_id`
   - `status` (pending, approved, rejected)
   - `requested_at`, `responded_at`

6. **User Individual Links**
   - `user_id` (FK → users)
   - `tree_id` (FK → trees)
   - `individual_xref` (XREF in GEDCOM file)
   - Links users to individuals in trees

7. **Albums**
   - `id`, `name`, `description`, `is_public`
   - `owner_id` (FK → users)
   - `created_at`, `updated_at`

8. **Album Media**
   - `album_id` (FK → albums)
   - `media_id` (references Go API media UUID)
   - Junction table

9. **Album Shares**
   - `album_id` (FK → albums)
   - `user_id` (FK → users)
   - `permission` (read, write)
   - `created_at`

10. **Tags**
    - `id`, `name`, `color`, `is_global`
    - `owner_id` (FK → users, nullable)
    - `created_at`, `updated_at`

11. **Tag Items**
    - `tag_id` (FK → tags)
    - `entity_type` (media, event, individual, family, note, source, place, date)
    - `entity_id` (UUID or XREF, depending on type)
    - `tree_id` (FK → trees, for context)
    - Polymorphic junction table

---

## Features & Functionality

### 1. User Authentication

**What it does:**
- User registration with username, email, password
- User login with JWT tokens
- Session management (localStorage)
- Protected routes (require authentication)
- Superuser role support

**Implementation:**
- Mycelia `useAuth` facet
- Next.js API routes for auth
- PostgreSQL `users` table
- JWT token-based authentication

---

### 2. Tree Management

**What it does:**
- Create trees (via GEDCOM upload)
- List trees (owned, collaborated, public)
- View tree details
- Edit tree metadata (name, description, visibility)
- Delete trees
- Tree ownership and permissions

**Implementation:**
- PostgreSQL `trees` table
- `tree_files` junction table
- Permission checks via `tree_collaborators`
- Proxies to Go API for GEDCOM operations

---

### 3. Tree Collaboration

**What it does:**
- Share trees with other users
- Permission levels (read, write, admin)
- Access request system
- Collaborator management

**Implementation:**
- PostgreSQL `tree_collaborators` table
- PostgreSQL `access_requests` table
- Permission checking in API routes

---

### 4. User-Individual Linking

**What it does:**
- Link users to individuals in trees
- "My Connections" feature
- Find yourself in a tree

**Implementation:**
- PostgreSQL `user_individual_links` table
- Links user to tree + individual XREF

---

### 5. GEDCOM File Processing

**What it does:**
- Upload GEDCOM files
- Parse and validate files
- Store file metadata
- Link files to trees
- Process via Go API

**Implementation:**
- File upload to Go API
- Tree creation in PostgreSQL
- File-tree linking

---

### 6. Family Tree Visualization

**What it does:**
- Display family trees
- Pedigree charts
- General family tree layouts
- Interactive navigation (zoom, pan)
- Node selection and details

**Implementation:**
- D3.js for layout calculations
- Konva.js for canvas rendering
- `useFamilyTreeVisualizer` facet
- `family-tree-vis` folder for visualization code

---

### 7. Search & Browse

**What it does:**
- Global search across trees
- Search individuals, families, places, sources, notes
- Browse surnames and given names
- Filter and pagination

**Implementation:**
- Mycelia facets for each entity type
- Proxies to Go API search endpoints
- Client-side filtering and display

---

### 8. Albums

**What it does:**
- Create albums (collections of media)
- Add/remove media from albums
- Share albums with users
- Public/private albums

**Implementation:**
- PostgreSQL `albums`, `album_media`, `album_shares` tables
- `useAlbums` Mycelia facet
- Next.js API routes for album management
- References media from Go API (doesn't store media itself)

---

### 9. Tags

**What it does:**
- Universal tagging system
- Tag any entity type (media, event, individual, family, note, source, place, date)
- Global tags (shared by all users)
- User-specific tags
- Tag management (create, edit, delete)
- Tag items (add/remove tags from entities)

**Implementation:**
- PostgreSQL `tags` table
- PostgreSQL `tag_items` table (polymorphic)
- `useTags` Mycelia facet
- Next.js API routes for tag management
- Entity-specific tag routes

---

### 10. Statistics & Analytics

**What it does:**
- Tree statistics (individuals, families, events, etc.)
- Individual statistics
- Family statistics
- Media statistics
- Graph analytics (diameter, density, centrality)

**Implementation:**
- Proxies to Go API statistics endpoints
- Display in dashboard and tree pages

---

### 11. Export

**What it does:**
- Export trees to GEDCOM format
- Export to JSON format
- Export to GEDCOM-JSON format
- Subtree export (filter by root individual/family)

**Implementation:**
- Proxies to Go API export endpoints
- File download handling

---

### 12. Duplicate Detection

**What it does:**
- Find duplicate individuals within a file
- Compare two files for duplicates
- Fuzzy matching algorithms

**Implementation:**
- Proxies to Go API duplicate endpoints
- `useGedcomDuplicates` facet

---

## State Management

### Mycelia Plugin System

**How it works:**
1. **Facets** contain domain logic and state
2. **Events** are emitted when state changes
3. **React components** listen to events and update UI
4. **No global state** - each facet manages its own state

**Example Flow:**
```javascript
// In a React component
const files = useFacet('gedcomFiles');

// Call facet method
files.uploadFile(fileData);

// Facet emits event
listeners.emit('gedcomFiles:file:uploaded', { fileID: '...' });

// React component listens and updates
useEffect(() => {
  const unsubscribe = listeners.on('gedcomFiles:file:uploaded', (event) => {
    // Update UI
  });
  return unsubscribe;
}, []);
```

### Facet State

Each facet maintains its own state:
- **Auth Facet**: `{ user, token, isAuthenticated, loading, error }`
- **Files Facet**: `{ files: [], currentFile: null, loading: false, error: null }`
- **Individuals Facet**: `{ individuals: [], currentIndividual: null, loading: false }`

### Event System

Facets emit events for:
- State changes
- Operations completed
- Errors occurred

React components subscribe to events to update UI reactively.

---

## Summary

The Ligneous Frontend is a **comprehensive multi-tenant genealogy platform** that provides:

### Core Features
- ✅ User authentication and authorization
- ✅ Tree management (create, view, edit, delete)
- ✅ Tree collaboration (sharing, permissions)
- ✅ User-individual linking
- ✅ GEDCOM file upload and processing
- ✅ Family tree visualization
- ✅ Search and browse functionality
- ✅ Statistics and analytics
- ✅ Export capabilities
- ✅ Duplicate detection
- ✅ Albums (media collections)
- ✅ Universal tagging system

### Architecture Highlights
- **Mycelia Plugin System** for domain logic
- **Next.js API Routes** as gateway to Go API
- **PostgreSQL** for multi-tenant data
- **Event-driven** state management
- **Thin UI layer** - presentation only

### Integration Points
- **Go API** (port 8090) - GEDCOM processing, graph operations, queries
- **PostgreSQL** - User data, trees, albums, tags, permissions
- **Prisma ORM** - Database access

The frontend serves as the **user interface layer** for the Ligneous genealogy platform, providing a complete web application for managing and exploring family trees.

---

**Last Updated:** February 15, 2026  
**Status:** Production-Ready ✅

