# Comments and Notifications System - Implementation Plan

**Date:** 2026-02-13  
**Status:** Planning  
**Purpose:** Comprehensive plan for implementing comments and notifications systems

---

## Executive Summary

This document outlines the design and implementation plan for:
1. **Comments System** - Entity-based commenting with threaded replies
2. **Notifications System** - Real-time and digest notifications for user activities

**Key Decisions:**
- Comments are entity-specific (individuals, families, events, etc.)
- Notifications are event-driven and support multiple delivery channels
- Email service is deferred (lower priority) - system works without it
- Real-time notifications and chat via WebSocket (bidirectional communication required for chat)

---

## 1. Comments System

### 1.1 What Can Be Commented On?

**Primary Entities (Phase 1 - High Priority):**
1. **Individuals** (`entityType: "individual"`)
   - Comment on person records
   - Examples: "This birth date seems incorrect", "I have additional information", "Can you add a photo?"

2. **Families** (`entityType: "family"`)
   - Comment on family units
   - Examples: "I believe there were more children", "The marriage date needs verification"

3. **Events** (`entityType: "event"`)
   - Comment on specific life events
   - Examples: "I was at this wedding", "The location is incorrect"

4. **Media** (`entityType: "media"`)
   - Comment on photos/documents
   - Examples: "This is actually John, not James", "Can you add names to this photo?"

**Secondary Entities (Phase 2 - Medium Priority):**
5. **Sources** (`entityType: "source"`)
   - Comment on source citations
   - Examples: "This source is unreliable", "I found additional pages"

6. **Places** (`entityType: "place"`)
   - Comment on locations
   - Examples: "This place name has changed", "Coordinates are slightly off"

7. **Trees** (`entityType: "tree"`)
   - Comment on entire trees
   - Examples: "This tree is well-researched", "I'm related to people in this tree"

8. **Notes** (`entityType: "note"`)
   - Comment on existing notes
   - Examples: "This note needs updating", "I can provide more details"

**Tertiary Entities (Phase 3 - Low Priority):**
9. **Dates** (`entityType: "date"`) - Comment on date interpretations
10. **UserContent** (`entityType: "user_content"`) - Comment on user-generated content

### 1.2 Comment Features

#### Phase 1: Basic Commenting (MVP)
- ✅ **Text comments** - Plain text or markdown
- ✅ **Threaded replies** - Reply to specific comments (parent-child relationship)
- ✅ **Edit/Delete** - Users can edit/delete their own comments
- ✅ **Timestamps** - Created/updated timestamps
- ✅ **User attribution** - Show comment author
- ✅ **Tree context** - Comments are scoped to a tree

#### Phase 2: Rich Comments
- ⏳ **Markdown support** - Bold, italic, lists, links, code blocks
- ⏳ **Mentions** - @username to mention other users
- ⏳ **Entity links** - Link to other entities (e.g., "See @I1234")
- ⏳ **Attachments** - Attach media to comments
- ⏳ **Reactions** - Like, helpful, etc. (future)

#### Phase 3: Moderation
- ⏳ **Report** - Report inappropriate comments
- ⏳ **Hide** - Hide comments (for owners/maintainers)
- ⏳ **Delete** - Delete comments (for owners/maintainers)
- ⏳ **Pin** - Pin important comments to top
- ⏳ **Resolve** - Mark comment as resolved (for questions/issues)

### 1.3 Comment Status

**Status Types:**
- **Active** (default) - Normal comment, visible to all
- **Resolved** - Question/issue has been addressed
- **Hidden** - Hidden by moderator (still exists, just not visible)
- **Deleted** - Soft-deleted (soft delete via `deletedAt`)

### 1.4 Comment Data Model

**Already in Schema:** ✅ `Comment` table exists

```prisma
model Comment {
  id         String    @id @default(uuid()) @db.Uuid
  entityType String    @map("entity_type") @db.VarChar(50)
  entityId   String    @map("entity_id") @db.VarChar(255)
  treeId     String    @map("tree_id") @db.Uuid
  userId     String    @map("user_id") @db.Uuid
  parentId   String?   @map("parent_id") @db.Uuid
  content    String    @db.Text
  isEdited   Boolean   @default(false) @map("is_edited")
  isResolved Boolean   @default(false) @map("is_resolved")
  isPinned   Boolean   @default(false) @map("is_pinned")
  isHidden   Boolean   @default(false) @map("is_hidden")
  createdAt  DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt  DateTime? @map("deleted_at") @db.Timestamptz(6)

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tree     Tree      @relation(fields: [treeId], references: [id], onDelete: Cascade)
  parent   Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: SetNull)
  replies  Comment[] @relation("CommentReplies")
  mentions User[]    @relation("CommentMentions")

  @@index([entityType, entityId])
  @@index([treeId])
  @@index([userId])
  @@index([parentId])
  @@map("comments")
}
```

**What We Need:**
- ✅ Schema is complete
- ⏳ API routes for CRUD operations
- ⏳ Mycelia facet for client-side state
- ⏳ UI components for displaying/creating comments
- ⏳ Permission checks (who can comment, edit, delete)

---

## 2. Notifications System

### 2.1 Notification Types

**Comment-Related Notifications:**
1. **`comment:created`** - New comment on entity you own/follow
2. **`comment:reply`** - Reply to your comment
3. **`comment:mention`** - You were mentioned in a comment
4. **`comment:resolved`** - Your comment/question was resolved

**Access Request Notifications:**
5. **`access_request:approved`** - Your access request was approved
6. **`access_request:rejected`** - Your access request was rejected
7. **`access_request:received`** - New access request on your tree

**Suggestion Notifications:**
8. **`suggestion:created`** - New suggestion on your entity
9. **`suggestion:approved`** - Your suggestion was approved
10. **`suggestion:rejected`** - Your suggestion was rejected

**Discussion Thread Notifications:**
11. **`thread:created`** - New thread in tree you follow
12. **`thread:post`** - New post in thread you're watching
13. **`thread:mention`** - You were mentioned in a thread

**Message Notifications:**
14. **`message:received`** - New direct message
15. **`message:group`** - New message in group you're in

**Activity Notifications:**
16. **`activity:entity_edited`** - Entity you follow was edited
17. **`activity:media_added`** - New media added to entity you follow
18. **`activity:tree_updated`** - Tree you follow was updated

**User-Related Notifications:**
19. **`user:followed`** - Someone started following you
20. **`user:content_liked`** - Someone liked your content
21. **`user:content_commented`** - Someone commented on your content

**System Notifications:**
22. **`system:maintenance`** - System maintenance scheduled
23. **`system:update`** - Platform update/announcement

### 2.2 Notification Delivery Channels

**Phase 1: In-App Only (No Email Service)**
- ✅ **In-app notifications** - Real-time via WebSocket
- ✅ **Notification panel** - UI component showing notifications
- ✅ **Notification badge** - Unread count indicator
- ✅ **Notification history** - View all past notifications
- ✅ **Chat support** - WebSocket enables future chat/messaging features

**Phase 2: Email Integration (When Service Available)**
- ⏳ **Email notifications** - Optional email for important notifications
- ⏳ **Email digest** - Daily/weekly digest of notifications
- ⏳ **Email preferences** - User controls which notifications trigger emails

**Phase 3: Push Notifications (Future)**
- ⏳ **Browser push** - Browser push notifications
- ⏳ **Mobile push** - Mobile app push notifications

### 2.3 Notification Data Model

**Already in Schema:** ✅ `Notification` table exists

```prisma
model Notification {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  type      String   @db.VarChar(100) // comment:created, access_request:approved, etc.
  title     String   @db.VarChar(255)
  message   String   @db.Text
  link      String?  @db.VarChar(500) // URL to related entity/page
  isRead    Boolean  @default(false) @map("is_read")
  readAt    DateTime? @map("read_at") @db.Timestamptz(6)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  // Related entity context (optional)
  entityType String? @map("entity_type") @db.VarChar(50)
  entityId   String? @map("entity_id") @db.VarChar(255)
  treeId     String? @map("tree_id") @db.Uuid

  // Actor (who triggered the notification)
  actorId    String? @map("actor_id") @db.Uuid

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  actor  User?  @relation("NotificationActor", fields: [actorId], references: [id], onDelete: SetNull)
  tree   Tree?  @relation(fields: [treeId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@index([type])
  @@map("notifications")
}
```

**What We Need:**
- ✅ Schema is complete
- ⏳ Notification service/utility functions
- ⏳ Event emitters for creating notifications
- ⏳ WebSocket/SSE server for real-time delivery
- ⏳ Mycelia facet for client-side state
- ⏳ UI components (notification panel, badge, list)
- ⏳ Notification preferences/permissions

### 2.4 Notification Preferences

**User Preferences (Future - Phase 2):**
- Which notification types to receive
- Delivery channel preferences (in-app, email, push)
- Frequency (real-time, digest, none)
- Quiet hours (don't notify during certain times)

**For Now (Phase 1):**
- All notifications delivered in-app
- No preferences (all notifications enabled)
- Can mark as read/unread
- Can dismiss/delete notifications

---

## 3. WebSocket Architecture

### 3.1 Unified WebSocket Connection

**Design:** Single WebSocket connection per user handles multiple features

**Benefits:**
- Efficient resource usage (one connection instead of multiple)
- Shared connection management (reconnection, heartbeat, etc.)
- Unified message routing
- Easier to extend for future features (presence, typing indicators, etc.)

**Connection Flow:**
1. User authenticates and receives JWT token
2. Client establishes WebSocket connection with JWT token
3. Server validates token and associates connection with user
4. Server subscribes user to relevant channels (notifications, chat rooms, etc.)
5. Client and server exchange messages via WebSocket

### 3.2 Message Routing

**Channel-Based Routing:**
- Messages are routed by `channel` field
- Each feature has its own channel namespace
- Channels can be user-specific, group-specific, or broadcast

**Channel Examples:**
- `notifications:user:{userId}` - User's notifications
- `chat:user:{userId}` - Direct messages to user
- `chat:group:{groupId}` - Group chat messages
- `chat:typing:{userId}` - Typing indicators
- `comments:entity:{entityType}:{entityId}` - Real-time comment updates (future)

### 3.3 WebSocket Server Implementation

**Option 1: Next.js API Route (Simple)**
- Use Next.js API route with WebSocket upgrade
- Pros: Simple, integrated with existing codebase
- Cons: Limited WebSocket features, harder to scale

**Option 2: Separate WebSocket Server (Recommended)**
- Standalone WebSocket server (Node.js with `ws` library)
- Pros: Better performance, easier to scale, more features
- Cons: Additional service to manage

**Recommended: Option 2 (Separate Server)**

**Server Structure:**
```
websocket-server/
├── server.js (main WebSocket server)
├── connection-manager.js (connection tracking, authentication)
├── message-router.js (route messages by type/channel)
├── handlers/
│   ├── notification-handler.js
│   ├── chat-handler.js
│   └── comment-handler.js (future)
└── broadcast-manager.js (send to users/rooms)
```

### 3.4 Client-Side WebSocket Library

**Location:** `lib/websocket/client.js`

**Features:**
- Connection management (connect, disconnect, reconnect)
- Automatic reconnection with exponential backoff
- Heartbeat/ping to keep connection alive
- Message queuing (queue messages when disconnected)
- Channel subscription management
- Event emitter for message handling

**Usage:**
```javascript
import { WebSocketClient } from '@/lib/websocket/client';

const wsClient = new WebSocketClient({
  url: 'ws://localhost:8091/ws',
  token: authToken,
  onMessage: (message) => {
    // Handle incoming messages
    if (message.channel === 'notifications') {
      handleNotification(message.payload);
    } else if (message.channel.startsWith('chat:')) {
      handleChatMessage(message.payload);
    }
  },
  onConnect: () => {
    // Subscribe to channels
    wsClient.subscribe('notifications:user:123');
    wsClient.subscribe('chat:user:123');
  }
});

// Send message
wsClient.send({
  type: 'chat:send',
  channel: 'chat:user:456',
  payload: { message: 'Hello!' }
});
```

### 3.5 Integration with Mycelia Facets

**Notifications Facet:**
```javascript
// In mycelia/facets/notifications.js
const connectWebSocket = () => {
  const wsClient = getWebSocketClient(); // Shared WebSocket client
  wsClient.subscribe(`notifications:user:${userId}`);
  wsClient.on('message', (message) => {
    if (message.channel === `notifications:user:${userId}`) {
      // Update notifications state
      state.notifications.unshift(message.payload);
      state.unreadCount++;
      emitStateChange();
    }
  });
};
```

**Chat Facet (Future):**
```javascript
// In mycelia/facets/chat.js
const connectWebSocket = () => {
  const wsClient = getWebSocketClient(); // Same WebSocket client
  wsClient.subscribe(`chat:user:${userId}`);
  wsClient.on('message', (message) => {
    if (message.channel.startsWith('chat:')) {
      // Update chat state
      handleChatMessage(message.payload);
    }
  });
};
```

### 3.6 WebSocket Server Configuration

**Environment Variables:**
```env
WS_PORT=8091
WS_HOST=0.0.0.0
WS_PATH=/ws
WS_HEARTBEAT_INTERVAL=30000
WS_RECONNECT_DELAY=1000
WS_MAX_RECONNECT_ATTEMPTS=10
```

**Authentication:**
- JWT token passed in WebSocket handshake query parameter
- Server validates token on connection
- Invalid token → close connection
- Valid token → associate connection with user

**Connection Management:**
- Track active connections per user
- Handle multiple connections from same user (multiple tabs/devices)
- Broadcast to all user's connections
- Clean up on disconnect

---

## 4. Implementation Plan

### Phase 1: Comments System (Week 1-2)

#### Week 1: Backend & API
1. **API Routes** (`app/api/comments/`)
   - `GET /api/comments` - List comments for entity
   - `POST /api/comments` - Create comment
   - `PUT /api/comments/[id]` - Update comment
   - `DELETE /api/comments/[id]` - Delete comment
   - `POST /api/comments/[id]/resolve` - Mark as resolved
   - `POST /api/comments/[id]/pin` - Pin comment
   - `POST /api/comments/[id]/hide` - Hide comment (moderator)

2. **Permission Functions** (`lib/permissions/comments.js`)
   - `canComment(entityType, entityId, treeId, userId)` - Check if user can comment
   - `canEditComment(commentId, userId)` - Check if user can edit
   - `canDeleteComment(commentId, userId)` - Check if user can delete
   - `canModerateComments(treeId, userId)` - Check if user can moderate

3. **Mycelia Facet** (`mycelia/facets/comments.js`)
   - `getComments(entityType, entityId, treeId)` - Fetch comments
   - `createComment(data)` - Create new comment
   - `updateComment(id, updates)` - Update comment
   - `deleteComment(id)` - Delete comment
   - `resolveComment(id)` - Mark as resolved
   - State management (comments, loading, error)

#### Week 2: Frontend UI
1. **UI Components** (`components/features/comments/`)
   - `CommentList.js` - Display list of comments
   - `CommentItem.js` - Display single comment with replies
   - `CommentForm.js` - Form to create/edit comment
   - `CommentThread.js` - Threaded comment display
   - `CommentActions.js` - Edit/delete/resolve actions

2. **Integration**
   - Add comment sections to entity detail pages
   - Individual detail page
   - Family detail page
   - Event detail page
   - Media detail page

### Phase 2: Notifications System (Week 3-4)

#### Week 3: Backend & Real-Time
1. **Notification Service** (`lib/notifications/`)
   - `createNotification(userId, type, data)` - Create notification
   - `markAsRead(notificationId, userId)` - Mark as read
   - `markAllAsRead(userId)` - Mark all as read
   - `deleteNotification(notificationId, userId)` - Delete notification
   - `getNotifications(userId, filters)` - Get notifications

2. **Event Emitters**
   - Emit notification events when actions occur
   - Comment created → emit `comment:created` notification
   - Access request approved → emit `access_request:approved` notification
   - etc.

3. **WebSocket Server** (`app/api/ws/route.js` or separate WebSocket server)
   - Real-time notification delivery
   - Future chat/messaging support
   - Bidirectional communication
   - Connection management and authentication

#### Week 4: Frontend UI
1. **Mycelia Facet** (`mycelia/facets/notifications.js`)
   - `getNotifications(filters)` - Fetch notifications
   - `markAsRead(id)` - Mark as read
   - `markAllAsRead()` - Mark all as read
   - `deleteNotification(id)` - Delete notification
   - `subscribe()` - Subscribe to real-time updates via WebSocket
   - `connectWebSocket()` - Establish WebSocket connection
   - `disconnectWebSocket()` - Close WebSocket connection
   - State management (notifications, unreadCount, loading, isConnected)

2. **UI Components** (`components/features/notifications/`)
   - `NotificationPanel.js` - Dropdown panel with notifications
   - `NotificationList.js` - List of notifications
   - `NotificationItem.js` - Single notification item
   - `NotificationBadge.js` - Unread count badge
   - `NotificationSettings.js` - User preferences (future)

3. **Integration**
   - Add notification panel to top bar
   - Add notification badge to top bar
   - Add notification page (`/notifications`)

### Phase 3: Integration & Polish (Week 5)

1. **Connect Comments to Notifications**
   - Emit notifications when comments are created
   - Emit notifications when comments are replied to
   - Emit notifications when mentions occur

2. **Testing**
   - Unit tests for API routes
   - Integration tests for notification flow
   - E2E tests for comment creation/notification delivery

3. **Documentation**
   - API documentation
   - Component usage examples
   - Notification type reference

---

## 5. Technical Decisions

### 4.1 Real-Time Communication

**Decision:** Use WebSocket for notifications and chat

**Rationale:**
- Chat/messaging requires bidirectional communication
- Single WebSocket connection can handle both notifications and chat
- More efficient than polling or separate SSE connection
- Better for real-time features (typing indicators, presence, etc.)
- Standard approach for modern real-time applications
- Can reuse WebSocket infrastructure for other features

**Implementation:**
- Unified WebSocket server (`app/api/ws/route.js` or separate server)
- Single WebSocket connection per user
- Message routing based on message type/channel
- Authentication via JWT token in WebSocket handshake
- Reconnection handling with exponential backoff
- Connection pooling and management

**Architecture:**
```
WebSocket Server
├── Connection Manager (authenticate, track connections)
├── Message Router (route messages by type)
│   ├── notifications/* → Notification Handler
│   ├── chat/* → Chat Handler
│   └── comments/* → Comment Handler (future)
└── Broadcast Manager (send to specific users/rooms)
```

**Message Format:**
```javascript
// Client → Server
{
  type: 'notification:subscribe' | 'chat:send' | 'chat:typing',
  channel?: string, // 'notifications', 'chat:user:123', 'chat:group:456'
  payload: { ... }
}

// Server → Client
{
  type: 'notification' | 'chat:message' | 'chat:typing',
  channel?: string,
  payload: { ... },
  timestamp: number
}
```

### 4.2 Comment Threading

**Decision:** Use parent-child relationship (flat threading)

**Rationale:**
- Simpler than nested threading
- Easier to display and paginate
- Can show depth visually (indentation)
- Can limit depth (e.g., max 3 levels)

**Alternative Considered:** Nested threading (rejected - too complex)

### 4.3 Notification Storage

**Decision:** Store all notifications in database

**Rationale:**
- Persistent notification history
- Can query and filter notifications
- Can implement notification preferences later
- Can generate notification digests

**Alternative Considered:** In-memory only (rejected - no history)

### 4.4 Email Service

**Decision:** Defer email integration (lower priority)

**Rationale:**
- Requires paid service subscription
- System works without email
- Can add email later when service is available
- In-app notifications are sufficient for MVP

**Future:** When email service is available, add email delivery as optional channel

---

## 5. API Design

### 5.1 Comments API

```typescript
// List comments for entity
GET /api/comments?entityType=individual&entityId=I1234&treeId=tree-uuid
Response: { comments: Comment[], pagination: {...} }

// Create comment
POST /api/comments
Body: { entityType, entityId, treeId, content, parentId? }
Response: { comment: Comment }

// Update comment
PUT /api/comments/[id]
Body: { content }
Response: { comment: Comment }

// Delete comment
DELETE /api/comments/[id]
Response: { success: true }

// Resolve comment
POST /api/comments/[id]/resolve
Response: { comment: Comment }

// Pin comment
POST /api/comments/[id]/pin
Response: { comment: Comment }
```

### 5.2 Notifications API

```typescript
// Get notifications
GET /api/notifications?unreadOnly=true&limit=50&offset=0
Response: { notifications: Notification[], unreadCount: number }

// Mark as read
PUT /api/notifications/[id]/read
Response: { notification: Notification }

// Mark all as read
POST /api/notifications/read-all
Response: { success: true }

// Delete notification
DELETE /api/notifications/[id]
Response: { success: true }

// WebSocket connection (for notifications and chat)
WS /api/ws?token={jwt_token}
Message Format: { type, channel?, payload }
```

---

## 6. Security & Permissions

### 6.1 Comment Permissions

**Who Can Comment:**
- Anyone with read access to the entity
- Must be authenticated
- Tree owners/maintainers can always comment

**Who Can Edit:**
- Comment author only
- Within time limit (e.g., 15 minutes after creation)
- Tree owners/maintainers can edit any comment

**Who Can Delete:**
- Comment author
- Tree owners/maintainers
- Website owners (global moderation)

**Who Can Moderate:**
- Tree owners
- Tree maintainers
- Website owners

### 6.2 Notification Permissions

**Who Receives Notifications:**
- Entity owners (when someone comments on their entity)
- Comment authors (when someone replies)
- Mentioned users (when @username is used)
- Tree owners (when activity occurs in their tree)
- Users who follow entities/trees

**Privacy:**
- Users can't see notifications for other users
- Notifications are scoped to user's permissions
- Only show notifications for entities user has access to

---

## 7. UI/UX Considerations

### 7.1 Comment Display

**Layout:**
- Comments displayed in chronological order (oldest first)
- Replies indented under parent comment
- Show comment author, timestamp, content
- Show edit/delete buttons for own comments
- Show resolve/pin/hide buttons for moderators

**Features:**
- Collapse/expand long threads
- "Load more replies" for threads with many replies
- Highlight new comments (since last visit)
- Show comment count badge on entity pages

### 7.2 Notification Display

**Notification Panel:**
- Dropdown panel from top bar
- Show unread count badge
- Group notifications by type
- Show timestamp (relative: "2 minutes ago")
- Click notification to navigate to related entity
- "Mark all as read" button
- "View all notifications" link to full page

**Notification Page:**
- Full list of all notifications
- Filter by type, read/unread
- Sort by date (newest first)
- Pagination for large lists
- Delete individual notifications

---

## 8. Testing Strategy

### 8.1 Unit Tests
- Comment CRUD operations
- Notification creation and delivery
- Permission checks
- Mycelia facets

### 8.2 Integration Tests
- Comment creation triggers notification
- Real-time notification delivery
- Permission enforcement
- Entity-specific comment filtering

### 8.3 E2E Tests
- User creates comment
- Other user receives notification
- User replies to comment
- Notification appears in real-time
- User marks notification as read

---

## 9. Future Enhancements

### Phase 4: Rich Features
- Markdown support in comments
- Mentions (@username)
- Entity links in comments
- Media attachments in comments
- Comment reactions (like, helpful)

### Phase 5: Email Integration
- Email service integration
- Email notification preferences
- Email digests (daily/weekly)
- Email templates

### Phase 6: Advanced Moderation
- Comment reporting
- Automated moderation
- Spam detection
- Content filtering

---

## 10. Summary

### What We're Building

1. **Comments System**
   - Entity-based commenting (individuals, families, events, media, etc.)
   - Threaded replies
   - Edit/delete own comments
   - Moderation tools (pin, hide, resolve)
   - Permission-based access

2. **Notifications System**
   - Real-time in-app notifications (SSE)
   - Multiple notification types (comments, access requests, suggestions, etc.)
   - Notification history and management
   - Unread count tracking
   - No email service required (works without it)

### Timeline

- **Week 1-2:** Comments system (backend + frontend)
- **Week 3-4:** Notifications system (backend + frontend)
- **Week 5:** Integration, testing, polish

**Total:** ~5 weeks for complete implementation

### Dependencies

- ✅ Database schemas exist
- ✅ Permission system exists
- ✅ Mycelia facet system exists
- ✅ UI component library exists
- ⏳ WebSocket server (to be implemented)
- ⏳ Notification service utilities (to be implemented)
- ⏳ WebSocket client library (connection management, reconnection, message routing)

---

## Next Steps

**Implementation checklist:** See [COMMENTS_AND_NOTIFICATIONS_CHECKLIST.md](./COMMENTS_AND_NOTIFICATIONS_CHECKLIST.md) for a file-by-file implementation checklist with checkboxes.

1. **Start with Comments API** - Implement CRUD routes
2. **Implement Comment Permissions** - Who can comment/edit/delete
3. **Build Comment UI Components** - Display and create comments
4. **Implement Notification Service** - Create and deliver notifications
5. **Build Notification UI** - Panel, badge, list components
6. **Connect Comments to Notifications** - Emit notifications on comment events
7. **Test and Polish** - Ensure everything works smoothly

