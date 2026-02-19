# Component File Organization Guide

**Date:** February 15, 2026  
**Purpose:** Visual guide to component file organization

---

## Current Structure vs. Proposed Structure

### Current Structure
```
components/
├── layout/          # Layout components
├── shared/          # Shared components (theme, notifications)
└── features/        # Feature-specific components
    ├── dashboard/
    ├── trees/
    ├── search/
    └── family-tree/
```

### Proposed Structure
```
components/
├── layout/          # Page-level layout components
├── shared/          # Reusable UI components (organized by type)
│   ├── cards/       # Entity card components
│   ├── data-display/# Data view components
│   ├── navigation/  # Navigation components
│   ├── forms/       # Form & input components
│   ├── feedback/    # Loading/error/empty states
│   └── ui/          # UI elements (badges, avatars, etc.)
└── features/        # Feature-specific components
    ├── dashboard/
    ├── trees/
    ├── individuals/
    ├── families/
    ├── places/
    ├── media/
    ├── albums/
    ├── tags/
    ├── search/
    ├── names/
    ├── events/
    └── sources/
```

---

## Detailed File Structure

### 📁 `components/layout/`
**Purpose:** Page structure and navigation

```
layout/
├── index.js
├── DashboardLayout.js      ✅ Existing
├── TopBar.js               ✅ Existing
├── MobileNav.js            ✅ Existing
├── DesktopSidebar.js       ✅ Existing
├── PageContainer.js        ⏳ New - Page wrapper
├── PageHeader.js           ⏳ New - Page title/actions
└── Toolbar.js              ⏳ New - Action toolbar
```

### 📁 `components/shared/cards/`
**Purpose:** Entity card components

```
cards/
├── index.js
│
├── BaseCard.js             ⏳ Generic base card
├── CardSkeleton.js         ⏳ Loading skeleton
├── EntityCard.js           ⏳ Configurable wrapper
│
├── PersonCard.js           ⏳ Individual/person
├── FamilyCard.js           ⏳ Family unit
├── TreeCard.js             ⏳ Move from features/trees/
├── PlaceCard.js            ⏳ Location/place
├── EventCard.js            ⏳ Life event
├── SourceCard.js           ⏳ Source/citation
├── MediaCard.js            ⏳ Media file
├── TagCard.js              ⏳ Tag
├── AlbumCard.js            ⏳ Album
├── GivenNameCard.js        ⏳ Given name
├── SurnameCard.js          ⏳ Surname
├── UserCard.js             ⏳ User account
└── RequestCard.js          ⏳ Access request
```

### 📁 `components/shared/data-display/`
**Purpose:** Data view and list components

```
data-display/
├── index.js
├── DataViewContainer.js    ⏳ Main container
├── DataView.js             ⏳ View switcher
├── ListView.js             ⏳ Table-like list
├── CardGrid.js             ⏳ Responsive grid
├── ListRow.js              ⏳ List row component
├── ListHeader.js           ⏳ Sortable headers
└── ListSkeleton.js         ⏳ List loading skeleton
```

### 📁 `components/shared/navigation/`
**Purpose:** Navigation and pagination

```
navigation/
├── index.js
├── Breadcrumbs.js          ⏳ Breadcrumb navigation
├── Pagination.js           ⏳ Page navigation
├── ViewToggle.js           ⏳ List/card toggle
├── SortDropdown.js         ⏳ Sort options
└── SortableHeader.js       ⏳ Sortable column header
```

### 📁 `components/shared/forms/`
**Purpose:** Form inputs and filters

```
forms/
├── index.js
├── SearchBar.js            ⏳ Search input
├── FilterPanel.js          ⏳ Filter panel
├── FilterChip.js           ⏳ Filter tag
└── FilterButton.js         ⏳ Filter toggle
```

### 📁 `components/shared/feedback/`
**Purpose:** Loading, error, and empty states

```
feedback/
├── index.js
├── EmptyState.js           ⏳ Empty state
├── LoadingState.js         ⏳ Loading spinner
├── ErrorState.js           ⏳ Error message
├── SkeletonLoader.js       ⏳ Generic skeleton
└── Shimmer.js              ⏳ Shimmer animation
```

### 📁 `components/shared/ui/`
**Purpose:** Reusable UI elements

```
ui/
├── index.js
│
├── metadata/               # Metadata display
│   ├── MetadataList.js
│   ├── DateDisplay.js
│   ├── PlaceDisplay.js
│   └── EntityIcon.js
│
├── badges/                 # Badges & tags
│   ├── Badge.js
│   └── TagBadge.js
│
├── avatars/                # Avatars
│   ├── Avatar.js
│   └── PersonAvatar.js
│
├── actions/                # Action menus
│   ├── ActionMenu.js
│   ├── ContextMenu.js
│   ├── BulkActions.js
│   └── EntityActions.js
│
├── links/                  # Link components
│   └── EntityLink.js
│
└── mobile/                 # Mobile components
    ├── MobileSheet.js
    ├── MobileDrawer.js
    └── ResponsiveGrid.js
```

### 📁 `components/features/`
**Purpose:** Feature-specific components organized by domain

```
features/
├── index.js
│
├── dashboard/              ✅ Existing
│   ├── index.js
│   ├── ExploreTrees.js
│   ├── RecentActivity.js
│   ├── PendingRequests.js
│   ├── StatsCards.js       ⏳ New
│   └── QuickActions.js     ⏳ New
│
├── trees/                  ✅ Existing (refactor)
│   ├── index.js
│   ├── TreeDetail.js       ⏳ New
│   ├── TreeStats.js        ⏳ New
│   └── TreeSettings.js     ⏳ New
│
├── individuals/            ⏳ New feature
│   ├── index.js
│   ├── IndividualDetail.js
│   ├── IndividualRelationships.js
│   ├── IndividualTimeline.js
│   └── IndividualMedia.js
│
├── families/               ⏳ New feature
│   ├── index.js
│   ├── FamilyDetail.js
│   ├── FamilyTree.js
│   └── FamilyMembers.js
│
├── places/                 ⏳ New feature
│   ├── index.js
│   ├── PlaceDetail.js
│   ├── PlaceMap.js
│   └── PlaceTimeline.js
│
├── media/                  ⏳ New feature
│   ├── index.js
│   ├── MediaGallery.js
│   ├── MediaViewer.js
│   └── MediaUpload.js
│
├── albums/                 ⏳ New feature
│   ├── index.js
│   ├── AlbumList.js
│   ├── AlbumDetail.js
│   └── AlbumEditor.js
│
├── tags/                   ⏳ New feature
│   ├── index.js
│   ├── TagList.js
│   ├── TagManager.js
│   └── TagSelector.js
│
├── search/                 ✅ Existing
│   ├── index.js
│   ├── GlobalSearch.js
│   ├── SearchResults.js    ⏳ New
│   └── AdvancedSearch.js   ⏳ New
│
├── names/                  ⏳ New feature
│   ├── index.js
│   ├── GivenNameList.js
│   ├── SurnameList.js
│   └── NameDetail.js
│
├── events/                 ⏳ New feature
│   ├── index.js
│   ├── EventList.js
│   ├── EventDetail.js
│   └── EventTimeline.js
│
└── sources/                ⏳ New feature
    ├── index.js
    ├── SourceList.js
    ├── SourceDetail.js
    └── SourceCitations.js
```

---

## Export Strategy

### Main Export Files

#### `components/index.js`
```javascript
// Shared components (reusable UI)
export * from './shared';

// Layout components
export { 
  DashboardLayout, 
  TopBar, 
  MobileNav, 
  DesktopSidebar,
  PageContainer,
  PageHeader,
  Toolbar
} from './layout';

// Feature-specific components
export * from './features';
```

#### `components/shared/index.js`
```javascript
// Cards
export * from './cards';

// Data Display
export * from './data-display';

// Navigation
export * from './navigation';

// Forms
export * from './forms';

// Feedback
export * from './feedback';

// UI Elements
export * from './ui';

// Theme (existing)
export * from './theme';

// Notifications (existing)
export * from './notifications';
```

#### `components/shared/cards/index.js`
```javascript
// Base components
export { default as BaseCard } from './BaseCard';
export { default as CardSkeleton } from './CardSkeleton';
export { default as EntityCard } from './EntityCard';

// Entity cards
export { default as PersonCard } from './PersonCard';
export { default as FamilyCard } from './FamilyCard';
export { default as TreeCard } from './TreeCard';
export { default as PlaceCard } from './PlaceCard';
export { default as EventCard } from './EventCard';
export { default as SourceCard } from './SourceCard';
export { default as MediaCard } from './MediaCard';
export { default as TagCard } from './TagCard';
export { default as AlbumCard } from './AlbumCard';
export { default as GivenNameCard } from './GivenNameCard';
export { default as SurnameCard } from './SurnameCard';
export { default as UserCard } from './UserCard';
export { default as RequestCard } from './RequestCard';
```

---

## Migration Plan

### Step 1: Create Foundation Structure
1. Create new subdirectories in `shared/`:
   - `cards/`
   - `data-display/`
   - `navigation/`
   - `forms/`
   - `feedback/`
   - `ui/` (with subdirectories)

### Step 2: Move Existing Components
1. Move `TreeCard.js` from `features/trees/` → `shared/cards/`
2. Extract `RequestCard` from `PendingRequests.js` → `shared/cards/`
3. Update imports in existing files

### Step 3: Create Base Components (Phase 1)
1. Create foundation components (BaseCard, Badge, Avatar, etc.)
2. Create index.js files for each subdirectory
3. Update `shared/index.js` exports

### Step 4: Create Data Display Components (Phase 2)
1. Create DataViewContainer, ListView, CardGrid
2. Refactor existing components to use new structure

### Step 5: Create Entity Cards (Phase 3)
1. Create all entity card components
2. Update feature components to use shared cards

### Step 6: Create Feature Components (Phase 4)
1. Create new feature directories
2. Build feature-specific components

---

## Naming Conventions

### File Names
- **PascalCase** for component files: `PersonCard.js`
- **camelCase** for utility files: `formatDate.js`
- **kebab-case** for styles: `person-card.css` (if needed)

### Component Names
- Match file name: `PersonCard.js` → `export default function PersonCard()`
- Descriptive and specific: `PersonCard` not `Card`

### Directory Names
- **camelCase** for feature directories: `individuals/`
- **kebab-case** for shared subdirectories: `data-display/`

### Export Names
- Use named exports for utilities: `export { formatDate }`
- Use default exports for components: `export default function PersonCard()`

---

## Import Patterns

### From Shared Components
```javascript
// Import from shared cards
import { PersonCard, FamilyCard } from '@/components/shared/cards';

// Import from shared data-display
import { DataViewContainer, ListView, CardGrid } from '@/components/shared/data-display';

// Import from shared navigation
import { Breadcrumbs, Pagination, ViewToggle } from '@/components/shared/navigation';
```

### From Features
```javascript
// Import feature-specific components
import { IndividualDetail, IndividualTimeline } from '@/components/features/individuals';
```

### From Layout
```javascript
// Import layout components
import { PageContainer, PageHeader, Toolbar } from '@/components/layout';
```

---

## Component Organization Principles

### 1. **Shared vs. Feature**
- **Shared:** Reusable, no business logic, pure presentation
- **Feature:** Domain-specific, may use Mycelia facets, business logic

### 2. **Grouping by Type**
- Cards together
- Data display together
- Navigation together
- Forms together

### 3. **Flat Structure**
- Avoid deep nesting (max 2-3 levels)
- Use subdirectories for logical grouping
- Keep related components together

### 4. **Index Files**
- Every directory has an `index.js`
- Centralizes exports
- Simplifies imports

### 5. **Single Responsibility**
- One component per file
- One purpose per component
- Clear, focused components

---

## Benefits of This Organization

1. **Discoverability:** Easy to find components by type
2. **Reusability:** Shared components clearly separated
3. **Maintainability:** Related components grouped together
4. **Scalability:** Easy to add new components
5. **Consistency:** Standardized structure across features
6. **Import Clarity:** Clear import paths

---

## Next Steps

1. ✅ Review and approve this organization plan
2. ⏳ Create directory structure
3. ⏳ Create base components (Phase 1)
4. ⏳ Migrate existing components
5. ⏳ Build out remaining components

