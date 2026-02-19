# Access Control & Rights Escalation Model

**Date:** 2026-01-26  
**Version:** 1.0  
**Status:** Design Document

---

## Table of Contents

1. [Overview](#overview)
2. [User Registration & Default Access](#user-registration--default-access)
3. [Tree Visibility & Discoverability](#tree-visibility--discoverability)
4. [Permission Levels](#permission-levels)
5. [Requesting Access & Rights](#requesting-access--rights)
6. [Direct Rights Assignment](#direct-rights-assignment)
7. [Invitation Links](#invitation-links)
8. [Approval Hierarchy](#approval-hierarchy)
9. [Permission Matrix](#permission-matrix)
10. [User Journeys](#user-journeys)

---

## Overview

This document defines the complete access control model for the Ligneous genealogy platform. The model supports:

- **Public and private trees** with different visibility rules
- **Self-service user registration** with minimal default access
- **Multiple pathways** to gain access (requests, direct assignment, invitation links)
- **Rights escalation** allowing users to request higher privileges
- **Hierarchical approval** system with clear authority levels
- **Individual identity linking** connecting users to their nodes in trees

---

## User Registration & Default Access

### Self-Registration

When a user self-registers through the `/register` page:

**Initial State:**
- Account created as a **registered user**
- Username, email, password stored
- No special privileges assigned
- `isWebsiteOwner = false`

**Default Access:**
- ✅ Can view and read **all public trees** (full content access)
- ❌ Cannot view **private trees** (not even metadata beyond discovery)
- ❌ Cannot edit **any trees** (even public ones)
- ❌ No special roles assigned

**Next Steps:**
- User must request access to private trees
- User must request edit permissions
- User can claim identity ("This is me")
- User can request elevated roles (maintainer, owner)

---

## Tree Visibility & Discoverability

### All Trees Are Discoverable

**Search & Discovery:**
- All trees appear in search results
- Users can search by tree name, description, family names, etc.
- Both public and private trees are discoverable
- Tree listing shows basic metadata for all trees

### Public Trees

**Visibility:**
- Full tree content visible to **everyone** (including unauthenticated users)
- All individuals, families, relationships visible
- All data fields accessible (names, dates, places, etc.)
- No authentication required for viewing

**User Experience:**
- Unauthenticated: Can browse and read
- Authenticated: Can browse and read
- To edit: Must request write permissions

**Typical Use Cases:**
- Historical societies publishing records
- Public family trees for genealogy research
- Collaborative trees open to contributions

### Private Trees

**Visibility:**
- **Search Results:** Tree name and basic metadata shown
- **Tree Page:** Only metadata visible (name, description, owner info)
- **Tree Content:** Completely hidden until access granted
- **Message:** "This tree is private. Request access to view."

**User Experience:**
- Can find the tree exists
- Can see who owns/maintains it
- Can request access
- Cannot see any individuals or family data

**Typical Use Cases:**
- Family trees with living people
- Trees with sensitive information
- Work-in-progress trees

---

## Permission Levels

### 1. Unregistered User

**Access:**
- View public trees (read-only)
- Search for trees
- Cannot request access (must register first)

**Cannot:**
- View private trees
- Edit any content
- Save data
- Make requests

---

### 2. Registered User (No Special Access)

**Access:**
- View public trees (read-only)
- Search all trees
- See that private trees exist (metadata only)
- Request access to private trees

**Cannot:**
- View private tree content
- Edit any trees
- Claim individual identity without access

---

### 3. User with Basic Tree Access

**Granted By:**
- Access request approval
- Direct assignment by owner/maintainer
- Invitation link

**Access Types:**

**Read-Only Access:**
- View entire tree structure
- Read all individual data
- See all relationships
- Cannot edit anything

**Read-Write Access:**
- All read-only privileges plus:
- Edit existing individuals
- Add new individuals
- Edit relationships
- Add media/documents
- Cannot delete tree
- Cannot manage users/permissions

**Cannot:**
- Add/remove owners or maintainers
- Delete the tree
- Grant access to others (unless also a maintainer)

---

### 4. User Linked to Individual

**Granted By:**
- "This is me" request approval
- Direct assignment by owner/maintainer
- Invitation link with individual link

**Special Permission Model:**
- **Read Access:** Entire tree (same as basic read access)
- **Write Access:** Limited to specific scope:
  - ✅ Can edit **their own node** (the individual they're linked to)
  - ✅ Can edit **their subtree** (all descendants of their node)
  - ❌ Cannot edit other parts of the tree
  - ❌ Cannot edit ancestors or siblings

**Rationale:**
- Users can manage information about themselves
- Users can manage information about their children/descendants
- Users cannot alter information about other family branches
- Prevents accidental or malicious edits outside their family line

**Example:**
- User linked to "John Smith (I123)" in tree
- Can edit John Smith's information
- Can edit John's children, grandchildren, etc.
- Cannot edit John's parents, siblings, aunts, uncles, cousins

**Cannot:**
- Edit other branches of the tree
- Delete the tree
- Manage permissions
- Grant access to others

---

### 5. Tree Maintainer

**Granted By:**
- Maintainer request approval (by owner only)
- Direct assignment by owner
- Invitation link (created by owner)

**Full Edit Access:**
- ✅ View entire tree
- ✅ Edit entire tree (all individuals, relationships)
- ✅ Add/delete individuals
- ✅ Add/delete relationships
- ✅ Manage tree metadata (name, description, public/private)
- ✅ Upload/manage media

**Administrative Access:**
- ✅ Approve basic access requests (read/write)
- ✅ Approve "This is me" requests
- ✅ Grant read/write permissions to users
- ✅ Create invitation links for basic access

**Cannot:**
- ❌ Add/remove owners
- ❌ Add/remove other maintainers
- ❌ Delete the tree
- ❌ Create invitation links for owner/maintainer roles

**Rationale:**
- Maintainers have full edit access to help maintain the tree
- They can approve access requests to reduce owner burden
- They cannot change ownership structure (prevents takeovers)
- They cannot delete the tree (only owners can)

---

### 6. Tree Owner

**Granted By:**
- Creating a new tree (becomes primary owner)
- Owner request approval (by existing owner)
- Direct assignment by existing owner
- Invitation link (created by existing owner)
- Website owner promotion

**Full Control:**
- ✅ All maintainer privileges
- ✅ Add/remove maintainers
- ✅ Add/remove owners (including themselves)
- ✅ Delete the tree
- ✅ Transfer primary ownership
- ✅ Create invitation links with any role (including owner/maintainer)
- ✅ Change tree public/private status
- ✅ Export tree data

**Multiple Owners:**
- Trees can have multiple co-owners
- All owners have equal privileges
- Any owner can add/remove other owners
- One owner is marked as "primary" for display purposes only

**Cannot:**
- Make themselves website owner (only website owner can)

---

### 7. Website Owner (Superuser)

**Granted By:**
- Database seed (initial superuser)
- Manual database update
- Promotion by another website owner

**Global Authority:**
- ✅ All privileges on all trees
- ✅ View all private trees
- ✅ Edit all trees
- ✅ Add/remove owners from any tree
- ✅ Add/remove maintainers from any tree
- ✅ Delete any tree
- ✅ Approve any access request
- ✅ Create users with any role
- ✅ Promote users to website owner
- ✅ Override any decision
- ✅ Access all administrative functions

**Responsibilities:**
- Resolve disputes between owners
- Handle appeals of rejected requests
- Emergency access to all data
- System-wide policy enforcement

---

## Requesting Access & Rights

### Request Types

Users can submit four types of requests:

1. **Basic Access Request** - Get read or read/write access to a tree
2. **Individual Link Request** - "This is me" - Link account to specific individual
3. **Maintainer Request** - Become a tree maintainer
4. **Owner Request** - Become a tree co-owner

### Request Flow

All requests follow the same pattern:

```
User Submits Request
    ↓
Request Stored in Database (status: pending)
    ↓
Notification Sent to Approvers
    ↓
Approver Reviews Request
    ↓
    ├─→ Approved: Permissions Granted
    └─→ Rejected: User Notified
```

---

### 1. Basic Access Request

**Who Can Request:**
- Any registered user

**Request Contains:**
- User ID
- Tree ID
- Requested permission type (read or write)
- Resource type: "tree"
- Notes (optional explanation)

**Where to Request:**
- From tree search results (for private trees)
- From tree page (if can see tree but want write access)

**UI Flow:**
1. User finds tree in search
2. Sees "This tree is private" or "Request Write Access"
3. Clicks "Request Access" button
4. Fills out request form with reason
5. Submits request

**Approval Needed From:**
- Website Owner, OR
- Any Tree Owner, OR
- Any Tree Maintainer

**Upon Approval:**
- User added to permissions table
- User can now view (and edit if write) the tree
- User notified of approval

---

### 2. Individual Link Request ("This is me")

**Who Can Request:**
- Users who can already view the tree (public tree or granted access)

**Request Contains:**
- User ID
- Tree ID
- Individual ID (e.g., "I1234")
- Resource type: "individual"
- Resource ID: specific individual xref
- Notes (optional explanation/proof)

**Where to Request:**
- From individual detail page
- Button: "This is me" or "Link to my account"

**UI Flow:**
1. User browses tree and finds themselves
2. Clicks "This is me" button on their individual page
3. Provides explanation or proof of identity
4. Submits request

**Approval Needed From:**
- Website Owner, OR
- Any Tree Owner, OR
- Any Tree Maintainer

**Upon Approval:**
- UserIndividualLink record created
- User gets read access to entire tree
- User gets write access to their node and subtree
- User notified of approval

**Verification Considerations:**
- Approvers may ask for verification (birth certificate, etc.)
- May require email confirmation
- May require matching personal details

---

### 3. Maintainer Request

**Who Can Request:**
- Users who already have some access to the tree

**Request Contains:**
- User ID
- Tree ID
- Resource type: "tree"
- Requested permission type: "admin"
- Role requested: "maintainer"
- Notes (explanation of why they want to help maintain)

**Where to Request:**
- From tree page (if has access)
- User settings/profile page
- "Request Maintainer Role" button

**UI Flow:**
1. User viewing tree they have access to
2. Clicks "Request Maintainer Role"
3. Explains why they want to help maintain
4. Submits request

**Approval Needed From:**
- Website Owner, OR
- Any Tree Owner
- **NOT** maintainers (only owners can approve new maintainers)

**Upon Approval:**
- TreeMaintainer record created
- User gets full edit access to tree
- User can now approve basic access requests
- User notified of approval

**Rationale for Owner-Only Approval:**
- Prevents maintainer proliferation
- Ensures owners have control over who helps manage
- Maintainers have significant privileges

---

### 4. Owner Request

**Who Can Request:**
- Users who already have access to the tree
- Typically maintainers or heavily involved users

**Request Contains:**
- User ID
- Tree ID
- Resource type: "tree"
- Role requested: "owner"
- Notes (explanation of why they should be co-owner)

**Where to Request:**
- From tree page
- "Request Co-Owner Role" button

**UI Flow:**
1. User viewing tree they have access to
2. Clicks "Request Co-Owner Role"
3. Explains their relationship to tree/family
4. Submits request

**Approval Needed From:**
- Website Owner, OR
- Any existing Tree Owner
- **NOT** maintainers

**Upon Approval:**
- TreeOwner record created
- User gets full owner privileges
- User can now add/remove owners and maintainers
- User can delete tree
- User notified of approval

**Rationale:**
- Family members may want co-ownership
- Collaborative ownership for shared family trees
- Succession planning (original owner retiring)

---

## Direct Rights Assignment

Privileged users can directly assign roles and permissions without the request/approval workflow.

### Website Owner Can Assign:

**Create New Users With:**
- Any role on any tree
- Website owner status
- Multiple roles simultaneously

**Grant to Existing Users:**
- Owner role on any tree
- Maintainer role on any tree
- Basic access to any tree
- Link to any individual
- Website owner status

---

### Tree Owner Can Assign:

**Create New Users With:**
- Owner role on their tree(s)
- Maintainer role on their tree(s)
- Basic access to their tree(s)
- Link to individuals in their tree(s)

**Grant to Existing Users:**
- Owner role on their tree(s)
- Maintainer role on their tree(s)
- Read/write access to their tree(s)
- Link to individuals in their tree(s)

**Cannot:**
- Make users website owners
- Grant access to other people's trees

---

### Tree Maintainer Can Assign:

**Grant to Existing Users:**
- Read access to their tree(s)
- Write access to their tree(s)
- Link to individuals (after verifying "This is me" claims)

**Cannot:**
- Create new users
- Grant owner role
- Grant maintainer role
- Make users website owners
- Grant access to other trees

---

## Invitation Links

### Overview

Invitation links provide a way to grant access without the request/approval workflow. The link itself represents pre-approval.

### Link Types

1. **Basic Access Link** - Grants read or read/write access
2. **Individual Link** - Links user to specific individual with appropriate permissions
3. **Maintainer Link** - Grants maintainer role
4. **Owner Link** - Grants owner role

### Link Structure

Each invitation link contains:
- Unique token (UUID or similar)
- Tree ID
- Access type/role to grant
- Optional: Individual ID to link to
- Optional: Expiration date
- Optional: Single-use vs multi-use
- Created by (user ID)
- Created at (timestamp)

### Link Generation Authority

**Website Owner Can Create:**
- Links with any role/access for any tree
- Links linking to any individual in any tree

**Tree Owner Can Create:**
- Owner links for their tree(s)
- Maintainer links for their tree(s)
- Basic access links for their tree(s)
- Individual link links for their tree(s)

**Tree Maintainer Can Create:**
- Basic access links (read/write only) for their tree(s)
- **Cannot** create owner or maintainer links

### Registration Flow with Link

1. Privileged user generates invitation link
2. Link is shared via any method (email, chat, SMS, etc.)
3. Recipient clicks link
4. If not registered:
   - Redirected to registration page
   - Link token preserved in URL
   - User completes registration
   - Upon successful registration, permissions automatically granted
5. If already registered and logged in:
   - Permissions immediately granted
   - User notified of new access

### Link Features

**Security:**
- One-time use links (consumed after use)
- Multi-use links (for groups/families)
- Expiration dates (optional)
- Can be revoked by creator

**Tracking:**
- Who created the link
- When it was created
- How many times it was used
- Who used it

---

## Approval Hierarchy

### Access Request Approvals

| Request Type | Website Owner | Tree Owner | Tree Maintainer |
|-------------|---------------|------------|-----------------|
| Basic Access (read/write) | ✅ | ✅ | ✅ |
| Individual Link ("This is me") | ✅ | ✅ | ✅ |
| Maintainer Role | ✅ | ✅ | ❌ |
| Owner Role | ✅ | ✅ | ❌ |

### Approval Process

**Request Visibility:**
- All pending requests visible to authorized approvers
- Approvers see: requester info, tree, requested role, notes
- Approvers can see request history (previous approvals/rejections)

**Approval Actions:**
- Approve (grant request)
- Reject (deny with reason)
- Request more information
- Defer to another approver

**Notifications:**
- User notified when request approved
- User notified when request rejected (with reason)
- Approvers notified of new requests

---

## Permission Matrix

### Summary Table

| User Type | View Public Trees | View Private Trees | Edit Public Trees | Edit Private Trees | Approve Requests | Add Maintainers | Add Owners | Delete Tree |
|-----------|------------------|-------------------|------------------|-------------------|------------------|----------------|------------|-------------|
| Unregistered | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Registered (no access) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| With Read Access | ✅ | ✅ (specific) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| With Write Access | ✅ | ✅ (specific) | ✅ (specific) | ✅ (specific) | ❌ | ❌ | ❌ | ❌ |
| Linked to Individual | ✅ | ✅ (specific) | ❌ (except self+subtree) | ✅ (self+subtree) | ❌ | ❌ | ❌ | ❌ |
| Tree Maintainer | ✅ | ✅ (specific) | ✅ (specific) | ✅ (specific) | ✅ (basic) | ❌ | ❌ | ❌ |
| Tree Owner | ✅ | ✅ (specific) | ✅ (specific) | ✅ (specific) | ✅ | ✅ | ✅ | ✅ |
| Website Owner | ✅ | ✅ (all) | ✅ (all) | ✅ (all) | ✅ | ✅ | ✅ | ✅ |

---

## User Journeys

### Journey 1: Casual User Viewing Public Trees

1. User visits site (not registered)
2. Searches for family name
3. Finds public tree
4. Browses tree structure and individuals
5. Reads ancestor information
6. No account needed

---

### Journey 2: Family Member Wanting to Edit

1. User self-registers
2. Can view public trees
3. Finds their family tree (public or private)
4. If private, requests access
5. Tree owner approves request
6. User can now view tree
7. User finds themselves in tree
8. Clicks "This is me"
9. Tree owner verifies and approves
10. User can now edit their info and their descendants

---

### Journey 3: Collaborator Becoming Maintainer

1. User has write access to tree
2. Actively helps maintain tree over time
3. Requests maintainer role
4. Tree owner reviews contributions
5. Owner approves maintainer role
6. User can now approve access requests
7. User helps manage the tree

---

### Journey 4: Invitation Link for Family Reunion

1. Tree owner preparing for family reunion
2. Wants all family members to access tree
3. Creates invitation link with read access
4. Emails link to family members
5. Family members click link
6. New users register, existing users login
7. All automatically get access to tree
8. No manual approvals needed

---

### Journey 5: Co-Ownership Transfer

1. Original tree owner getting older
2. Child/relative has been helping maintain
3. Child requests owner role
4. Original owner approves
5. Child becomes co-owner
6. Both have full ownership rights
7. Ensures continuity if original owner unavailable

---

## Implementation Notes

### Database Requirements

1. **User table** - isWebsiteOwner flag
2. **Tree table** - isPublic flag
3. **TreeOwner table** - multiple owners per tree, isPrimary flag
4. **TreeMaintainer table** - maintainer assignments
5. **UserIndividualLink table** - user-to-individual mappings
6. **Permission table** - flexible permission grants
7. **AccessRequest table** - pending requests with type, status
8. **InvitationLink table** - temporary registration links (NEW)

### API Endpoints Needed

**Access Requests:**
- `POST /api/access-requests` - Submit request
- `GET /api/access-requests` - List requests (filtered by role)
- `POST /api/access-requests/{id}/approve` - Approve request
- `POST /api/access-requests/{id}/reject` - Reject request

**Invitation Links:**
- `POST /api/invitation-links` - Create link
- `GET /api/invitation-links` - List links (by creator)
- `DELETE /api/invitation-links/{id}` - Revoke link
- `GET /api/invitation-links/{token}` - Validate link
- `POST /api/invitation-links/{token}/consume` - Use link

**Role Management:**
- `POST /api/trees/{id}/owners` - Add owner
- `DELETE /api/trees/{id}/owners/{userId}` - Remove owner
- `POST /api/trees/{id}/maintainers` - Add maintainer
- `DELETE /api/trees/{id}/maintainers/{userId}` - Remove maintainer

### UI Components Needed

1. **Access Request Button** - On tree pages
2. **"This is me" Button** - On individual pages
3. **Request Maintainer/Owner Button** - On tree pages
4. **Access Request Management Dashboard** - For approvers
5. **Invitation Link Generator** - For privileged users
6. **Pending Requests Badge** - Notification counter
7. **User Role Display** - Show current access level

---

## Future Enhancements

### Phase 2

1. **Email Notifications** - Automatic emails for requests and approvals
2. **Request Comments** - Allow discussion on requests
3. **Bulk Operations** - Approve multiple requests at once
4. **Access Audit Log** - Track all permission changes
5. **Request Templates** - Pre-filled reasons for common requests

### Phase 3

1. **Time-Limited Access** - Grant temporary access
2. **Conditional Access** - Based on relationship or location
3. **Access Groups** - Grant access to groups of users
4. **Delegation** - Owners delegate approval authority
5. **Appeal Process** - Rejected requests can be appealed

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-26 | Initial document | System |


