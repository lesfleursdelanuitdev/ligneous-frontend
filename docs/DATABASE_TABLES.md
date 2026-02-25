# Database Tables Reference

This document describes every table in the Ligneous frontend PostgreSQL database as defined in `prisma/schema.prisma`. The database is managed by Prisma ORM and is separate from the Go API database.

Tables are grouped by domain. The Prisma model name and the actual SQL table name (from `@@map`) are both shown.

---

## Table of Contents

1. [Enumerations](#enumerations)
2. [User & Authentication Tables](#user--authentication-tables)
3. [Tree & Permission Tables](#tree--permission-tables)
4. [Invitation Tables](#invitation-tables)
5. [Media & Tag Tables](#media--tag-tables)
6. [Collaboration Tables](#collaboration-tables)
7. [Research Tables](#research-tables)
8. [Messaging Tables](#messaging-tables)
9. [User Profile & Social Tables](#user-profile--social-tables)
10. [Content & Feed Tables](#content--feed-tables)
11. [Notification & Activity Tables](#notification--activity-tables)
12. [Supporting Junction Tables](#supporting-junction-tables)
13. [GEDCOM Data Tables](#gedcom-data-tables)

---

## Enumerations

| Enum | Values | Used By |
|------|--------|---------|
| `PermissionType` | `read`, `write`, `delete`, `admin` | `Permission`, `AccessRequest` |
| `ResourceType` | `tree`, `individual`, `family`, `subtree` | `Permission`, `AccessRequest`, `PrivateData` |
| `AccessRequestType` | `basic_access`, `individual_link`, `contributor_role`, `maintainer_role`, `owner_role` | `AccessRequest` |
| `AccessRequestStatus` | `pending`, `approved`, `rejected`, `cancelled` | `AccessRequest` |
| `EntityType` | `media`, `event`, `individual`, `family`, `note`, `source`, `place`, `date`, `story` | `TaggedItem` |
| `StorySubjectType` | `individual`, `family`, `place`, `event` | `StorySubject` |
| `SuggestionStatus` | `pending`, `approved`, `rejected`, `needs_info` | `Suggestion` |
| `ProfileVisibility` | `public`, `collaborators_only`, `private` | `UserProfile` |
| `ActivityVisibility` | `public`, `followers_only`, `collaborators_only`, `private` | `UserProfile` |
| `ContentType` | `research_update`, `family_story`, `research_discovery`, `collaboration_request`, `recipe`, `research_log` | `UserContent` |
| `ContentVisibility` | `public`, `followers_only`, `collaborators_only`, `private` | `UserContent` |
| `NotificationType` | `comment`, `reply`, `mention`, `suggestion`, `message`, `access_request`, `activity`, `system`, `follow`, `content_like`, `content_comment`, `content_share` | `Notification` |
| `GedcomSex` | `M`, `F`, `U`, `X` | `GedcomIndividual` |
| `GedcomDateType` | `EXACT`, `ABOUT`, `BEFORE`, `AFTER`, `BETWEEN`, `CALCULATED`, `ESTIMATED`, `FROM_TO`, `UNKNOWN` | `GedcomDate` |

---

## User & Authentication Tables

### `users`
**Prisma model:** `User`

Stores every registered user account. The `is_website_owner` flag designates the superuser (admin) account.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `username` | VARCHAR(255) | No | — | Unique login name |
| `email` | VARCHAR(255) | No | — | Unique email address |
| `password_hash` | VARCHAR(255) | No | — | bcrypt password hash |
| `name` | VARCHAR(255) | Yes | — | Display name |
| `is_website_owner` | BOOLEAN | No | `false` | Superuser / admin flag |
| `is_active` | BOOLEAN | No | `true` | Account enabled flag |
| `created_at` | TIMESTAMPTZ | No | `now()` | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |
| `last_login_at` | TIMESTAMPTZ | Yes | — | Last successful login |

**Indexes:** `email`, `username`

---

### `sessions`
**Prisma model:** `Session`

Authentication sessions issued on login. The short-lived `token_hash` is sent with every request; `refresh_token_hash` is used to obtain a new session.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `token_hash` | VARCHAR(255) | No | — | Unique SHA-256 hash of the access token |
| `expires_at` | TIMESTAMPTZ | No | — | Access token expiry |
| `refresh_token_hash` | VARCHAR(255) | Yes | — | Unique hash of the refresh token |
| `refresh_expires_at` | TIMESTAMPTZ | Yes | — | Refresh token expiry |
| `ip_address` | INET | Yes | — | Client IP at login |
| `user_agent` | TEXT | Yes | — | Browser user-agent string |
| `is_revoked` | BOOLEAN | No | `false` | Explicitly revoked flag |
| `created_at` | TIMESTAMPTZ | No | `now()` | Session creation timestamp |
| `last_used_at` | TIMESTAMPTZ | No | `now()` | Last request timestamp |

**Indexes:** `user_id`, `token_hash`, `refresh_token_hash`, `expires_at`, `refresh_expires_at`, composite `(user_id, is_revoked, expires_at)`, composite `(user_id, is_revoked, refresh_expires_at)`

---

### `password_reset_tokens`
**Prisma model:** `PasswordResetToken`

Single-use, time-limited tokens for the "forgot password" flow.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `token` | VARCHAR(255) | No | — | Unique secure random token |
| `expires_at` | TIMESTAMPTZ | No | — | Token expiry |
| `used_at` | TIMESTAMPTZ | Yes | — | Timestamp of use (non-null = consumed) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Token creation timestamp |

**Indexes:** `user_id`, `token`, `expires_at`, composite `(user_id, expires_at, used_at)`

---

## Tree & Permission Tables

### `trees`
**Prisma model:** `Tree`

Core registry of family trees. `file_id` is the string key used by the Go GEDCOM API. `gedcom_file_id` links to the parsed GEDCOM data.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `file_id` | VARCHAR(255) | No | — | Unique Go API file identifier |
| `name` | VARCHAR(255) | No | — | Human-readable tree name |
| `description` | TEXT | Yes | — | Optional description |
| `is_public` | BOOLEAN | No | `false` | Public visibility flag |
| `gedcom_file_id` | UUID | Yes | — | FK → `gedcom_files.id` (SET NULL) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |

**Indexes:** `file_id`, `is_public`

---

### `tree_owners`
**Prisma model:** `TreeOwner`

Supports multiple owners per tree. One owner per tree may be the primary owner (`is_primary = true`).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `tree_id` | UUID | No | — | FK → `trees.id` (CASCADE DELETE) |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `is_primary` | BOOLEAN | No | `false` | Primary owner flag |
| `added_by` | UUID | Yes | — | FK → `users.id` (SET NULL) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Timestamp |

**Unique:** `(tree_id, user_id)` | **Indexes:** `tree_id`, `user_id`, `(tree_id, is_primary)`

---

### `tree_maintainers`
**Prisma model:** `TreeMaintainer`

Users who have admin-level maintenance access to a tree (edit, moderate, etc.), granted by owners.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `tree_id` | UUID | No | — | FK → `trees.id` (CASCADE DELETE) |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `added_by` | UUID | Yes | — | FK → `users.id` |
| `created_at` | TIMESTAMPTZ | No | `now()` | Timestamp |

**Unique:** `(tree_id, user_id)` | **Indexes:** `tree_id`, `user_id`

---

### `tree_contributors`
**Prisma model:** `TreeContributor`

Users who can author stories and user-generated content for a tree. Granted by owners and maintainers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `tree_id` | UUID | No | — | FK → `trees.id` (CASCADE DELETE) |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `added_by` | UUID | Yes | — | FK → `users.id` (SET NULL) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Timestamp |

**Unique:** `(tree_id, user_id)` | **Indexes:** `tree_id`, `user_id`

---

### `user_individual_links`
**Prisma model:** `UserIndividualLink`

Links a registered user to a GEDCOM individual ("This is me"). Can be verified or unverified.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `tree_id` | UUID | No | — | FK → `trees.id` (CASCADE DELETE) |
| `individual_xref` | VARCHAR(50) | No | — | GEDCOM XREF of the individual (e.g. `I23`) |
| `verified` | BOOLEAN | No | `false` | Whether the link has been verified |
| `created_at` | TIMESTAMPTZ | No | `now()` | Timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |

**Unique:** `(user_id, tree_id, individual_xref)` | **Indexes:** `user_id`, `tree_id`, `(tree_id, individual_xref)`, `(user_id, verified)`

---

### `permissions`
**Prisma model:** `Permission`

Fine-grained explicit permission grants. Allows scoping to a whole tree, a single individual, a family, or a subtree. Supports optional expiry.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `tree_id` | UUID | No | — | FK → `trees.id` (CASCADE DELETE) |
| `resource_type` | `ResourceType` | No | — | `tree`, `individual`, `family`, or `subtree` |
| `resource_id` | VARCHAR(255) | No | — | ID of the resource (e.g. XREF or `'tree'`) |
| `permission_type` | `PermissionType` | No | — | `read`, `write`, `delete`, or `admin` |
| `granted_by` | UUID | Yes | — | FK → `users.id` |
| `granted_at` | TIMESTAMPTZ | No | `now()` | Grant timestamp |
| `expires_at` | TIMESTAMPTZ | Yes | — | Optional expiry (null = permanent) |
| `notes` | TEXT | Yes | — | Free-text reason for the grant |

**Unique:** `(user_id, tree_id, resource_type, resource_id, permission_type)` | **Indexes:** `(user_id, tree_id)`, `(tree_id, resource_type, resource_id)`, `expires_at`

---

### `access_requests`
**Prisma model:** `AccessRequest`

Records user requests for various roles or individual links. Managed through the admin panel.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `tree_id` | UUID | No | — | FK → `trees.id` (CASCADE DELETE) |
| `request_type` | `AccessRequestType` | No | `basic_access` | Type of access being requested |
| `resource_type` | `ResourceType` | Yes | — | Specific resource type (for individual/subtree requests) |
| `resource_id` | VARCHAR(255) | Yes | — | Specific resource ID |
| `requested_permission_type` | `PermissionType` | Yes | — | Permission level requested |
| `status` | `AccessRequestStatus` | No | `pending` | Current status |
| `notes` | TEXT | Yes | — | Requester's notes |
| `response_notes` | TEXT | Yes | — | Responder's notes |
| `requested_at` | TIMESTAMPTZ | No | `now()` | Request timestamp |
| `responded_at` | TIMESTAMPTZ | Yes | — | Response timestamp |
| `responded_by` | UUID | Yes | — | FK → `users.id` |

**Indexes:** `user_id`, `tree_id`, `(request_type, status)`, `status`, `(tree_id, status)`

---

### `private_data`
**Prisma model:** `PrivateData`

Marks specific fields on specific entities as private within a tree.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `tree_id` | UUID | No | — | FK → `trees.id` (CASCADE DELETE) |
| `resource_type` | `ResourceType` | No | — | Entity type |
| `resource_id` | VARCHAR(255) | No | — | Entity XREF/ID |
| `field_name` | VARCHAR(255) | No | — | Field being privatised |
| `is_private` | BOOLEAN | No | `true` | Enabled flag |
| `created_at` | TIMESTAMPTZ | No | `now()` | Timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |

**Indexes:** `(tree_id, resource_type, resource_id)`, `tree_id`

---

## Invitation Tables

### `invitation_links`
**Prisma model:** `InvitationLink`

Shareable one-time or multi-use invitation links. Can optionally be scoped to a specific individual (for individual-link requests).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `token` | UUID | No | `uuid()` | Unique URL token |
| `tree_id` | UUID | No | — | FK → `trees.id` (CASCADE DELETE) |
| `created_by` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `role_type` | VARCHAR(50) | No | — | `read`, `write`, `maintainer`, or `owner` |
| `individual_xref` | VARCHAR(50) | Yes | — | Optional XREF for individual-link invites |
| `expires_at` | TIMESTAMPTZ | Yes | — | Optional expiry (null = no expiry) |
| `max_uses` | INTEGER | Yes | — | Use limit (null = unlimited, 1 = one-time) |
| `used_count` | INTEGER | No | `0` | Times used so far |
| `is_revoked` | BOOLEAN | No | `false` | Revocation flag |
| `notes` | TEXT | Yes | — | Description of the link's purpose |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |

**Indexes:** `token`, `tree_id`, `created_by`, `(is_revoked, expires_at)`

---

### `invitation_link_uses`
**Prisma model:** `InvitationLinkUse`

Audit trail of every time an invitation link is redeemed.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `link_id` | UUID | No | — | FK → `invitation_links.id` (CASCADE DELETE) |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `used_at` | TIMESTAMPTZ | No | `now()` | Redemption timestamp |
| `ip_address` | INET | Yes | — | Client IP at redemption |

**Unique:** `(link_id, user_id)` | **Indexes:** `link_id`, `user_id`

---

## Media & Tag Tables

### `albums`
**Prisma model:** `Album`

User-created media collections. Each album is owned by one user and can be public or private.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `name` | VARCHAR(255) | No | — | Album name |
| `description` | TEXT | Yes | — | Optional description |
| `cover_media_id` | VARCHAR(255) | Yes | — | Go API media UUID for the cover image |
| `is_public` | BOOLEAN | No | `false` | Public visibility |
| `sort_order` | INTEGER | No | `0` | User's ordering of their albums |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |

**Indexes:** `user_id`, `(user_id, is_public)`

---

### `album_media`
**Prisma model:** `AlbumMedia`

Junction table linking albums to Go API media objects. Tracks who added each item and its display order within the album.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `album_id` | UUID | No | — | FK → `albums.id` (CASCADE DELETE) |
| `file_id` | VARCHAR(255) | No | — | Go API file identifier |
| `media_id` | VARCHAR(255) | No | — | Go API media UUID |
| `sort_order` | INTEGER | No | `0` | Display order within album |
| `added_at` | TIMESTAMPTZ | No | `now()` | When the item was added |
| `added_by` | UUID | Yes | — | FK → `users.id` (SET NULL) |

**Unique:** `(album_id, file_id, media_id)` | **Indexes:** `album_id`, `(file_id, media_id)`

---

### `album_shares`
**Prisma model:** `AlbumShare`

Records which users have been given access to a private album and whether they can edit it.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `album_id` | UUID | No | — | FK → `albums.id` (CASCADE DELETE) |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) — recipient |
| `can_edit` | BOOLEAN | No | `false` | Edit permission flag |
| `shared_at` | TIMESTAMPTZ | No | `now()` | Share timestamp |
| `shared_by` | UUID | No | — | FK → `users.id` (CASCADE DELETE) — sharer |

**Unique:** `(album_id, user_id)` | **Indexes:** `album_id`, `user_id`

---

### `tags`
**Prisma model:** `Tag`

Supports both global (site-wide) and per-user tags. Global tags have `user_id = null` and `is_global = true`.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `user_id` | UUID | Yes | — | FK → `users.id` (CASCADE DELETE); null = global |
| `name` | VARCHAR(100) | No | — | Tag label |
| `color` | VARCHAR(7) | Yes | — | Hex colour for UI (e.g. `#ff6600`) |
| `description` | TEXT | Yes | — | Optional description |
| `is_global` | BOOLEAN | No | `false` | Explicit global flag |
| `created_by` | UUID | Yes | — | FK → `users.id` (SET NULL) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |

**Indexes:** `user_id`, `is_global`, `(is_global, name)`, `name`, `(user_id, name)`

---

### `tagged_items`
**Prisma model:** `TaggedItem`

Polymorphic junction table associating tags with any entity type (media, individual, family, etc.). `file_id` and `entity_id` reference the Go API.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `tag_id` | UUID | No | — | FK → `tags.id` (CASCADE DELETE) |
| `tagged_by` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `entity_type` | `EntityType` | No | — | Type of tagged entity |
| `file_id` | VARCHAR(255) | No | — | Go API file identifier |
| `entity_id` | VARCHAR(255) | No | — | Entity UUID or XREF |
| `entity_xref` | VARCHAR(50) | Yes | — | Optional GEDCOM XREF for convenience |
| `tagged_at` | TIMESTAMPTZ | No | `now()` | Tagging timestamp |

**Unique:** `(tag_id, tagged_by, entity_type, file_id, entity_id)` | **Indexes:** `tag_id`, `(tagged_by, entity_type, file_id, entity_id)`, `(entity_type, file_id, entity_id)`, `tagged_by`

---

### `stories`
**Prisma model:** `Story`

Long-form authored narrative content attached to a tree. Body is stored as Markdown text. Only owners, maintainers, and contributors can create stories.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `tree_id` | UUID | No | — | FK → `trees.id` (CASCADE DELETE) |
| `author_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `title` | VARCHAR(255) | No | — | Story title |
| `body` | TEXT | No | `''` | Markdown content |
| `excerpt` | VARCHAR(500) | Yes | — | Optional summary |
| `cover_media_id` | VARCHAR(255) | Yes | — | Go API media UUID for cover image |
| `is_published` | BOOLEAN | No | `false` | Published/draft flag |
| `published_at` | TIMESTAMPTZ | Yes | — | Publication timestamp |
| `tags` | TEXT[] | No | — | Array of tag strings |
| `views_count` | INTEGER | No | `0` | Cached view count |
| `likes_count` | INTEGER | No | `0` | Cached like count |
| `comments_count` | INTEGER | No | `0` | Cached comment count |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | Yes | — | Soft-delete timestamp |

**Indexes:** `tree_id`, `author_id`, `is_published`, `published_at`, `created_at`, `(tree_id, is_published)`, `tags` (GIN)

---

### `story_subjects`
**Prisma model:** `StorySubject`

Links a story to the GEDCOM entities it is "about" (individuals, families, places, or events). `subject_id` is the entity's UUID from the Go API tables.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `story_id` | UUID | No | — | FK → `stories.id` (CASCADE DELETE) |
| `subject_type` | `StorySubjectType` | No | — | `individual`, `family`, `place`, or `event` |
| `subject_id` | VARCHAR(255) | No | — | Entity UUID or XREF |
| `subject_xref` | VARCHAR(50) | Yes | — | Optional GEDCOM XREF |
| `file_id` | VARCHAR(255) | No | — | Go API file identifier |
| `sort_order` | INTEGER | No | `0` | Display order |
| `created_at` | TIMESTAMPTZ | No | `now()` | Timestamp |

**Unique:** `(story_id, subject_type, subject_id)` | **Indexes:** `story_id`, `(subject_type, subject_id)`, `(file_id, subject_type, subject_id)`

---

## Collaboration Tables

### `comments`
**Prisma model:** `Comment`

Polymorphic comments on any entity within a tree. Supports threading via `parent_id`. Soft-deleted via `deleted_at`.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `entity_type` | VARCHAR(50) | No | — | Type of the commented entity (e.g. `discussion_post`) |
| `entity_id` | VARCHAR(255) | No | — | ID of the commented entity |
| `tree_id` | UUID | No | — | FK → `trees.id` (CASCADE DELETE) |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `parent_id` | UUID | Yes | — | FK → `comments.id` (SET NULL) — parent comment for replies |
| `content` | TEXT | No | — | HTML comment body |
| `is_edited` | BOOLEAN | No | `false` | Edit flag |
| `is_resolved` | BOOLEAN | No | `false` | Resolved flag |
| `is_pinned` | BOOLEAN | No | `false` | Pinned flag |
| `is_hidden` | BOOLEAN | No | `false` | Hidden (moderation) flag |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | Yes | — | Soft-delete timestamp |

**Indexes:** `(entity_type, entity_id)`, `tree_id`, `user_id`, `parent_id`

---

### `discussion_threads`
**Prisma model:** `DiscussionThread`

Top-level "brick wall" research threads scoped to a tree. `category` is used to differentiate thread types (e.g. `'most_wanted'`). `tags` is a PostgreSQL text array for filtering.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `tree_id` | UUID | Yes | — | FK → `trees.id` (CASCADE DELETE); null = site-wide thread |
| `title` | VARCHAR(255) | No | — | Thread title |
| `description` | TEXT | Yes | — | Optional description |
| `category` | VARCHAR(100) | Yes | — | Category string (e.g. `most_wanted`) |
| `tags` | TEXT[] | No | — | Array of tag strings (surname, location, etc.) |
| `is_locked` | BOOLEAN | No | `false` | Locked flag (no new posts) |
| `is_pinned` | BOOLEAN | No | `false` | Pinned to top |
| `is_closed` | BOOLEAN | No | `false` | Closed/resolved flag |
| `created_by` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |

**Indexes:** `tree_id`, `created_by`, `category`, `tags` (GIN)

---

### `discussion_thread_entities`
**Prisma model:** `DiscussionThreadEntity`

Junction table linking a discussion thread to specific GEDCOM entities (individuals or families) it relates to.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `thread_id` | UUID | No | — | FK → `discussion_threads.id` (CASCADE DELETE) |
| `entity_type` | VARCHAR(50) | No | — | `individual` or `family` |
| `entity_id` | VARCHAR(255) | No | — | GEDCOM XREF (e.g. `I1`, `F2`) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Timestamp |

**Unique:** `(thread_id, entity_type, entity_id)` | **Indexes:** `thread_id`, `(entity_type, entity_id)`

---

### `discussion_posts`
**Prisma model:** `DiscussionPost`

Topic-level posts within a discussion thread. A thread can have many posts (topic discussions). Comments are stored in the `comments` table referencing these posts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `thread_id` | UUID | No | — | FK → `discussion_threads.id` (CASCADE DELETE) |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `content` | TEXT | No | — | HTML post body |
| `is_edited` | BOOLEAN | No | `false` | Edit flag |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | Yes | — | Soft-delete timestamp |

**Indexes:** `thread_id`, `user_id`, `created_at`

---

### `entity_likes`
**Prisma model:** `EntityLike`

Polymorphic likes for `discussion_post` and `comment` entities. Enforces one like per user per entity.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `entity_type` | VARCHAR(50) | No | — | `discussion_post` or `comment` |
| `entity_id` | UUID | No | — | ID of the liked entity |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Like timestamp |

**Unique:** `(entity_type, entity_id, user_id)` | **Indexes:** `(entity_type, entity_id)`, `user_id`

---

### `suggestions`
**Prisma model:** `Suggestion`

User-submitted suggestions to correct or improve GEDCOM data. Reviewed by tree owners/maintainers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `entity_type` | VARCHAR(50) | No | — | Type of entity being corrected |
| `entity_id` | VARCHAR(255) | No | — | Entity XREF/ID |
| `tree_id` | UUID | No | — | FK → `trees.id` (CASCADE DELETE) |
| `field_name` | VARCHAR(255) | No | — | Which field is being suggested |
| `current_value` | TEXT | Yes | — | Current field value |
| `suggested_value` | TEXT | No | — | Proposed new value |
| `evidence` | TEXT | Yes | — | Supporting evidence or sources |
| `status` | `SuggestionStatus` | No | `pending` | Review status |
| `suggested_by` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `reviewed_by` | UUID | Yes | — | FK → `users.id` (SET NULL) |
| `reviewed_at` | TIMESTAMPTZ | Yes | — | Review timestamp |
| `review_notes` | TEXT | Yes | — | Reviewer's notes |
| `created_at` | TIMESTAMPTZ | No | `now()` | Submission timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |

**Indexes:** `(entity_type, entity_id)`, `tree_id`, `status`, `suggested_by`, `reviewed_by`

---

## Research Tables

### `research_notes`
**Prisma model:** `ResearchNote`

Private or shared research notes attached to a tree and optionally to a specific entity. Can be organised into notebooks.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `entity_type` | VARCHAR(50) | Yes | — | Optional: type of attached entity |
| `entity_id` | VARCHAR(255) | Yes | — | Optional: ID of attached entity |
| `tree_id` | UUID | Yes | — | FK → `trees.id` (CASCADE DELETE) |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `title` | VARCHAR(255) | Yes | — | Optional note title |
| `content` | TEXT | No | — | Note body |
| `is_private` | BOOLEAN | No | `true` | Private flag |
| `notebook_id` | UUID | Yes | — | FK → `notebooks.id` (SET NULL) |
| `tags` | TEXT[] | No | — | Array of tag strings |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |

**Indexes:** `(entity_type, entity_id)`, `tree_id`, `user_id`, `notebook_id`, `tags` (GIN)

---

### `notebooks`
**Prisma model:** `Notebook`

Named collections for organising research notes. Private by default.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `name` | VARCHAR(255) | No | — | Notebook name |
| `description` | TEXT | Yes | — | Optional description |
| `is_private` | BOOLEAN | No | `true` | Private flag |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |

**Indexes:** `user_id`

---

### `research_todo_items`
**Prisma model:** `ResearchTodoItem`

Research task items scoped to a tree. Supports priority, due dates, status tracking, and optional entity context.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `tree_id` | UUID | No | — | FK → `trees.id` (CASCADE DELETE) |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `title` | VARCHAR(500) | No | — | Task title |
| `description` | TEXT | Yes | — | Optional description |
| `status` | VARCHAR(50) | No | `'pending'` | Task status (e.g. `pending`, `done`) |
| `priority` | INTEGER | No | `0` | Priority level (higher = more important) |
| `due_date` | DATE | Yes | — | Optional due date |
| `entity_type` | VARCHAR(50) | Yes | — | Optional: related entity type |
| `entity_id` | UUID | Yes | — | Optional: related entity ID |
| `sort_order` | INTEGER | No | `0` | Manual ordering |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |

**Indexes:** `tree_id`, `user_id`

---

### `research_links`
**Prisma model:** `ResearchLink`

Bookmarked external URLs scoped to a tree, with a human-readable label.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `tree_id` | UUID | No | — | FK → `trees.id` (CASCADE DELETE) |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `label` | VARCHAR(500) | No | — | Link label |
| `url` | TEXT | No | — | Target URL |
| `sort_order` | INTEGER | No | `0` | Manual ordering |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |

**Indexes:** `tree_id`, `user_id`

---

## Messaging Tables

### `messages`
**Prisma model:** `Message`

Direct messages between users or messages posted to a group. `is_system = true` for automated system messages.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `sender_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `recipient_id` | UUID | Yes | — | FK → `users.id` (CASCADE DELETE) — null for group messages |
| `group_id` | UUID | Yes | — | FK → `message_groups.id` (CASCADE DELETE) — null for DMs |
| `subject` | VARCHAR(255) | Yes | — | Optional subject line |
| `content` | TEXT | No | — | Message body |
| `is_read` | BOOLEAN | No | `false` | Read flag |
| `read_at` | TIMESTAMPTZ | Yes | — | Read timestamp |
| `is_system` | BOOLEAN | No | `false` | System-generated flag |
| `created_at` | TIMESTAMPTZ | No | `now()` | Sent timestamp |

**Indexes:** `sender_id`, `recipient_id`, `group_id`, `is_read`, `created_at`

---

### `message_groups`
**Prisma model:** `MessageGroup`

Group conversation containers, optionally scoped to a tree.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `name` | VARCHAR(255) | No | — | Group name |
| `description` | TEXT | Yes | — | Optional description |
| `tree_id` | UUID | Yes | — | FK → `trees.id` (CASCADE DELETE) — optional tree context |
| `created_by` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |

**Indexes:** `tree_id`, `created_by`

---

## User Profile & Social Tables

### `user_profiles`
**Prisma model:** `UserProfile`

One-to-one extension of `users` storing biographical information, research interests, visibility settings, and cached stats.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `user_id` | UUID | No | — | Unique FK → `users.id` (CASCADE DELETE) |
| `display_name` | VARCHAR(255) | Yes | — | Public display name |
| `bio` | TEXT | Yes | — | Biography |
| `location` | VARCHAR(255) | Yes | — | Location string |
| `profile_photo_url` | VARCHAR(500) | Yes | — | Profile photo URL |
| `cover_photo_url` | VARCHAR(500) | Yes | — | Cover photo URL |
| `research_surnames` | TEXT[] | No | `[]` | Surnames being researched |
| `research_locations` | TEXT[] | No | `[]` | Locations being researched |
| `research_time_periods` | TEXT[] | No | `[]` | Time periods being researched |
| `research_goals` | TEXT | Yes | — | Free-text research goals |
| `years_researching` | INTEGER | Yes | — | Years of genealogy experience |
| `specializations` | TEXT[] | No | `[]` | Research specializations |
| `certifications` | TEXT[] | No | `[]` | Genealogical certifications |
| `languages` | TEXT[] | No | `[]` | Languages spoken |
| `profile_visibility` | `ProfileVisibility` | No | `collaborators_only` | Who can see the profile |
| `activity_visibility` | `ActivityVisibility` | No | `collaborators_only` | Who can see activity feed |
| `allow_direct_messages` | BOOLEAN | No | `true` | DM preference |
| `allow_following` | BOOLEAN | No | `true` | Following preference |
| `trees_owned_count` | INTEGER | No | `0` | Cached owner count |
| `trees_maintained_count` | INTEGER | No | `0` | Cached maintainer count |
| `contributions_count` | INTEGER | No | `0` | Cached contribution count |
| `followers_count` | INTEGER | No | `0` | Cached follower count |
| `following_count` | INTEGER | No | `0` | Cached following count |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |

---

### `follows`
**Prisma model:** `Follow`

Polymorphic follow/watch relationships. A user can follow another user, a tree, a GEDCOM entity, or a discussion thread.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `follower_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `followee_id` | UUID | Yes | — | FK → `users.id` (CASCADE DELETE) — set when following a user |
| `tree_id` | UUID | Yes | — | FK → `trees.id` (CASCADE DELETE) — set when following a tree |
| `entity_type` | VARCHAR(50) | Yes | — | Set when following a GEDCOM entity |
| `entity_id` | VARCHAR(255) | Yes | — | Entity XREF/ID |
| `discussion_thread_id` | UUID | Yes | — | FK → `discussion_threads.id` (CASCADE DELETE) |
| `is_muted` | BOOLEAN | No | `false` | Muted flag (no notifications) |
| `is_private` | BOOLEAN | No | `false` | Private follow flag |
| `created_at` | TIMESTAMPTZ | No | `now()` | Follow timestamp |

**Unique constraints:** `(follower_id, followee_id)`, `(follower_id, tree_id)`, `(follower_id, entity_type, entity_id)`, `(follower_id, discussion_thread_id)` | **Indexes:** `follower_id`, `followee_id`, `tree_id`

---

## Content & Feed Tables

### `user_content`
**Prisma model:** `UserContent`

User-published posts (research updates, family stories, recipes, etc.). Supports visibility levels, engagement counters, and optional entity context.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `content_type` | `ContentType` | No | — | Post type |
| `title` | VARCHAR(255) | Yes | — | Optional title |
| `content` | TEXT | No | — | Post body |
| `is_public` | BOOLEAN | No | `false` | Public flag |
| `visibility` | `ContentVisibility` | No | `followers_only` | Audience visibility setting |
| `tree_id` | UUID | Yes | — | FK → `trees.id` (CASCADE DELETE) — optional tree context |
| `entity_type` | VARCHAR(50) | Yes | — | Optional related entity type |
| `entity_id` | VARCHAR(255) | Yes | — | Optional related entity ID |
| `surnames` | TEXT[] | No | `[]` | Surname tags for discovery |
| `locations` | TEXT[] | No | `[]` | Location tags for discovery |
| `time_periods` | TEXT[] | No | `[]` | Time period tags for discovery |
| `likes_count` | INTEGER | No | `0` | Cached like count |
| `comments_count` | INTEGER | No | `0` | Cached comment count |
| `shares_count` | INTEGER | No | `0` | Cached share count |
| `recipe_ingredients` | TEXT | Yes | — | Ingredients (for `recipe` type) |
| `recipe_instructions` | TEXT | Yes | — | Instructions (for `recipe` type) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | Yes | — | Soft-delete timestamp |

**Indexes:** `user_id`, `content_type`, `tree_id`, `is_public`, `created_at`, `surnames` (GIN), `locations` (GIN), `time_periods` (GIN)

---

### `content_likes`
**Prisma model:** `ContentLike`

Records a user liking a `UserContent` post. Enforces one like per user per post.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `content_id` | UUID | No | — | FK → `user_content.id` (CASCADE DELETE) |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Like timestamp |

**Unique:** `(content_id, user_id)` | **Indexes:** `content_id`, `user_id`

---

### `content_comments`
**Prisma model:** `ContentComment`

Threaded comments on `UserContent` posts. Supports nested replies via `parent_id`. Soft-deleted.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `content_id` | UUID | No | — | FK → `user_content.id` (CASCADE DELETE) |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `parent_id` | UUID | Yes | — | FK → `content_comments.id` — for replies |
| `content` | TEXT | No | — | Comment body |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | auto-updated | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | Yes | — | Soft-delete timestamp |

**Indexes:** `content_id`, `user_id`, `parent_id`

---

### `content_shares`
**Prisma model:** `ContentShare`

Records a user sharing a `UserContent` post. `shared_with` is optional (null = shared publicly).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `content_id` | UUID | No | — | FK → `user_content.id` (CASCADE DELETE) |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `shared_with` | UUID | Yes | — | FK → recipient user ID (optional) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Share timestamp |

**Indexes:** `content_id`, `user_id`

---

### `user_feeds`
**Prisma model:** `UserFeed`

Fan-out table for each user's personalised content feed. Each row represents one content item that should appear in a user's feed, from a specific source (e.g. a followed user or tree).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `content_id` | UUID | No | — | FK → `user_content.id` (CASCADE DELETE) |
| `source_type` | VARCHAR(50) | No | — | Why this appeared (e.g. `followed_user`) |
| `source_id` | VARCHAR(255) | No | — | ID of the source entity |
| `is_read` | BOOLEAN | No | `false` | Read/seen flag |
| `read_at` | TIMESTAMPTZ | Yes | — | Read timestamp |
| `created_at` | TIMESTAMPTZ | No | `now()` | Feed insertion timestamp |

**Indexes:** `(user_id, is_read, created_at)`, `content_id`, `(source_type, source_id)`

---

## Notification & Activity Tables

### `notifications`
**Prisma model:** `Notification`

In-app notifications for users. Each notification has a type, title, message, optional link, and optional entity/tree/actor context.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) — recipient |
| `type` | `NotificationType` | No | — | Notification category |
| `title` | VARCHAR(255) | No | — | Short heading |
| `message` | TEXT | No | — | Full notification text |
| `link` | VARCHAR(500) | Yes | — | Optional deep link |
| `is_read` | BOOLEAN | No | `false` | Read flag |
| `read_at` | TIMESTAMPTZ | Yes | — | Read timestamp |
| `entity_type` | VARCHAR(50) | Yes | — | Related entity type |
| `entity_id` | VARCHAR(255) | Yes | — | Related entity ID |
| `tree_id` | UUID | Yes | — | FK → `trees.id` (CASCADE DELETE) |
| `actor_id` | UUID | Yes | — | FK → `users.id` (SET NULL) — user who triggered it |
| `created_at` | TIMESTAMPTZ | No | `now()` | Creation timestamp |

**Indexes:** `user_id`, `(user_id, is_read)`, `(user_id, created_at)`, `type`

---

### `activities`
**Prisma model:** `Activity`

Audit/activity log scoped to a tree. Stores `activity_type` strings (e.g. `tree.updated`, `story.published`) with optional entity context and a JSON `metadata` blob for before/after values.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `activity_type` | VARCHAR(100) | No | — | Activity category string |
| `entity_type` | VARCHAR(50) | Yes | — | Entity type involved |
| `entity_id` | VARCHAR(255) | Yes | — | Entity ID involved |
| `tree_id` | UUID | No | — | FK → `trees.id` (CASCADE DELETE) |
| `user_id` | UUID | No | — | FK → `users.id` (CASCADE DELETE) |
| `description` | TEXT | No | — | Human-readable description |
| `metadata` | JSON | Yes | — | Additional data (e.g. before/after values) |
| `created_at` | TIMESTAMPTZ | No | `now()` | Activity timestamp |

**Indexes:** `tree_id`, `user_id`, `activity_type`, `created_at`

---

## Supporting Junction Tables

### `media_attachments`
**Prisma model:** `Media` (SQL table: `media_attachments`)

Polymorphic bridge table linking Go API media objects to entities in this database (discussion posts, suggestions, research notes, messages, and user content).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `uuid()` | Primary key |
| `file_id` | VARCHAR(255) | No | — | Go API file identifier |
| `media_id` | VARCHAR(255) | No | — | Go API media UUID |
| `entity_type` | VARCHAR(50) | No | — | Type of the owning entity |
| `entity_id` | UUID | No | — | ID of the owning entity |
| `created_at` | TIMESTAMPTZ | No | `now()` | Timestamp |

**Indexes:** `(file_id, media_id)`, `(entity_type, entity_id)`

---

## GEDCOM Data Tables

These tables store genealogical data parsed from uploaded GEDCOM files. All tables are scoped to a `GedcomFile` via `file_uuid`. Table names use the `_v2` suffix.

---

### `gedcom_files`
**Prisma model:** `GedcomFile`

Registry of uploaded GEDCOM files. Tracks parsing status, entity counts, and access statistics.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `file_id` | TEXT | No | Unique string identifier (matches `trees.file_id`) |
| `name` | TEXT | No | File name |
| `original_filename` | TEXT | Yes | Original uploaded filename |
| `gedcom_path` | TEXT | Yes | Storage path |
| `individuals_count` | INTEGER | No | Parsed individual count |
| `families_count` | INTEGER | No | Parsed family count |
| `places_count` | INTEGER | No | Parsed place count |
| `dates_count` | INTEGER | No | Parsed date count |
| `events_count` | INTEGER | No | Parsed event count |
| `notes_count` | INTEGER | No | Parsed note count |
| `sources_count` | INTEGER | No | Parsed source count |
| `file_size` | BIGINT | Yes | File size in bytes |
| `checksum` | TEXT | Yes | File checksum |
| `gedcom_version` | TEXT | Yes | GEDCOM spec version |
| `charset` | TEXT | Yes | Character set |
| `status` | TEXT | No | `uploading`, `parsing`, `ready`, `error` |
| `parse_errors` | INTEGER | No | Count of parse errors |
| `parse_warnings` | INTEGER | No | Count of parse warnings |
| `error_message` | TEXT | Yes | Error detail |
| `access_count` | BIGINT | No | Access counter |
| `last_accessed_at` | TIMESTAMPTZ | Yes | Last access timestamp |
| `parsed_at` | TIMESTAMPTZ | Yes | Parse completion timestamp |
| `created_at` | TIMESTAMPTZ | No | Upload timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |

---

### `gedcom_places_v2`
**Prisma model:** `GedcomPlace`

Deduplicated place records. Each unique place (by hash) is stored once per file.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `file_uuid` | UUID | No | FK → `gedcom_files.id` |
| `original` | TEXT | No | Raw PLAC value from GEDCOM |
| `name` | TEXT | Yes | Locality/city portion |
| `county` | TEXT | Yes | County |
| `state` | TEXT | Yes | State/province |
| `country` | TEXT | Yes | Country |
| `latitude` | DECIMAL(10,7) | Yes | Geocoded latitude |
| `longitude` | DECIMAL(10,7) | Yes | Geocoded longitude |
| `hash` | TEXT | No | Deduplication hash of the place string |
| `created_at` | TIMESTAMPTZ | No | Timestamp |

**Unique:** `(file_uuid, hash)` | **Indexes:** `file_uuid`, `(file_uuid, country)`, `(file_uuid, state)`, `(file_uuid, name)`

---

### `gedcom_dates_v2`
**Prisma model:** `GedcomDate`

Deduplicated, parsed date records. Supports range dates (`FROM_TO`, `BETWEEN`) via `end_year/month/day`.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `file_uuid` | UUID | No | FK → `gedcom_files.id` |
| `original` | TEXT | Yes | Raw DATE value |
| `date_type` | `GedcomDateType` | No | Precision/qualifier |
| `calendar` | TEXT | Yes | Calendar system (default `GREGORIAN`) |
| `year` | INTEGER | Yes | Start year |
| `month` | INTEGER | Yes | Start month |
| `day` | INTEGER | Yes | Start day |
| `end_year` | INTEGER | Yes | End year (range dates) |
| `end_month` | INTEGER | Yes | End month (range dates) |
| `end_day` | INTEGER | Yes | End day (range dates) |
| `hash` | TEXT | No | Deduplication hash |
| `created_at` | TIMESTAMPTZ | No | Timestamp |

**Unique:** `(file_uuid, hash)` | **Indexes:** `file_uuid`, `(file_uuid, year)`

---

### `gedcom_surnames_v2`
**Prisma model:** `GedcomSurname`

Deduplicated surname index with phonetic codes for fuzzy matching.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `file_uuid` | UUID | No | FK → `gedcom_files.id` |
| `surname` | TEXT | No | Original surname casing |
| `surname_lower` | TEXT | No | Lowercased for deduplication |
| `soundex` | TEXT | Yes | Soundex code |
| `metaphone` | TEXT | Yes | Metaphone code |
| `frequency` | INTEGER | No | Occurrence count |
| `created_at` | TIMESTAMPTZ | No | Timestamp |

**Unique:** `(file_uuid, surname_lower)` | **Indexes:** `file_uuid`, `(file_uuid, surname_lower)`, `(file_uuid, soundex)`, `(file_uuid, frequency)`

---

### `gedcom_given_names_v2`
**Prisma model:** `GedcomGivenName`

Deduplicated given-name index.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `file_uuid` | UUID | No | FK → `gedcom_files.id` |
| `given_name` | TEXT | No | Original casing |
| `given_name_lower` | TEXT | No | Lowercased for deduplication |
| `frequency` | INTEGER | No | Occurrence count |
| `created_at` | TIMESTAMPTZ | No | Timestamp |

**Unique:** `(file_uuid, given_name_lower)` | **Indexes:** `file_uuid`, `(file_uuid, given_name_lower)`, `(file_uuid, frequency)`

---

### `gedcom_individuals_v2`
**Prisma model:** `GedcomIndividual`

Core individual (person) records parsed from GEDCOM INDI records.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `file_uuid` | UUID | No | FK → `gedcom_files.id` |
| `xref` | TEXT | No | GEDCOM XREF (e.g. `@I1@`) |
| `full_name` | TEXT | Yes | Assembled full name |
| `full_name_lower` | TEXT | Yes | Lowercased full name for search |
| `sex` | `GedcomSex` | Yes | `M`, `F`, `U`, or `X` |
| `birth_date_id` | UUID | Yes | FK → `gedcom_dates_v2.id` |
| `birth_place_id` | UUID | Yes | FK → `gedcom_places_v2.id` |
| `birth_date_display` | TEXT | Yes | Pre-formatted birth date string |
| `birth_place_display` | TEXT | Yes | Pre-formatted birth place string |
| `birth_year` | INTEGER | Yes | Extracted birth year for sorting |
| `death_date_id` | UUID | Yes | FK → `gedcom_dates_v2.id` |
| `death_place_id` | UUID | Yes | FK → `gedcom_places_v2.id` |
| `death_date_display` | TEXT | Yes | Pre-formatted death date string |
| `death_place_display` | TEXT | Yes | Pre-formatted death place string |
| `death_year` | INTEGER | Yes | Extracted death year for sorting |
| `is_living` | BOOLEAN | No | Living flag (default `true`) |
| `has_parents` | BOOLEAN | No | Has parent relationships |
| `has_children` | BOOLEAN | No | Has child relationships |
| `has_spouse` | BOOLEAN | No | Has spouse relationships |
| `occupation` | TEXT | Yes | Occupation |
| `religion` | TEXT | Yes | Religion |
| `nationality` | TEXT | Yes | Nationality |
| `created_at` | TIMESTAMPTZ | No | Timestamp |
| `updated_at` | TIMESTAMPTZ | No | Timestamp |

**Unique:** `(file_uuid, xref)` | **Indexes:** many combinations of `file_uuid` with `xref`, `full_name_lower`, `birth_year`, `death_year`, `is_living`, `sex`

---

### `gedcom_families_v2`
**Prisma model:** `GedcomFamily`

GEDCOM FAM records. Links husband and wife individuals and stores marriage/divorce data.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `file_uuid` | UUID | No | FK → `gedcom_files.id` |
| `xref` | TEXT | No | GEDCOM XREF (e.g. `@F1@`) |
| `husband_id` | UUID | Yes | FK → `gedcom_individuals_v2.id` |
| `wife_id` | UUID | Yes | FK → `gedcom_individuals_v2.id` |
| `husband_xref` | TEXT | Yes | Husband's XREF for reference |
| `wife_xref` | TEXT | Yes | Wife's XREF for reference |
| `marriage_date_id` | UUID | Yes | FK → `gedcom_dates_v2.id` |
| `marriage_place_id` | UUID | Yes | FK → `gedcom_places_v2.id` |
| `marriage_date_display` | TEXT | Yes | Pre-formatted marriage date |
| `marriage_place_display` | TEXT | Yes | Pre-formatted marriage place |
| `marriage_year` | INTEGER | Yes | Marriage year for sorting |
| `divorce_date_id` | UUID | Yes | FK → `gedcom_dates_v2.id` |
| `divorce_place_id` | UUID | Yes | FK → `gedcom_places_v2.id` |
| `is_divorced` | BOOLEAN | No | Divorced flag |
| `children_count` | INTEGER | No | Cached child count |
| `created_at` | TIMESTAMPTZ | No | Timestamp |
| `updated_at` | TIMESTAMPTZ | No | Timestamp |

**Unique:** `(file_uuid, xref)` | **Indexes:** `file_uuid`, `(file_uuid, xref)`, `husband_id`, `wife_id`, `(file_uuid, marriage_year)`

---

### `gedcom_events_v2`
**Prisma model:** `GedcomEvent`

GEDCOM events (birth, death, marriage, census, immigration, etc.). Events are linked to individuals or families via junction tables.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `file_uuid` | UUID | No | FK → `gedcom_files.id` |
| `event_type` | TEXT | No | Standard GEDCOM tag (e.g. `BIRT`, `DEAT`, `MARR`, `CENS`) |
| `custom_type` | TEXT | Yes | Custom event type label |
| `date_id` | UUID | Yes | FK → `gedcom_dates_v2.id` |
| `place_id` | UUID | Yes | FK → `gedcom_places_v2.id` |
| `value` | TEXT | Yes | Event value/note |
| `cause` | TEXT | Yes | Cause of death (for DEAT events) |
| `agency` | TEXT | Yes | Recording agency |
| `sort_order` | INTEGER | No | Display order |
| `created_at` | TIMESTAMPTZ | No | Timestamp |

**Indexes:** `file_uuid`, `(file_uuid, event_type)`, `date_id`, `place_id`

---

### `gedcom_notes_v2`
**Prisma model:** `GedcomNote`

GEDCOM NOTE records (inline or top-level `@N1@` style).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `file_uuid` | UUID | No | FK → `gedcom_files.id` |
| `xref` | TEXT | Yes | XREF (null for inline notes) |
| `content` | TEXT | No | Note text |
| `is_top_level` | BOOLEAN | No | True for XREF-referenced notes |
| `created_at` | TIMESTAMPTZ | No | Timestamp |

**Unique:** `(file_uuid, xref)` | **Indexes:** `file_uuid`, `(file_uuid, is_top_level)`

---

### `gedcom_sources_v2`
**Prisma model:** `GedcomSource`

GEDCOM SOUR records (source definitions, not citations). Citations are stored in junction tables.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `file_uuid` | UUID | No | FK → `gedcom_files.id` |
| `xref` | TEXT | No | GEDCOM XREF (e.g. `@S1@`) |
| `title` | TEXT | Yes | Source title |
| `author` | TEXT | Yes | Author |
| `abbreviation` | TEXT | Yes | Abbreviation |
| `publication` | TEXT | Yes | Publication info |
| `text` | TEXT | Yes | Source text |
| `repository_xref` | TEXT | Yes | Repository XREF reference |
| `call_number` | TEXT | Yes | Library call number |
| `created_at` | TIMESTAMPTZ | No | Timestamp |

**Unique:** `(file_uuid, xref)` | **Indexes:** `file_uuid`, `(file_uuid, xref)`, `(file_uuid, title)`

---

### `gedcom_repositories_v2`
**Prisma model:** `GedcomRepository`

GEDCOM REPO records (library/archive definitions).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `file_uuid` | UUID | No | FK → `gedcom_files.id` |
| `xref` | TEXT | No | GEDCOM XREF |
| `name` | TEXT | Yes | Repository name |
| `address` | TEXT | Yes | Street address |
| `city` | TEXT | Yes | City |
| `state` | TEXT | Yes | State |
| `country` | TEXT | Yes | Country |
| `phone` | TEXT | Yes | Phone number |
| `email` | TEXT | Yes | Email address |
| `website` | TEXT | Yes | Website URL |
| `created_at` | TIMESTAMPTZ | No | Timestamp |

**Unique:** `(file_uuid, xref)` | **Indexes:** `file_uuid`

---

### `gedcom_media_v2`
**Prisma model:** `GedcomMedia`

GEDCOM OBJE (media object) records. `file_ref` is the file path from the GEDCOM; actual binaries are managed by the Go API.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `file_uuid` | UUID | No | FK → `gedcom_files.id` |
| `xref` | TEXT | Yes | XREF (null for inline objects) |
| `file_ref` | TEXT | Yes | File reference path |
| `form` | TEXT | Yes | Media format |
| `title` | TEXT | Yes | Media title |
| `created_at` | TIMESTAMPTZ | No | Timestamp |

**Unique:** `(file_uuid, xref)` | **Indexes:** `file_uuid`

---

### `gedcom_file_objects`
**Prisma model:** `GedcomFileObject`

XREF routing table that maps every top-level GEDCOM XREF to a specific record UUID. Enables fast lookup of any XREF without knowing the entity type.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `file_uuid` | UUID | No | FK → `gedcom_files.id` |
| `xref` | TEXT | No | GEDCOM XREF string |
| `object_type` | TEXT | No | Entity type (`individual`, `family`, etc.) |
| `object_uuid` | UUID | No | UUID of the resolved entity record |
| `created_at` | TIMESTAMPTZ | No | Timestamp |

**Unique:** `(file_uuid, xref)` | **Indexes:** `file_uuid`, `(file_uuid, xref)`, `(file_uuid, object_type)`

---

### GEDCOM Junction Tables

The following junction tables implement many-to-many relationships between GEDCOM entities. All follow the same pattern: `id`, `file_uuid`, two FK columns, and `created_at`.

| Table | SQL Name | Joins |
|-------|----------|-------|
| `GedcomIndividualEvent` | `gedcom_individual_events_v2` | Individual ↔ Event (with `role`) |
| `GedcomFamilyEvent` | `gedcom_family_events_v2` | Family ↔ Event |
| `GedcomIndividualNote` | `gedcom_individual_notes_v2` | Individual ↔ Note |
| `GedcomFamilyNote` | `gedcom_family_notes_v2` | Family ↔ Note |
| `GedcomEventNote` | `gedcom_event_notes_v2` | Event ↔ Note |
| `GedcomSourceNote` | `gedcom_source_notes_v2` | Source ↔ Note |
| `GedcomIndividualSource` | `gedcom_individual_sources_v2` | Individual ↔ Source (citation; includes `page`, `quality`, `citation_text`) |
| `GedcomFamilySource` | `gedcom_family_sources_v2` | Family ↔ Source (citation) |
| `GedcomEventSource` | `gedcom_event_sources_v2` | Event ↔ Source (citation) |
| `GedcomIndividualSurname` | `gedcom_individual_surnames_v2` | Individual ↔ Surname (with `name_type`, `is_primary`) |
| `GedcomIndividualGivenName` | `gedcom_individual_given_names_v2` | Individual ↔ Given Name (with `position`, `is_primary`) |
| `GedcomFamilySurname` | `gedcom_family_surnames_v2` | Family ↔ Surname |
| `GedcomParentChild` | `gedcom_parent_child_v2` | Parent Individual ↔ Child Individual (with `relationship_type`, `pedigree`) |
| `GedcomFamilyChild` | `gedcom_family_children_v2` | Family ↔ Child Individual (with `birth_order`) |
| `GedcomSpouse` | `gedcom_spouses_v2` | Individual ↔ Spouse Individual (via Family) |
| `GedcomIndividualMedia` | `gedcom_individual_media_v2` | Individual ↔ Media Object |
| `GedcomFamilyMedia` | `gedcom_family_media_v2` | Family ↔ Media Object |
| `GedcomSourceMedia` | `gedcom_source_media_v2` | Source ↔ Media Object |
| `GedcomSourceRepository` | `gedcom_source_repositories_v2` | Source ↔ Repository (with `call_number`) |
