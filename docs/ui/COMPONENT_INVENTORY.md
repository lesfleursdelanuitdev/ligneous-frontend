# UI Component Inventory & Organization Plan

**Date:** February 15, 2026  
**Status:** Planning  
**Purpose:** Comprehensive list of all UI components to be created and their file organization

---

## Table of Contents

1. [Component Categories](#component-categories)
2. [Complete Component List](#complete-component-list)
3. [File Organization Structure](#file-organization-structure)
4. [Component Dependencies](#component-dependencies)
5. [Implementation Priority](#implementation-priority)

---

## Component Categories

### 1. **Layout Components** (`components/layout/`)
- Page-level containers and navigation
- Already exists: `DashboardLayout`, `TopBar`, `MobileNav`, `DesktopSidebar`

### 2. **Shared UI Components** (`components/shared/`)
- Reusable, generic UI components
- No business logic, pure presentation
- Used across multiple features

### 3. **Entity Cards** (`components/shared/cards/`)
- Card components for displaying entities
- Generic base + specific entity cards

### 4. **Data Display Components** (`components/shared/data-display/`)
- Lists, grids, views, pagination, sorting
- Reusable data presentation patterns

### 5. **Navigation Components** (`components/shared/navigation/`)
- Breadcrumbs, pagination, view toggles

### 6. **Form & Input Components** (`components/shared/forms/`)
- Search bars, filters, inputs

### 7. **Feedback Components** (`components/shared/feedback/`)
- Loading, empty, error states

### 8. **Feature-Specific Components** (`components/features/`)
- Domain-specific components organized by feature area

---

## Complete Component List

### 📐 Layout Components (`components/layout/`)

#### Existing
- ✅ `DashboardLayout.js` - Main dashboard layout
- ✅ `TopBar.js` - Top navigation bar
- ✅ `MobileNav.js` - Mobile navigation
- ✅ `DesktopSidebar.js` - Desktop sidebar

#### New
- ⏳ `PageContainer.js` - Standard page wrapper with breadcrumbs area
- ⏳ `PageHeader.js` - Page title, actions, search bar container
- ⏳ `Toolbar.js` - Action toolbar (view toggle, sort, filter buttons)

---

### 🎴 Entity Cards (`components/shared/cards/`)

#### Base Card Components
- ⏳ `BaseCard.js` - Generic card component with variants
- ⏳ `CardSkeleton.js` - Loading skeleton for cards
- ⏳ `EntityCard.js` - Configurable entity card wrapper

#### Specific Entity Cards
- ⏳ `PersonCard.js` / `IndividualCard.js` - Person/individual card
- ⏳ `FamilyCard.js` - Family unit card
- ⏳ `PlaceCard.js` - Place/location card
- ⏳ `EventCard.js` - Event card
- ⏳ `SourceCard.js` - Source/citation card
- ⏳ `MediaCard.js` - Media file card
- ⏳ `TagCard.js` - Tag card
- ⏳ `AlbumCard.js` - Album card
- ⏳ `GivenNameCard.js` - Given name card
- ⏳ `SurnameCard.js` - Surname card
- ⏳ `UserCard.js` - User card
- ⏳ `RequestCard.js` - Access request card (refactor existing)
- ⏳ `TreeCard.js` - Tree card (move from `features/trees/`)

#### Collaborative Feature Cards
- ⏳ `DiscussionThreadCard.js` - Discussion thread card
- ⏳ `SuggestionCard.js` - Suggestion card
- ⏳ `ResearchNoteCard.js` - Research note card
- ⏳ `NotebookCard.js` - Notebook card
- ⏳ `UserContentCard.js` - User content card (research updates, stories, recipes)
- ⏳ `NotificationCard.js` - Notification card
- ⏳ `ActivityCard.js` - Activity feed card
- ⏳ `CommentCard.js` - Comment card (for comment lists)

---

### 📊 Data Display Components (`components/shared/data-display/`)

#### View Containers
- ⏳ `DataViewContainer.js` - Main container for list/card views
- ⏳ `ListView.js` - Table-like list view
- ⏳ `CardGrid.js` - Responsive grid of cards
- ⏳ `DataView.js` - Switches between ListView and CardGrid

#### List Components
- ⏳ `ListRow.js` - Single row in list view
- ⏳ `ListHeader.js` - Sortable column headers
- ⏳ `ListSkeleton.js` - Loading skeleton for list view

---

### 🧭 Navigation Components (`components/shared/navigation/`)

- ⏳ `Breadcrumbs.js` - Hierarchical breadcrumb navigation
- ⏳ `Pagination.js` - Page navigation component
- ⏳ `ViewToggle.js` - Toggle between list/card views
- ⏳ `SortDropdown.js` - Sort options dropdown
- ⏳ `SortableHeader.js` - Clickable sortable column header

---

### 🔍 Form & Input Components (`components/shared/forms/`)

- ⏳ `SearchBar.js` - Search input with icon and clear button
- ⏳ `FilterPanel.js` - Collapsible filter panel
- ⏳ `FilterChip.js` - Removable filter tag
- ⏳ `FilterButton.js` - Button to toggle filter panel

---

### 💬 Feedback Components (`components/shared/feedback/`)

- ⏳ `EmptyState.js` - Empty state with icon, message, action
- ⏳ `LoadingState.js` - Loading spinner with message
- ⏳ `ErrorState.js` - Error message with retry button
- ⏳ `SkeletonLoader.js` - Generic skeleton loader
- ⏳ `Shimmer.js` - Shimmer animation effect

---

### 🎨 UI Elements (`components/shared/ui/`)

#### Metadata & Display
- ⏳ `MetadataList.js` - Key-value metadata display
- ⏳ `Badge.js` - Colored badge/tag component
- ⏳ `TagBadge.js` - Tag-specific badge variant
- ⏳ `Avatar.js` - User avatar with initials fallback
- ⏳ `PersonAvatar.js` - Person-specific avatar
- ⏳ `DateDisplay.js` - Formatted date with relative time option
- ⏳ `PlaceDisplay.js` - Hierarchical place name display
- ⏳ `EntityIcon.js` - Icon mapping for entity types
- ⏳ `EntityLink.js` - Standardized entity detail link

#### Actions & Menus
- ⏳ `ActionMenu.js` - Three-dot context menu
- ⏳ `ContextMenu.js` - Right-click context menu
- ⏳ `BulkActions.js` - Bulk action bar for selected items
- ⏳ `EntityActions.js` - Standardized action buttons per entity

#### Mobile Components
- ⏳ `MobileSheet.js` - Bottom sheet for mobile
- ⏳ `MobileDrawer.js` - Full-screen drawer for mobile
- ⏳ `ResponsiveGrid.js` - Auto-adjusting responsive grid

---

### 🎯 Feature-Specific Components (`components/features/`)

#### Dashboard (`components/features/dashboard/`)
- ✅ `ExploreTrees.js` - Existing
- ✅ `RecentActivity.js` - Existing
- ✅ `PendingRequests.js` - Existing
- ⏳ `StatsCards.js` - Dashboard statistics cards
- ⏳ `QuickActions.js` - Quick action buttons

#### Trees (`components/features/trees/`)
- ✅ `TreeCard.js` - Existing (move to `shared/cards/`)
- ⏳ `TreeDetail.js` - Tree detail view
- ⏳ `TreeStats.js` - Tree statistics display
- ⏳ `TreeSettings.js` - Tree settings form

#### Individuals (`components/features/individuals/`)
- ⏳ `IndividualDetail.js` - Individual detail page
- ⏳ `IndividualRelationships.js` - Relationship diagram
- ⏳ `IndividualTimeline.js` - Life events timeline
- ⏳ `IndividualMedia.js` - Associated media gallery

#### Families (`components/features/families/`)
- ⏳ `FamilyDetail.js` - Family detail page
- ⏳ `FamilyTree.js` - Family tree visualization
- ⏳ `FamilyMembers.js` - Family members list

#### Places (`components/features/places/`)
- ⏳ `PlaceDetail.js` - Place detail page
- ⏳ `PlaceMap.js` - Map visualization
- ⏳ `PlaceTimeline.js` - Events at this place

#### Media (`components/features/media/`)
- ⏳ `MediaGallery.js` - Media gallery grid
- ⏳ `MediaViewer.js` - Media viewer modal
- ⏳ `MediaUpload.js` - Media upload form

#### Albums (`components/features/albums/`)
- ⏳ `AlbumList.js` - Album list view
- ⏳ `AlbumDetail.js` - Album detail page
- ⏳ `AlbumEditor.js` - Album editing interface

#### Tags (`components/features/tags/`)
- ⏳ `TagList.js` - Tag list view
- ⏳ `TagManager.js` - Tag management interface
- ⏳ `TagSelector.js` - Tag selection component

#### Search (`components/features/search/`)
- ✅ `GlobalSearch.js` - Existing
- ⏳ `SearchResults.js` - Search results display
- ⏳ `AdvancedSearch.js` - Advanced search form

#### Names (`components/features/names/`)
- ⏳ `GivenNameList.js` - Given names browse
- ⏳ `SurnameList.js` - Surnames browse
- ⏳ `NameDetail.js` - Name detail (usage stats)

#### Events (`components/features/events/`)
- ⏳ `EventList.js` - Events list
- ⏳ `EventDetail.js` - Event detail page
- ⏳ `EventTimeline.js` - Timeline visualization

#### Sources (`components/features/sources/`)
- ⏳ `SourceList.js` - Sources list
- ⏳ `SourceDetail.js` - Source detail page
- ⏳ `SourceCitations.js` - Citations display

---

## File Organization Structure

```
components/
├── index.js                          # Main export file
│
├── layout/                           # Layout components
│   ├── index.js
│   ├── DashboardLayout.js            # ✅ Existing
│   ├── TopBar.js                     # ✅ Existing
│   ├── MobileNav.js                  # ✅ Existing
│   ├── DesktopSidebar.js             # ✅ Existing
│   ├── PageContainer.js              # ⏳ New
│   ├── PageHeader.js                 # ⏳ New
│   └── Toolbar.js                    # ⏳ New
│
├── shared/                           # Shared reusable components
│   ├── index.js
│   │
│   ├── cards/                        # Entity card components
│   │   ├── index.js
│   │   ├── BaseCard.js               # ⏳ Generic base card
│   │   ├── CardSkeleton.js           # ⏳ Loading skeleton
│   │   ├── EntityCard.js             # ⏳ Configurable wrapper
│   │   │
│   │   ├── PersonCard.js             # ⏳ Individual/person card
│   │   ├── FamilyCard.js             # ⏳ Family card
│   │   ├── PlaceCard.js              # ⏳ Place card
│   │   ├── EventCard.js              # ⏳ Event card
│   │   ├── SourceCard.js             # ⏳ Source card
│   │   ├── MediaCard.js              # ⏳ Media card
│   │   ├── TagCard.js                # ⏳ Tag card
│   │   ├── AlbumCard.js              # ⏳ Album card
│   │   ├── GivenNameCard.js          # ⏳ Given name card
│   │   ├── SurnameCard.js            # ⏳ Surname card
│   │   ├── UserCard.js               # ⏳ User card
│   │   ├── RequestCard.js            # ⏳ Request card
│   │   └── TreeCard.js               # ⏳ Move from features/trees/
│   │
│   ├── data-display/                 # Data view components
│   │   ├── index.js
│   │   ├── DataViewContainer.js      # ⏳ Main container
│   │   ├── DataView.js               # ⏳ View switcher
│   │   ├── ListView.js               # ⏳ Table-like list
│   │   ├── CardGrid.js               # ⏳ Card grid
│   │   ├── ListRow.js                # ⏳ List row component
│   │   ├── ListHeader.js             # ⏳ Sortable headers
│   │   └── ListSkeleton.js           # ⏳ List loading skeleton
│   │
│   ├── navigation/                   # Navigation components
│   │   ├── index.js
│   │   ├── Breadcrumbs.js            # ⏳ Breadcrumb navigation
│   │   ├── Pagination.js             # ⏳ Page navigation
│   │   ├── ViewToggle.js             # ⏳ List/card toggle
│   │   ├── SortDropdown.js           # ⏳ Sort options
│   │   └── SortableHeader.js         # ⏳ Sortable column header
│   │
│   ├── forms/                        # Form & input components
│   │   ├── index.js
│   │   ├── SearchBar.js              # ⏳ Search input
│   │   ├── FilterPanel.js            # ⏳ Filter panel
│   │   ├── FilterChip.js             # ⏳ Filter tag
│   │   └── FilterButton.js           # ⏳ Filter toggle button
│   │
│   ├── feedback/                     # Feedback states
│   │   ├── index.js
│   │   ├── EmptyState.js             # ⏳ Empty state
│   │   ├── LoadingState.js           # ⏳ Loading state
│   │   ├── ErrorState.js             # ⏳ Error state
│   │   ├── SkeletonLoader.js         # ⏳ Generic skeleton
│   │   └── Shimmer.js                # ⏳ Shimmer animation
│   │
│   ├── ui/                           # UI elements
│   │   ├── index.js
│   │   │
│   │   ├── metadata/                 # Metadata display
│   │   │   ├── MetadataList.js
│   │   │   ├── DateDisplay.js
│   │   │   ├── PlaceDisplay.js
│   │   │   └── EntityIcon.js
│   │   │
│   │   ├── badges/                   # Badges & tags
│   │   │   ├── Badge.js
│   │   │   └── TagBadge.js
│   │   │
│   │   ├── avatars/                  # Avatars
│   │   │   ├── Avatar.js
│   │   │   └── PersonAvatar.js
│   │   │
│   │   ├── actions/                  # Action components
│   │   │   ├── ActionMenu.js
│   │   │   ├── ContextMenu.js
│   │   │   ├── BulkActions.js
│   │   │   └── EntityActions.js
│   │   │
│   │   ├── links/                    # Link components
│   │   │   └── EntityLink.js
│   │   │
│   │   └── mobile/                   # Mobile-specific
│   │       ├── MobileSheet.js
│   │       ├── MobileDrawer.js
│   │       └── ResponsiveGrid.js
│   │
│   ├── theme/                        # ✅ Existing
│   │   └── ...
│   │
│   └── notifications/                # ✅ Existing
│       └── ...
│
└── features/                         # Feature-specific components
    ├── index.js
    │
    ├── dashboard/                    # ✅ Existing
    │   ├── index.js
    │   ├── ExploreTrees.js
    │   ├── RecentActivity.js
    │   ├── PendingRequests.js
    │   ├── StatsCards.js             # ⏳ New
    │   └── QuickActions.js           # ⏳ New
    │
    ├── trees/                        # ✅ Existing (refactor)
    │   ├── index.js
    │   ├── TreeDetail.js             # ⏳ New
    │   ├── TreeStats.js              # ⏳ New
    │   └── TreeSettings.js           # ⏳ New
    │
    ├── individuals/                  # ⏳ New feature
    │   ├── index.js
    │   ├── IndividualDetail.js
    │   ├── IndividualRelationships.js
    │   ├── IndividualTimeline.js
    │   └── IndividualMedia.js
    │
    ├── families/                     # ⏳ New feature
    │   ├── index.js
    │   ├── FamilyDetail.js
    │   ├── FamilyTree.js
    │   └── FamilyMembers.js
    │
    ├── places/                       # ⏳ New feature
    │   ├── index.js
    │   ├── PlaceDetail.js
    │   ├── PlaceMap.js
    │   └── PlaceTimeline.js
    │
    ├── media/                        # ⏳ New feature
    │   ├── index.js
    │   ├── MediaGallery.js
    │   ├── MediaViewer.js
    │   └── MediaUpload.js
    │
    ├── albums/                       # ⏳ New feature
    │   ├── index.js
    │   ├── AlbumList.js
    │   ├── AlbumDetail.js
    │   └── AlbumEditor.js
    │
    ├── tags/                         # ⏳ New feature
    │   ├── index.js
    │   ├── TagList.js
    │   ├── TagManager.js
    │   └── TagSelector.js
    │
    ├── search/                       # ✅ Existing
    │   ├── index.js
    │   ├── GlobalSearch.js
    │   ├── SearchResults.js          # ⏳ New
    │   └── AdvancedSearch.js         # ⏳ New
    │
    ├── names/                        # ⏳ New feature
    │   ├── index.js
    │   ├── GivenNameList.js
    │   ├── SurnameList.js
    │   └── NameDetail.js
    │
    ├── events/                       # ⏳ New feature
    │   ├── index.js
    │   ├── EventList.js
    │   ├── EventDetail.js
    │   └── EventTimeline.js
    │
    └── sources/                      # ⏳ New feature
        ├── index.js
        ├── SourceList.js
        ├── SourceDetail.js
        └── SourceCitations.js
```

---

## Component Dependencies

### Dependency Hierarchy

```
PageContainer
  └── PageHeader
      └── Breadcrumbs
      └── SearchBar
  └── Toolbar
      └── ViewToggle
      └── SortDropdown
      └── FilterButton
  └── DataViewContainer
      └── DataView
          ├── ListView
          │   └── ListRow
          │       └── EntityCard (or specific card)
          └── CardGrid
              └── EntityCard (or specific card)
      └── Pagination
      └── EmptyState / LoadingState / ErrorState
```

### Base Components (Build First)

1. **BaseCard** - Foundation for all entity cards
2. **Badge** - Used in many cards
3. **Avatar** - Used in person/user cards
4. **EntityIcon** - Used across all entity types
5. **EmptyState** - Used in all data views
6. **LoadingState** - Used in all data views
7. **ErrorState** - Used in all data views

### Composite Components (Build Second)

1. **DataViewContainer** - Combines view toggle, sorting, pagination
2. **EntityCard** - Generic wrapper using BaseCard
3. **ListView** - Uses ListRow and ListHeader
4. **CardGrid** - Uses BaseCard variants

### Specific Components (Build Third)

1. **PersonCard** - Uses BaseCard, Avatar, Badge, EntityIcon
2. **FamilyCard** - Uses BaseCard, PersonCard (for members)
3. **MediaCard** - Uses BaseCard, Badge
4. All other entity-specific cards

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
**Goal:** Create base components that everything else depends on

1. ✅ Layout components (already exist)
2. ⏳ `BaseCard.js` - Generic card foundation
3. ⏳ `Badge.js` - Badge component
4. ⏳ `Avatar.js` - Avatar component
5. ⏳ `EntityIcon.js` - Icon mapping
6. ⏳ `EmptyState.js` - Empty state
7. ⏳ `LoadingState.js` - Loading state
8. ⏳ `ErrorState.js` - Error state
9. ⏳ `Breadcrumbs.js` - Breadcrumb navigation
10. ⏳ `Pagination.js` - Pagination component

### Phase 2: Data Display (Week 2)
**Goal:** Create reusable data view components

1. ⏳ `DataViewContainer.js` - Main container
2. ⏳ `ViewToggle.js` - View switcher
3. ⏳ `SortDropdown.js` - Sort options
4. ⏳ `CardGrid.js` - Card grid layout
5. ⏳ `ListView.js` - List view layout
6. ⏳ `DataView.js` - View switcher logic
7. ⏳ `SearchBar.js` - Search input
8. ⏳ `FilterPanel.js` - Filter panel

### Phase 3: Entity Cards (Week 3-4)
**Goal:** Create all entity card components

1. ⏳ `EntityCard.js` - Generic wrapper
2. ⏳ `PersonCard.js` - Person card
3. ⏳ `FamilyCard.js` - Family card
4. ⏳ `TreeCard.js` - Move and refactor existing
5. ⏳ `MediaCard.js` - Media card
6. ⏳ `TagCard.js` - Tag card
7. ⏳ `AlbumCard.js` - Album card
8. ⏳ `PlaceCard.js` - Place card
9. ⏳ `EventCard.js` - Event card
10. ⏳ `SourceCard.js` - Source card
11. ⏳ `GivenNameCard.js` - Given name card
12. ⏳ `SurnameCard.js` - Surname card
13. ⏳ `UserCard.js` - User card
14. ⏳ `RequestCard.js` - Refactor existing

### Phase 4: Feature Pages (Week 5-6)
**Goal:** Create feature-specific detail pages

1. ⏳ Individual detail page
2. ⏳ Family detail page
3. ⏳ Place detail page
4. ⏳ Media gallery
5. ⏳ Album pages
6. ⏳ Tag management
7. ⏳ Name browse pages

### Phase 5: Polish & Mobile (Week 7)
**Goal:** Mobile optimization and polish

1. ⏳ `MobileSheet.js` - Bottom sheets
2. ⏳ `MobileDrawer.js` - Drawers
3. ⏳ `ResponsiveGrid.js` - Responsive utilities
4. ⏳ Touch gesture support
5. ⏳ Mobile-specific layouts
6. ⏳ Accessibility improvements

---

## Component Export Strategy

### `components/shared/index.js`
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

### `components/shared/cards/index.js`
```javascript
// Base
export { default as BaseCard } from './BaseCard';
export { default as CardSkeleton } from './CardSkeleton';
export { default as EntityCard } from './EntityCard';

// Entity Cards
export { default as PersonCard } from './PersonCard';
export { default as FamilyCard } from './FamilyCard';
export { default as TreeCard } from './TreeCard';
// ... etc
```

### `components/features/index.js`
```javascript
// Dashboard (existing)
export * from './dashboard';

// Trees
export * from './trees';

// Individuals
export * from './individuals';

// ... etc
```

---

## Notes

### Migration Strategy

1. **Move existing components:**
   - `TreeCard.js` from `features/trees/` → `shared/cards/`
   - `RequestCard.js` from `features/dashboard/PendingRequests.js` → `shared/cards/` (extract)

2. **Refactor existing components:**
   - Update `ExploreTrees.js` to use new `CardGrid` and `DataViewContainer`
   - Update `PendingRequests.js` to use new `RequestCard` from shared

3. **Create new components:**
   - Start with Phase 1 foundation components
   - Build up dependency chain
   - Test each component in isolation

### Design System Considerations

- All components should use CSS variables for theming
- Consistent spacing scale (4px, 8px, 12px, 16px, 24px, 32px)
- Consistent border radius (4px, 8px, 12px)
- Consistent shadows (sm, md, lg)
- Mobile-first responsive breakpoints
- Accessibility: ARIA labels, keyboard navigation, focus states

### Testing Strategy

- Unit tests for base components
- Visual regression tests for cards
- Integration tests for data views
- Mobile viewport testing
- Accessibility testing

---

## Summary

**Total Components to Create:** ~80 components

- **Layout:** 3 new components
- **Shared Cards:** 15 components
- **Data Display:** 7 components
- **Navigation:** 5 components
- **Forms:** 4 components
- **Feedback:** 5 components
- **UI Elements:** 15 components
- **Feature Components:** ~25 components

**Organization Principle:**
- **Shared components** = Reusable, no business logic
- **Feature components** = Domain-specific, may use Mycelia facets
- **Layout components** = Page structure and navigation

