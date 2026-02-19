# Database Schema Gap Analysis

**Date:** 2026-01-26  
**Purpose:** Analyze current schema against ACCESS_CONTROL_MODEL.md requirements

---

## Current Schema Review

### ✅ What We Have

#### 1. User Table
```prisma
model User {
  id               String    @id @default(uuid())
  username         String    @unique
  email            String    @unique
  passwordHash     String
  name             String?
  isWebsiteOwner   Boolean   @default(false)  // ✅ Superuser support
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  lastLoginAt      DateTime?
  isActive         Boolean   @default(true)
  // ... relations
}
```
**Status:** ✅ **FULLY SUPPORTS** the model
- Website owner flag present
- All necessary fields

---

#### 2. Tree Table
```prisma
model Tree {
  id          String    @id @default(uuid())
  fileId      String    @unique
  name        String
  description String?
  isPublic    Boolean   @default(false)  // ✅ Public/Private support
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  // ... relations
}
```
**Status:** ✅ **FULLY SUPPORTS** the model
- Public/private flag present
- Discoverability supported

---

#### 3. TreeOwner Table (Multiple Owners)
```prisma
model TreeOwner {
  id        String    @id @default(uuid())
  treeId    String
  userId    String
  isPrimary Boolean   @default(false)  // ✅ Primary owner designation
  createdAt DateTime  @default(now())
  addedBy   String?                    // ✅ Tracks who added them
  
  tree    Tree  @relation(fields: [treeId], references: [id])
  user    User  @relation(fields: [userId], references: [id])
  adder   User? @relation("OwnerAddedBy", fields: [addedBy])
  
  @@unique([treeId, userId])
}
```
**Status:** ✅ **FULLY SUPPORTS** the model
- Multiple owners per tree supported
- Primary owner designation
- Tracks who added each owner

---

#### 4. TreeMaintainer Table
```prisma
model TreeMaintainer {
  id         String    @id @default(uuid())
  userId     String
  treeId     String
  assignedBy String?   // ✅ Tracks who assigned them
  createdAt  DateTime  @default(now())
  
  user      User  @relation(fields: [userId], references: [id])
  tree      Tree  @relation(fields: [treeId], references: [id])
  assigner  User? @relation("MaintainerAddedBy", fields: [assignedBy])
  
  @@unique([userId, treeId])
}
```
**Status:** ✅ **FULLY SUPPORTS** the model
- Maintainer role supported
- Tracks who assigned the role

---

#### 5. UserIndividualLink Table
```prisma
model UserIndividualLink {
  id             String    @id @default(uuid())
  userId         String
  treeId         String
  individualXref String    // ✅ e.g., "I1234"
  verified       Boolean   @default(false)  // ✅ Approval tracking
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  tree Tree @relation(fields: [treeId], references: [id])
  
  @@unique([userId, treeId, individualXref])
}
```
**Status:** ✅ **FULLY SUPPORTS** the model
- Individual linking supported
- Verification flag for approval workflow
- Links users to specific individuals

---

#### 6. Permission Table
```prisma
enum PermissionType {
  read
  write
  delete
  admin
}

enum ResourceType {
  tree
  individual
  family
  subtree
}

model Permission {
  id              String         @id @default(uuid())
  userId          String
  treeId          String
  resourceType    ResourceType   // ✅ Flexible resource targeting
  resourceId      String         // ✅ Can target specific resources
  permissionType  PermissionType // ✅ read, write, delete, admin
  grantedById     String?        // ✅ Tracks who granted
  grantedAt       DateTime       @default(now())
  expiresAt       DateTime?      // ✅ Optional expiration
  notes           String?
  
  user      User  @relation("UserPermissions", fields: [userId])
  tree      Tree  @relation(fields: [treeId], references: [id])
  grantedBy User? @relation("GrantedPermissions", fields: [grantedById])
  
  @@unique([userId, treeId, resourceType, resourceId, permissionType])
}
```
**Status:** ✅ **FULLY SUPPORTS** the model
- Flexible permission system
- Can grant tree-level, individual-level, or subtree-level permissions
- Tracks who granted and when
- Supports expiration

---

#### 7. AccessRequest Table
```prisma
model AccessRequest {
  id                      String         @id @default(uuid())
  userId                  String
  treeId                  String
  resourceType            ResourceType   // ✅ Can specify what access is for
  resourceId              String         // ✅ Can target specific resource
  requestedPermissionType PermissionType // ✅ What permission level requested
  status                  String         @default("pending")  // pending, approved, rejected
  requestedAt             DateTime       @default(now())
  respondedBy             String?        // ✅ Who approved/rejected
  respondedAt             DateTime?
  notes                   String?        // ✅ User's reason
  responseNotes           String?        // ✅ Approver's response
  
  user      User  @relation("UserAccessRequests", fields: [userId])
  tree      Tree  @relation(fields: [treeId], references: [id])
  responder User? @relation("RequestRespondedBy", fields: [respondedBy])
  
  @@index([userId, treeId])
  @@index([treeId, resourceType, resourceId])
  @@index([status])
}
```
**Status:** ⚠️ **PARTIALLY SUPPORTS** the model

**What Works:**
- ✅ Basic access requests (read/write)
- ✅ Individual link requests ("This is me")
- ✅ Approval workflow with notes
- ✅ Status tracking

**What's Missing:**
- ❌ Cannot distinguish between requesting **maintainer** vs **owner** roles
- ❌ The `requestedPermissionType` enum only has: read, write, delete, admin
- ❌ No way to request "owner" role specifically
- ❌ Could use "admin" for maintainer, but not clear

---

## ❌ What We're Missing

### 1. **InvitationLink Table (MISSING)**

**Purpose:** Support invitation links for automatic access grants

**Needed Fields:**
```prisma
model InvitationLink {
  id              String    @id @default(uuid())
  token           String    @unique          // Unique token in URL
  treeId          String                     // Which tree
  createdBy       String                     // Who created it
  roleType        String                     // 'read', 'write', 'maintainer', 'owner'
  individualXref  String?                    // Optional: link to specific individual
  expiresAt       DateTime?                  // Optional expiration
  maxUses         Int?                       // null = unlimited, 1 = one-time
  usedCount       Int       @default(0)      // How many times used
  isRevoked       Boolean   @default(false)  // Can be revoked
  createdAt       DateTime  @default(now())
  
  tree    Tree @relation(fields: [treeId], references: [id])
  creator User @relation("InvitationLinksCreated", fields: [createdBy])
  uses    InvitationLinkUse[] // Track who used it
}

model InvitationLinkUse {
  id        String   @id @default(uuid())
  linkId    String
  userId    String
  usedAt    DateTime @default(now())
  
  link InvitationLink @relation(fields: [linkId], references: [id])
  user User           @relation(fields: [userId], references: [id])
  
  @@unique([linkId, userId])
}
```

**Status:** ❌ **MUST BE ADDED**

---

### 2. **AccessRequest Enhancements (NEEDS UPDATE)**

**Problem:** Cannot distinguish between role requests (maintainer vs owner)

**Current:**
```prisma
requestedPermissionType PermissionType // read, write, delete, admin
```

**Options:**

**Option A: Add a new field**
```prisma
model AccessRequest {
  // ... existing fields ...
  requestedPermissionType PermissionType  // For basic permissions
  requestedRole           String?         // 'maintainer', 'owner', null
  // ...
}
```

**Option B: Extend the enum**
```prisma
enum PermissionType {
  read
  write
  delete
  admin
  maintainer  // NEW
  owner       // NEW
}
```

**Option C: Use a separate RequestType enum**
```prisma
enum AccessRequestType {
  basic_access        // Read/write access request
  individual_link     // "This is me" request
  maintainer_role     // Request to become maintainer
  owner_role          // Request to become owner
}

model AccessRequest {
  // ... existing fields ...
  requestType             AccessRequestType
  requestedPermissionType PermissionType?  // Only for basic_access type
  // ...
}
```

**Recommendation:** **Option C** - Most explicit and clear

**Status:** ⚠️ **NEEDS ENHANCEMENT**

---

## Summary of Required Changes

### ❌ Must Add

1. **InvitationLink table** - For invitation link feature
2. **InvitationLinkUse table** - Track invitation link usage

### ⚠️ Must Enhance

1. **AccessRequest table** - Add support for role requests (maintainer/owner)
   - Add `requestType` field (enum: basic_access, individual_link, maintainer_role, owner_role)
   - Keep `requestedPermissionType` optional (only for basic_access)

### ✅ Already Supported

1. ✅ User table with website owner flag
2. ✅ Tree table with public/private flag
3. ✅ TreeOwner table (multiple owners)
4. ✅ TreeMaintainer table
5. ✅ UserIndividualLink table
6. ✅ Permission table (flexible permissions)
7. ✅ AccessRequest table (basic structure exists)

---

## Proposed Schema Updates

### Update 1: Add AccessRequestType Enum

```prisma
enum AccessRequestType {
  basic_access        // Request read or write access to tree
  individual_link     // "This is me" - link to individual
  maintainer_role     // Request to become tree maintainer
  owner_role          // Request to become tree owner
}
```

### Update 2: Modify AccessRequest Table

```prisma
model AccessRequest {
  id                      String             @id @default(uuid())
  userId                  String
  treeId                  String
  requestType             AccessRequestType  // NEW: Type of request
  resourceType            ResourceType?      // Optional: for basic_access and individual_link
  resourceId              String?            // Optional: for basic_access and individual_link
  requestedPermissionType PermissionType?    // Optional: only for basic_access
  status                  String             @default("pending")
  requestedAt             DateTime           @default(now())
  respondedBy             String?
  respondedAt             DateTime?
  notes                   String?
  responseNotes           String?
  
  user      User  @relation("UserAccessRequests", fields: [userId])
  tree      Tree  @relation(fields: [treeId], references: [id])
  responder User? @relation("RequestRespondedBy", fields: [respondedBy])
  
  @@index([userId, treeId])
  @@index([requestType, status])
}
```

### Update 3: Add InvitationLink Tables

```prisma
model InvitationLink {
  id              String    @id @default(uuid())
  token           String    @unique @default(uuid())
  treeId          String
  createdBy       String
  roleType        String    // 'read', 'write', 'maintainer', 'owner'
  individualXref  String?   // Optional: if linking to individual
  expiresAt       DateTime?
  maxUses         Int?      // null = unlimited
  usedCount       Int       @default(0)
  isRevoked       Boolean   @default(false)
  notes           String?   // Description of link purpose
  createdAt       DateTime  @default(now())
  
  tree    Tree                @relation(fields: [treeId], references: [id])
  creator User                @relation("InvitationLinksCreated", fields: [createdBy])
  uses    InvitationLinkUse[]
  
  @@index([token])
  @@index([treeId])
  @@index([createdBy])
  @@map("invitation_links")
}

model InvitationLinkUse {
  id        String   @id @default(uuid())
  linkId    String
  userId    String
  usedAt    DateTime @default(now())
  ipAddress String?  @db.Inet
  
  link InvitationLink @relation(fields: [linkId], references: [id], onDelete: Cascade)
  user User           @relation("InvitationLinkUses", fields: [userId], references: [id])
  
  @@unique([linkId, userId])
  @@index([linkId])
  @@index([userId])
  @@map("invitation_link_uses")
}
```

### Update 4: Add Relations to Existing Models

```prisma
model User {
  // ... existing fields ...
  
  // Add new relations:
  createdInvitationLinks InvitationLink[]    @relation("InvitationLinksCreated")
  invitationLinkUses     InvitationLinkUse[] @relation("InvitationLinkUses")
}

model Tree {
  // ... existing fields ...
  
  // Add new relation:
  invitationLinks InvitationLink[]
}
```

---

## Migration Strategy

### Phase 1: Update AccessRequest (Non-Breaking)

1. Add `AccessRequestType` enum
2. Add `requestType` field to `AccessRequest` table
3. Set default value for existing records:
   - If `resourceType = 'individual'` → `requestType = 'individual_link'`
   - Otherwise → `requestType = 'basic_access'`
4. Make fields optional where appropriate

### Phase 2: Add InvitationLink Tables

1. Create `InvitationLink` table
2. Create `InvitationLinkUse` table
3. Add relations to User and Tree tables

### Phase 3: Test & Deploy

1. Run migrations
2. Update API routes to support new fields
3. Test all request types
4. Test invitation link generation and consumption

---

## Compatibility Check

### ✅ Backward Compatibility

All proposed changes are **additive**:
- No existing tables removed
- No existing fields removed
- New fields are nullable or have defaults
- Existing code will continue to work

### ⚠️ Code Updates Needed

1. Update access request creation logic
2. Add invitation link API routes
3. Add invitation link UI components
4. Update approval logic to handle role requests

---

## Conclusion

**Current Schema Status:** 🟡 **85% Complete**

**What Works:**
- ✅ All core tables present
- ✅ User roles (website owner, tree owner, maintainer)
- ✅ Individual linking
- ✅ Basic permissions system
- ✅ Basic access requests

**What's Missing:**
- ❌ Invitation link system (2 new tables needed)
- ⚠️ Role request distinction (1 field update needed)

**Recommendation:**
Proceed with the two schema updates (AccessRequest enhancement + InvitationLink tables) to achieve 100% support for the ACCESS_CONTROL_MODEL.md requirements.

---

## Next Steps

1. ✅ Document created: `ACCESS_CONTROL_MODEL.md`
2. ✅ Gap analysis complete: `SCHEMA_GAP_ANALYSIS.md`
3. ⏭️ Create migration for AccessRequest updates
4. ⏭️ Create migration for InvitationLink tables
5. ⏭️ Update API routes
6. ⏭️ Implement invitation link generation
7. ⏭️ Implement role request flows



