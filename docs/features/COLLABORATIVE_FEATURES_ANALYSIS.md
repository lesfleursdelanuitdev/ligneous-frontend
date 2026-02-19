# Collaborative Features Analysis

**Date:** February 15, 2026  
**Status:** Planning  
**Purpose:** Comprehensive analysis of collaborative features needed for the genealogical application

---

## Table of Contents

1. [Current State](#current-state)
2. [Access Requests](#access-requests)
3. [Comments System](#comments-system)
4. [Discussion Threads](#discussion-threads)
5. [Suggestions & Notes](#suggestions--notes)
6. [Messaging System](#messaging-system)
7. [Additional Collaborative Features](#additional-collaborative-features)
8. [Data Model Requirements](#data-model-requirements)
9. [UI/UX Considerations](#uiux-considerations)
10. [Implementation Priority](#implementation-priority)

---

## Current State

### Existing Features
- ✅ **Access Requests** - Users can request access to trees
- ✅ **Permissions System** - Tree-level, individual-level, family-level, subtree-level permissions
- ✅ **User-Individual Links** - Users can link their account to specific individuals
- ✅ **Tree Ownership** - Multiple owners per tree
- ✅ **Tree Maintainers** - Maintainer role for tree management
- ✅ **Invitation Links** - Shareable links for automatic access
- ✅ **Notifications** - Basic notification system exists
- ✅ **Albums** - Shared media collections
- ✅ **Tags** - Collaborative tagging system

### Missing Collaborative Features
- ❌ Comments
- ❌ Discussion threads
- ❌ Suggestions/notes
- ❌ Direct messaging
- ❌ Activity feed
- ❌ Mentions/notifications
- ❌ Change tracking/version history
- ❌ Research notes
- ❌ To-do lists/tasks

---

## 1. Access Requests

### Current Representation

**Database Model:**
- `AccessRequest` table with status (pending, approved, rejected, cancelled)
- Request types: `basic_access`, `individual_link`, `maintainer_role`, `owner_role`
- Can target specific resources (tree, individual, family, subtree)
- Includes notes and response notes

**Current UI:**
- `PendingRequests` component shows requests in cards
- Admin page for managing requests
- Request cards show: requester, tree, type, status, notes

### Proposed Enhancements

#### 1.1 Request History & Timeline
- **What:** Show full history of all requests (not just pending)
- **Where:** 
  - User's request history page (`/my-requests`)
  - Tree's request history (for owners)
- **Why:** Users can track their requests, see what was approved/rejected

#### 1.2 Request Notifications
- **What:** Real-time notifications when requests are approved/rejected
- **Where:** Notification panel
- **Why:** Users need to know immediately when access is granted

#### 1.3 Request Templates
- **What:** Pre-filled request forms for common scenarios
- **Where:** Request access button
- **Why:** Make it easier to request access with proper context

#### 1.4 Bulk Request Management
- **What:** Approve/reject multiple requests at once
- **Where:** Admin requests page
- **Why:** Efficiency for admins managing many requests

#### 1.5 Request Analytics
- **What:** Dashboard showing request stats (pending count, approval rate, etc.)
- **Where:** Admin dashboard
- **Why:** Help admins understand collaboration patterns

---

## 2. Comments System

### What Should Be Commentable?

**Primary Entities (High Priority):**
1. **Individuals** - Comment on person records
   - "This birth date seems incorrect based on..."
   - "I have additional information about this person"
   - "Can you add a photo?"

2. **Families** - Comment on family units
   - "I believe there were more children in this family"
   - "The marriage date needs verification"

3. **Events** - Comment on specific life events
   - "I was at this wedding, here's what I remember"
   - "The location is incorrect, it was actually..."

4. **Sources** - Comment on source citations
   - "This source is unreliable"
   - "I found additional pages in this source"

5. **Media** - Comment on photos/documents
   - "This is actually John, not James"
   - "Can you add names to this photo?"

6. **Places** - Comment on locations
   - "This place name has changed"
   - "Coordinates are slightly off"

**Secondary Entities (Medium Priority):**
7. **Trees** - Comment on entire trees
   - "This tree is well-researched"
   - "I'm related to people in this tree"

8. **Notes** - Comment on existing notes
   - "This note needs updating"
   - "I can provide more details"

**Tertiary Entities (Low Priority):**
9. **Dates** - Comment on date interpretations
10. **Sources** - Comment on source quality

### Comment Features

#### 2.1 Basic Commenting
- **Text comments** with markdown support
- **Threaded replies** - Reply to specific comments
- **Edit/Delete** - Users can edit/delete their own comments
- **Timestamps** - When comment was made/edited

#### 2.2 Rich Comments
- **Mentions** - @username to mention other users
- **Links** - Link to other entities (individuals, families, etc.)
- **Attachments** - Attach media to comments
- **Formatting** - Bold, italic, lists, code blocks

#### 2.3 Comment Moderation
- **Report** - Report inappropriate comments
- **Hide** - Hide comments (for owners/maintainers)
- **Delete** - Delete comments (for owners/maintainers)
- **Pin** - Pin important comments to top

#### 2.4 Comment Notifications
- **New comment** - Notify when someone comments on your entity
- **Reply** - Notify when someone replies to your comment
- **Mention** - Notify when mentioned in a comment
- **Resolved** - Notify when comment is marked as resolved

#### 2.5 Comment Status
- **Open** - Active discussion
- **Resolved** - Issue addressed
- **Closed** - Discussion ended
- **Archived** - Old comments

---

## 3. Discussion Threads

### Discussion Threads vs Comments

**Comments:**
- **Purpose:** Quick annotations, questions, clarifications
- **Scope:** Attached to specific entity (individual, event, etc.)
- **Structure:** Flat or threaded replies
- **Visibility:** Visible on entity detail page
- **Example:** "This birth date is wrong" on an individual's page

**Discussion Threads:**
- **Purpose:** Longer-form discussions, research questions, collaboration
- **Scope:** Tree-level or topic-based
- **Structure:** Thread with multiple posts, can branch into subtopics
- **Visibility:** Separate discussion area, can be linked from entities
- **Example:** "Researching the Smith family line - anyone have information?"

### Discussion Thread Types

#### 3.1 Tree-Level Discussions
- **What:** General discussions about a tree
- **Where:** `/trees/{id}/discussions`
- **Topics:**
  - Research questions
  - Collaboration requests
  - Methodology discussions
  - Tree organization questions
- **Who Can Create:** Anyone with read access to tree

#### 3.2 Topic-Based Discussions
- **What:** Discussions about specific topics (surnames, places, time periods)
- **Where:** `/discussions` (global) or `/trees/{id}/discussions`
- **Topics:**
  - "Researching the Johnson surname"
  - "Anyone from Springfield, IL?"
  - "Civil War veterans in our trees"
- **Who Can Create:** Any user

#### 3.3 Entity-Linked Discussions
- **What:** Discussion threads linked to specific entities
- **Where:** Can be created from entity detail page
- **Purpose:** Longer discussions about specific individuals/families
- **Example:** "Researching the origins of John Smith (I1234)"

### Discussion Features

#### 3.1 Thread Management
- **Create thread** - Title, description, tags
- **Edit thread** - Edit title/description (author only)
- **Close thread** - Mark as resolved/closed
- **Pin thread** - Pin important threads
- **Lock thread** - Prevent new posts (moderators)

#### 3.2 Post Features
- **Rich text** - Markdown support, formatting
- **Attachments** - Attach media, documents
- **Links** - Link to entities, other threads
- **Mentions** - @username mentions
- **Edit/Delete** - Edit own posts, delete (with time limit)

#### 3.3 Thread Organization
- **Categories** - Research, Collaboration, Questions, etc.
- **Tags** - Surname, location, time period tags
- **Search** - Search discussions by keyword, tag, author
- **Sorting** - By date, activity, relevance

#### 3.4 Notifications
- **New thread** - Notify when thread created in your tree
- **New post** - Notify when someone posts in thread you're following
- **Mention** - Notify when mentioned in thread
- **Tagged** - Notify when thread tagged with your interests

---

## 4. Suggestions & Notes

### What Are Suggestions vs Notes?

**Suggestions:**
- **Purpose:** Propose changes to data
- **Scope:** Specific field or entity
- **Action Required:** Owner/maintainer must approve/reject
- **Example:** "Suggest changing birth date from 1850 to 1851 based on census"

**Notes:**
- **Purpose:** Research notes, observations, private annotations
- **Scope:** Can be private or shared
- **Action Required:** None (informational)
- **Example:** "Need to verify this marriage date with county records"

### What Should Support Suggestions?

**High Priority:**
1. **Individuals** - Suggest changes to:
   - Name (given, surname, suffix)
   - Birth/death dates
   - Birth/death places
   - Sex
   - Relationships

2. **Families** - Suggest changes to:
   - Marriage date/place
   - Divorce date
   - Children additions/removals

3. **Events** - Suggest changes to:
   - Event date
   - Event place
   - Event description

4. **Places** - Suggest changes to:
   - Place name
   - Coordinates
   - Place hierarchy

**Medium Priority:**
5. **Sources** - Suggest corrections to citations
6. **Media** - Suggest better titles, descriptions, associations

### Suggestion Workflow

#### 4.1 Creating Suggestions
- **Inline editing** - Click "Suggest edit" on any field
- **Bulk suggestions** - Suggest multiple changes at once
- **Evidence** - Attach sources/media as evidence
- **Explanation** - Required explanation for suggestion

#### 4.2 Reviewing Suggestions
- **Suggestion queue** - List of pending suggestions
- **Compare view** - Side-by-side current vs. suggested
- **Evidence review** - Review attached evidence
- **Approve/Reject** - One-click approval or rejection
- **Request changes** - Request more information before approving

#### 4.3 Suggestion Notifications
- **New suggestion** - Notify owners/maintainers
- **Approved** - Notify suggester when approved
- **Rejected** - Notify suggester with reason
- **Changes requested** - Notify suggester to provide more info

### Notes System

#### 4.1 Note Types
- **Research notes** - Private research observations
- **Shared notes** - Notes visible to collaborators
- **Public notes** - Notes visible to all tree viewers
- **Entity notes** - Notes attached to specific entities

#### 4.2 Note Features
- **Rich text** - Markdown support
- **Tags** - Tag notes for organization
- **Attachments** - Attach media, documents
- **Links** - Link to entities, sources
- **Privacy** - Control who can see notes

#### 4.3 Note Organization
- **Notebooks** - Organize notes into notebooks
- **Search** - Search notes by content, tags, entity
- **Timeline** - View notes chronologically
- **Entity view** - See all notes for an entity

---

## 5. Messaging System

### Message Types

#### 5.1 Direct Messages (DMs)
- **What:** One-on-one private messages between users
- **Purpose:** 
  - Private collaboration
  - Personal questions
  - Sharing sensitive information
- **Features:**
  - Real-time or async messaging
  - Read receipts
  - Message search
  - File attachments
  - Message threads

#### 5.2 Group Messages
- **What:** Messages to multiple users
- **Purpose:**
  - Tree owner/maintainer announcements
  - Family group discussions
  - Research team coordination
- **Features:**
  - Create groups (tree collaborators, research teams)
  - Group management (add/remove members)
  - Group settings (who can post, etc.)

#### 5.3 System Messages
- **What:** Automated messages from the system
- **Purpose:**
  - Access request notifications
  - Suggestion approvals/rejections
  - Activity summaries
- **Features:**
  - Cannot reply
  - Mark as read/unread
  - Archive

### Messaging Features

#### 5.1 Core Features
- **Send message** - Compose and send
- **Reply** - Reply to messages
- **Forward** - Forward messages
- **Delete** - Delete messages (own messages only)
- **Archive** - Archive conversations
- **Search** - Search message history

#### 5.2 Rich Messaging
- **Formatting** - Bold, italic, links
- **Attachments** - Files, media, entity links
- **Entity mentions** - Link to individuals, families, etc.
- **Emojis** - Emoji support

#### 5.3 Organization
- **Inbox** - All received messages
- **Sent** - Sent messages
- **Archived** - Archived conversations
- **Starred** - Important messages
- **Filters** - Filter by sender, tree, type

#### 5.4 Notifications
- **New message** - Real-time notification
- **Unread count** - Badge showing unread messages
- **Email notifications** - Optional email for new messages

---

## 6. Additional Collaborative Features

### 6.1 Activity Feed

**What:** Timeline of all activity in trees user has access to

**Activities to Track:**
- New individuals/families added
- Data edits (who changed what)
- New media uploaded
- Comments posted
- Suggestions created/approved
- Discussion threads created
- Access requests approved
- User links created

**Features:**
- **Filter** - Filter by tree, user, activity type
- **Follow** - Follow specific trees/users
- **Notifications** - Get notified of activities
- **Privacy** - Only show activities user has permission to see

### 6.2 Mentions & Notifications

**Mentions:**
- **@username** - Mention users in comments, discussions, messages
- **@entity** - Link to entities (e.g., @I1234 for individual)
- **Notifications** - Notify when mentioned

**Notification Types:**
- New comment on your entity
- Reply to your comment
- Mention in comment/discussion
- New suggestion on your entity
- Suggestion approved/rejected
- New message
- Access request approved/rejected
- New collaborator added
- Activity in followed trees

**Notification Settings:**
- Email notifications (on/off)
- In-app notifications (on/off)
- Notification frequency (real-time, daily digest, weekly)
- Notification types (choose which to receive)

### 6.3 Change Tracking & Version History

**What:** Track all changes to data with full history

**Features:**
- **Edit log** - Who changed what, when
- **Version history** - See previous versions of entities
- **Revert** - Revert to previous version
- **Compare** - Compare versions side-by-side
- **Change summary** - Summary of changes in time period

**What to Track:**
- Field changes (before/after values)
- Relationship changes
- Media additions/removals
- Source additions
- Note changes

### 6.4 Research Notes & To-Do Lists

**Research Notes:**
- **Private notes** - Personal research notes
- **Shared notes** - Notes shared with collaborators
- **Entity notes** - Notes attached to entities
- **Notebooks** - Organize notes
- **Tags** - Tag notes for organization
- **Search** - Search notes

**To-Do Lists:**
- **Personal tasks** - Tasks for yourself
- **Shared tasks** - Tasks assigned to collaborators
- **Entity tasks** - Tasks related to specific entities
- **Task status** - To-do, in-progress, done
- **Due dates** - Set deadlines
- **Assignees** - Assign tasks to users

### 6.5 Follow & Watch Features

**Follow:**
- **Follow trees** - Get updates on tree activity
- **Follow users** - Get updates on user activity
- **Follow entities** - Get updates on specific individuals/families
- **Follow discussions** - Get updates on discussion threads

**Watch:**
- **Watch for changes** - Get notified of any changes
- **Watch for comments** - Get notified of new comments
- **Watch for suggestions** - Get notified of new suggestions

### 6.6 Sharing & Collaboration Tools

**Sharing:**
- **Share trees** - Generate shareable links
- **Share entities** - Share links to specific individuals/families
- **Share media** - Share media collections
- **Share albums** - Share album links

**Collaboration Tools:**
- **Collaborator list** - See all collaborators on a tree
- **Role management** - Assign roles (viewer, editor, maintainer, owner)
- **Activity dashboard** - See collaboration activity
- **Contribution stats** - See who contributed what

### 6.7 Moderation Tools

**For Tree Owners/Maintainers:**
- **Moderate comments** - Approve/delete comments
- **Moderate discussions** - Lock/delete threads
- **Moderate suggestions** - Review suggestions
- **User management** - Remove collaborators
- **Content flags** - Handle reported content

**For Website Owners:**
- **Global moderation** - Moderate across all trees
- **User bans** - Ban users from platform
- **Content review** - Review flagged content
- **Appeal process** - Handle appeals

---

## Data Model Requirements

### New Tables Needed

#### Comments Table
```prisma
model Comment {
  id            String   @id @default(uuid())
  entityType    String   // individual, family, event, source, media, place, tree, note
  entityId      String   // UUID or XREF
  treeId        String   // For tree context
  userId        String   // Comment author
  parentId      String?  // For threaded replies
  content       String   @db.Text
  isEdited      Boolean  @default(false)
  isResolved    Boolean  @default(false)
  isPinned      Boolean  @default(false)
  isHidden      Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
  
  user    User     @relation(fields: [userId])
  tree    Tree     @relation(fields: [treeId])
  parent  Comment? @relation("CommentReplies", fields: [parentId])
  replies Comment[] @relation("CommentReplies")
  mentions User[]  @relation("CommentMentions")
  
  @@index([entityType, entityId])
  @@index([treeId])
  @@index([userId])
  @@index([parentId])
}
```

#### Discussion Threads Table
```prisma
model DiscussionThread {
  id          String   @id @default(uuid())
  treeId      String?  // Optional - can be tree-level or global
  title       String
  description String?  @db.Text
  category    String?  // Research, Collaboration, Question, etc.
  tags        String[] // Array of tags
  isLocked    Boolean  @default(false)
  isPinned    Boolean  @default(false)
  isClosed    Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tree    Tree?   @relation(fields: [treeId])
  creator User    @relation(fields: [createdBy])
  posts   DiscussionPost[]
  watchers User[] @relation("ThreadWatchers")
  
  @@index([treeId])
  @@index([createdBy])
  @@index([category])
}
```

#### Discussion Posts Table
```prisma
model DiscussionPost {
  id        String   @id @default(uuid())
  threadId  String
  userId    String
  content   String   @db.Text
  isEdited  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  
  thread   DiscussionThread @relation(fields: [threadId])
  user     User             @relation(fields: [userId])
  mentions User[]           @relation("PostMentions")
  
  @@index([threadId])
  @@index([userId])
}
```

#### Suggestions Table
```prisma
model Suggestion {
  id          String   @id @default(uuid())
  entityType  String   // individual, family, event, etc.
  entityId    String   // UUID or XREF
  treeId      String
  fieldName   String   // Which field is being suggested
  currentValue String? @db.Text
  suggestedValue String @db.Text
  evidence    String?  @db.Text // Explanation/evidence
  status      SuggestionStatus @default(pending)
  suggestedBy String
  reviewedBy  String?
  reviewedAt  DateTime?
  reviewNotes String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  suggester User    @relation("SuggestionAuthor", fields: [suggestedBy])
  reviewer  User?   @relation("SuggestionReviewer", fields: [reviewedBy])
  tree      Tree    @relation(fields: [treeId])
  attachments Media[] @relation("SuggestionAttachments")
  
  @@index([entityType, entityId])
  @@index([treeId])
  @@index([status])
  @@index([suggestedBy])
}

enum SuggestionStatus {
  pending
  approved
  rejected
  needs_info
}
```

#### Notes Table
```prisma
model Note {
  id          String   @id @default(uuid())
  entityType  String?  // Optional - can be general or entity-specific
  entityId    String?  // Optional
  treeId      String?  // Optional
  userId      String
  title       String?
  content     String   @db.Text
  isPrivate   Boolean  @default(true)
  notebookId  String?  // Optional - organize into notebooks
  tags        String[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user      User     @relation(fields: [userId])
  tree      Tree?    @relation(fields: [treeId])
  notebook  Notebook? @relation(fields: [notebookId])
  attachments Media[] @relation("NoteAttachments")
  
  @@index([entityType, entityId])
  @@index([treeId])
  @@index([userId])
  @@index([notebookId])
}

model Notebook {
  id          String   @id @default(uuid())
  userId      String
  name        String
  description String?  @db.Text
  isPrivate   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user  User   @relation(fields: [userId])
  notes Note[]
  
  @@index([userId])
}
```

#### Messages Table
```prisma
model Message {
  id          String   @id @default(uuid())
  senderId    String
  recipientId String?  // For DMs
  groupId     String?  // For group messages
  subject     String?
  content     String   @db.Text
  isRead      Boolean  @default(false)
  readAt      DateTime?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  sender    User     @relation("SentMessages", fields: [senderId])
  recipient User?    @relation("ReceivedMessages", fields: [recipientId])
  group     MessageGroup? @relation(fields: [groupId])
  attachments Media[] @relation("MessageAttachments")
  
  @@index([senderId])
  @@index([recipientId])
  @@index([groupId])
  @@index([isRead])
}

model MessageGroup {
  id          String   @id @default(uuid())
  name        String
  description String?  @db.Text
  treeId      String?  // Optional - can be tree-specific
  createdBy   String
  createdAt   DateTime @default(now())
  
  tree    Tree?     @relation(fields: [treeId])
  creator User      @relation(fields: [createdBy])
  members User[]    @relation("GroupMembers")
  messages Message[]
  
  @@index([treeId])
  @@index([createdBy])
}
```

#### Activity Feed Table
```prisma
model Activity {
  id          String   @id @default(uuid())
  activityType String  // edit, comment, suggestion, media_upload, etc.
  entityType   String? // individual, family, etc.
  entityId     String?
  treeId       String
  userId       String
  description String   @db.Text
  metadata     Json?    // Additional data
  createdAt    DateTime @default(now())
  
  user User @relation(fields: [userId])
  tree Tree @relation(fields: [treeId])
  
  @@index([treeId])
  @@index([userId])
  @@index([activityType])
  @@index([createdAt])
}
```

#### Notifications Table
```prisma
model Notification {
  id          String   @id @default(uuid())
  userId      String
  type        NotificationType
  title       String
  message     String   @db.Text
  link        String?  // URL to related content
  isRead      Boolean  @default(false)
  readAt      DateTime?
  createdAt   DateTime @default(now())
  
  user User @relation(fields: [userId])
  
  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}

enum NotificationType {
  comment
  reply
  mention
  suggestion
  message
  access_request
  activity
  system
}
```

---

## UI/UX Considerations

### 1. Access Requests UI

**Where to Show:**
- **Request button** - On tree/entity pages (if no access)
- **Request queue** - Admin/maintainer dashboard
- **Request history** - User's request history page
- **Request notifications** - In notification panel

**UI Components Needed:**
- `RequestCard` - Display request (already exists, enhance)
- `RequestForm` - Form to create request
- `RequestQueue` - List of pending requests
- `RequestHistory` - User's request history
- `RequestDetail` - Detailed request view

### 2. Comments UI

**Where to Show:**
- **Entity detail pages** - Comments section below entity info
- **Comment thread** - Expandable comment threads
- **Comment form** - Inline comment form
- **Comment notifications** - In notification panel

**UI Components Needed:**
- `CommentCard` - Display single comment
- `CommentThread` - Threaded comment display
- `CommentForm` - Form to create/edit comment
- `CommentActions` - Edit, delete, reply, report buttons
- `CommentMentions` - @mention autocomplete

### 3. Discussion Threads UI

**Where to Show:**
- **Discussions page** - `/trees/{id}/discussions`
- **Thread list** - List of all threads
- **Thread detail** - Individual thread view
- **Thread creation** - Form to create new thread

**UI Components Needed:**
- `ThreadCard` - Display thread summary
- `ThreadList` - List of threads with filters
- `ThreadDetail` - Full thread view with posts
- `PostCard` - Display individual post
- `PostForm` - Form to create/edit post
- `ThreadFilters` - Filter by category, tag, author

### 4. Suggestions UI

**Where to Show:**
- **Inline on entity pages** - "Suggest edit" button on fields
- **Suggestion queue** - Owner/maintainer review page
- **Suggestion history** - User's suggestion history
- **Suggestion notifications** - In notification panel

**UI Components Needed:**
- `SuggestionCard` - Display suggestion
- `SuggestionForm` - Form to create suggestion
- `SuggestionQueue` - List of pending suggestions
- `SuggestionCompare` - Side-by-side current vs. suggested
- `SuggestionActions` - Approve, reject, request info buttons

### 5. Notes UI

**Where to Show:**
- **Notes page** - `/notes` (user's notes)
- **Entity notes** - Notes section on entity pages
- **Notebooks** - Organize notes into notebooks
- **Note editor** - Rich text editor for notes

**UI Components Needed:**
- `NoteCard` - Display note summary
- `NoteList` - List of notes
- `NoteEditor` - Rich text note editor
- `NotebookCard` - Display notebook
- `NotebookList` - List of notebooks

### 6. Messaging UI

**Where to Show:**
- **Messages page** - `/messages` (inbox)
- **Conversation view** - Individual conversation
- **Compose message** - Form to send message
- **Message notifications** - In notification panel

**UI Components Needed:**
- `MessageList` - List of conversations
- `ConversationView` - Message thread view
- `MessageComposer` - Form to compose message
- `MessageCard` - Display individual message
- `GroupSelector` - Select group for group messages

---

## Implementation Priority

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Basic collaboration infrastructure

1. **Comments System**
   - Comments table
   - Basic commenting on individuals, families, events
   - Comment display and form
   - Comment notifications

2. **Enhanced Access Requests**
   - Request history page
   - Request notifications
   - Request templates

### Phase 2: Collaboration Tools (Weeks 3-4)
**Goal:** Core collaboration features

1. **Suggestions System**
   - Suggestions table
   - Inline suggestion form
   - Suggestion queue
   - Suggestion notifications

2. **Direct Messaging**
   - Messages table
   - Basic DM system
   - Message notifications

### Phase 3: Advanced Features (Weeks 5-6)
**Goal:** Rich collaboration features

1. **Discussion Threads**
   - Threads and posts tables
   - Discussion pages
   - Thread management

2. **Notes System**
   - Notes and notebooks tables
   - Note editor
   - Note organization

### Phase 4: Polish & Enhancement (Weeks 7-8)
**Goal:** Complete collaboration experience

1. **Activity Feed**
   - Activity tracking
   - Activity feed page
   - Activity notifications

2. **Advanced Features**
   - Mentions system
   - Change tracking
   - To-do lists
   - Follow/watch features

---

## Summary

### Collaborative Features Needed

1. **Access Requests** ✅ (enhance existing)
   - Request history
   - Better notifications
   - Request templates

2. **Comments** ⏳ (new)
   - On individuals, families, events, sources, media, places
   - Threaded replies
   - Mentions, moderation

3. **Discussion Threads** ⏳ (new)
   - Tree-level and topic-based
   - Separate from comments
   - Rich discussion features

4. **Suggestions** ⏳ (new)
   - Propose data changes
   - Review and approve workflow
   - Evidence attachments

5. **Notes** ⏳ (new)
   - Research notes
   - Private and shared
   - Notebook organization

6. **Messaging** ⏳ (new)
   - Direct messages
   - Group messages
   - System messages

7. **Additional Features** ⏳ (new)
   - Activity feed
   - Mentions & notifications
   - Change tracking
   - To-do lists
   - Follow/watch
   - Moderation tools

### Database Tables Needed

- `Comment` - Comments on entities
- `DiscussionThread` - Discussion threads
- `DiscussionPost` - Posts in threads
- `Suggestion` - Data change suggestions
- `Note` - Research notes
- `Notebook` - Note organization
- `Message` - Direct messages
- `MessageGroup` - Group messages
- `Activity` - Activity feed
- `Notification` - User notifications

### UI Components Needed

- Comment components (CommentCard, CommentThread, CommentForm)
- Discussion components (ThreadCard, ThreadList, PostCard)
- Suggestion components (SuggestionCard, SuggestionQueue, SuggestionCompare)
- Note components (NoteCard, NoteEditor, NotebookCard)
- Message components (MessageList, ConversationView, MessageComposer)
- Activity components (ActivityFeed, ActivityCard)
- Notification components (NotificationPanel - enhance existing)

---

## Additional Considerations

### 7.1 Privacy & Permissions

**Comment Visibility:**
- Comments on public entities → visible to all
- Comments on private entities → visible only to users with access
- Private comments → visible only to author and mentioned users

**Discussion Privacy:**
- Tree-level discussions → visible to all tree collaborators
- Private discussions → invite-only
- Public discussions → visible to all users

**Suggestion Privacy:**
- Suggestions → visible to suggester and tree owners/maintainers
- Approved suggestions → visible to all tree viewers
- Rejected suggestions → visible only to suggester and reviewers

**Message Privacy:**
- Direct messages → private between sender and recipient
- Group messages → visible to all group members
- System messages → visible only to recipient

### 7.2 Moderation & Safety

**Content Moderation:**
- **Report system** - Report inappropriate content
- **Auto-moderation** - Flag potentially problematic content
- **Moderator tools** - Tools for owners/maintainers to moderate
- **Appeal process** - Users can appeal moderation decisions

**User Safety:**
- **Block users** - Block users from messaging/mentioning you
- **Privacy settings** - Control who can message/mention you
- **Content warnings** - Mark sensitive content
- **Safe mode** - Hide potentially sensitive content

### 7.3 Collaboration Analytics

**For Tree Owners:**
- **Contributor stats** - Who contributed what
- **Activity timeline** - Timeline of all changes
- **Collaboration health** - Metrics on collaboration quality
- **Engagement metrics** - Comments, suggestions, discussions per tree

**For Users:**
- **Personal stats** - Your contributions across all trees
- **Collaboration history** - History of your collaborations
- **Recognition** - Badges/recognition for contributions

### 7.4 Research Collaboration

**Research Teams:**
- **Team creation** - Create research teams
- **Team trees** - Trees associated with teams
- **Team discussions** - Team-specific discussions
- **Team notes** - Shared research notes

**Research Tools:**
- **Research logs** - Log research activities
- **Source tracking** - Track sources being researched
- **Task assignment** - Assign research tasks to team members
- **Progress tracking** - Track research progress

### 7.5 Integration Features

**External Integration:**
- **Email notifications** - Email digests of activity
- **Export discussions** - Export discussions to PDF/text
- **Share externally** - Share discussions/comments via link
- **API access** - API endpoints for external tools

**Internal Integration:**
- **Link entities** - Link comments/discussions to entities
- **Cross-tree references** - Reference entities in other trees
- **Unified search** - Search across comments, discussions, notes
- **Activity aggregation** - Aggregate activity across trees

---

## Recommendations

### High Priority (Implement First)

1. **Comments System** - Essential for collaboration
2. **Suggestions System** - Critical for data quality
3. **Enhanced Access Requests** - Improve existing system
4. **Direct Messaging** - Basic user-to-user communication

### Medium Priority (Implement Second)

1. **Discussion Threads** - Rich collaboration
2. **Activity Feed** - Keep users engaged
3. **Notes System** - Research organization
4. **Mentions & Notifications** - Better communication

### Low Priority (Implement Later)

1. **To-Do Lists** - Task management
2. **Change Tracking** - Version history
3. **Research Teams** - Advanced collaboration
4. **Analytics** - Collaboration metrics

### Design Principles

1. **Privacy First** - Respect user privacy and data sensitivity
2. **Permission-Aware** - All features respect tree permissions
3. **Mobile-Friendly** - All features work on mobile
4. **Accessible** - WCAG compliant
5. **Performant** - Handle large trees and many users
6. **Scalable** - Support growing user base

---

## Next Steps

1. ✅ Review and approve this analysis
2. ⏳ Design database schema for new tables
3. ⏳ Create API endpoints for new features
4. ⏳ Build UI components
5. ⏳ Implement notifications system
6. ⏳ Test collaboration workflows
7. ⏳ Implement moderation tools
8. ⏳ Add privacy controls

