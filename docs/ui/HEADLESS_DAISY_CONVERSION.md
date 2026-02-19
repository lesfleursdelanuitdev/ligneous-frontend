# Headless UI + DaisyUI Conversion Status

**Date:** 2026-02-18  
**Stack:** Next.js 16, React 19, Tailwind 4.

## Done

### Setup
- **Dependencies:** `@headlessui/react` (v2), `daisyui` (v5).
- **Tailwind 4:** `@plugin "daisyui"` in `app/globals.css`.
- **Theme:** `ThemeContext` sets `data-theme="light"` or `data-theme="dark"` on `<html>` so DaisyUI theme variables apply.

### Components converted

| Component | Change |
|-----------|--------|
| **SortDropdown** | Headless UI `Listbox` (behavior) + DaisyUI `btn btn-outline btn-sm`, `menu`, `dropdown-content`, `rounded-box`, `bg-base-100`. |
| **TopBar** | Headless UI `Menu` / `MenuButton` / `MenuItems` / `MenuItem` (user menu); DaisyUI `btn btn-ghost`, `badge`, `rounded-box`, `base-100`, `base-200`, `base-content`, `primary`, `error`. |
| **ThemeToggle** | DaisyUI `btn btn-ghost btn-square btn-sm`. |
| **CommentForm** | DaisyUI `textarea textarea-bordered`, `btn btn-primary btn-sm`, `btn btn-ghost btn-sm`, `text-error`. |
| **Pagination** | DaisyUI `btn btn-outline btn-sm`, `btn btn-primary btn-sm`, `btn btn-ghost`, `text-base-content/60`. |
| **SearchBar** | DaisyUI `input input-bordered`, `text-base-content/40`. |
| **ViewToggle** | DaisyUI `join`, `btn btn-sm join-item`, `btn-primary`, `btn-ghost`. |
| **EmptyState** | DaisyUI `text-base-content`, `text-base-content/60`. |
| **ErrorState** | DaisyUI `text-error`, `text-base-content`, `btn btn-primary`. |
| **LoadingState** | DaisyUI `loading loading-spinner text-primary`, `loading-sm` / `loading-lg`, `text-base-content/60`. |
| **Breadcrumbs** | DaisyUI `breadcrumbs`, `text-base-content`, `text-base-content/60`, `link`. |
| **Badge** | DaisyUI `badge`, `badge-ghost`, `badge-success`, `badge-warning`, `badge-error`, `badge-info`, `badge-primary`, `badge-sm`, `badge-lg`. |
| **BaseCard** | DaisyUI `bg-base-100`, `border-base-content/10`, `rounded-box`, `bg-base-200`. |
| **DesktopSidebar** | DaisyUI `bg-base-100`, `border-base-content/10`, `bg-primary/10 text-primary`, `text-base-content/50`, `bg-base-200`. |
| **MobileNav** | DaisyUI `bg-base-100`, `btn btn-primary` (FAB), `btn btn-ghost btn-sm`, `text-primary`, `bg-error text-error-content`. |
| **PendingRequests / RequestCard** | DaisyUI `bg-base-100`, `btn btn-success btn-sm`, `btn btn-error btn-sm`, `btn btn-ghost btn-sm`, `textarea textarea-bordered`, `link link-primary`, warning panel with `border-warning/30`, `bg-warning/5`, `text-success`, `text-error`, `loading loading-spinner`. |
| **ErrorToast** | DaisyUI `alert`, `alert-error`, `alert-warning`, `alert-info`, `btn btn-ghost btn-sm btn-square`, `btn btn-sm`. |
| **TreeCard** | DaisyUI `ring-primary`, `link link-hover link-primary`, `text-base-content` / `base-content/50` / `base-content/70`, `btn btn-primary btn-sm`, `btn btn-ghost btn-sm`, `border-base-content/10`. |

### Styling notes
- Headless UI state: use Tailwind data attributes, e.g. `data-[open]:rotate-180`, `data-[active]:bg-base-200`.
- DaisyUI semantic tokens: `base-100`, `base-200`, `base-content`, `primary`, `primary-content`, `error`, `error-content` (respect light/dark via `data-theme`).

### Fix applied
- `lib/tree-access.js`: import from `./permissions/index.js` (was `./permissions.js`).

### Additional conversions (batch 2)
- **NotificationPanel:** `bg-base-100`, `border-base-content/10`, `badge badge-primary`, `btn btn-ghost btn-sm btn-square`, `btn btn-sm` (filter tabs), `link link-primary`, notification item `bg-primary/5`, `text-base-content` / `base-content/60`, `btn btn-primary btn-sm` / `btn btn-ghost btn-sm` (Approve/Deny). Icon colors: `text-info`, `text-secondary`, `text-success`, `text-warning` with `bg-*/20`.
- **ExploreTrees:** Header `bg-primary/10`, `text-primary`, `text-base-content`, `text-base-content/60`, `link link-primary`. Error/empty cards: `bg-base-100`, `border-base-content/10`, `bg-error/20`, `text-error`, `btn btn-primary`, `bg-base-200`, `text-base-content/40`.
- **RecentActivity:** Header `bg-info/20`, `text-info`, `text-base-content`, `link link-primary`. Activity colors: `text-success`, `text-info`, `text-secondary`, `text-warning` with `bg-*/20`. Card `bg-base-100`, `border-base-content/10`, `divide-base-content/10`, `bg-base-200`, `text-base-content/80`, `text-base-content/50`.
- **CommentItem:** Reply border `border-base-content/10`, `text-base-content` / `text-base-content/60`, `text-success`, `text-warning`, `link link-primary`, `text-error`, `link link-hover`.
- **CommentList:** `text-base-content`, `text-base-content/60`, `text-error`.
- **Shared cards:** PersonCard, MediaCard, RequestCard (shared), GivenNameCard, SurnameCard, FamilyCard, PlaceCard, EventCard, SourceCard, AlbumCard, EntityCard, TagCard, UserCard, NotebookCard, DiscussionThreadCard, NotificationCard, SuggestionCard, ActivityCard, UserContentCard, ResearchNoteCard: `text-base-content`, `text-base-content/50`–`/80`, `border-base-content/10`, `bg-base-200`, `link link-primary`, `btn btn-success` / `btn btn-error` / `btn btn-ghost`, `text-success` (SuggestionCard).
- **CardSkeleton, ListView, ListSkeleton:** `bg-base-200`, `bg-base-100`, `divide-base-content/10`.
- **Avatar, EntityIcon, ThemeToggle:** `bg-base-200`, `text-base-content/70`, `focus:ring-primary`.

## Optional next steps
- **Headless UI Tailwind plugin:** Add `@headlessui/tailwindcss` and use `ui-open:`, `ui-active:` etc. instead of `data-[open]:`, `data-[active]:` if you prefer.
- **Headless UI Dialog:** Use for modals (e.g. confirm dialogs) where appropriate.
- **Custom DaisyUI theme:** In `globals.css` or a theme file, override DaisyUI variables to align with existing `--color-accent` etc. so the app stays on-brand.

## Build
- `npm run build` succeeds. One CSS warning from DaisyUI’s `@property` (radial progress); safe to ignore.
