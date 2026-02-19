# DataView, New Pages & Consistency TODO

**Stack for all new/updated pages:** Headless UI, DaisyUI, Lucide Icons.

**Reusable data display:** Use **DataView** (from `@/components/shared/data-display`) for **everything** that displays data in lists. DataView switches between list (ListView) and card (CardGrid) modes; we always use it so behaviour and layout stay consistent and users can choose view.

---

## 1. What You’re Saying (Summary)

- **All new pages** must use **Headless UI** (modals, dropdowns, disclosure), **DaisyUI** (tokens, components), and **Lucide Icons** (no inline SVG icons).
- **DataView** is the standard for any list/card data. Use it in:
  - Explore Trees
  - My Trees (new page)
  - Admin: Manage Users
  - Admin: Access Requests
  - Admin: Manage Trees
  - All new tree-scoped list pages (Individuals, Families, Places, Notes, etc.).
- This document lists:
  - Pages to **create** (including tree-type pages: individuals, families, notes, etc.).
  - Pages to **update** to use DataView and the shared stack.

---

## 2. Pages to Create

### 2.1 Global

| Route | Purpose | DataView |
|-------|---------|----------|
| `/my-trees` | List trees owned or maintained by the current user | **DataView** (list + card); same data shape as explore. |

### 2.2 Tree-scoped (under `/trees/[treeId]/...`)

| Route | Purpose | DataView |
|-------|---------|----------|
| `/trees/[treeId]` | Tree overview (stats, recent activity, quick links) | Optional: recent items via **DataView**. |
| `/trees/[treeId]/individuals` | List individuals (people) in this tree | **DataView** (list: name, sex, birth, death; card: person card; link to detail). |
| `/trees/[treeId]/given-names` | List given names (index) with counts | **DataView** (list: name, frequency; link to individuals by given name). |
| `/trees/[treeId]/surnames` | List surnames (index) with counts | **DataView** (list: surname, frequency; link to individuals by surname). |
| `/trees/[treeId]/families` | List families in this tree | **DataView** (list: parents, children count; link to family detail if we add it). |
| `/trees/[treeId]/places` | List places in this tree | **DataView** (place name, event count or similar). |
| `/trees/[treeId]/events` | List events (birth, death, marriage, etc.) | **DataView** (type, date, place, linked person/family). |
| `/trees/[treeId]/dates` | List normalized dates (index) | **DataView** (date, event count). |
| `/trees/[treeId]/sources` | List sources | **DataView** (title/ref, citation count). |
| `/trees/[treeId]/notes` | List notes | **DataView** (preview, owner ref). |

**Existing tree page:**

- `/trees/[treeId]/individuals/[id]` – Individual detail (already exists). Keep Headless UI + DaisyUI + Lucide; no DataView on this page.

---

## 3. Pages to Update (Use DataView + Stack)

| Page | Current UI | Change |
|------|------------|--------|
| **Explore** (`/explore`) | Card grid only (TreeCard) | Use **DataView**: list (rows: name, description, owner, counts, visibility) + card (TreeCard); Headless UI + DaisyUI + Lucide. |
| **My Trees** (`/my-trees`) | (Page missing) | **Create** page; use **DataView** (list + card) for "my" trees; same stack. |
| **Admin: Manage Users** (`/admin/users`) | Custom `<table>` | Refactor to use **DataView** (list mode with headers + `renderRow`; optional card); modals/dropdowns with Headless UI; Lucide. |
| **Admin: Access Requests** (`/admin/requests`) | Custom request cards/list | Refactor to use **DataView** (list: user, tree, type, status, date, actions; card: request card); Headless UI + DaisyUI + Lucide. |
| **Admin: Manage Trees** (`/admin/trees`) | Custom tree cards/list | Refactor to use **DataView** (list + card); Headless UI + DaisyUI + Lucide. |

---

## 4. Component Stack Checklist (Every New/Updated Page)

- **Headless UI** – For modals, listboxes, dropdowns, disclosure, tabs where appropriate.
- **DaisyUI** – For layout (e.g. `card`, `btn`, `input`, `badge`, `alert`), colors (`base-content`, `primary`, etc.), no raw Tailwind color classes or `--color-*`.
- **Lucide Icons** – Use `lucide-react` for all icons; no ad-hoc SVG in the page.
- **DataView** – For any screen that displays a list of items (list + card modes; DataView uses ListView and CardGrid internally).

---

## 5. DataView / ListView API (Reminder)

- **DataView props:** `view` ('list' | 'card'), `items`, `renderRow`, `renderCard`, `listViewProps`, `cardGridProps`, `className`. Parent handles view toggle (e.g. tab or toolbar).
- **ListView** (used by DataView for list mode): `items`, `renderRow(item, index) => <><td>...</td></>`, `headers` (optional, `{ label, key, sortable }`), `onSort`, `sortKey`, `sortDirection`, `className`.
- **Empty state:** ListView returns `null` when no items; parent pages should show an explicit empty state (e.g. “No individuals in this tree”) when `items.length === 0`.

---

## 6. Suggested Order of Work

1. **Create `/my-trees`** – Uses DataView/ListView; unblocks sidebar link.
2. **Refactor Explore** – Add list view via DataView + ListView.
3. **Create tree overview** – `/trees/[treeId]/page.js` (optional ListView for recent items).
4. **Create tree-scoped list pages** – Individuals, then Families, Given names, Surnames, Places, Events, Dates, Sources, Notes; each uses **DataView** + stack.
5. **Refactor Admin: Users, Requests, Trees** – Replace custom tables/cards with **DataView** and align with Headless UI + DaisyUI + Lucide.

---

## 7. What Pages We Need (Full List)

**Create:**

- `/my-trees` (My Trees)
- `/trees/[treeId]` (Tree overview)
- `/trees/[treeId]/individuals` (Individuals list)
- `/trees/[treeId]/given-names` (Given names list)
- `/trees/[treeId]/surnames` (Surnames list)
- `/trees/[treeId]/families` (Families list)
- `/trees/[treeId]/places` (Places list)
- `/trees/[treeId]/events` (Events list)
- `/trees/[treeId]/dates` (Dates list)
- `/trees/[treeId]/sources` (Sources list)
- `/trees/[treeId]/notes` (Notes list)

**Update to use DataView + stack:**

- `/explore` (Explore Trees)
- `/admin/users` (Manage Users)
- `/admin/requests` (Access Requests)
- `/admin/trees` (Manage Trees)

**Already exists (keep stack consistent):**

- `/trees/[treeId]/individuals/[id]` (Individual detail)

This document is the single place to track: **what to build**, **what to refactor**, and **how** (DataView, Headless UI, DaisyUI, Lucide).

---

## 8. Cross-tree search (people / names in multiple trees)

**Question:** What if we want to search for people or names that exist in **multiple trees**?

### 8.1 Data ownership and access (critical)

- **Frontend database** holds **tree metadata and access control only**:
  - Tree record: `id` (tree_id), `fileId` (links to backend), `name`, `description`, `isPublic`, etc.
  - Who can access which tree: `TreeOwner`, `TreeMaintainer`, `Permission`, and public flag. Same logic as `GET /api/trees` (owned, maintained, explicit permission, or public).
  - The frontend DB does **not** store the actual tree data (individuals, families, places, sources, notes).
- **Backend (Go API) database** holds **all actual tree data** for each file (individuals, families, places, sources, notes, graph). It is keyed by `file_id`. The Go API has **no** notion of users or permissions; it only knows `file_id`.
- **Access rule for cross-tree search:** Search **must** be limited to trees the user has access to. We must **never** pass a `file_id` to the Go API for a tree the user is not allowed to see—otherwise they could peek at other people's data. The list of allowed trees (and their `file_id`s) is computed **only** from the frontend DB using the same rules as elsewhere (owner, maintainer, permission, or public).

### 8.2 Current state: Go API

- The Go API has **no cross-tree (multi-file) search**.
- All search is **per file**:
  - **POST /api/v1/files/{file_id}/search** – “global” search **within that one file** (individuals, families, places, sources, notes by query string).
  - **POST /api/v1/files/{file_id}/individuals/search** – individuals search in that file.
  - **GET /api/v1/files/{file_id}/given-names**, **surnames** – name indexes for that file only.
- So: **we do not currently have Go API endpoints that support searching people or names across multiple trees.**

### 8.3 Frontend today

- **Search page** (`/search`) uses **mock data** only (“Mock search - replace with real API”). The mock implies cross-tree results (e.g. individuals with `treeId`), but there is no real backend for cross-tree search.

### 8.4 Options to support cross-tree search

**Option A – Orchestrate in Next.js (recommended)**

- Add a **Next.js API** route, e.g. **POST /api/search** (or **GET /api/search?q=...&scope=all|tree|treeIds=...**).
- Flow:
  1. **Auth:** Resolve current user (required for "my trees"; unauthenticated may only see public trees).
  2. **Allowed trees:** Compute the set of trees the user may search using the **frontend DB only**—same logic as `GET /api/trees` (e.g. owned, maintained, has permission, or tree is public). Restrict scope to this set (e.g. "all my trees" = this set; "this tree only" or "select trees" = subset). **Never** include a tree the user cannot access.
  3. For each allowed tree, read `fileId` from the frontend DB and call the **Go API** **POST /api/v1/files/{fileId}/search** (and/or individuals/search, given-names, surnames as needed). Do **not** call Go for any other `file_id`.
  4. **Aggregate** results: combine individuals (and optionally families, places, etc.) from those trees, attaching `treeId` and `treeName` (from frontend metadata) and `fileId` to each result.
  5. Return a **unified response** (e.g. `{ individuals: [{ ...person, treeId, treeName }, ...], families: [...], ... }`).
- **Pros:** Go API stays single-file; access control stays in the app that owns it (frontend DB). **Cons:** Multiple Go calls per search (can be parallel); cap number of trees or results for performance.

**Option B – New Go API “multi-file” search**

- New endpoint in the **Go API**, e.g. **POST /api/v1/search** with body `{ "query": "...", "file_ids": ["id1","id2",...] }` (or “all” if Go API owns file list).
- Go API would need to accept a list of file_ids (and possibly auth if it ever becomes the gatekeeper). It would run the existing per-file search logic for each file and merge results.
- **Pros:** One HTTP call from the frontend. **Cons:** Access control still must be enforced in the frontend before building the file_ids list; Go does not know users or permissions. The security constraint (no peeking) is unchanged: only pass allowed file_ids.

**Recommendation:** **Option A** – implement **POST /api/search** (or GET) in the **Next.js API** that (1) resolves user and **allowed** tree IDs/file IDs from the **frontend DB** (same rules as permissions), (2) calls the Go API **only** for those file_ids, (3) aggregates and returns results with tree context. No change to Go API contract; cross-tree logic and **access scoping** stay in the app; users cannot peek at other people's data.

### 8.5 How the UI would change

- **Search scope control**
  - **Scope selector:** e.g. “Search in: **All my trees** | **This tree only** (when already in a tree) | **Select trees…**” (multi-select). Default “All my trees” for the main search page; “This tree only” when searching from inside a tree (e.g. in header or sidebar).
- **Results**
  - Every result row/card includes **which tree** it’s in: e.g. “Norman Gonsalves · Gonsalves Family Tree” or a “Tree” column in list view.
  - **Links** go to the correct tree and entity: e.g. `/trees/{treeId}/individuals/{xref}` for a person. If the same name appears in multiple trees, show **one row/card per tree** (or a grouped UX later).
- **Search page**
  - Replace mock with call to the new **Next.js** search API; pass scope (all / treeId / treeIds). Render results with **DataView** (list + card); list columns should include “Tree” (and optionally “Name”, “Birth”, “Death”, etc.); cards show tree name and link to the person in that tree.
- **Within-tree search**
  - When the user is on a tree page (e.g. `/trees/[treeId]/individuals`), search can default to “This tree only” and call either the new aggregator with `scope=tree&treeId=...` or directly **Go API** for that one file. Same DataView for results; tree column can be omitted when scope is single tree.

Summary: **We do not have Go API support for cross-tree search today.** The **frontend DB** holds tree metadata and access control; the **backend DB** holds actual tree data. Cross-tree search must be **limited to trees the user has access to** (computed from the frontend DB); never pass other file_ids to the Go API. Add a **Next.js API** that (1) computes allowed trees from the frontend DB, (2) calls Go per-file search only for those file_ids, (3) aggregates results with tree context. Then update the **search UI** to use DataView, scope selector, and tree-aware result links.
