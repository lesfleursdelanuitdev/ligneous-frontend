# Schema Update Summary - Invitation Links & Request Types

**Date:** 2026-01-26  
**Migration:** `20260126124017_add_invitation_links_and_request_types`  
**Status:** ✅ COMPLETE

---

## Changes Applied

### 1. New Enum: AccessRequestType

Added to distinguish between different types of access requests:

```prisma
enum AccessRequestType {
  basic_access        // Request read or write access to tree
  individual_link     // "This is me" - link to individual
  maintainer_role     // Request to become tree maintainer
  owner_role          // Request to become tree owner
}
```

**Purpose:** Allows users to request different levels of access through the same request system.

---

### 2. Updated AccessRequest Table

**Fields Added:**
- `request_type` - Type of request (enum: AccessRequestType)

**Fields Made Optional:**
- `resource_type` - Only needed for basic_access and individual_link
- `resource_id` - Only needed for basic_access and individual_link  
- `requested_permission_type` - Only needed for basic_access

**New Indexes:**
- `@@index([requestType, status])` - Efficient filtering by request type and status

**Migration Strategy:**
- Existing records default to `basic_access` type
- Maintains backward compatibility

---

### 3. New Table: InvitationLink

Stores invitation links for automatic access grants:

```prisma
model InvitationLink {
  id             String    @id @default(uuid())
  token          String    @unique @default(uuid())
  treeId         String
  createdBy      String
  roleType       String    // 'read', 'write', 'maintainer', 'owner'
  individualXref String?   // Optional: link to specific individual
  expiresAt      DateTime?
  maxUses        Int?      // null = unlimited
  usedCount      Int       @default(0)
  isRevoked      Boolean   @default(false)
  notes          String?
  createdAt      DateTime  @default(now())
  
  // Relations
  tree    Tree
  creator User
  uses    InvitationLinkUse[]
}
```

**Features:**
- Unique token for each link
- Optional expiration date
- Usage tracking (count and max)
- Can be revoked
- Tracks creator
- Optional individual linking

**Indexes:**
- `token` - Fast token lookup
- `treeId` - Find all links for a tree
- `createdBy` - Find links created by user
- `(isRevoked, expiresAt)` - Efficient validation checks

---

### 4. New Table: InvitationLinkUse

Tracks who used which invitation links:

```prisma
model InvitationLinkUse {
  id        String   @id @default(uuid())
  linkId    String
  userId    String
  usedAt    DateTime @default(now())
  ipAddress String?  // For security audit
  
  // Relations
  link InvitationLink
  user User
  
  // Constraints
  @@unique([linkId, userId]) // User can only use link once
}
```

**Features:**
- Tracks each use of a link
- Records timestamp and IP address
- Prevents duplicate usage by same user
- Audit trail for security

**Indexes:**
- `linkId` - Find all uses of a link
- `userId` - Find all links used by a user

---

### 5. Updated User Model Relations

**Added:**
```prisma
createdInvitationLinks InvitationLink[]    @relation("InvitationLinksCreated")
invitationLinkUses     InvitationLinkUse[] @relation("InvitationLinkUses")
```

**Purpose:** Track invitation links created by and used by each user.

---

### 6. Updated Tree Model Relations

**Added:**
```prisma
invitationLinks InvitationLink[]
```

**Purpose:** Access all invitation links for a tree.

---

## Database State

### Tables Count: 10 (was 8)

1. ✅ `users` - User accounts
2. ✅ `sessions` - JWT sessions  
3. ✅ `trees` - Tree metadata
4. ✅ `tree_owners` - Multiple owners per tree
5. ✅ `tree_maintainers` - Tree maintainers
6. ✅ `user_individual_links` - User-to-individual mappings
7. ✅ `permissions` - Flexible permissions
8. ✅ `access_requests` - **UPDATED** with request types
9. ✅ `private_data` - Field-level privacy
10. ✅ `invitation_links` - **NEW** invitation links
11. ✅ `invitation_link_uses` - **NEW** usage tracking

### Enums Count: 4 (was 3)

1. ✅ `PermissionType` - read, write, delete, admin
2. ✅ `ResourceType` - tree, individual, family, subtree
3. ✅ `AccessRequestStatus` - pending, approved, rejected, cancelled
4. ✅ `AccessRequestType` - **NEW** basic_access, individual_link, maintainer_role, owner_role

---

## ACCESS_CONTROL_MODEL.md Support

### ✅ Now Fully Supported (100%)

| Feature | Status | Implementation |
|---------|--------|----------------|
| User Registration | ✅ | User table with isActive |
| Website Owner | ✅ | User.isWebsiteOwner flag |
| Multiple Tree Owners | ✅ | TreeOwner table |
| Tree Maintainers | ✅ | TreeMaintainer table |
| Public/Private Trees | ✅ | Tree.isPublic flag |
| Individual Linking | ✅ | UserIndividualLink table |
| Flexible Permissions | ✅ | Permission table |
| **Basic Access Requests** | ✅ | AccessRequest with type=basic_access |
| **Individual Link Requests** | ✅ | AccessRequest with type=individual_link |
| **Maintainer Requests** | ✅ | AccessRequest with type=maintainer_role |
| **Owner Requests** | ✅ | AccessRequest with type=owner_role |
| **Invitation Links** | ✅ | InvitationLink + InvitationLinkUse tables |
| Request Approvals | ✅ | AccessRequest.respondedBy |
| Role Escalation | ✅ | All request types supported |

**Previous Support:** 85%  
**Current Support:** **100%** ✅

---

## API Endpoints Needed

### Access Requests (Enhanced)

**Submit Requests:**
```
POST /api/access-requests
Body: {
  treeId: "uuid",
  requestType: "basic_access" | "individual_link" | "maintainer_role" | "owner_role",
  resourceType?: "tree" | "individual" | "family" | "subtree",  // For basic_access/individual_link
  resourceId?: "string",  // For basic_access/individual_link
  requestedPermissionType?: "read" | "write",  // For basic_access only
  notes?: "string"
}
```

**List Requests:**
```
GET /api/access-requests?status=pending&requestType=maintainer_role
GET /api/access-requests/tree/{treeId}
GET /api/access-requests/user/{userId}
```

**Approve/Reject:**
```
POST /api/access-requests/{id}/approve
POST /api/access-requests/{id}/reject
Body: { responseNotes?: "string" }
```

---

### Invitation Links (New)

**Create Link:**
```
POST /api/invitation-links
Body: {
  treeId: "uuid",
  roleType: "read" | "write" | "maintainer" | "owner",
  individualXref?: "I1234",  // Optional individual linking
  expiresAt?: "2026-12-31T23:59:59Z",  // Optional expiration
  maxUses?: 10,  // Optional usage limit
  notes?: "For family reunion"
}
```

**List Links:**
```
GET /api/invitation-links  // Created by current user
GET /api/invitation-links/tree/{treeId}  // All links for tree (if owner/maintainer)
```

**Validate Link:**
```
GET /api/invitation-links/{token}
Returns: {
  valid: true/false,
  treeId: "uuid",
  roleType: "read",
  individualXref?: "I1234",
  treeName: "Smith Family Tree",
  creatorName: "John Smith"
}
```

**Consume Link:**
```
POST /api/invitation-links/{token}/consume
- If user not authenticated: Store token, redirect to register/login
- If user authenticated: Grant access immediately
```

**Revoke Link:**
```
DELETE /api/invitation-links/{id}
```

---

## UI Components Needed

### Access Request UI

1. **Request Buttons:**
   - "Request Access" (basic_access)
   - "This is me" (individual_link)
   - "Request Maintainer Role" (maintainer_role)
   - "Request Owner Role" (owner_role)

2. **Request Form:**
   - Type selector
   - Resource selector (for basic_access/individual_link)
   - Permission level (for basic_access)
   - Notes/reason field

3. **Request Management Dashboard:**
   - Filter by request type
   - Filter by status
   - Approve/reject buttons
   - Response notes field

---

### Invitation Link UI

1. **Link Generator:**
   - Tree selector
   - Role type selector
   - Individual selector (optional)
   - Expiration date picker
   - Max uses input
   - Generate button
   - Copy link button

2. **Link List:**
   - Show all created links
   - Usage count / max uses
   - Expiration status
   - Revoke button

3. **Link Landing Page:**
   - Show tree info
   - Show access being granted
   - Register/Login buttons
   - Auto-apply after auth

---

## Migration Safety

### Backward Compatibility

✅ **Safe Migration:**
- All changes are additive
- No data loss
- Existing access_requests default to `basic_access` type
- All new fields are optional or have defaults

### Data Integrity

✅ **Constraints Maintained:**
- Foreign keys preserved
- Unique constraints preserved
- Cascading deletes configured
- Indexes optimized

---

## Testing Checklist

### Database

- [x] Migration applied successfully
- [x] All tables created
- [x] All indexes created
- [x] Foreign keys working
- [x] Enums created

### Access Requests

- [ ] Create basic_access request
- [ ] Create individual_link request
- [ ] Create maintainer_role request
- [ ] Create owner_role request
- [ ] Approve requests
- [ ] Reject requests

### Invitation Links

- [ ] Create invitation link
- [ ] Validate token
- [ ] Consume link (new user)
- [ ] Consume link (existing user)
- [ ] Track usage
- [ ] Enforce max uses
- [ ] Check expiration
- [ ] Revoke link

---

## Next Steps

### Phase 1: Access Request Enhancement (Week 1)

1. ✅ Update schema
2. ⏭️ Update API routes to support all request types
3. ⏭️ Create request type selector UI
4. ⏭️ Test all request flows

### Phase 2: Invitation Links (Week 2)

1. ⏭️ Create invitation link API routes
2. ⏭️ Create link generator UI
3. ⏭️ Create link landing page
4. ⏭️ Implement link consumption logic
5. ⏭️ Test with registration flow

### Phase 3: Integration & Polish (Week 3)

1. ⏭️ Integrate with existing auth system
2. ⏭️ Add email notifications (optional)
3. ⏭️ Add usage analytics
4. ⏭️ Security audit
5. ⏭️ Performance testing

---

## Documentation Updated

- ✅ `ACCESS_CONTROL_MODEL.md` - Complete access control spec
- ✅ `SCHEMA_GAP_ANALYSIS.md` - Gap analysis (now resolved)
- ✅ `SCHEMA_UPDATE_SUMMARY.md` - This document
- ✅ Prisma schema comments updated
- ⏭️ API documentation (to be created)
- ⏭️ UI component documentation (to be created)

---

## Success Metrics

**Schema Completeness:** 100% ✅  
**ACCESS_CONTROL_MODEL Support:** 100% ✅  
**Migration Status:** Applied ✅  
**Data Integrity:** Preserved ✅  
**Backward Compatibility:** Maintained ✅

**Ready for implementation!** 🚀



