# UI Components Reference

This document catalogues every reusable UI component in the Ligneous frontend (`/apps/gonsalves-genealogy/ligneous-frontend/components`), including props, variants, and purpose.

---

## Table of Contents

1. [Layout Components](#layout-components)
2. [Card Components](#card-components)
3. [Data Display Components](#data-display-components)
4. [UI Elements](#ui-elements)
5. [Navigation Components](#navigation-components)
6. [Form Components](#form-components)
7. [Feedback Components](#feedback-components)
8. [Notification Components](#notification-components)
9. [Theme Components](#theme-components)
10. [Feature Components](#feature-components)
11. [Other Shared Components](#other-shared-components)

---

## Layout Components

### `DashboardLayout`
**File:** `components/layout/DashboardLayout.js`

The root layout wrapper for every authenticated page. Composes the TopBar, DesktopSidebar, MobileNav, NotificationPanel, GlobalSearch modal, and ActiveTreeProvider. Handles sidebar collapse state, mobile detection, and the ⌘K keyboard shortcut to open search.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Page content |

---

### `TopBar`
**File:** `components/layout/TopBar.js`

Fixed top header containing sidebar toggle, logo, active tree selector, theme toggle, notifications button, and user menu (profile, settings, admin panel, logout).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onNotificationClick` | `Function` | — | Called when notification bell is clicked |
| `onSidebarToggle` | `Function` | — | Called when sidebar collapse button is clicked |
| `isSidebarCollapsed` | `boolean` | — | Drives the collapse button icon direction |
| `notificationCount` | `number` | `3` | Badge count on the notification bell |

---

### `MobileNav`
**File:** `components/layout/MobileNav.js`

Fixed bottom navigation bar for mobile viewports. Shows five items: Home, Trees, Upload (primary CTA), Alerts, and Profile. Displays an unread-notification badge.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `user` | `Object` | — | Current authenticated user |
| `isSuperuser` | `boolean` | — | Shows admin link when `true` |
| `onNotificationClick` | `Function` | — | Called when Alerts icon is tapped |
| `className` | `string` | `''` | Extra CSS classes |

---

### `DesktopSidebar`
**File:** `components/layout/DesktopSidebar.js`

Collapsible sidebar for desktop. Contains the tree selector widget, main navigation (Home, Explore Trees, Upload), expandable section groups (My Trees, Current Tree, People, Families, Context, Evidence, Media, Research), and an admin section for superusers.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `user` | `Object` | — | Current authenticated user |
| `isSuperuser` | `boolean` | — | Renders admin section when `true` |
| `isCollapsed` | `boolean` | `false` | Collapsed state (icons only) |
| `className` | `string` | `''` | Extra CSS classes |

**Internal sub-components:** `NavItem`, `ExpandableSection`, `TreeSelectorWidget`

---

## Card Components

### `BaseCard`
**File:** `components/shared/cards/BaseCard.js`

Generic card container with visual variants and optional interactivity.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Card content |
| `variant` | `'default' \| 'outlined' \| 'elevated' \| 'flat'` | `'default'` | Visual style |
| `hoverable` | `boolean` | `false` | Adds hover shadow/scale effect |
| `clickable` | `boolean` | `false` | Adds cursor pointer and focus ring |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `CardSkeleton`
**File:** `components/shared/cards/CardSkeleton.js`

Animated pulse loading skeleton for card-shaped content.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `string` | `'default'` | Skeleton layout variant |
| `className` | `string` | `''` | Extra CSS classes |

---

### `EntityCard`
**File:** `components/shared/cards/EntityCard.js`

Configurable wrapper displaying an entity icon, badges, title, subtitle, and slot content.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entityType` | `string` | — | Used to resolve the entity icon |
| `title` | `string` | — | Primary heading |
| `subtitle` | `string` | — | Secondary line |
| `children` | `ReactNode` | — | Body content |
| `badges` | `Array<{label, variant, size}>` | `[]` | Badges rendered next to the title |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `PersonCard`
**File:** `components/shared/cards/PersonCard.js`

Displays a genealogical individual: avatar or photo, full name, gender and living/deceased badges, birth/death info, and relationship counts.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `person` | `Object` | — | `{id, xref, name, givenName, surname, birthDate, birthPlace, deathDate, deathPlace, gender, isLiving, photoUrl, relationships}` |
| `treeId` | `string` | — | Used to build detail-page links |
| `onClick` | `Function` | — | Click handler |
| `variant` | `'default' \| 'compact'` | `'default'` | Layout size |
| `className` | `string` | `''` | Extra CSS classes |

---

### `FamilyCard`
**File:** `components/shared/cards/FamilyCard.js`

Displays a GEDCOM family unit with husband/wife avatars, marriage and divorce info, and children count.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `family` | `Object` | — | `{id, xref, husband, wife, children, marriageDate, marriagePlace, divorceDate, divorcePlace}` |
| `treeId` | `string` | — | Used for navigation links |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `TreeCard`
**File:** `components/shared/cards/TreeCard.js`

Displays a family tree with public/private badge, stat grid (individuals, families, places, events, sources, notes), owner info, and action buttons. Features a `featured` ring variant.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tree` | `Object` | — | `{id, name, description, isPublic, individualsCount, familiesCount, placesCount, eventsCount, sourcesCount, notesCount, owner, owners, updatedAt}` |
| `onClick` | `Function` | — | Click handler |
| `onRequestAccess` | `Function` | — | Request-access button handler |
| `variant` | `'default' \| 'compact' \| 'featured'` | `'default'` | Layout variant |
| `showPreview` | `boolean` | `false` | Show mini pedigree preview |
| `className` | `string` | `''` | Extra CSS classes |

---

### `MediaCard`
**File:** `components/shared/cards/MediaCard.js`

Displays a media file with thumbnail/preview, type badge (Image/Video/Audio/Document), file size, dimensions, and association count.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `media` | `Object` | — | `{id, title, description, filePath, thumbnailPath, mimeType, fileSize, width, height, createdAt, associations}` |
| `treeId` | `string` | — | Navigation context |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `TagCard`
**File:** `components/shared/cards/TagCard.js`

Displays a tag with its coloured badge, description, scope (global or personal), and item count.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tag` | `Object` | — | `{id, name, color, description, isGlobal, userId, createdAt}` |
| `itemCount` | `number` | `0` | Number of tagged items |
| `onClick` | `Function` | — | Click handler |
| `onRemove` | `Function` | — | Remove tag handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `AlbumCard`
**File:** `components/shared/cards/AlbumCard.js`

Displays a media album with cover image, public/private badge, media count, and owner info.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `album` | `Object` | — | `{id, name, description, isPublic, user, createdAt, updatedAt}` |
| `mediaCount` | `number` | `0` | Number of items in the album |
| `coverImageUrl` | `string` | — | Cover image URL |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `PlaceCard`
**File:** `components/shared/cards/PlaceCard.js`

Displays a place with optional coordinates and event/person/family counts.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `place` | `Object` | — | `{id, name, normalizedName, latitude, longitude, eventsCount, individualsCount, familiesCount}` |
| `treeId` | `string` | — | Navigation context |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `EventCard`
**File:** `components/shared/cards/EventCard.js`

Displays a GEDCOM event with type badge, date, place, description, participant counts, and source/media counts.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `event` | `Object` | — | `{id, eventType, date, place, description, individuals, families, sources, media}` |
| `treeId` | `string` | — | Navigation context |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `SourceCard`
**File:** `components/shared/cards/SourceCard.js`

Displays a GEDCOM source with XREF badge, title, author, publication, repository, citation count, and media count.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `source` | `Object` | — | `{id, xref, title, author, publication, repository, citationsCount, media}` |
| `treeId` | `string` | — | Navigation context |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `GivenNameCard`
**File:** `components/shared/cards/GivenNameCard.js`

Displays a given name with frequency and gender breakdown (total, male, female, unknown).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `givenName` | `Object` | — | `{name, normalizedName, individualsCount, malesCount, femalesCount, unknownCount}` |
| `treeId` | `string` | — | Navigation context |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `SurnameCard`
**File:** `components/shared/cards/SurnameCard.js`

Displays a surname with frequency and family count.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `surname` | `Object` | — | `{name, normalizedName, individualsCount, familiesCount}` |
| `treeId` | `string` | — | Navigation context |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `UserCard`
**File:** `components/shared/cards/UserCard.js`

Displays a user profile with avatar, admin badge, display name, username, location, bio, tree/contribution stats, and follower/following counts.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `user` | `Object` | — | `{id, username, name, email, isWebsiteOwner, profilePhotoUrl}` |
| `profile` | `Object` | — | `{displayName, bio, location, treesOwnedCount, treesMaintainedCount, contributionsCount, followersCount, followingCount}` |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `RequestCard`
**File:** `components/shared/cards/RequestCard.js`

Displays an access request with type badge, status badge, requester info, tree link, notes, response notes, timestamps, and approve/reject buttons (visible when status is `pending`).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `request` | `Object` | — | `{id, requestType, status, notes, responseNotes, requestedAt, respondedAt, user, tree, responder}` |
| `onApprove` | `Function` | — | Approve button handler |
| `onReject` | `Function` | — | Reject button handler |
| `actionLoading` | `boolean` | `false` | Disables buttons while saving |
| `className` | `string` | `''` | Extra CSS classes |

---

### `DiscussionThreadCard`
**File:** `components/shared/cards/DiscussionThreadCard.js`

Displays a discussion thread with pinned/locked/closed badges, category badge, title, description, tags, creator info, and post count.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `thread` | `Object` | — | `{id, title, description, category, tags, isLocked, isPinned, isClosed, createdBy, creator, createdAt, posts, tree}` |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `SuggestionCard`
**File:** `components/shared/cards/SuggestionCard.js`

Displays an edit suggestion with entity icon, status badge, field name, current vs suggested values, evidence text, suggester info, and reviewer info.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `suggestion` | `Object` | — | `{id, entityType, entityId, fieldName, currentValue, suggestedValue, evidence, status, suggestedBy, suggester, reviewedBy, reviewer, reviewedAt, createdAt, tree}` |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `ResearchNoteCard`
**File:** `components/shared/cards/ResearchNoteCard.js`

Displays a research note with private badge, notebook badge, entity context, title, content preview, tags, author info, and tree name.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `note` | `Object` | — | `{id, title, content, entityType, entityId, isPrivate, tags, notebook, user, createdAt, updatedAt, tree}` |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `NotebookCard`
**File:** `components/shared/cards/NotebookCard.js`

Displays a notebook with private badge, name, description, note count, and owner info.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `notebook` | `Object` | — | `{id, name, description, isPrivate, user, createdAt, updatedAt}` |
| `noteCount` | `number` | `0` | Number of notes in the notebook |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `UserContentCard`
**File:** `components/shared/cards/UserContentCard.js`

Displays a user content post (research update, family story, recipe, etc.) with content type badge, visibility badge, title, content preview, recipe ingredients (if applicable), tag arrays (surnames, locations, time periods), and engagement stats.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `Object` | — | `{id, contentType, title, content, isPublic, visibility, surnames, locations, timePeriods, likesCount, commentsCount, sharesCount, recipeIngredients, recipeInstructions, user, createdAt, tree, entityType, entityId}` |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `NotificationCard`
**File:** `components/shared/cards/NotificationCard.js`

Displays a notification with type icon, title, message, unread dot indicator, relative timestamp, and a mark-as-read button.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `notification` | `Object` | — | `{id, type, title, message, link, isRead, readAt, createdAt}` |
| `onClick` | `Function` | — | Click/navigate handler |
| `onMarkRead` | `Function` | — | Mark as read handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `ActivityCard`
**File:** `components/shared/cards/ActivityCard.js`

Displays an activity feed entry with user avatar or activity type icon, username, description, entity reference, tree name, and relative timestamp.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activity` | `Object` | — | `{id, activityType, entityType, entityId, description, user, tree, createdAt, metadata}` |
| `onClick` | `Function` | — | Click handler |
| `className` | `string` | `''` | Extra CSS classes |

---

## Data Display Components

### `DataViewContainer`
**File:** `components/shared/data-display/DataViewContainer.js`

The primary orchestrator for paginated, searchable, filterable, sortable entity lists. Manages all view state and delegates rendering to child components. Supports card/list toggle, bulk selection, tabs, and an "Add new" panel.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Array` | `[]` | Data items to display |
| `loading` | `boolean` | `false` | Shows skeleton/spinner while `true` |
| `error` | `Object \| string \| null` | — | Error to display |
| `emptyState` | `{title, message, action}` | — | Rendered when `items` is empty |
| `renderCard` | `(item, index) => ReactNode` | — | Card renderer |
| `renderRow` | `(item, index) => ReactNode` | — | Row renderer for list view |
| `defaultView` | `'card' \| 'list'` | `'card'` | Initial view mode |
| `listHeaders` | `Array<{label, key, sortable}>` | — | Column headers for list view |
| `cardGridProps` | `Object` | — | Forwarded to `CardGrid` |
| `searchPlaceholder` | `string` | `'Search...'` | Search input placeholder |
| `searchLabel` | `string` | `''` | Label describing what field is searched |
| `advancedSearchFields` | `Array` | — | Config for advanced search conditions |
| `filters` | `Array` | — | Filter field configs |
| `defaultFilterValues` | `Object` | — | Initial filter state |
| `sortOptions` | `Array<{value, label}>` | — | Sort choices |
| `defaultSort` | `string` | `''` | Initial sort key |
| `defaultSortDirection` | `'asc' \| 'desc'` | `'asc'` | Initial sort direction |
| `totalItems` | `number` | `0` | Total count for pagination |
| `defaultPerPage` | `number` | `10` | Default items per page |
| `actions` | `Array` | — | Entity action configs |
| `userPermissions` | `Object` | — | Permission map for action visibility |
| `getItemId` | `(item) => string` | `item.id ?? item.xref` | Key extractor |
| `onBulkDelete` | `Function` | — | Bulk delete handler |
| `onBulkCompare` | `Function` | — | Bulk compare handler |
| `onParamsChange` | `(params) => void` | — | Called on every search/filter/sort/page change |
| `addNewComponent` | `ReactNode` | — | Content for the "Add new" tab |
| `extraTabs` | `Array` | `[]` | Additional tab definitions |
| `className` | `string` | `''` | Extra CSS classes |

---

### `DataView`
**File:** `components/shared/data-display/DataView.js`

Switches between `ListView` (table-like) and `CardGrid` (responsive grid) based on the `view` prop.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `view` | `'list' \| 'card'` | `'card'` | Active view mode |
| `items` | `Array` | `[]` | Data items |
| `renderCard` | `Function` | — | Card renderer |
| `renderRow` | `Function` | — | Row renderer |
| `cardGridProps` | `Object` | — | Forwarded to `CardGrid` |
| `listViewProps` | `Object` | — | Forwarded to `ListView` |
| `className` | `string` | `''` | Extra CSS classes |

---

### `ListView`
**File:** `components/shared/data-display/ListView.js`

Table-style list with sortable column headers, optional row selection checkboxes, and hover effects.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Array` | `[]` | Data items |
| `renderRow` | `Function` | — | Row renderer: `(item, index) => ReactNode` |
| `headers` | `Array<{label, key, sortable}>` | `[]` | Column headers |
| `onSort` | `(key, direction) => void` | — | Sort change handler |
| `sortKey` | `string` | — | Active sort column |
| `sortDirection` | `'asc' \| 'desc'` | `'asc'` | Active sort direction |
| `isSelectionMode` | `boolean` | `false` | Renders checkboxes |
| `onSelectAll` | `Function` | — | Select-all checkbox handler |
| `isSelectAllChecked` | `boolean` | `false` | State of select-all checkbox |
| `className` | `string` | `''` | Extra CSS classes |

---

### `CardGrid`
**File:** `components/shared/data-display/CardGrid.js`

Responsive grid that renders a list of cards with configurable column counts per breakpoint.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Array` | `[]` | Data items |
| `renderCard` | `Function` | — | Card renderer: `(item, index) => ReactNode` |
| `columns` | `{default, sm, md, lg, xl}` | `{default:1, sm:2, md:3, lg:4}` | Column counts per breakpoint |
| `className` | `string` | `''` | Extra CSS classes |

---

### `DataViewToolbar`
**File:** `components/shared/data-display/DataViewToolbar.js`

Icon toolbar with progressive disclosure. Clicking Search, Filter, Sort, or Selection Mode icons expands a section below with an animated slide-down. Also contains the card/list view toggle.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeSection` | `'search' \| 'filter' \| 'sort' \| 'selection' \| null` | — | Currently open section |
| `onSectionChange` | `Function` | — | Section toggle handler |
| `view` | `'card' \| 'list'` | `'card'` | Current view mode |
| `onViewChange` | `Function` | — | View toggle handler |
| `hasSearch` | `boolean` | `true` | Shows search icon |
| `hasFilters` | `boolean` | `false` | Shows filter icon |
| `hasSort` | `boolean` | `false` | Shows sort icon |
| `hasSelectionMode` | `boolean` | `true` | Shows selection icon |
| `renderSearchSection` | `() => ReactNode` | — | Search section content |
| `renderFilterSection` | `() => ReactNode` | — | Filter section content |
| `renderSortSection` | `() => ReactNode` | — | Sort section content |
| `renderSelectionSection` | `() => ReactNode` | — | Selection section content |
| `className` | `string` | `''` | Extra CSS classes |

---

### `DataViewSearch`
**File:** `components/shared/data-display/DataViewSearch.js`

Debounced search input with a search icon, clear button, and optional label. Fires `onChange` after `debounceMs` milliseconds.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | Current search value |
| `onChange` | `(value) => void` | — | Debounced change handler |
| `placeholder` | `string` | `'Search...'` | Input placeholder |
| `searchLabel` | `string` | `''` | Label shown beside the input |
| `debounceMs` | `number` | `300` | Debounce delay in ms |
| `className` | `string` | `''` | Extra CSS classes |

---

### `DataViewSearchAdvanced`
**File:** `components/shared/data-display/DataViewSearchAdvanced.js`

Toggle panel for building multi-condition searches. Supports `text`, `select`, `number`, and `date` field types with appropriate operators (contains, equals, starts with, etc.). Shows an active-condition count badge.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fields` | `Array<{key, label, type?, options?, operators?}>` | `[]` | Field definitions |
| `value` | `Array<{id, field, operator, value}>` | `[]` | Active conditions |
| `onChange` | `(conditions) => void` | — | Conditions change handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `DataViewFilter`
**File:** `components/shared/data-display/DataViewFilter.js`

Filter panel with declarative configuration. Supports `select`, `toggle`, `text`, and `range` filter types. Active filters are shown as removable badges.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `filters` | `Array<{key, label, type, options?, min?, max?, placeholder?}>` | `[]` | Filter field configs |
| `values` | `Object` | `{}` | Current filter values |
| `onChange` | `(values) => void` | — | Values change handler |
| `onClear` | `() => void` | — | Reset all filters handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `DataViewSort`
**File:** `components/shared/data-display/DataViewSort.js`

Sort field dropdown (Headless UI `Listbox`) paired with an ascending/descending toggle button.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `Array<{value, label}>` | `[]` | Sort options |
| `sortKey` | `string` | — | Active sort key |
| `sortDirection` | `'asc' \| 'desc'` | `'asc'` | Active sort direction |
| `onChange` | `(key, direction) => void` | — | Change handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `DataViewActions`
**File:** `components/shared/data-display/DataViewActions.js`

Renders action buttons for a single entity, used in both table rows and card footers. Provides built-in icons for `view`, `edit`, `delete`, `activate`, `deactivate`, and `admin` actions. Supports permission-based visibility.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `actions` | `Array<{key, label, icon?, href?, onClick?, permission?, variant?}>` | `[]` | Action definitions |
| `item` | `Object` | — | The entity data row |
| `userPermissions` | `Object` | `{}` | Map of permission keys to booleans |
| `layout` | `'row' \| 'card'` | `'row'` | Spacing/orientation for context |

---

### `DataViewTabs`
**File:** `components/shared/data-display/DataViewTabs.js`

Tab container using DaisyUI lifted-tab styling.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `Array<{key, label, content, icon?}>` | `[]` | Tab definitions |
| `defaultTab` | `string` | — | Initially active tab key |
| `onChange` | `(key) => void` | — | Tab change handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `ListSkeleton`
**File:** `components/shared/data-display/ListSkeleton.js`

Loading skeleton for the list view.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `number` | `5` | Number of skeleton rows |
| `columns` | `number` | `4` | Number of skeleton columns per row |
| `className` | `string` | `''` | Extra CSS classes |

---

### `AddNewPlaceholder`
**File:** `components/shared/data-display/AddNewPlaceholder.js`

Placeholder content rendered in the "Add new" tab.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | `'Add new form coming soon.'` | Placeholder message |

---

### `ChartsPlaceholder` / `StatisticsPlaceholder`
**Files:** `components/shared/data-display/ChartsPlaceholder.js`, `StatisticsPlaceholder.js`

Placeholder content for Charts and Statistics tabs respectively.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | `'Charts coming soon.'` / `'Statistics coming soon.'` | Placeholder message |

---

### `MediaTagsAndAlbums`
**File:** `components/shared/data-display/MediaTagsAndAlbums.js`
**Exports:** `TagsCell`, `AlbumsCell`

Helper cell components for rendering tag badge arrays and album name lists in media list-view rows.

| Export | Prop | Description |
|--------|------|-------------|
| `TagsCell` | `tags: Array` | Renders tags as inline badges |
| `AlbumsCell` | `albums: Array` | Renders album names as comma-separated text |

---

## UI Elements

### `Badge`
**File:** `components/shared/ui/badges/Badge.js`

DaisyUI badge with variant and size mapping.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Badge label |
| `variant` | `'default' \| 'success' \| 'warning' \| 'error' \| 'info' \| 'accent'` | `'default'` | Colour variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size |
| `className` | `string` | `''` | Extra CSS classes |

---

### `TagBadge`
**File:** `components/shared/ui/badges/TagBadge.js`

Specialised badge for tags, supporting a custom hex colour and an optional remove button.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | — | Tag name |
| `color` | `string` | — | Hex colour (e.g. `#ff6600`) |
| `removable` | `boolean` | `false` | Shows ✕ button when `true` |
| `onRemove` | `Function` | — | Remove handler |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size |
| `className` | `string` | `''` | Extra CSS classes |

---

### `Avatar`
**File:** `components/shared/ui/avatars/Avatar.js`

User avatar with image or generated-initials fallback.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | — | Image URL |
| `alt` | `string` | — | Alt text |
| `name` | `string` | — | Name used to generate initials when no `src` |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Size |
| `className` | `string` | `''` | Extra CSS classes |

---

### `EntityIcon`
**File:** `components/shared/ui/metadata/EntityIcon.js`

Maps an entity type string to a corresponding SVG icon.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entityType` | `'individual' \| 'family' \| 'event' \| 'place' \| 'source' \| 'media' \| 'tree' \| 'note' \| 'date' \| 'tag' \| 'album' \| 'user'` | — | Entity type |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Icon size |
| `className` | `string` | `''` | Extra CSS classes |

---

## Navigation Components

### `Breadcrumbs`
**File:** `components/shared/navigation/Breadcrumbs.js`

Hierarchical breadcrumb navigation using DaisyUI breadcrumb styling.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Array<{label, href}>` | `[]` | Breadcrumb items (last item is current page) |
| `className` | `string` | `''` | Extra CSS classes |

---

### `Pagination`
**File:** `components/shared/navigation/Pagination.js`

Page navigation with per-page selector. Displays "Showing X–Y of Z results" and page number buttons with ellipsis compression for large page counts.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | `1` | Active page number |
| `totalPages` | `number` | `1` | Total number of pages |
| `totalItems` | `number` | `0` | Total record count |
| `onPageChange` | `(page) => void` | — | Page change handler |
| `itemsPerPage` | `number` | `25` | Records per page |
| `perPageOptions` | `number[]` | `[5,10,20,25,50,100]` | Per-page selector options |
| `onPerPageChange` | `(perPage) => void` | — | Per-page change handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `ViewToggle`
**File:** `components/shared/navigation/ViewToggle.js`

Joined button pair to switch between list and card view modes.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `view` | `'list' \| 'card'` | `'card'` | Active view |
| `onViewChange` | `(view) => void` | — | Toggle handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `SortDropdown`
**File:** `components/shared/navigation/SortDropdown.js`

Headless UI `Listbox` dropdown for sort option selection.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `Array<{value, label}>` | `[]` | Sort options |
| `value` | `string` | — | Selected option value |
| `onChange` | `(value) => void` | — | Change handler |
| `className` | `string` | `''` | Extra CSS classes |

---

## Form Components

### `SearchBar`
**File:** `components/shared/forms/SearchBar.js`

Standalone search input with icon and clear button. Pressing Enter triggers `onSearch`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | Current value |
| `onChange` | `(value) => void` | — | Change handler |
| `onSearch` | `(value) => void` | — | Submit handler (Enter key) |
| `placeholder` | `string` | `'Search...'` | Input placeholder |
| `className` | `string` | `''` | Extra CSS classes |

---

## Feedback Components

### `EmptyState`
**File:** `components/shared/feedback/EmptyState.js`

Centred empty-state placeholder with optional icon, title, message, and action button.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | Heading |
| `message` | `string` | — | Supporting text |
| `icon` | `ReactNode` | — | Icon node |
| `action` | `ReactNode` | — | Action button/link |
| `className` | `string` | `''` | Extra CSS classes |

---

### `LoadingState`
**File:** `components/shared/feedback/LoadingState.js`

Centred DaisyUI spinner with optional text message.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | — | Loading message |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Spinner size |
| `className` | `string` | `''` | Extra CSS classes |

---

### `ErrorState`
**File:** `components/shared/feedback/ErrorState.js`

Error display with title, message, and an optional retry button.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `'Something went wrong'` | Error heading |
| `message` | `string` | — | Error detail |
| `onRetry` | `Function` | — | Retry handler |
| `className` | `string` | `''` | Extra CSS classes |

---

## Notification Components

### `NotificationPanel`
**File:** `components/shared/notifications/NotificationPanel.js`

Slide-in panel from the right that displays grouped notifications (Today, This Week, Earlier). Supports All/Unread filter tabs, mark-as-read, and action links.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | — | Controls panel visibility |
| `onClose` | `Function` | — | Close handler |
| `user` | `Object` | — | Current authenticated user |

---

### `ErrorToast`
**File:** `components/shared/notifications/ErrorToast.js`

Individual error toast with severity styling, auto-dismiss for non-critical errors, and an optional retry button.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `error` | `{message, error, action, facet, timestamp, retryable?}` | — | Error data |
| `severity` | `'error' \| 'warning' \| 'info'` | `'error'` | Toast colour |
| `retryable` | `boolean` | `false` | Shows Retry button when `true` |
| `onDismiss` | `Function` | — | Dismiss handler |
| `onRetry` | `Function` | — | Retry handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `ErrorNotificationContainer`
**File:** `components/shared/notifications/ErrorNotificationContainer.js`

Container that listens for `errors:stateChanged` events and renders up to `maxNotifications` `ErrorToast` components at the specified screen corner.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Screen corner |
| `maxNotifications` | `number` | `5` | Max visible toasts |
| `className` | `string` | `''` | Extra CSS classes |

---

## Theme Components

### `ThemeToggle` / `ThemeDropdown`
**File:** `components/shared/theme/ThemeToggle.js`

| Export | Description |
|--------|-------------|
| `ThemeToggle` | Icon button that toggles between light and dark themes |
| `ThemeDropdown` | Dropdown with Light / Dark / System options |

Both accept an optional `className` prop.

---

### `ThemeProvider` / `useTheme`
**File:** `components/shared/theme/ThemeContext.js`

Context provider managing theme state with `localStorage` persistence and system-preference detection.

**`ThemeProvider` props:** `children: ReactNode`

**`useTheme()` returns:**

| Key | Type | Description |
|-----|------|-------------|
| `theme` | `'light' \| 'dark' \| 'system'` | Stored preference |
| `resolvedTheme` | `'light' \| 'dark'` | Actual applied theme |
| `setTheme` | `(theme) => void` | Set preference |
| `toggleTheme` | `() => void` | Toggle light ↔ dark |
| `isDark` | `boolean` | Shorthand for `resolvedTheme === 'dark'` |

---

## Feature Components

### `ExploreTrees`
**File:** `components/features/dashboard/ExploreTrees.js`

Section component showing a grid of tree cards. Fetches trees from the API with an optional filter.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `'Explore Trees'` | Section heading |
| `subtitle` | `string` | `'Discover family histories...'` | Section sub-heading |
| `showViewAll` | `boolean` | `true` | Shows "View all" link |
| `limit` | `number` | `6` | Max trees to fetch |
| `filter` | `'all' \| 'public' \| 'my'` | `'all'` | Which trees to load |
| `emptyMessage` | `string` | `'No trees found'` | Empty state message |
| `emptyLinkText` | `string` | `'Upload GEDCOM'` | Empty state CTA text |
| `emptyLinkHref` | `string` | `'/upload'` | Empty state CTA href |

---

### `RecentActivity`
**File:** `components/features/dashboard/RecentActivity.js`

Section showing an activity feed with icons, formatted messages, and relative timestamps.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `'Recent Activity'` | Section heading |
| `limit` | `number` | `5` | Number of items to show |
| `showViewAll` | `boolean` | `true` | Shows "View all" link |

---

### `PendingRequests`
**File:** `components/features/dashboard/PendingRequests.js`

Superuser-only section showing pending access requests with approve/reject actions and response-note input. Fetches from the API.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxItems` | `number` | `5` | Max requests to show |
| `showViewAll` | `boolean` | `true` | Shows "View all" link |

---

### `GlobalSearch`
**File:** `components/features/search/GlobalSearch.js`

Full-screen modal (triggered by ⌘K) with debounced multi-entity search, filter tabs (All / Trees / People / Places), grouped results, and a "See all results" link.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | — | Controls modal visibility |
| `onClose` | `Function` | — | Close handler |
| `placeholder` | `string` | `'Search trees, people, places...'` | Input placeholder |

---

### `TreeCard` (feature variant)
**File:** `components/features/trees/TreeCard.js`
**Exports:** `TreeCard`, `TreeCardSkeleton`

Feature-level tree card that additionally renders a mini 3-generation pedigree preview.

| Export | Props | Description |
|--------|-------|-------------|
| `TreeCard` | `tree, variant, showPreview, onRequestAccess` | Full tree card with pedigree preview |
| `TreeCardSkeleton` | — | Loading skeleton matching the card layout |

---

### `TreeOverviewToolbar`
**File:** `components/features/trees/TreeOverviewToolbar.js`

Toolbar for the tree overview page with progressive-disclosure sections: Overview, Edit, Export, Media, Fork/Clone, Discussions, Blog, and AI.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `treeId` | `string` | — | Current tree ID |
| `activeSection` | `string \| null` | — | Open section key |
| `onSectionChange` | `Function` | — | Section toggle handler |
| `className` | `string` | `''` | Extra CSS classes |

---

### `TreeProfileHeader`
**File:** `components/features/trees/TreeProfileHeader.js`

Profile-style header for the tree overview page with avatar, tree name, description, follower/member counts, and Follow/Join/Email actions.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tree` | `Object` | — | Tree data object |

---

### `CommentList`
**File:** `components/features/comments/CommentList.js`

Fetches and renders a threaded comment list for any entity, plus a new-comment form.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entityType` | `string` | — | Entity type being commented on |
| `entityId` | `string` | — | Entity ID being commented on |
| `treeId` | `string` | — | Scoping tree ID |
| `canModerate` | `boolean` | `false` | Shows moderation actions |
| `className` | `string` | `''` | Extra CSS classes |

---

### `CommentItem`
**File:** `components/features/comments/CommentItem.js`

Single comment or reply with author, content, and inline edit/delete/resolve/reply actions.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `comment` | `Object` | — | `{id, content, user, createdAt, isEdited, isResolved, isPinned, replies}` |
| `isReply` | `boolean` | `false` | Applies indented reply styling |
| `onEdit` | `(id, content) => Promise` | — | Save edit handler |
| `onDelete` | `(id) => Promise` | — | Delete handler |
| `onResolve` | `(id, resolved) => Promise` | — | Resolve/unresolve handler |
| `onReply` | `(parentId, content) => Promise` | — | Submit reply handler |
| `canEdit` | `boolean` | `false` | Shows edit action |
| `canModerate` | `boolean` | `false` | Shows moderate actions |

---

### `CommentForm`
**File:** `components/features/comments/CommentForm.js`

Form for creating a new comment, new reply, or editing an existing comment.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entityType` | `string` | — | Entity type (for new comments) |
| `entityId` | `string` | — | Entity ID (for new comments) |
| `treeId` | `string` | — | Scoping tree ID |
| `parentId` | `string` | — | Parent comment ID (for replies) |
| `initialContent` | `string` | `''` | Pre-filled content (for edits) |
| `commentId` | `string` | — | ID of comment being edited |
| `onSuccess` | `Function` | — | Called after successful save |
| `onCancel` | `Function` | — | Cancel handler |
| `onSubmit` | `(content) => Promise` | — | Custom submit override |

---

## Other Shared Components

### `TreeSelectorModal`
**File:** `components/shared/trees/TreeSelectorModal.js`

Modal driven by `ActiveTreeContext` for switching between trees. Includes search, a filtered tree list, and an active-tree indicator.

> No external props — reads from and writes to `ActiveTreeContext`.

---

### `TreePageHeader`
**File:** `components/shared/TreePageHeader.js`

Page header for tree-scoped pages. Fetches and displays the tree name from the API, along with the page title and optional subtitle.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `treeId` | `string` | — | Tree ID used to fetch tree name |
| `title` | `string` | — | Page-level heading |
| `subtitle` | `string` | — | Optional sub-heading |
| `className` | `string` | `''` | Extra CSS classes |

---

### `RichTextEditor`
**File:** `components/shared/RichTextEditor.js`

TipTap-based rich text editor (StarterKit + Placeholder extension). Outputs HTML. Configured for SSR safety in Next.js.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | HTML content (controlled) |
| `onChange` | `(html) => void` | — | Content change handler |
| `placeholder` | `string` | `'Write something…'` | Editor placeholder |
| `minHeight` | `string` | `'100px'` | Minimum editor height |
| `className` | `string` | `''` | Extra CSS classes |
| `disabled` | `boolean` | `false` | Prevents editing |

---

## Context Providers

### `ActiveTreeContext`
**File:** `context/ActiveTreeContext.js`
**Exports:** `ActiveTreeProvider`, `useActiveTree`

Tracks the currently active tree across the session. On mount it resolves the active tree by checking: URL treeId → `localStorage` → first alphabetical tree. Synchronises state when the URL changes.

**`useActiveTree()` returns:**

| Key | Type | Description |
|-----|------|-------------|
| `activeTree` | `Object \| null` | Currently active tree |
| `trees` | `Array` | All accessible trees |
| `loading` | `boolean` | `true` while fetching trees |
| `setActiveTree` | `(tree) => void` | Sets active tree without navigation |
| `switchTree` | `(tree) => void` | Sets active tree and navigates to same path under new treeId |
| `isTreeSelectorOpen` | `boolean` | Tree selector modal state |
| `openTreeSelector` | `() => void` | Opens tree selector modal |
| `closeTreeSelector` | `() => void` | Closes tree selector modal |
