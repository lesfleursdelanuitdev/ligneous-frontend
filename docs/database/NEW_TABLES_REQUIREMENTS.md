# New Database Tables - Complete Requirements

**Date:** February 15, 2026  
**Status:** Planning  
**Purpose:** Comprehensive list of all new tables needed for collaborative features

---

## Table of Contents

1. [Summary](#summary)
2. [Collaboration Tables](#collaboration-tables)
3. [User Profile & Following Tables](#user-profile--following-tables)
4. [Content & Feed Tables](#content--feed-tables)
5. [Notification Tables](#notification-tables)
6. [Table Relationships](#table-relationships)
7. [Migration Strategy](#migration-strategy)

---

## Summary

### Total New Tables: **20 Tables**

**By Category:**
- **Collaboration:** 6 tables (Comments, Discussions, Suggestions, Notes, Notebooks, Messages)
- **User Profiles & Following:** 2 tables (UserProfile, Follow)
- **Content & Feed:** 5 tables (UserContent, ContentLike, ContentComment, ContentShare, UserFeed)
- **Notifications:** 1 table (Notification)
- **Activity:** 1 table (Activity)
- **Supporting:** 5 tables (MessageGroup, DiscussionPost, ContentMedia, etc.)

---

## Collaboration Tables

### 1. Comments Table
**Purpose:** Comments on entities (individuals, families, events, sources, media, places, trees, notes)

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
  
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tree    Tree     @relation(fields: [treeId], references: [id], onDelete: Cascade)
  parent  Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies Comment[] @relation("CommentReplies")
  mentions User[]  @relation("CommentMentions")
  
  @@index([entityType, entityId])
  @@index([treeId])
  @@index([userId])
  @@index([parentId])
  @@map("comments")
}
```

**Relations:**
- `user` → User (author)
- `tree` → Tree (context)
- `parent` → Comment (for replies)
- `replies` → Comment[] (child comments)
- `mentions` → User[] (mentioned users)

---

### 2. Discussion Threads Table
**Purpose:** Tree-level or topic-based discussion threads

```prisma
model DiscussionThread {
  id          String   @id @default(uuid())
  treeId      String?  // Optional - can be tree-level or global
  title       String
  description String?  @db.Text
  category    String?  // Research, Collaboration, Question, etc.
  tags        String[] // Array of tags (surnames, locations, etc.)
  isLocked    Boolean  @default(false)
  isPinned    Boolean  @default(false)
  isClosed    Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tree    Tree?   @relation(fields: [treeId], references: [id], onDelete: Cascade)
  creator User    @relation(fields: [createdBy], references: [id], onDelete: Cascade)
  posts   DiscussionPost[]
  watchers User[] @relation("ThreadWatchers")
  follows Follow[]
  
  @@index([treeId])
  @@index([createdBy])
  @@index([category])
  @@index([tags]) // GIN index for array search
  @@map("discussion_threads")
}
```

**Relations:**
- `tree` → Tree? (optional tree context)
- `creator` → User (thread creator)
- `posts` → DiscussionPost[] (posts in thread)
- `watchers` → User[] (users watching thread)
- `follows` → Follow[] (follow relationships)

---

### 3. Discussion Posts Table
**Purpose:** Posts within discussion threads

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
  
  thread   DiscussionThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  user     User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  mentions User[]           @relation("PostMentions")
  attachments Media[]       @relation("PostAttachments")
  
  @@index([threadId])
  @@index([userId])
  @@index([createdAt])
  @@map("discussion_posts")
}
```

**Relations:**
- `thread` → DiscussionThread
- `user` → User (post author)
- `mentions` → User[] (mentioned users)
- `attachments` → Media[] (attached media)

---

### 4. Suggestions Table
**Purpose:** Propose changes to entity data

```prisma
model Suggestion {
  id          String   @id @default(uuid())
  entityType  String   // individual, family, event, place, source, media
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
  
  suggester User    @relation("SuggestionAuthor", fields: [suggestedBy], references: [id], onDelete: Cascade)
  reviewer  User?   @relation("SuggestionReviewer", fields: [reviewedBy], references: [id], onDelete: SetNull)
  tree      Tree    @relation(fields: [treeId], references: [id], onDelete: Cascade)
  attachments Media[] @relation("SuggestionAttachments")
  
  @@index([entityType, entityId])
  @@index([treeId])
  @@index([status])
  @@index([suggestedBy])
  @@index([reviewedBy])
  @@map("suggestions")
}

enum SuggestionStatus {
  pending
  approved
  rejected
  needs_info
}
```

**Relations:**
- `suggester` → User (who suggested)
- `reviewer` → User? (who reviewed)
- `tree` → Tree
- `attachments` → Media[] (evidence)

---

### 5. Research Notes Table
**Purpose:** Research notes (private or shared)

```prisma
model ResearchNote {
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
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tree      Tree?    @relation(fields: [treeId], references: [id], onDelete: Cascade)
  notebook  Notebook? @relation(fields: [notebookId], references: [id], onDelete: SetNull)
  attachments Media[] @relation("ResearchNoteAttachments")
  
  @@index([entityType, entityId])
  @@index([treeId])
  @@index([userId])
  @@index([notebookId])
  @@index([tags]) // GIN index for array search
  @@map("research_notes")
}
```

**Relations:**
- `user` → User (note author)
- `tree` → Tree? (optional tree context)
- `notebook` → Notebook? (optional notebook)
- `attachments` → Media[] (attached media)

---

### 6. Notebooks Table
**Purpose:** Organize notes into notebooks

```prisma
model Notebook {
  id          String   @id @default(uuid())
  userId      String
  name        String
  description String?  @db.Text
  isPrivate   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  notes ResearchNote[]
  
  @@index([userId])
  @@map("notebooks")
}
```

**Relations:**
- `user` → User (notebook owner)
- `notes` → Note[] (notes in notebook)

---

### 7. Messages Table
**Purpose:** Direct messages between users

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
  
  sender    User     @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
  recipient User?    @relation("ReceivedMessages", fields: [recipientId], references: [id], onDelete: Cascade)
  group     MessageGroup? @relation(fields: [groupId], references: [id], onDelete: Cascade)
  attachments Media[] @relation("MessageAttachments")
  
  @@index([senderId])
  @@index([recipientId])
  @@index([groupId])
  @@index([isRead])
  @@index([createdAt])
  @@map("messages")
}
```

**Relations:**
- `sender` → User (message sender)
- `recipient` → User? (DM recipient)
- `group` → MessageGroup? (group message)
- `attachments` → Media[] (attached files)

---

### 8. Message Groups Table
**Purpose:** Group messages (tree collaborators, research teams)

```prisma
model MessageGroup {
  id          String   @id @default(uuid())
  name        String
  description String?  @db.Text
  treeId      String?  // Optional - can be tree-specific
  createdBy   String
  createdAt   DateTime @default(now())
  
  tree    Tree?     @relation(fields: [treeId], references: [id], onDelete: Cascade)
  creator User      @relation(fields: [createdBy], references: [id], onDelete: Cascade)
  members User[]    @relation("GroupMembers")
  messages Message[]
  
  @@index([treeId])
  @@index([createdBy])
  @@map("message_groups")
}
```

**Relations:**
- `tree` → Tree? (optional tree context)
- `creator` → User (group creator)
- `members` → User[] (group members)
- `messages` → Message[] (messages in group)

---

## User Profile & Following Tables

### 9. User Profiles Table
**Purpose:** Extended user profile information

```prisma
model UserProfile {
  id              String   @id @default(uuid())
  userId          String   @unique @db.Uuid
  displayName     String?  @db.VarChar(255)
  bio             String?  @db.Text
  location        String?  @db.VarChar(255) // City, State, Country
  profilePhotoUrl String?  @map("profile_photo_url") @db.VarChar(500)
  coverPhotoUrl   String?  @map("cover_photo_url") @db.VarChar(500)
  
  // Research interests
  researchSurnames String[] @map("research_surnames")
  researchLocations String[] @map("research_locations")
  researchTimePeriods String[] @map("research_time_periods")
  researchGoals    String?  @map("research_goals") @db.Text
  
  // Genealogy credentials
  yearsResearching Int?     @map("years_researching")
  specializations  String[]
  certifications   String[]
  languages        String[]
  
  // Privacy settings
  profileVisibility ProfileVisibility @default(collaborators_only) @map("profile_visibility")
  activityVisibility ActivityVisibility @default(collaborators_only) @map("activity_visibility")
  allowDirectMessages Boolean @default(true) @map("allow_direct_messages")
  allowFollowing Boolean @default(true) @map("allow_following")
  
  // Stats (computed/cached)
  treesOwnedCount Int @default(0) @map("trees_owned_count")
  treesMaintainedCount Int @default(0) @map("trees_maintained_count")
  contributionsCount Int @default(0) @map("contributions_count")
  followersCount Int @default(0) @map("followers_count")
  followingCount Int @default(0) @map("following_count")
  
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_profiles")
}

enum ProfileVisibility {
  public
  collaborators_only
  private
}

enum ActivityVisibility {
  public
  followers_only
  collaborators_only
  private
}
```

**Relations:**
- `user` → User (one-to-one)

---

### 10. Follows Table
**Purpose:** Following relationships (users, trees, entities, discussions)

```prisma
model Follow {
  id          String   @id @default(uuid())
  followerId  String   @map("follower_id") @db.Uuid
  followeeId  String?  @map("followee_id") @db.Uuid // For following users
  treeId      String?  @map("tree_id") @db.Uuid // For following trees
  entityType  String?  @map("entity_type") // For following entities
  entityId    String?  @map("entity_id") @db.VarChar(255)
  discussionThreadId String? @map("discussion_thread_id") @db.Uuid // For following discussions
  
  isMuted     Boolean  @default(false) @map("is_muted")
  isPrivate   Boolean  @default(false) @map("is_private") // Private follow
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  
  follower User @relation("Following", fields: [followerId], references: [id], onDelete: Cascade)
  followee User? @relation("Followers", fields: [followeeId], references: [id], onDelete: Cascade)
  tree     Tree? @relation(fields: [treeId], references: [id], onDelete: Cascade)
  thread   DiscussionThread? @relation(fields: [discussionThreadId], references: [id], onDelete: Cascade)
  
  // Ensure one follow per user/tree/entity combination
  @@unique([followerId, followeeId])
  @@unique([followerId, treeId])
  @@unique([followerId, entityType, entityId])
  @@unique([followerId, discussionThreadId])
  @@index([followerId])
  @@index([followeeId])
  @@index([treeId])
  @@map("follows")
}
```

**Relations:**
- `follower` → User (who is following)
- `followee` → User? (user being followed)
- `tree` → Tree? (tree being followed)
- `thread` → DiscussionThread? (discussion being followed)

---

## Content & Feed Tables

### 11. User Content Table
**Purpose:** User-generated content (updates, stories, discoveries, recipes, logs)

```prisma
model UserContent {
  id          String   @id @default(uuid())
  userId      String   @map("user_id") @db.Uuid
  contentType ContentType @map("content_type")
  title       String?  @db.VarChar(255)
  content     String   @db.Text // Rich text/markdown
  isPublic    Boolean  @default(false) @map("is_public")
  visibility  ContentVisibility @default(followers_only) @map("visibility")
  
  // Links to related entities
  treeId      String?  @map("tree_id") @db.Uuid
  entityType  String?  @map("entity_type")
  entityId    String?  @map("entity_id") @db.VarChar(255)
  
  // Tags for organization
  surnames    String[] // Surnames mentioned
  locations   String[] // Locations mentioned
  timePeriods String[] @map("time_periods") // Time periods
  
  // Engagement (cached)
  likesCount  Int @default(0) @map("likes_count")
  commentsCount Int @default(0) @map("comments_count")
  sharesCount Int @default(0) @map("shares_count")
  
  // Recipe-specific (if contentType is recipe)
  recipeIngredients String? @map("recipe_ingredients") @db.Text
  recipeInstructions String? @map("recipe_instructions") @db.Text
  
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz(6)
  
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tree    Tree?    @relation(fields: [treeId], references: [id], onDelete: Cascade)
  media   Media[]   @relation("ContentMedia")
  likes   ContentLike[]
  comments ContentComment[]
  shares  ContentShare[]
  
  @@index([userId])
  @@index([contentType])
  @@index([treeId])
  @@index([isPublic])
  @@index([createdAt])
  @@index([surnames]) // GIN index for array search
  @@index([locations]) // GIN index for array search
  @@index([timePeriods]) // GIN index for array search
  @@map("user_content")
}

enum ContentType {
  research_update
  family_story
  research_discovery
  collaboration_request
  recipe
  research_log
}

enum ContentVisibility {
  public
  followers_only
  collaborators_only
  private
}
```

**Relations:**
- `user` → User (content author)
- `tree` → Tree? (optional tree context)
- `media` → Media[] (attached media)
- `likes` → ContentLike[] (likes)
- `comments` → ContentComment[] (comments)
- `shares` → ContentShare[] (shares)

---

### 12. Content Likes Table
**Purpose:** Likes/reactions on user content

```prisma
model ContentLike {
  id        String   @id @default(uuid())
  contentId String   @map("content_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  
  content UserContent @relation(fields: [contentId], references: [id], onDelete: Cascade)
  user    User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([contentId, userId])
  @@index([contentId])
  @@index([userId])
  @@map("content_likes")
}
```

**Relations:**
- `content` → UserContent
- `user` → User

---

### 13. Content Comments Table
**Purpose:** Comments on user content

```prisma
model ContentComment {
  id        String   @id @default(uuid())
  contentId String   @map("content_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  parentId  String?  @map("parent_id") @db.Uuid // For threaded replies
  content   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz(6)
  
  content UserContent @relation(fields: [contentId], references: [id], onDelete: Cascade)
  user    User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent  ContentComment? @relation("ContentCommentReplies", fields: [parentId], references: [id])
  replies ContentComment[] @relation("ContentCommentReplies")
  
  @@index([contentId])
  @@index([userId])
  @@index([parentId])
  @@map("content_comments")
}
```

**Relations:**
- `content` → UserContent
- `user` → User (comment author)
- `parent` → ContentComment? (for replies)
- `replies` → ContentComment[] (child comments)

---

### 14. Content Shares Table
**Purpose:** Shares of user content

```prisma
model ContentShare {
  id        String   @id @default(uuid())
  contentId String   @map("content_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  sharedWith String? @map("shared_with") @db.Uuid // User or group
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  
  content UserContent @relation(fields: [contentId], references: [id], onDelete: Cascade)
  user    User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([contentId])
  @@index([userId])
  @@map("content_shares")
}
```

**Relations:**
- `content` → UserContent
- `user` → User (who shared)

---

### 15. User Feeds Table
**Purpose:** Personalized feed generation for users

```prisma
model UserFeed {
  id        String   @id @default(uuid())
  userId    String   @map("user_id") @db.Uuid
  contentId String   @map("content_id") @db.Uuid
  sourceType String  @map("source_type") // user, tree, entity
  sourceId  String   @map("source_id") @db.VarChar(255)
  isRead    Boolean  @default(false) @map("is_read")
  readAt    DateTime? @map("read_at") @db.Timestamptz(6)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  
  user    User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  content UserContent @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  @@index([userId, isRead, createdAt])
  @@index([contentId])
  @@index([sourceType, sourceId])
  @@map("user_feeds")
}
```

**Relations:**
- `user` → User (feed owner)
- `content` → UserContent (content in feed)

---

## Notification Tables

### 16. Notifications Table
**Purpose:** User notifications

```prisma
model Notification {
  id          String   @id @default(uuid())
  userId      String   @map("user_id") @db.Uuid
  type        NotificationType
  title       String
  message     String   @db.Text
  link        String?  // URL to related content
  isRead      Boolean  @default(false) @map("is_read")
  readAt      DateTime? @map("read_at") @db.Timestamptz(6)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
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
  follow
  content_like
  content_comment
  content_share
}
```

**Relations:**
- `user` → User (notification recipient)

---

## Activity Tables

### 17. Activities Table
**Purpose:** Activity feed tracking

```prisma
model Activity {
  id          String   @id @default(uuid())
  activityType String  // edit, comment, suggestion, media_upload, content_created, etc.
  entityType   String? // individual, family, etc.
  entityId     String?
  treeId       String
  userId       String
  description String   @db.Text
  metadata     Json?    // Additional data (before/after values, etc.)
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  tree Tree @relation(fields: [treeId], references: [id], onDelete: Cascade)
  
  @@index([treeId])
  @@index([userId])
  @@index([activityType])
  @@index([createdAt])
  @@map("activities")
}
```

**Relations:**
- `user` → User (who performed activity)
- `tree` → Tree (tree context)

---

## Supporting Junction Tables

### 18. Comment Mentions Table
**Purpose:** Track user mentions in comments

```prisma
model CommentMention {
  id        String   @id @default(uuid())
  commentId String   @map("comment_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  
  comment Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user    User    @relation("CommentMentions", fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([commentId, userId])
  @@index([commentId])
  @@index([userId])
  @@map("comment_mentions")
}
```

---

### 19. Post Mentions Table
**Purpose:** Track user mentions in discussion posts

```prisma
model PostMention {
  id        String   @id @default(uuid())
  postId    String   @map("post_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  
  post DiscussionPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User           @relation("PostMentions", fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([postId, userId])
  @@index([postId])
  @@index([userId])
  @@map("post_mentions")
}
```

---

### 20. Thread Watchers Table
**Purpose:** Track users watching discussion threads

```prisma
model ThreadWatcher {
  id        String   @id @default(uuid())
  threadId  String   @map("thread_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  
  thread DiscussionThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  user   User             @relation("ThreadWatchers", fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([threadId, userId])
  @@index([threadId])
  @@index([userId])
  @@map("thread_watchers")
}
```

---

## Table Relationships Summary

### User Relationships
- `User` → `UserProfile` (1:1)
- `User` → `Comment[]` (1:many)
- `User` → `DiscussionThread[]` (1:many, as creator)
- `User` → `DiscussionPost[]` (1:many)
- `User` → `Suggestion[]` (1:many, as suggester/reviewer)
- `User` → `ResearchNote[]` (1:many)
- `User` → `Notebook[]` (1:many)
- `User` → `Message[]` (1:many, as sender/recipient)
- `User` → `UserContent[]` (1:many)
- `User` → `Follow[]` (1:many, as follower/followee)
- `User` → `Notification[]` (1:many)
- `User` → `Activity[]` (1:many)

### Tree Relationships
- `Tree` → `Comment[]` (1:many)
- `Tree` → `DiscussionThread[]` (1:many)
- `Tree` → `Suggestion[]` (1:many)
- `Tree` → `ResearchNote[]` (1:many)
- `Tree` → `MessageGroup[]` (1:many)
- `Tree` → `UserContent[]` (1:many)
- `Tree` → `Follow[]` (1:many)
- `Tree` → `Activity[]` (1:many)

### Content Relationships
- `UserContent` → `ContentLike[]` (1:many)
- `UserContent` → `ContentComment[]` (1:many)
- `UserContent` → `ContentShare[]` (1:many)
- `UserContent` → `Media[]` (many:many, via junction)
- `UserContent` → `UserFeed[]` (1:many)

### Discussion Relationships
- `DiscussionThread` → `DiscussionPost[]` (1:many)
- `DiscussionThread` → `Follow[]` (1:many)
- `DiscussionThread` → `ThreadWatcher[]` (1:many)

---

## Migration Strategy

### Phase 1: Core Collaboration (Tables 1-7)
1. `Comment`
2. `DiscussionThread`
3. `DiscussionPost`
4. `Suggestion`
5. `Note`
6. `Notebook`
7. `Message`
8. `MessageGroup`

### Phase 2: User Profiles & Following (Tables 9-10)
9. `UserProfile`
10. `Follow`

### Phase 3: Content System (Tables 11-15)
11. `UserContent`
12. `ContentLike`
13. `ContentComment`
14. `ContentShare`
15. `UserFeed`

### Phase 4: Notifications & Activity (Tables 16-17)
16. `Notification`
17. `Activity`

### Phase 5: Supporting Tables (Tables 18-20)
18. `CommentMention`
19. `PostMention`
20. `ThreadWatcher`

---

## Index Strategy

### High-Priority Indexes
- All foreign keys
- All unique constraints
- Frequently queried fields (userId, treeId, entityType+entityId)
- Array fields (tags, surnames, locations) - GIN indexes
- Timestamp fields for sorting (createdAt, updatedAt)

### Performance Considerations
- **GIN indexes** for array columns (tags, surnames, locations, timePeriods)
- **Composite indexes** for common query patterns
- **Partial indexes** for filtered queries (e.g., unread notifications)
- **Covering indexes** for common SELECT patterns

---

## Summary

### Total Tables: **20 Tables**

**By Feature:**
- **Comments:** 1 table + 1 mention table = 2
- **Discussions:** 2 tables + 1 watcher table = 3
- **Suggestions:** 1 table
- **Research Notes:** 2 tables (ResearchNotes + Notebooks)
- **Messaging:** 2 tables (Messages + MessageGroups)
- **User Profiles:** 1 table
- **Following:** 1 table
- **User Content:** 1 table + 3 engagement tables = 4
- **Feeds:** 1 table
- **Notifications:** 1 table
- **Activity:** 1 table

**Key Relationships:**
- All tables link to `User` (except junction tables)
- Most tables link to `Tree` (for tree context)
- Many tables support polymorphic entities (entityType + entityId)
- Array fields use GIN indexes for efficient searching

**Migration Order:**
1. Core collaboration (comments, discussions, suggestions, notes, messages)
2. User profiles and following
3. Content system
4. Notifications and activity
5. Supporting junction tables

