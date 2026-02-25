# Multi-Tree Endpoints and Pages — Specification

**Status:** Specification (no implementation)  
**Date:** 2026-02-22

---

## 0. What You're Saying (Summary)

- **API:** Use `/api/me/trees/[entityType]` (e.g. `/api/me/trees/individuals`, `/api/me/trees/families`). **Pages** use the same pattern: `/me/trees/individuals`, `/me/trees/families`, etc.
- **Access:** A user sees data from **personal trees** (owned, maintained, or with permission) **and** **public trees**.
- **Same container for all:** Every multi-tree page uses the **same DataViewContainer**.
- **Filter by tree:** Filter section has a "filter by tree" control with **multi-select** (user can select multiple trees); the shared filter component may need to support **multiple selections**.
- **Sidebar when logged in:** Sidebar shows **menu items / links** to these multi-tree pages (e.g. under "My trees" or "Across my trees"). Not shown when logged out.

No coding in this doc.

---

## 1. What “Multi-Tree” Means

**Multi-tree** = operations and views that span **multiple trees** the user can access, instead of a single tree.

- **Current model:** All entity endpoints are **tree-scoped**: `/api/trees/[treeId]/individuals`, `/api/trees/[treeId]/families`, etc. The user picks one tree, then sees that tree’s entities.
- **Multi-tree model:** The user sees **one entity type** (e.g. individuals) **across all trees** they have access to in one list, with each item tagged by which tree it belongs to.

So:

- **Multi-tree endpoints** = API routes that return a **single entity type** (e.g. individuals, families, places) aggregated across **all accessible trees** (or a chosen subset).
- **A page for each entity** = One **frontend page** per entity type that calls the corresponding multi-tree endpoint and shows that entity type across trees (list/card, filters, links to tree-scoped detail).

---

## 2. Goals

- **Unified browse:** “Show me all my individuals” or “all my places” across every tree I can read, without switching trees.
- **Search/filter:** Optional search and filters (e.g. by tree, by name, by date) on the multi-tree list.
- **Consistent UX:** Same entity types that already have tree-scoped list pages (individuals, families, places, etc.) get a **multi-tree** counterpart: one endpoint + one page per entity type.

---

## 3. Scope of “Accessible Trees”

A user has access to **personal trees** and **public trees**:

- **Personal trees:** Trees the user **owns** (TreeOwner), **maintains** (TreeMaintainer), or has **explicit permission** on (Permission).
- **Public trees:** Trees that are public (isPublic = true), which any logged-in user can read.

Multi-tree data is the union of these: same logic as existing `GET /api/trees`. Only trees the user can **read** are included.

**Authentication:** Multi-tree endpoints and pages require an authenticated user. Unauthenticated users have no multi-tree data and do not see multi-tree menu items.

---

## 4. Entity Types in Scope

Align with existing tree-scoped entities and tagging:

| Entity type   | Description              | Tree-scoped list today      | Multi-tree list |
|---------------|--------------------------|-----------------------------|-----------------|
| **Individuals** | People                   | `/trees/[treeId]/individuals` | Yes             |
| **Families**    | Family units             | `/trees/[treeId]/families`     | Yes             |
| **Places**      | Locations                | `/trees/[treeId]/places`       | Yes             |
| **Events**      | Birth, death, marriage…  | `/trees/[treeId]/events`       | Yes             |
| **Sources**     | Citations/sources        | `/trees/[treeId]/sources`      | Yes             |
| **Notes**       | Notes                    | `/trees/[treeId]/notes`        | Yes             |
| **Media**       | Photos, documents       | `/trees/[treeId]/media`         | Yes             |
| **Dates**       | Normalized date index    | `/trees/[treeId]/dates`        | Yes (optional)  |
| **Given names** | Given-name index         | `/trees/[treeId]/given-names`   | Yes (optional)  |
| **Surnames**    | Surname index            | `/trees/[treeId]/surnames`      | Yes (optional)  |

“A page for each entity” = one multi-tree **page** (and one **endpoint**) per row in the table above (with “optional” meaning we can phase those in later).

---

## 5. Multi-Tree API Endpoints

### 5.1 Base path

- **Option A:** `GET /api/me/trees/[entityType]`  
  - Example: `GET /api/me/trees/individuals`, `GET /api/me/trees/families`.  
  - Keeps multi-tree under “me” and makes it clear this is “my trees’ data.”

- **Option B:** `GET /api/multi-tree/[entityType]`  
  - Example: `GET /api/multi-tree/individuals`.  
  - Clearly “multi-tree” in the URL.

**Recommendation:** Option A (`/api/me/trees/[entityType]`) to stay consistent with `/api/me/stats`, `/api/me/links`, and the idea that data is “my trees’ data.”

### 5.2 Supported entity types (path segment)

- `individuals`
- `families`
- `places`
- `events`
- `sources`
- `notes`
- `media`
- `dates` (optional)
- `given-names` (optional)
- `surnames` (optional)

Invalid `entityType` → `400 Bad Request` or `404 Not Found` (to be decided).

### 5.3 Query parameters (common)

- **Pagination:** `limit`, `offset` (or `page` + `pageSize`).
- **Search:** `search` or `q` (free text where applicable).
- **Tree filter:** `treeIds` (e.g. comma-separated list of tree IDs) so the user can restrict to **multiple selected trees**. Omit = all accessible trees (personal + public). The UI must support **multi-select** for this filter.
- **Sort:** `sort`, `order` (e.g. `name`, `treeName`, `birthYear`; `asc`/`desc`). Exact fields depend on entity type.

### 5.4 Response shape (common pattern)

- **List responses** are **paginated**.
- Each **item** includes:
  - The entity’s normal fields (e.g. for individuals: xref, fullName, sex, birthYear, …).
  - **Tree context:** `treeId`, `treeName` (and optionally `fileId` if useful for linking).
- Top-level structure, e.g.:

  - `data`: array of items (each item includes `treeId`, `treeName`).
  - `pagination`: `{ total, limit, offset, hasMore }` (or equivalent).

- **Permissions:** Only trees the user can **read** are included. No need to expose write permission in the list response unless we add “edit” actions on the multi-tree page later.

### 5.5 Implementation note (no coding here)

Backend can:

- Resolve accessible tree IDs (same logic as `GET /api/trees`).
- For each entity type, query the **frontend DB** (e.g. Prisma) per tree / file, or aggregate in one query if schema allows, and attach `treeId` / `treeName`.
- Apply `treeIds` filter, search, sort, pagination.

No GEDCOM lib API change required if all data is already in the frontend DB; if some entities still come from another service, the multi-tree route would aggregate from that service per tree (using existing tree → file mapping).

---

## 6. Multi-Tree Pages (One per Entity)

### 6.1 Route pattern

**Decided:** Page routes mirror the API: **`/me/trees/[entityType]`**

- Examples: `/me/trees/individuals`, `/me/trees/families`, `/me/trees/places`, etc.
- No clash with `/trees/[treeId]/...` (which has a tree ID in the path).

### 6.2 Page per entity type

| Page route                 | Entity type   | Purpose                                      |
|----------------------------|---------------|----------------------------------------------|
| `/me/trees/individuals`    | Individuals   | List/card view of all individuals (accessible trees) |
| `/me/trees/families`       | Families      | List/card view of all families               |
| `/me/trees/places`         | Places        | List/card view of all places                 |
| `/me/trees/events`         | Events        | List/card view of all events                 |
| `/me/trees/sources`        | Sources       | List/card view of all sources                |
| `/me/trees/notes`          | Notes         | List/card view of all notes                  |
| `/me/trees/media`          | Media         | List/card view of all media                  |
| `/me/trees/dates`          | Dates         | (Optional) List of dates across trees        |
| `/me/trees/given-names`    | Given names   | (Optional) Index of given names              |
| `/me/trees/surnames`       | Surnames      | (Optional) Index of surnames                 |

Each page:

- Calls the corresponding multi-tree endpoint: `GET /api/me/trees/[entityType]?...`.
- Uses the **same DataViewContainer** as all other multi-tree pages (consistent layout, toolbar, filter area).
- Shows **tree context** for each row/card (e.g. tree name, link to `/trees/[treeId]` or to the tree-scoped entity).
- Supports **filters** (e.g. by tree, search, sort) via query params and UI.
- Links to **tree-scoped detail** where it exists (e.g. individual → `/trees/[treeId]/individuals/[xref]`).

### 6.3 Same DataViewContainer for all

Every multi-tree page uses the **same DataViewContainer** so layout, toolbar, and filter area are consistent; only the entity type and data source (the corresponding `/api/me/trees/[entityType]` endpoint) change per page.

### 6.4 Filter section and tree filter (multi-select)

- Each page has a **filter section**. One of the filters is **"Filter by tree"** (or "Trees").
- The user must be able to **select more than one tree** (e.g. "Show only individuals from Tree A and Tree C"). The control is **multi-select**, not single-select.
- Selecting zero trees = all accessible trees (default); selecting one or more trees restricts the list; the API is called with the appropriate `treeIds` query parameter.
- **Implication:** The shared filter component may need to support **multiple selections** for a single filter. If it currently only supports single-select, it will need to be extended or a multi-select variant added.

### 6.5 Sidebar: menu items when logged in

- When the user **is logged in**, the **sidebar** must show **menu items / links** to these multi-tree pages (Individuals, Families, Places, etc.), so they can reach each entity list without first choosing a tree.
- These can be grouped under a label like "My trees" or "Across my trees" to distinguish from single-tree navigation.
- When the user is **not** logged in, these multi-tree links are not shown (multi-tree requires authentication).

### 6.6 Per-page behavior

Each page calls the corresponding endpoint with pagination, search, and `treeIds` when the user has selected trees; shows tree context for each row/card; and links to tree-scoped detail where it exists.

---


## 7. Summary

| Concept                | Meaning                                                                 |
|------------------------|-------------------------------------------------------------------------|
| **API**                | `GET /api/me/trees/[entityType]` (e.g. individuals, families, places). |
| **Page routes**        | `/me/trees/individuals`, `/me/trees/families`, etc.—one page per entity type. |
| **Accessible trees**  | **Personal trees** (owned, maintained, or with permission) **and** **public trees**. |
| **Container**          | Same **DataViewContainer** used for every multi-tree page.               |
| **Tree filter**        | Filter section includes “filter by tree” with **multi-select** (user can select multiple trees). Filter component may need to support multiple selections. |
| **Sidebar**            | When **logged in**, sidebar shows **menu items / links** to each multi-tree page (e.g. under “My trees” or “Across my trees”). Not shown when logged out. |
| **Response**           | Each item includes entity fields + `treeId` and `treeName`.             |
| **Auth**               | Required for multi-tree; only accessible trees are included.           |

This specification defines **what** multi-tree endpoints and pages are and **how** they behave; implementation details (exact field names, error codes, UI wireframes) can be added in follow-up docs or tickets.
