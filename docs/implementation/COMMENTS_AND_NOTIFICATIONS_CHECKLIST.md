# Comments and Notifications — Implementation Checklist

**Date:** 2026-02-18  
**Status:** Ready for implementation  
**Source:** [COMMENTS_AND_NOTIFICATIONS_PLAN.md](./COMMENTS_AND_NOTIFICATIONS_PLAN.md)

Use this checklist to track progress. Order of tasks matters where dependencies are noted.

---

## Prerequisites

### Schema and config

- [ ] **Notification model update** — Extend `prisma/schema.prisma`:
  - Add optional `entityType`, `entityId`, `treeId` (optional), `actorId` to `Notification`.
  - Add `actor User?` relation (`NotificationActor`, `actorId`, `onDelete: SetNull`).
  - Decide `type`: keep `NotificationType` enum and map plan types (e.g. `comment:created` → `comment`) **or** change `type` to `String` for full type names.
- [ ] **Run migration** — `npx prisma migrate dev --name notifications_context` (or equivalent).
- [ ] **Env for WebSocket** (when starting Phase 2) — Add to `.env.local` (and deployment):
  - `WS_PORT=8091`, `WS_HOST=0.0.0.0`, `WS_PATH=/ws`
  - Optional: `WS_HEARTBEAT_INTERVAL`, `WS_RECONNECT_DELAY`, `WS_MAX_RECONNECT_ATTEMPTS`

---

## Phase 1: Comments (Backend & API)

### 1.1 Permissions

- [ ] **Create** `lib/permissions/comments.js`:
  - [ ] `canComment(entityType, entityId, treeId, userId)` — user has read (or higher) access to entity/tree; use existing `lib/permissions` helpers (`hasReadAccess`, `isTreeOwner`, `isTreeMaintainer`, etc.).
  - [ ] `canEditComment(commentId, userId)` — comment author or tree owner/maintainer (optional: time window, e.g. 15 min).
  - [ ] `canDeleteComment(commentId, userId)` — comment author or tree owner/maintainer or website owner.
  - [ ] `canModerateComments(treeId, userId)` — tree owner or maintainer or website owner.
- [ ] **Export** comment permission functions from `lib/permissions/index.js` (if you centralize exports there).

### 1.2 API routes

Use `getAuthenticatedUser(request)` from `lib/middleware.js`; return 401 if auth required and no user. Use Prisma from `lib/database/prisma.js`.

- [ ] **GET** `app/api/comments/route.js`:
  - Query: `entityType`, `entityId`, `treeId` (required). Optional: `limit`, `offset`, `includeReplies`.
  - Auth: optional (if tree/entity is public, allow unauthenticated read).
  - Permission: ensure caller can read the entity/tree.
  - Return: `{ comments: Comment[], pagination?: { total, limit, offset } }`. Include `user` (id, username, name) and nested `replies` (or flat list with `parentId`).
  - Exclude soft-deleted: `deletedAt: null`. Exclude hidden unless moderator.
- [ ] **POST** `app/api/comments/route.js`:
  - Body: `entityType`, `entityId`, `treeId`, `content`, `parentId?`.
  - Auth: required.
  - Permission: `canComment(...)`.
  - Create comment; return `{ comment: Comment }` with user.
- [ ] **PUT** `app/api/comments/[id]/route.js`:
  - Body: `content` (and optionally other editable fields if you add them).
  - Auth: required.
  - Permission: `canEditComment(commentId, userId)`.
  - Return `{ comment: Comment }`.
- [ ] **DELETE** `app/api/comments/[id]/route.js`:
  - Auth: required.
  - Permission: `canDeleteComment(commentId, userId)`.
  - Soft-delete: set `deletedAt = now()`. Return `{ success: true }`.
- [ ] **POST** `app/api/comments/[id]/resolve/route.js`:
  - Toggle or set `isResolved`. Permission: author or `canModerateComments`.
  - Return `{ comment: Comment }`.
- [ ] **POST** `app/api/comments/[id]/pin/route.js`:
  - Toggle or set `isPinned`. Permission: `canModerateComments(treeId, userId)`.
  - Return `{ comment: Comment }`.
- [ ] **POST** `app/api/comments/[id]/hide/route.js`:
  - Set `isHidden`. Permission: `canModerateComments`.
  - Return `{ comment: Comment }`.

### 1.3 Mycelia comments facet

- [ ] **Create** `mycelia/facets/comments.js`:
  - `required: ['listeners', 'auth']`.
  - State: `comments`, `loading`, `error`.
  - [ ] `getComments(entityType, entityId, treeId)` — GET `/api/comments?entityType=...&entityId=...&treeId=...`, update state, emit `comments:stateChanged` (or similar).
  - [ ] `createComment({ entityType, entityId, treeId, content, parentId? })` — POST `/api/comments`, then refresh or append, emit.
  - [ ] `updateComment(id, { content })` — PUT `/api/comments/[id]`, update state, emit.
  - [ ] `deleteComment(id)` — DELETE, remove from state or mark deleted, emit.
  - [ ] `resolveComment(id)` — POST resolve, update state, emit.
  - [ ] Optional: `pinComment(id)`, `hideComment(id)` if you expose them in UI.
  - Use `auth.getState().token` for `Authorization` header; use `subsystem.find('listeners')` to emit.
- [ ] **Register facet** in `mycelia/system.builder.js`: `.use(useComments)` and add `import { useComments } from './facets/comments.js'`.

---

## Phase 1: Comments (Frontend UI)

### 1.4 Comment components

- [ ] **Create** `components/features/comments/CommentForm.js`:
  - Props: `entityType`, `entityId`, `treeId`, `parentId?`, `onSuccess`, `onCancel?`, `initialContent?` (for edit).
  - Submit via comments facet `createComment` or `updateComment`.
  - Basic validation (non-empty content).
- [ ] **Create** `components/features/comments/CommentItem.js`:
  - Display one comment: author, timestamp, content, edited indicator.
  - Actions (if permitted): Edit, Delete, Resolve (for author/moderator), Pin/Hide (moderator). Use permissions from API or from a small helper that calls facet/context.
- [ ] **Create** `components/features/comments/CommentThread.js`:
  - Recursive or flat list of comments with replies (indent by depth or `parentId`).
  - Load more / collapse long threads if needed.
- [ ] **Create** `components/features/comments/CommentList.js`:
  - Wraps list of threads + `CommentForm` for new top-level comment.
  - Fetches via facet `getComments(entityType, entityId, treeId)` on mount; shows loading/error.
- [ ] **Create** `components/features/comments/CommentActions.js` (optional if you inline actions in CommentItem):
  - Edit / Delete / Resolve / Pin / Hide buttons with permission checks.
- [ ] **Create** `components/features/comments/index.js` — export all public components.

### 1.5 Integrate comments into entity pages

- [ ] **Individual detail** — Add comment section (e.g. `<CommentList entityType="individual" entityId={...} treeId={...} />`). Locate page: e.g. `app/trees/[treeId]/individuals/[id]/page.js` or equivalent.
- [ ] **Family detail** — Same for `entityType="family"`.
- [ ] **Event detail** — Same for `entityType="event"`.
- [ ] **Media detail** — Same for `entityType="media"`.

(If some of these pages don’t exist yet, add a note and create a placeholder or the first page that will show comments.)

---

## Phase 2: Notifications (Backend & real-time)

### 2.1 Notification service (server-side)

- [ ] **Create** `lib/notifications/index.js` (or split into `create.js`, `queries.js`):
  - [ ] `createNotification(userId, type, data)` — `data`: `title`, `message`, `link?`, `entityType?`, `entityId?`, `treeId?`, `actorId?`. Insert into `Notification` (Prisma). Return created notification.
  - [ ] `getNotifications(userId, filters)` — filters: `unreadOnly?`, `limit`, `offset`. Return `{ notifications, unreadCount }`.
  - [ ] `markAsRead(notificationId, userId)` — set `isRead = true`, `readAt = now()`; ensure notification belongs to userId.
  - [ ] `markAllAsRead(userId)`.
  - [ ] `deleteNotification(notificationId, userId)` — ensure ownership, then delete (or soft-delete if you add it).
- [ ] **Wire notification creation to comment flows** (can be done in Phase 3): from comment API route or a small helper, after creating a comment call `createNotification` for:
  - Entity/tree owners or relevant watchers (e.g. `comment:created`).
  - Parent comment author on reply (`comment:reply`).
  - Mentioned users when you implement mentions (`comment:mention`).

### 2.2 Notifications API routes

- [ ] **GET** `app/api/notifications/route.js`:
  - Query: `unreadOnly`, `limit`, `offset`.
  - Auth: required.
  - Return: `{ notifications: Notification[], unreadCount: number }`. Include `actor` if you added it.
- [ ] **PUT** `app/api/notifications/[id]/read/route.js` — Auth required; mark as read; return updated notification.
- [ ] **POST** `app/api/notifications/read-all/route.js` — Auth required; mark all as read; return `{ success: true }`.
- [ ] **DELETE** `app/api/notifications/[id]/route.js` — Auth required; delete only own; return `{ success: true }`.

### 2.3 WebSocket server

Choose one:

- **Option A — Separate Node server (recommended in plan):**
  - [ ] **Create** `websocket-server/` (or `ws-server/`): `server.js`, `connection-manager.js`, `message-router.js`, optional `handlers/notification-handler.js`, `broadcast-manager.js`.
  - [ ] **Auth:** Read JWT from query (e.g. `?token=...`), validate, attach userId to connection.
  - [ ] **Channels:** Subscribe connection to `notifications:user:{userId}`. On new notification (from API/service), broadcast to that channel.
  - [ ] **Heartbeat:** Ping/pong or heartbeat message to drop stale connections.
  - [ ] **Env:** Use `WS_PORT`, `WS_HOST`, `WS_PATH` from env.
- **Option B — Next.js API route with WebSocket upgrade:**
  - [ ] **Create** `app/api/ws/route.js` (or similar) that handles WebSocket upgrade, same auth and channel logic (connection tracking and broadcast will live in memory or a small store).

### 2.4 WebSocket client (browser)

- [ ] **Create** `lib/websocket/client.js` (or `lib/websocket/WebSocketClient.js`):
  - Connect with URL + token (query or header per server design).
  - Reconnect with backoff on close/error.
  - Heartbeat/ping to keep alive.
  - Optional: queue outbound messages when disconnected.
  - Subscribe to channel(s); expose `onMessage(callback)` or event emitter.
  - Export a singleton or factory so the notifications facet (and future chat) share one connection.

---

## Phase 2: Notifications (Frontend UI)

### 2.5 Notifications facet

- [ ] **Create** `mycelia/facets/notifications.js`:
  - `required: ['listeners', 'auth']`.
  - State: `notifications`, `unreadCount`, `loading`, `error`, `isConnected` (WebSocket).
  - [ ] `getNotifications(filters)` — GET `/api/notifications`, update state, emit.
  - [ ] `markAsRead(id)` — PUT read, update state, emit.
  - [ ] `markAllAsRead()` — POST read-all, update state, emit.
  - [ ] `deleteNotification(id)` — DELETE, update state, emit.
  - [ ] `connectWebSocket()` — get token from auth, create/use shared WebSocket client, subscribe to `notifications:user:{userId}`, on message push notification and increment unread, emit.
  - [ ] `disconnectWebSocket()` — close connection (e.g. on logout).
  - Call `connectWebSocket()` when user is logged in (e.g. from facet init or from a layout/hook that has auth).
- [ ] **Register** in `mycelia/system.builder.js`: `.use(useNotifications)` and import.

### 2.6 Notification UI components

- [ ] **Create** `components/features/notifications/NotificationItem.js` — One row: icon/type, title, message, relative time, link to `link` (e.g. entity page); mark as read on click if needed.
- [ ] **Create** `components/features/notifications/NotificationList.js` — List of `NotificationItem`, optional “Mark all as read”, empty state.
- [ ] **Create** `components/features/notifications/NotificationPanel.js` — Dropdown (or slide-out) containing `NotificationList`; trigger from TopBar.
- [ ] **Create** `components/features/notifications/NotificationBadge.js` — Unread count badge (e.g. red pill); show on TopBar icon.
- [ ] **Create** `components/features/notifications/index.js` — Export components.
- [ ] **Optional (Phase 2 later):** `NotificationSettings.js` — Preferences (which types, channels); can stub for now.

### 2.7 Integrate notifications into layout

- [ ] **TopBar** — Add notification icon + `NotificationBadge` (unread count from facet) + click opens `NotificationPanel`. Ensure notifications facet is connected (WebSocket) when user is authenticated.
- [ ] **Page** `app/notifications/page.js` — Full-page list of notifications (reuse `NotificationList` or same data from facet), with filters (all/unread) and pagination if needed.

---

## Phase 3: Integration & polish

### 3.1 Comments → Notifications

- [ ] **On comment create** — In comments API POST handler (or a shared helper), after creating the comment: determine recipients (e.g. tree owners, parent comment author); call `createNotification(userId, 'comment' or 'comment:created', { title, message, link, entityType, entityId, treeId, actorId })` for each. If using separate WebSocket server, also push to each user’s channel (or have API call a small “notify” endpoint that the WebSocket server subscribes to).
- [ ] **On reply** — Same; add notification to parent comment’s author with type `comment:reply` (or `reply`).
- [ ] **On mention** (when Comment.mentions is used) — When saving comment, create notification for each mentioned user (`comment:mention`).

### 3.2 Testing

- [ ] **Comments:** Unit tests for `lib/permissions/comments.js` (canComment, canEdit, canDelete, canModerate).
- [ ] **Comments:** API route tests (GET list, POST create, PUT/DELETE with auth and permissions).
- [ ] **Notifications:** Unit tests for `lib/notifications` (create, markAsRead, markAllAsRead, getNotifications).
- [ ] **Notifications:** API route tests for GET/PUT/POST/DELETE.
- [ ] **Integration:** Comment creation triggers notification creation (and optionally WebSocket push) for the right user(s).
- [ ] **E2E (optional):** One flow: login → open entity → add comment → second user sees notification in panel.

### 3.3 Documentation

- [ ] **API:** Document in `docs/api/` or existing API doc: comments endpoints (query/body/response), notifications endpoints, WebSocket URL and message format.
- [ ] **Components:** Add usage examples for `CommentList` and notification panel in `docs/components/` or README in `components/features/comments` and `components/features/notifications`.
- [ ] **Notification types:** List supported `type` values and when they are used (e.g. in `COMMENTS_AND_NOTIFICATIONS_PLAN.md` or a small reference doc).

---

## Quick reference

| Area              | Key paths |
|-------------------|-----------|
| Permissions       | `lib/permissions/comments.js` |
| Comment API       | `app/api/comments/route.js`, `app/api/comments/[id]/route.js`, `app/api/comments/[id]/resolve/route.js`, etc. |
| Comments facet    | `mycelia/facets/comments.js` |
| Comment UI        | `components/features/comments/*.js` |
| Notification svc  | `lib/notifications/index.js` |
| Notifications API | `app/api/notifications/route.js`, `app/api/notifications/[id]/route.js`, `read/route.js`, `read-all/route.js` |
| WebSocket server | `websocket-server/*` or `app/api/ws/route.js` |
| WebSocket client  | `lib/websocket/client.js` |
| Notifications facet | `mycelia/facets/notifications.js` |
| Notification UI   | `components/features/notifications/*.js` |

---

## Dependency order

1. Prerequisites (Notification schema + migration).
2. Comments: permissions → API → facet → UI → entity page integration.
3. Notifications: service → API → WebSocket server + client → facet → UI → TopBar + `/notifications` page.
4. Phase 3: Wire comment events to notification service + WebSocket; tests and docs.
