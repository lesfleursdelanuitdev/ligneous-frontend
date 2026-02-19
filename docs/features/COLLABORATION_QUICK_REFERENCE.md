# Collaboration Features - Quick Reference

**Date:** February 15, 2026  
**Purpose:** Quick answers to collaboration feature questions

---

## 1. How Are We Representing Access Requests?

### Current State
- ✅ **Database:** `AccessRequest` table with status (pending, approved, rejected, cancelled)
- ✅ **UI:** `RequestCard` component showing requester, tree, type, status
- ✅ **Admin Page:** `/admin/requests` for managing requests
- ✅ **Dashboard:** `PendingRequests` component showing pending requests

### Proposed Enhancements
- **Request History Page** - `/my-requests` showing user's request history
- **Request Timeline** - Visual timeline of request status changes
- **Request Templates** - Pre-filled forms for common request types
- **Bulk Management** - Approve/reject multiple requests at once
- **Request Analytics** - Stats on request patterns

### UI Representation
- **Request Card** - Card showing request details (enhance existing)
- **Request Queue** - List of pending requests for review
- **Request History** - User's complete request history
- **Request Detail** - Detailed view with timeline and notes

---

## 2. What Should We Allow Comments On?

### High Priority (Implement First)
1. **Individuals** - Comment on person records
   - Questions about data
   - Additional information
   - Photo requests
   - Relationship clarifications

2. **Families** - Comment on family units
   - Missing children
   - Marriage date corrections
   - Family history

3. **Events** - Comment on life events
   - Date/place corrections
   - Personal memories
   - Additional details

4. **Sources** - Comment on source citations
   - Source quality
   - Additional pages
   - Reliability notes

5. **Media** - Comment on photos/documents
   - Identification corrections
   - Context information
   - Quality notes

6. **Places** - Comment on locations
   - Name changes
   - Coordinate corrections
   - Historical context

### Medium Priority
7. **Trees** - Comment on entire trees
   - General feedback
   - Research questions
   - Collaboration requests

8. **Notes** - Comment on existing notes
   - Corrections
   - Additional information

### Low Priority
9. **Dates** - Comment on date interpretations
10. **Sources** - Comment on source quality

### Comment Features
- **Threaded replies** - Reply to specific comments
- **Mentions** - @username to mention users
- **Edit/Delete** - Users can edit/delete own comments
- **Moderation** - Owners/maintainers can moderate
- **Status** - Open, resolved, closed, archived
- **Notifications** - Notify on new comments/replies/mentions

---

## 3. Discussion Threads vs Comments

### Comments
**Purpose:** Quick annotations, questions, clarifications on specific entities

**Characteristics:**
- Attached to specific entity (individual, event, etc.)
- Visible on entity detail page
- Flat or threaded replies
- Short-form (typically 1-3 paragraphs)
- Example: "This birth date is wrong" on an individual's page

**Use Cases:**
- Point out data errors
- Ask quick questions
- Provide additional context
- Request changes

### Discussion Threads
**Purpose:** Longer-form discussions, research questions, collaboration

**Characteristics:**
- Tree-level or topic-based (not tied to single entity)
- Separate discussion area (`/trees/{id}/discussions`)
- Multiple posts, can branch into subtopics
- Long-form (can be multiple paragraphs/posts)
- Example: "Researching the Smith family line - anyone have information?"

**Use Cases:**
- Research collaboration
- Methodology discussions
- General tree questions
- Topic-based discussions (surnames, places, time periods)

### When to Use Which?

**Use Comments When:**
- Commenting on specific data point
- Quick question about entity
- Pointing out error
- Providing context for entity

**Use Discussion Threads When:**
- General research question
- Collaboration request
- Methodology discussion
- Topic-based discussion
- Multi-entity discussion

---

## 4. Suggestions & Notes - On What?

### Suggestions (Propose Changes)

**What to Allow Suggestions On:**

**High Priority:**
1. **Individuals** - Suggest changes to:
   - Name (given, surname, suffix)
   - Birth/death dates
   - Birth/death places
   - Sex
   - Relationships (add/remove)

2. **Families** - Suggest changes to:
   - Marriage date/place
   - Divorce date
   - Children (add/remove children)
   - Parent relationships

3. **Events** - Suggest changes to:
   - Event date
   - Event place
   - Event description
   - Event type

4. **Places** - Suggest changes to:
   - Place name
   - Coordinates
   - Place hierarchy (city, state, country)

**Medium Priority:**
5. **Sources** - Suggest corrections to citations
6. **Media** - Suggest better titles, descriptions, associations

**Suggestion Workflow:**
1. User clicks "Suggest edit" on field
2. Form shows current value vs. suggested value
3. User provides evidence/explanation
4. Owner/maintainer reviews in suggestion queue
5. Approve → change applied, Reject → change rejected
6. Notifications sent to both parties

### Notes (Research Notes)

**What to Allow Notes On:**

**All Entity Types:**
- Individuals
- Families
- Events
- Sources
- Media
- Places
- Trees
- General (not entity-specific)

**Note Types:**
- **Research notes** - Private research observations
- **Shared notes** - Notes visible to collaborators
- **Public notes** - Notes visible to all tree viewers
- **Entity notes** - Notes attached to specific entities

**Note Features:**
- Rich text (markdown)
- Tags for organization
- Attachments (media, documents)
- Links to entities
- Privacy controls
- Notebooks for organization

**Use Cases:**
- "Need to verify this marriage date with county records"
- "This person might be related to [other person]"
- "Found conflicting information in [source]"
- "Research next steps: check [source]"

---

## 5. User-to-User Messaging

### Message Types

#### Direct Messages (DMs)
- **One-on-one** private messages
- **Purpose:** Private collaboration, personal questions
- **Features:** Real-time or async, read receipts, attachments

#### Group Messages
- **Multiple users** in conversation
- **Purpose:** Tree owner announcements, family group discussions
- **Features:** Group management, group settings

#### System Messages
- **Automated** messages from system
- **Purpose:** Access request notifications, suggestion approvals
- **Features:** Cannot reply, mark as read, archive

### Messaging Features
- **Send/Reply/Forward** - Basic messaging
- **Attachments** - Files, media, entity links
- **Mentions** - @username mentions
- **Formatting** - Rich text support
- **Search** - Search message history
- **Organization** - Inbox, sent, archived, starred
- **Notifications** - Real-time notifications

### Use Cases
- "Can you help me research this person?"
- "I have additional photos for this family"
- "Would you like to collaborate on this tree?"
- Tree owner: "I've made updates to the tree"

---

## 6. What Else Should We Have?

### Activity Feed
- **Timeline** of all activity in trees user has access to
- **Activities:** Edits, comments, suggestions, media uploads, etc.
- **Features:** Filter by tree/user/type, follow trees/users

### Mentions & Notifications
- **@username** mentions in comments/discussions/messages
- **@entity** links to entities (e.g., @I1234)
- **Notifications:** Comments, replies, mentions, suggestions, messages
- **Settings:** Control notification types and frequency

### Change Tracking & Version History
- **Edit log** - Who changed what, when
- **Version history** - See previous versions of entities
- **Revert** - Revert to previous version
- **Compare** - Compare versions side-by-side

### Research Notes & To-Do Lists
- **Research notes** - Private/shared research notes
- **Notebooks** - Organize notes
- **To-do lists** - Tasks for research
- **Task assignment** - Assign tasks to collaborators

### Follow & Watch Features
- **Follow trees** - Get updates on tree activity
- **Follow users** - Get updates on user activity
- **Follow entities** - Get updates on specific individuals/families
- **Watch discussions** - Get updates on discussion threads

### Moderation Tools
- **Content moderation** - Approve/delete comments, discussions
- **User management** - Remove collaborators, ban users
- **Content flags** - Report inappropriate content
- **Appeal process** - Handle appeals

### Collaboration Analytics
- **Contributor stats** - Who contributed what
- **Activity timeline** - Timeline of changes
- **Engagement metrics** - Comments, suggestions per tree
- **Recognition** - Badges for contributions

---

## Summary Table

| Feature | Purpose | Where Used | Priority |
|---------|---------|------------|----------|
| **Access Requests** | Request tree access | Tree pages, admin | ✅ Existing (enhance) |
| **Comments** | Quick annotations | Entity detail pages | ⏳ High |
| **Discussion Threads** | Long-form discussions | Separate discussions page | ⏳ Medium |
| **Suggestions** | Propose data changes | Inline on entity pages | ⏳ High |
| **Notes** | Research notes | Notes page, entity pages | ⏳ Medium |
| **Messaging** | User-to-user communication | Messages page | ⏳ High |
| **Activity Feed** | Activity timeline | Dashboard, tree pages | ⏳ Medium |
| **Mentions** | @username mentions | Comments, discussions, messages | ⏳ Medium |
| **Change Tracking** | Version history | Entity detail pages | ⏳ Low |
| **To-Do Lists** | Task management | Research tools | ⏳ Low |

---

## Key Decisions Needed

### 1. Comments vs Discussions
- **Decision:** Both - Comments for entity-specific, Discussions for general
- **Rationale:** Different use cases, different UI patterns

### 2. Suggestions vs Comments
- **Decision:** Separate - Suggestions propose changes, Comments are annotations
- **Rationale:** Different workflows, different permissions

### 3. Notes vs Comments
- **Decision:** Separate - Notes are research notes, Comments are annotations
- **Rationale:** Notes can be private, Comments are collaborative

### 4. Messaging Privacy
- **Decision:** Private DMs, optional group messages
- **Rationale:** Balance collaboration with privacy

### 5. Moderation Model
- **Decision:** Tree owners/maintainers moderate their trees, website owner moderates globally
- **Rationale:** Distributed moderation, scalable

---

## Implementation Order

### Phase 1: Essential Collaboration (Weeks 1-2)
1. Comments system (individuals, families, events)
2. Suggestions system (individuals, families, events)
3. Enhanced access requests
4. Basic messaging

### Phase 2: Rich Collaboration (Weeks 3-4)
1. Discussion threads
2. Notes system
3. Activity feed
4. Mentions & notifications

### Phase 3: Advanced Features (Weeks 5-6)
1. Change tracking
2. To-do lists
3. Research teams
4. Collaboration analytics

---

## Questions to Answer

1. **Comment Moderation:** Who can moderate? (Owners/maintainers only, or all collaborators?)
2. **Suggestion Approval:** Single approver or consensus? (Single approver for speed)
3. **Discussion Privacy:** Public or tree-only? (Tree-only for privacy)
4. **Message Limits:** Rate limiting on messages? (Yes, prevent spam)
5. **Notification Frequency:** Real-time or batched? (Real-time for important, batched for activity feed)

