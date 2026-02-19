# User Profiles & Following System - Analysis

**Date:** February 15, 2026  
**Status:** Planning  
**Purpose:** Design user profiles and following system for genealogical collaboration

---

## Table of Contents

1. [Current State](#current-state)
2. [User Profiles - What Should They Include?](#user-profiles---what-should-they-include)
3. [Following System - How Should It Work?](#following-system---how-should-it-work)
4. [Content Types - Updates, Stories, Recipes?](#content-types---updates-stories-recipes)
5. [Privacy & Permissions](#privacy--permissions)
6. [Data Model](#data-model)
7. [UI/UX Design](#uiux-design)
8. [Implementation Plan](#implementation-plan)

---

## Current State

### Existing User Data
- ✅ **Basic Info:** username, email, name, password
- ✅ **Account Status:** is_active, is_website_owner
- ✅ **Timestamps:** created_at, updated_at, last_login_at
- ❌ **No profile information** (bio, location, interests, etc.)
- ❌ **No following system**
- ❌ **No user-generated content** (updates, stories, etc.)

### What We Can Derive
- Trees owned/maintained
- Contributions (comments, suggestions, edits)
- Activity history
- Collaboration relationships (shared trees)

---

## User Profiles - What Should They Include?

### Core Profile Information

#### 1. Basic Information (Public)
- **Display Name** - How they want to be known
- **Bio/About** - Short biography, research interests
- **Location** - General location (city, state, country) - optional
- **Profile Photo** - Avatar/profile picture
- **Cover Photo** - Optional header image

#### 2. Genealogy-Specific Information

**Research Interests:**
- **Surnames** - Surnames they're researching
- **Locations** - Geographic areas of interest
- **Time Periods** - Historical periods they focus on
- **Research Goals** - What they're trying to find

**Research Activity:**
- **Trees Working On** - Public trees they own/maintain
- **Contributions** - Stats on contributions (edits, comments, suggestions)
- **Research Focus** - Primary research areas
- **Collaboration Style** - How they prefer to collaborate

**Genealogy Credentials (Optional):**
- **Years Researching** - Experience level
- **Specializations** - Areas of expertise
- **Certifications** - Professional certifications (if any)
- **Languages** - Languages they can research in

#### 3. Privacy Settings
- **Profile Visibility** - Public, collaborators only, private
- **Activity Visibility** - What activity is visible
- **Contact Preferences** - Who can message them
- **Following Settings** - Who can follow them

### What Should NOT Be Included (Genealogy-Focused)

**Not Like Facebook:**
- ❌ **Personal life updates** - "Had coffee today" (not genealogy-relevant)
- ❌ **General recipes** - Family recipes unrelated to genealogy
- ❌ **Political posts** - Not relevant to genealogy
- ❌ **General social posts** - Keep it genealogy-focused

**What Makes Sense:**
- ✅ **Research updates** - "Found new records for the Smith family"
- ✅ **Family stories** - Stories related to genealogy research
- ✅ **Research discoveries** - "Discovered connection to [family]"
- ✅ **Collaboration requests** - "Looking for information on [surname]"
- ✅ **Genealogy-related recipes** - Recipes with family history context

---

## Following System - How Should It Work?

### What Can Users Follow?

#### 1. Follow Users
**Purpose:** Get updates on users' research activity

**What Updates to Show:**
- New trees created
- Research discoveries
- Contributions to trees
- New research updates/stories
- Collaboration requests

**Use Cases:**
- Follow researchers working on related family lines
- Follow collaborators on shared trees
- Follow users who make valuable contributions
- Follow users with similar research interests

#### 2. Follow Trees
**Purpose:** Get updates on tree activity

**What Updates to Show:**
- New individuals/families added
- Data edits
- New media uploaded
- New comments/discussions
- New suggestions

**Use Cases:**
- Follow trees related to your research
- Follow trees you're collaborating on
- Follow public trees of interest

#### 3. Follow Entities
**Purpose:** Get updates on specific individuals/families

**What Updates to Show:**
- Changes to the entity
- New comments
- New suggestions
- New media
- New sources

**Use Cases:**
- Follow your own ancestors
- Follow individuals you're researching
- Follow families you're tracking

#### 4. Follow Discussions
**Purpose:** Get updates on discussion threads

**What Updates to Show:**
- New posts in thread
- Thread updates
- Thread resolved/closed

**Use Cases:**
- Follow research discussions
- Follow collaboration threads
- Follow topic discussions

### Following Features

#### 1. Follow Actions
- **Follow** - Start following
- **Unfollow** - Stop following
- **Follow Back** - Reciprocate follow
- **Mute** - Follow but don't show updates (for trees with high activity)

#### 2. Follow Types
- **Public Follow** - Visible to others (like Twitter)
- **Private Follow** - Only you know you're following (like Instagram)
- **Mutual Follow** - Both users follow each other

#### 3. Follow Notifications
- **New activity** - Notify when followed user/tree has activity
- **New follower** - Notify when someone follows you (optional)
- **Follow suggestions** - Suggest users/trees to follow

---

## Content Types - Updates, Stories, Recipes?

### Genealogy-Focused Content Types

#### 1. Research Updates
**What:** Short updates about research progress

**Examples:**
- "Found birth certificate for John Smith (I1234)"
- "Discovered connection between Smith and Johnson families"
- "Added 50 new individuals to the Smith tree"
- "Found immigration records for my great-grandfather"

**Features:**
- Link to related entities (individuals, families, trees)
- Attach media (documents, photos)
- Tag with surnames, locations
- Comments and reactions

#### 2. Family Stories
**What:** Stories related to genealogy research

**Examples:**
- "The story of how my great-grandmother immigrated"
- "Family legend about our ancestor's military service"
- "Oral history passed down about [ancestor]"
- "What I learned about [family] from [source]"

**Features:**
- Rich text with formatting
- Link to related individuals/families
- Attach photos/documents
- Tag with surnames, locations, time periods
- Comments and discussion

#### 3. Research Discoveries
**What:** Significant research findings

**Examples:**
- "Found the missing link in the family tree"
- "Discovered ancestor was a [occupation]"
- "Solved the mystery of [ancestor's] origins"
- "Found DNA match connecting to [family]"

**Features:**
- Link to related entities
- Evidence attachments
- Tag with research areas
- Share with collaborators

#### 4. Collaboration Requests
**What:** Requests for research help

**Examples:**
- "Looking for information on [surname] in [location]"
- "Need help finding records for [individual]"
- "Anyone researching [family] in [time period]?"
- "Looking for descendants of [ancestor]"

**Features:**
- Link to related entities
- Tag with surnames, locations
- Responses and discussions
- Mark as resolved

#### 5. Genealogy Recipes (Optional)
**What:** Recipes with family history context

**Examples:**
- "My great-grandmother's apple pie recipe - passed down from [ancestor]"
- "Traditional [ethnicity] recipe from [ancestor's] homeland"
- "Recipe from [ancestor] who was a [occupation]"

**Features:**
- Recipe with ingredients/instructions
- Family history context
- Link to related ancestors
- Photos of the dish
- Comments and variations

**Note:** Only if it has genealogy context - not general recipes

#### 6. Research Logs
**What:** Logs of research activities

**Examples:**
- "Checked [source] for [surname] - found [results]"
- "Visited [location] to research [family]"
- "Contacted [repository] about [records]"

**Features:**
- Link to sources
- Tag with research areas
- Private or shared
- Searchable

### Content Organization

#### 1. User Feed
- **Personal feed** - Your own updates
- **Following feed** - Updates from users/trees you follow
- **Discovery feed** - Suggested content based on interests
- **Tree feed** - Updates from specific trees

#### 2. Content Filters
- **By type** - Updates, stories, discoveries, requests
- **By surname** - Filter by surname tags
- **By location** - Filter by location tags
- **By time period** - Filter by time period
- **By tree** - Filter by tree

#### 3. Content Interactions
- **Like/React** - React to content
- **Comment** - Comment on content
- **Share** - Share content with others
- **Save** - Save for later
- **Report** - Report inappropriate content

---

## Privacy & Permissions

### Profile Privacy Levels

#### 1. Public Profile
- **Visible to:** Everyone (including non-logged-in users)
- **Shows:** Basic info, public trees, public activity
- **Use case:** Researchers wanting to be found

#### 2. Collaborators Only
- **Visible to:** Users who share trees with you
- **Shows:** Basic info, shared trees, shared activity
- **Use case:** Privacy-conscious researchers

#### 3. Private Profile
- **Visible to:** Only you
- **Shows:** Nothing to others (but you can still collaborate)
- **Use case:** Maximum privacy

### Content Privacy

#### 1. Public Content
- **Visible to:** Everyone
- **Use case:** Research updates, public stories

#### 2. Followers Only
- **Visible to:** Users who follow you
- **Use case:** More personal research updates

#### 3. Collaborators Only
- **Visible to:** Users who share trees with you
- **Use case:** Tree-specific updates

#### 4. Private Content
- **Visible to:** Only you
- **Use case:** Personal research notes

### Following Privacy

#### 1. Public Following
- **Visible to:** Everyone can see who you follow
- **Use case:** Open collaboration

#### 2. Private Following
- **Visible to:** Only you know who you follow
- **Use case:** Privacy-conscious following

#### 3. Mutual Following Required
- **Requirement:** Both users must follow each other
- **Use case:** More controlled collaboration

---

## Data Model

### User Profile Table
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
  researchSurnames String[] @map("research_surnames") // Array of surnames
  researchLocations String[] @map("research_locations") // Array of locations
  researchTimePeriods String[] @map("research_time_periods") // Array of periods
  researchGoals    String?  @map("research_goals") @db.Text
  
  // Genealogy credentials
  yearsResearching Int?     @map("years_researching")
  specializations  String[] // Array of specializations
  certifications   String[] // Array of certifications
  languages        String[] // Array of languages
  
  // Privacy settings
  profileVisibility ProfileVisibility @default(collaborators_only) @map("profile_visibility")
  activityVisibility ActivityVisibility @default(collaborators_only) @map("activity_visibility")
  allowDirectMessages Boolean @default(true) @map("allow_direct_messages")
  allowFollowing Boolean @default(true) @map("allow_following")
  
  // Stats (computed)
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

### Following Table
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

### User Content Table (Updates, Stories, etc.)
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
  
  // Engagement
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
  media   Media[]  @relation("ContentMedia")
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
  parent  ContentComment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies ContentComment[] @relation("CommentReplies")
  
  @@index([contentId])
  @@index([userId])
  @@index([parentId])
  @@map("content_comments")
}

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

### User Feed Table (For Personalized Feeds)
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
  @@map("user_feeds")
}
```

---

## UI/UX Design

### User Profile Page

#### Layout
```
┌─────────────────────────────────────────┐
│  [Cover Photo]                          │
│                                         │
│  [Profile Photo]  [Display Name]       │
│                  [Location]             │
│                  [Bio]                  │
│  [Follow] [Message] [Share]             │
├─────────────────────────────────────────┤
│  Tabs:                                  │
│  [Overview] [Content] [Trees] [Activity]│
├─────────────────────────────────────────┤
│  Content Area:                          │
│  - Research Interests                   │
│  - Trees Working On                     │
│  - Recent Activity                      │
│  - Content Feed                         │
└─────────────────────────────────────────┘
```

#### Profile Sections

**1. Overview Tab**
- Bio and research interests
- Research goals
- Genealogy credentials
- Stats (trees, contributions, followers)
- Public trees list

**2. Content Tab**
- User's research updates
- Family stories
- Research discoveries
- Collaboration requests
- Recipes (if any)

**3. Trees Tab**
- Trees owned
- Trees maintained
- Trees collaborated on
- Public trees only (or all if viewing own profile)

**4. Activity Tab**
- Recent activity timeline
- Contributions
- Comments made
- Suggestions submitted

### Following UI

#### Follow Button
- **Not Following:** "Follow" button
- **Following:** "Following" button (can unfollow)
- **Mutual:** "Mutual Follow" indicator
- **Muted:** "Muted" indicator

#### Following Lists
- **Following:** List of users/trees you follow
- **Followers:** List of users who follow you
- **Mutual:** List of mutual follows
- **Suggestions:** Suggested users/trees to follow

### Content Feed

#### Feed Types
- **Home Feed:** Updates from users/trees you follow
- **Discover Feed:** Suggested content based on interests
- **Tree Feed:** Updates from specific tree
- **Surname Feed:** Updates tagged with specific surname
- **Location Feed:** Updates tagged with specific location

#### Feed Item
- Author info (avatar, name, time)
- Content type indicator
- Content (text, media)
- Related entities (links)
- Tags (surnames, locations)
- Actions (like, comment, share, save)
- Engagement (likes, comments count)

---

## Implementation Plan

### Phase 1: Basic Profiles & Following (Weeks 1-2)

**1. User Profiles**
- Create `UserProfile` table
- Profile page (`/users/{id}`)
- Profile editing
- Basic profile display

**2. Following System**
- Create `Follow` table
- Follow/unfollow functionality
- Following/followers lists
- Basic follow notifications

### Phase 2: Content System (Weeks 3-4)

**1. User Content**
- Create `UserContent` table
- Content creation forms
- Content display
- Content privacy settings

**2. Content Types**
- Research updates
- Family stories
- Research discoveries
- Collaboration requests

### Phase 3: Feed & Discovery (Weeks 5-6)

**1. Feed System**
- Create `UserFeed` table
- Feed generation algorithm
- Feed display
- Feed filtering

**2. Discovery**
- Follow suggestions
- Content recommendations
- Search users/content

### Phase 4: Engagement & Polish (Weeks 7-8)

**1. Engagement**
- Likes/reactions
- Comments on content
- Shares
- Saves/bookmarks

**2. Advanced Features**
- Recipe content type (if desired)
- Research logs
- Content analytics
- Feed personalization

---

## Key Design Decisions

### 1. Profile Style: Genealogy-Focused, Not Social Network

**Decision:** Genealogy-focused profiles, not Facebook-style

**Rationale:**
- Keep platform focused on genealogy research
- Avoid general social media noise
- Maintain professional/research-oriented tone
- Recipes/stories only if genealogy-related

### 2. Following Model: Public or Private?

**Decision:** Both options - user chooses

**Rationale:**
- Some users want open collaboration (public)
- Some users want privacy (private)
- Flexibility for different use cases

### 3. Content Types: What to Include?

**Decision:** Genealogy-focused content types

**Include:**
- ✅ Research updates
- ✅ Family stories (genealogy context)
- ✅ Research discoveries
- ✅ Collaboration requests
- ✅ Recipes (with family history context)
- ✅ Research logs

**Exclude:**
- ❌ General personal updates
- ❌ General recipes
- ❌ Political/social posts
- ❌ Non-genealogy content

### 4. Feed Algorithm: Chronological or Algorithmic?

**Decision:** Start with chronological, add algorithmic later

**Rationale:**
- Chronological is simpler and transparent
- Can add relevance-based ranking later
- Users can filter/sort as needed

### 5. Profile Visibility: Default?

**Decision:** Default to "collaborators only"

**Rationale:**
- Privacy-first approach
- Users can opt-in to public profiles
- Protects privacy-conscious users

---

## Recommendations

### High Priority Features

1. **User Profiles** - Basic genealogy-focused profiles
2. **Following System** - Follow users, trees, entities
3. **Research Updates** - Share research progress
4. **Family Stories** - Share genealogy-related stories
5. **Feed System** - See updates from followed users/trees

### Medium Priority Features

1. **Research Discoveries** - Share significant findings
2. **Collaboration Requests** - Request research help
3. **Content Engagement** - Likes, comments, shares
4. **Follow Suggestions** - Discover relevant users/trees

### Low Priority Features

1. **Recipes** - Only if genealogy-related
2. **Research Logs** - Detailed research tracking
3. **Content Analytics** - Engagement metrics
4. **Advanced Feed** - Algorithmic ranking

### Content Moderation

- **Genealogy-focused** - Moderate non-genealogy content
- **Quality control** - Ensure content is research-related
- **Spam prevention** - Prevent abuse
- **Community guidelines** - Clear content policies

---

## Summary

### User Profiles
- **Genealogy-focused** - Research interests, credentials, activity
- **Privacy controls** - Public, collaborators only, private
- **Not Facebook-style** - No general social posts

### Following System
- **Follow users** - Get updates on research activity
- **Follow trees** - Get updates on tree activity
- **Follow entities** - Get updates on specific individuals/families
- **Follow discussions** - Get updates on discussion threads

### Content Types
- **Research updates** - Research progress
- **Family stories** - Genealogy-related stories
- **Research discoveries** - Significant findings
- **Collaboration requests** - Research help requests
- **Recipes** - Only with family history context
- **Research logs** - Research activity logs

### Key Principle
**Genealogy-First:** All features should support genealogy research and collaboration, not general social networking.

