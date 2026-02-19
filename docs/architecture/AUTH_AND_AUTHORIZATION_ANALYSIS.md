# Authentication and Authorization System Analysis

## Overview

The Ligneous frontend implements a comprehensive authentication and authorization system with:
- **JWT-based authentication** with session management
- **Hierarchical permission model** for tree access
- **Role-based access control** (Website Owner, Tree Owner, Tree Maintainer, Regular User)
- **Fine-grained permissions** (read, write, delete, admin)
- **Public/private tree support** with different access rules

---

## Authentication System

### Architecture

**Components:**
1. **Auth Facet** (`mycelia/facets/auth.js`) - Client-side state management
2. **API Routes** (`app/api/auth/*`) - Server-side authentication endpoints
3. **Auth Utilities** (`lib/auth.js`) - Server-side token/password utilities
4. **React Hooks** (`hooks/useAuthState.js`, `hooks/useRequireAuth.js`) - Client-side integration

### Authentication Flow

#### 1. Registration Flow

```javascript
// Client (Auth Facet)
auth.register(username, email, password, name)
  ↓
// API Route: POST /api/auth/register
  - Validates input (username ≥3 chars, password ≥8 chars)
  - Checks for existing user (username or email)
  - Hashes password with bcrypt
  - Creates user in database
  - Generates JWT token
  - Creates session record
  ↓
// Response: { user, token }
  ↓
// Client stores token in localStorage
  ↓
// Auth facet updates state and emits 'auth:registered' event
```

#### 2. Login Flow

```javascript
// Client (Auth Facet)
auth.login(username, password)
  ↓
// API Route: POST /api/auth/login
  - Finds user by username or email
  - Verifies password with bcrypt
  - Updates lastLoginAt
  - Generates JWT token
  - Creates session record (7 days expiry)
  ↓
// Response: { user, token }
  ↓
// Client stores token in localStorage
  ↓
// Auth facet updates state and emits 'auth:loggedIn' event
```

#### 3. Token Management

**Token Storage:**
- **Client-side**: Stored in `localStorage` as `auth_token`
- **Server-side**: Token hash stored in `sessions` table
- **Token Format**: JWT with `{ userId }` payload

**Token Lifecycle:**
- **Generation**: On login/register
- **Expiration**: 7 days (configurable)
- **Validation**: On every `/api/auth/me` call
- **Revocation**: On logout or manual revocation

**Session Management:**
- Sessions stored in `sessions` table
- Token hash (SHA-256) stored, not plain token
- Tracks: IP address, user agent, last used, expiration
- Can be revoked (`isRevoked = true`)

#### 4. Current User Retrieval

```javascript
// Client (Auth Facet)
auth.getCurrentUser()
  ↓
// API Route: GET /api/auth/me
  - Extracts token from Authorization header
  - Verifies JWT token
  - Checks session in database (not revoked, not expired)
  - Updates session lastUsedAt
  - Returns user data
  ↓
// Response: { user }
  ↓
// Auth facet updates state
```

**Auto-load on Init:**
- Auth facet automatically loads token from localStorage on initialization
- Calls `getCurrentUser()` if token exists
- Restores user session on page refresh

#### 5. Logout Flow

```javascript
// Client (Auth Facet)
auth.logout()
  ↓
// API Route: POST /api/auth/logout
  - Revokes session (sets isRevoked = true)
  ↓
// Client removes token from localStorage
  ↓
// Auth facet clears state and emits 'auth:loggedOut' event
```

### Security Features

**Password Security:**
- ✅ Bcrypt hashing (configurable salt rounds)
- ✅ Password never stored in plain text
- ✅ Minimum 8 characters required

**Token Security:**
- ✅ JWT with expiration
- ✅ Token hash stored in database (not plain token)
- ✅ Session revocation support
- ✅ IP address and user agent tracking

**Session Security:**
- ✅ Automatic expiration (7 days)
- ✅ Manual revocation support
- ✅ Last used tracking
- ✅ Multiple sessions per user supported

---

## Authorization System

### Permission Model

**Hierarchy (checked in order):**

1. **Website Owner (Superuser)** - Highest Priority
   - ✅ Absolute access to **all trees**
   - ✅ All permissions (read, write, delete, admin)
   - ✅ Bypasses all other permission checks
   - ✅ Requires authentication

2. **Tree Owner**
   - ✅ Full read and write access to **entire tree**
   - ✅ All permissions on tree
   - ✅ Can have multiple owners per tree
   - ✅ Requires authentication

3. **Tree Maintainer**
   - ✅ Admin access to **specific tree**
   - ✅ Full read and write access
   - ✅ Requires authentication

4. **Explicit Permission**
   - ✅ Resource-specific permission
   - ✅ Can be on tree, individual, family, or subtree
   - ✅ Supports expiration dates
   - ✅ Requires authentication

5. **Subtree Permission**
   - ✅ Permission on subtree (descendants of an individual)
   - ✅ Write access to subtree only
   - ✅ Read access to entire tree (via tree-level permission)
   - ✅ Requires authentication

6. **Tree-level Permission**
   - ✅ General tree access permission
   - ✅ Applies to entire tree
   - ✅ Requires authentication

7. **Public Tree** - Lowest Priority
   - ✅ Read-only access for **anyone** (including unauthenticated)
   - ✅ Write requires authentication and permission
   - ✅ No authentication required for read

### Permission Types

- **read** - View data
- **write** - Create/update data
- **delete** - Delete data
- **admin** - Administrative access

### Permission Check Function

**Location:** `lib/permissions/index.js`

**Function:** `hasPermission(userId, treeId, resourceType, resourceId, permissionType)`

**Logic:**
```javascript
1. If write/delete/admin AND not authenticated → return false
2. If website owner → return true
3. If tree owner → return true
4. If tree maintainer → return true
5. If explicit permission → return true
6. If subtree permission (for individuals/families) → return true
7. If tree-level permission → return true
8. If public tree AND read → return true
9. Return false (no access)
```

### Public vs. Private Trees

**Public Trees (`isPublic = true`):**
- ✅ **Read**: Anyone (including unauthenticated users)
- ❌ **Write**: Requires authentication + permission
- ❌ **Delete**: Requires authentication + permission

**Private Trees (`isPublic = false`):**
- ❌ **Read**: Requires authentication + permission
- ❌ **Write**: Requires authentication + permission
- ❌ **Delete**: Requires authentication + permission

---

## Database Schema

### User Table

```prisma
model User {
  id             String    @id @default(uuid())
  username       String    @unique
  email          String    @unique
  passwordHash   String    // Bcrypt hash
  name           String?
  isWebsiteOwner Boolean   @default(false)  // Superuser flag
  isActive       Boolean   @default(true)
  createdAt      DateTime
  lastLoginAt    DateTime?
  // ... relations
}
```

### Session Table

```prisma
model Session {
  id         String   @id @default(uuid())
  userId     String
  tokenHash  String   @unique  // SHA-256 hash of JWT token
  expiresAt DateTime  // 7 days from creation
  lastUsedAt DateTime
  ipAddress  String?
  userAgent  String?
  isRevoked  Boolean  @default(false)
  // ... relations
}
```

### Permission Tables

**TreeOwner:**
```prisma
model TreeOwner {
  treeId    String
  userId    String
  isPrimary Boolean  // One primary owner per tree
  // ... relations
}
```

**TreeMaintainer:**
```prisma
model TreeMaintainer {
  treeId String
  userId String
  // ... relations
}
```

**Permission:**
```prisma
model Permission {
  userId        String
  treeId        String
  resourceType  String  // 'tree', 'individual', 'family', 'subtree'
  resourceId    String  // 'tree', 'I1', 'F2', etc.
  permissionType String // 'read', 'write', 'delete', 'admin'
  expiresAt     DateTime?  // Optional expiration
  // ... relations
}
```

---

## API Integration

### Authentication in API Routes

**Pattern:**
```javascript
// Extract token from request
const token = getTokenFromRequest(request);
const user = await getAuthenticatedUser(request);

// Check permissions
const hasAccess = await hasPermission(
  user?.id,
  treeId,
  'tree',
  'tree',
  'read'
);
```

**Middleware Functions:**
- `getTokenFromRequest(request)` - Extracts JWT from Authorization header
- `getAuthenticatedUser(request)` - Verifies token and returns user
- `hasPermission(...)` - Checks permission

### Proxy Route Pattern

**Location:** `app/api/trees/[treeId]/[...path]/route.js`

**Flow:**
1. Extract `treeId` from URL
2. Map `treeId` to `fileId` (Go API uses fileId)
3. Get authenticated user (optional for public trees)
4. Check permission based on HTTP method:
   - GET/HEAD → 'read'
   - POST/PUT/PATCH → 'write'
   - DELETE → 'delete'
5. Proxy request to Go API if authorized
6. Return response

---

## Client-Side Integration

### React Hooks

**1. `useAuthState()`**
- Reactive hook that listens to auth events
- Returns: `{ user, isAuthenticated, loading, error, isSuperuser, authFacet }`
- Automatically updates on login/logout

**2. `useRequireAuth(options)`**
- Protects routes/pages
- Redirects to login if not authenticated
- Supports superuser requirement
- Returns: `{ isReady, user, isAuthenticated, isSuperuser }`

### Usage Patterns

**Protected Page:**
```javascript
export default function ProtectedPage() {
  const { isReady, user } = useRequireAuth();
  
  if (!isReady) return <LoadingState />;
  
  return <div>Welcome, {user.name}!</div>;
}
```

**Superuser Page:**
```javascript
export default function AdminPage() {
  const { isReady } = useRequireAuth({ requireSuperuser: true });
  
  if (!isReady) return <LoadingState />;
  
  return <div>Admin Dashboard</div>;
}
```

**Conditional Rendering:**
```javascript
const { user, isAuthenticated, isSuperuser } = useAuthState();

{isAuthenticated && (
  <button onClick={() => authFacet.logout()}>Logout</button>
)}

{isSuperuser && (
  <Link href="/admin">Admin Panel</Link>
)}
```

---

## Access Control Patterns

### 1. Route-Level Protection

**Pattern:** Use `useRequireAuth` in page components

```javascript
// app/admin/page.js
export default function AdminPage() {
  useRequireAuth({ requireSuperuser: true });
  // ... page content
}
```

### 2. Component-Level Protection

**Pattern:** Conditional rendering based on auth state

```javascript
const { user, isAuthenticated } = useAuthState();

{isAuthenticated && user && (
  <EditButton onClick={handleEdit} />
)}
```

### 3. API-Level Protection

**Pattern:** Check permissions in API routes

```javascript
// app/api/trees/[treeId]/individuals/route.js
export async function POST(request, { params }) {
  const user = await getAuthenticatedUser(request);
  const hasWrite = await hasPermission(
    user?.id,
    params.treeId,
    'tree',
    'tree',
    'write'
  );
  
  if (!hasWrite) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // ... proceed with operation
}
```

### 4. Proxy Route Protection

**Pattern:** Check permissions before proxying to Go API

```javascript
// app/api/trees/[treeId]/[...path]/route.js
const permissionType = getPermissionType(request.method);
const hasAccess = await checkTreeAccessForProxy(
  user?.id,
  treeId,
  permissionType
);

if (!hasAccess) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Proxy to Go API
```

---

## Access Requests

### System

Users can request access to trees they don't have access to.

**Flow:**
1. User creates `AccessRequest` record
2. Request includes: `requestType`, `treeId`, `notes`, `userId`
3. Tree owners/maintainers can approve/reject
4. On approval, permissions are granted

**Request Types:**
- `basic_access` - Read access to tree
- `individual_link` - Link user to individual (identity claim)
- `maintainer_role` - Maintainer role request
- `owner_role` - Owner role request

---

## Current Implementation Status

### ✅ Implemented

1. **Authentication**
   - ✅ User registration
   - ✅ User login
   - ✅ User logout
   - ✅ Token management (JWT)
   - ✅ Session management
   - ✅ Auto-restore session on page load
   - ✅ Password hashing (bcrypt)

2. **Authorization**
   - ✅ Permission checking function
   - ✅ Website owner (superuser) support
   - ✅ Tree owner support (multiple owners)
   - ✅ Tree maintainer support
   - ✅ Explicit permissions
   - ✅ Tree-level permissions
   - ✅ Public/private tree support
   - ✅ Access request system

3. **Client Integration**
   - ✅ Auth facet (Mycelia)
   - ✅ Reactive auth state hook
   - ✅ Route protection hook
   - ✅ Event-driven updates

4. **API Integration**
   - ✅ Authentication middleware
   - ✅ Permission checking in API routes
   - ✅ Proxy route with permission checks

### ⚠️ Partially Implemented

1. **Subtree Permissions**
   - ⚠️ Database schema exists
   - ⚠️ Permission check logic exists
   - ❌ `isInSubtree()` function not implemented (placeholder)
   - **Issue:** Requires Go API integration to determine subtree membership

2. **Token Refresh**
   - ⚠️ Tokens expire after 7 days
   - ❌ No automatic token refresh
   - **Issue:** User must re-login after token expires

### ❌ Not Implemented

1. **Password Reset**
   - ❌ No password reset flow
   - ❌ No email verification
   - ❌ No password change functionality

2. **Two-Factor Authentication**
   - ❌ Not implemented

3. **OAuth/SSO**
   - ❌ Not implemented

4. **Session Management UI**
   - ❌ No UI to view/revoke sessions
   - ❌ No "remember me" option

5. **Permission Management UI**
   - ❌ No UI to grant/revoke permissions
   - ❌ No UI to manage tree owners/maintainers

---

## Security Considerations

### ✅ Good Practices

1. **Password Security**
   - ✅ Bcrypt hashing
   - ✅ Minimum length requirements
   - ✅ Never stored in plain text

2. **Token Security**
   - ✅ JWT with expiration
   - ✅ Token hash stored (not plain token)
   - ✅ Session revocation support

3. **Permission Checks**
   - ✅ Server-side validation
   - ✅ Hierarchical permission model
   - ✅ Public tree read-only for unauthenticated

### ⚠️ Potential Issues

1. **Token Storage**
   - ⚠️ Stored in localStorage (XSS risk)
   - **Mitigation:** Use httpOnly cookies (not implemented)

2. **No CSRF Protection**
   - ⚠️ No CSRF tokens
   - **Mitigation:** Consider adding CSRF protection

3. **Subtree Permission Check**
   - ⚠️ `isInSubtree()` not implemented
   - **Impact:** Subtree permissions don't work yet

4. **No Rate Limiting**
   - ⚠️ No rate limiting on login/register
   - **Risk:** Brute force attacks

5. **No Account Lockout**
   - ⚠️ No account lockout after failed attempts
   - **Risk:** Brute force attacks

---

## Architecture Strengths

### ✅ **1. Separation of Concerns**

- **Client-side**: Auth facet manages state
- **Server-side**: API routes handle authentication
- **Business logic**: Permission checking in separate module

### ✅ **2. Reactive State Management**

- Event-driven updates
- Automatic UI updates on auth changes
- No manual state synchronization needed

### ✅ **3. Flexible Permission Model**

- Hierarchical permissions
- Fine-grained control
- Public/private tree support
- Multiple owners per tree

### ✅ **4. Session Management**

- Multiple sessions per user
- Session tracking (IP, user agent)
- Session revocation
- Expiration support

---

## Architecture Weaknesses

### ⚠️ **1. Token Storage**

**Issue:** Tokens stored in localStorage (XSS vulnerability)

**Current:**
```javascript
localStorage.setItem('auth_token', token);
```

**Recommendation:**
- Use httpOnly cookies for token storage
- Or implement token refresh mechanism

### ⚠️ **2. No Token Refresh**

**Issue:** Tokens expire after 7 days, user must re-login

**Current:**
- Token expires after 7 days
- No refresh token mechanism
- User must re-authenticate

**Recommendation:**
- Implement refresh token mechanism
- Auto-refresh before expiration

### ⚠️ **3. Subtree Permission Not Implemented**

**Issue:** `isInSubtree()` function is a placeholder

**Current:**
```javascript
export async function isInSubtree(resourceId, subtreeRootXref, treeId) {
  // TODO: Implement subtree checking by querying Go API
  return false;
}
```

**Impact:**
- Subtree permissions don't work
- Users with subtree write access can't actually write

**Recommendation:**
- Integrate with Go API to check subtree membership
- Or implement subtree checking in frontend database

### ⚠️ **4. No Permission Caching**

**Issue:** Permission checks query database every time

**Current:**
- Every permission check = database query
- No caching mechanism

**Recommendation:**
- Cache permission results (Redis or in-memory)
- Invalidate cache on permission changes

### ⚠️ **5. Inconsistent Permission Checks**

**Issue:** Some routes check permissions, others don't

**Current:**
- Proxy route checks permissions
- Some direct API routes may not check
- Inconsistent patterns

**Recommendation:**
- Standardize permission checking
- Create middleware for permission checks
- Document which routes require permissions

---

## Recommendations

### Short Term (Immediate)

1. **Implement Subtree Permission Check**
   - Integrate with Go API
   - Or implement in frontend database

2. **Add Permission Caching**
   - Cache permission results
   - Invalidate on changes

3. **Standardize Permission Checks**
   - Create permission middleware
   - Apply to all protected routes

### Medium Term (Next Sprint)

1. **Token Refresh Mechanism**
   - Implement refresh tokens
   - Auto-refresh before expiration

2. **Password Reset Flow**
   - Email-based password reset
   - Secure token generation

3. **Session Management UI**
   - View active sessions
   - Revoke sessions
   - "Remember me" option

### Long Term (Future)

1. **Move to httpOnly Cookies**
   - More secure token storage
   - CSRF protection

2. **Rate Limiting**
   - Limit login attempts
   - Account lockout

3. **Permission Management UI**
   - Grant/revoke permissions
   - Manage tree owners/maintainers

4. **OAuth/SSO Support**
   - Google/GitHub login
   - Enterprise SSO

---

## Usage Examples

### Example 1: Protected API Route

```javascript
// app/api/trees/[treeId]/individuals/route.js
export async function POST(request, { params }) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const hasWrite = await hasPermission(
    user.id,
    params.treeId,
    'tree',
    'tree',
    'write'
  );
  
  if (!hasWrite) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Proceed with operation
}
```

### Example 2: Public Tree with Write Protection

```javascript
// Public tree: anyone can read, but only authorized users can write
const isPublic = await isPublicTree(treeId);
const permissionType = request.method === 'GET' ? 'read' : 'write';

if (permissionType === 'read' && isPublic) {
  // Allow read for anyone
} else {
  // Require authentication and permission
  const user = await getAuthenticatedUser(request);
  const hasAccess = await hasPermission(
    user?.id,
    treeId,
    'tree',
    'tree',
    permissionType
  );
  
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

### Example 3: Superuser Bypass

```javascript
// Superuser has access to everything
if (user && await isWebsiteOwner(user.id)) {
  // Allow all operations
  return proceed();
}

// Check normal permissions
const hasAccess = await hasPermission(...);
```

---

## Conclusion

### Current State

**Strengths:**
- ✅ Comprehensive permission model
- ✅ Reactive client-side state
- ✅ Secure password handling
- ✅ Session management
- ✅ Public/private tree support

**Weaknesses:**
- ⚠️ Token storage (localStorage)
- ⚠️ No token refresh
- ⚠️ Subtree permissions not implemented
- ⚠️ No permission caching
- ⚠️ Some missing features (password reset, etc.)

### Overall Assessment

The authentication and authorization system is **well-architected** with:
- Clear separation of concerns
- Flexible permission model
- Good security practices (password hashing, session management)

**Priority Improvements:**
1. Implement subtree permission check
2. Add permission caching
3. Standardize permission checking patterns
4. Consider token refresh mechanism

The system provides a solid foundation for a genealogy application with complex permission requirements.

