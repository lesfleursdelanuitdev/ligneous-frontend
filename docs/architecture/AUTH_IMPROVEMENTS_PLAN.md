# Authentication and Authorization Improvements Plan

## Overview

This document outlines the implementation plan for:
1. **Subtree Permissions** - Implement `isInSubtree()` function
2. **Password Reset** - Email-based password reset flow
3. **Token Refresh** - Automatic token refresh mechanism
4. **User Content System** - User-owned content with privacy controls

---

## 1. Subtree Permissions Implementation

### Current State

**Problem:** `isInSubtree()` function in `lib/permissions/index.js` is a placeholder that always returns `false`, making subtree permissions non-functional.

**Current Code:**
```javascript
export async function isInSubtree(resourceId, subtreeRootXref, treeId) {
  // TODO: Implement subtree checking by querying Go API
  return false;
}
```

### Required Go API Endpoint

**Endpoint:** `GET /api/v1/files/{file_id}/individuals/{xref}/descendants`

**Status:** ✅ **Already implemented in Go API**

**Response Structure:**
```json
{
  "data": {
    "descendants": [
      {
        "xref": "@I0145@",
        "name": "Aaron Peter /Gonsalves/",
        // ... other fields
      }
    ],
    "meta": {
      "total": 4
    }
  }
}
```

**Query Parameters:**
- `generations` (optional): Limit number of generations (default: unlimited)

### Implementation Plan

#### Step 1: Create Helper Function in Tree Access Module

**File:** `lib/tree-access.js` (or create new `lib/subtree.js`)

```javascript
/**
 * Get all descendants of an individual (for subtree permission checking)
 * @param {string} fileId - Go API file_id
 * @param {string} subtreeRootXref - XREF of subtree root individual
 * @returns {Promise<string[]>} Array of XREFs of all descendants
 */
export async function getSubtreeDescendants(fileId, subtreeRootXref) {
  const GO_API_URL = config.api.goApi.baseURL;
  
  try {
    const response = await fetch(
      `${GO_API_URL}/api/v1/files/${fileId}/individuals/${subtreeRootXref}/descendants`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get descendants: ${response.statusText}`);
    }
    
    const data = await response.json();
    const descendants = data.data?.descendants || [];
    
    // Extract XREFs from descendants array
    return descendants.map(desc => desc.xref);
  } catch (error) {
    console.error('Error getting subtree descendants:', error);
    throw error;
  }
}
```

#### Step 2: Implement `isInSubtree()` Function

**File:** `lib/permissions/index.js`

```javascript
import { getFileIdFromTreeId } from '../tree-access.js';
import { getSubtreeDescendants } from '../subtree.js'; // or tree-access.js

/**
 * Check if a resource is within a subtree that the user has permission for
 * @param {string} resourceId - XREF of resource to check (e.g., 'I1', 'F2')
 * @param {string} subtreeRootXref - XREF of subtree root individual
 * @param {string} treeId - Frontend tree ID
 * @returns {Promise<boolean>} True if resource is in subtree
 */
export async function isInSubtree(resourceId, subtreeRootXref, treeId) {
  try {
    // Map treeId to fileId
    const fileId = await getFileIdFromTreeId(treeId);
    if (!fileId) {
      return false;
    }
    
    // Get all descendants of subtree root
    const descendants = await getSubtreeDescendants(fileId, subtreeRootXref);
    
    // Check if resourceId is in descendants
    // Note: resourceId might be an individual XREF (I1) or family XREF (F2)
    // For families, we need to check if any family member is in the subtree
    
    // For individuals: direct check
    if (descendants.includes(resourceId)) {
      return true;
    }
    
    // For families: check if any family member is in subtree
    // This requires an additional API call to get family members
    if (resourceId.startsWith('F')) {
      // TODO: Get family members and check if any are in descendants
      // For now, return false (can be enhanced later)
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking subtree membership:', error);
    return false; // Fail closed (no access on error)
  }
}
```

#### Step 3: Add Caching (Optional but Recommended)

**Problem:** Subtree permission checks may be called frequently, and fetching descendants on every check is inefficient.

**Solution:** Cache descendant lists with TTL.

```javascript
// lib/subtree-cache.js
const descendantCache = new Map(); // In-memory cache
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getSubtreeDescendantsCached(fileId, subtreeRootXref) {
  const cacheKey = `${fileId}:${subtreeRootXref}`;
  const cached = descendantCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.descendants;
  }
  
  const descendants = await getSubtreeDescendants(fileId, subtreeRootXref);
  descendantCache.set(cacheKey, {
    descendants,
    timestamp: Date.now()
  });
  
  return descendants;
}
```

#### Step 4: Handle Family XREFs in Subtree

**Challenge:** Families (F1, F2) need special handling - a family is "in subtree" if any member is in the subtree.

**Required Go API Endpoint:** `GET /api/v1/files/{file_id}/families/{xref}/members`

**Status:** Need to verify if this exists, or use individual endpoints.

**Implementation:**
```javascript
// For family XREFs, check if any family member is in subtree
if (resourceId.startsWith('F')) {
  const familyMembers = await getFamilyMembers(fileId, resourceId);
  const memberXrefs = [
    familyMembers.husband?.xref,
    familyMembers.wife?.xref,
    ...familyMembers.children?.map(c => c.xref) || []
  ].filter(Boolean);
  
  // Check if any member is in descendants
  return memberXrefs.some(xref => descendants.includes(xref));
}
```

### Testing Plan

1. **Unit Tests:**
   - Test `getSubtreeDescendants()` with valid/invalid XREFs
   - Test `isInSubtree()` with individual XREFs
   - Test `isInSubtree()` with family XREFs
   - Test caching behavior

2. **Integration Tests:**
   - Test permission check with subtree permission
   - Test permission check without subtree permission
   - Test error handling (API failure, invalid treeId)

---

## 2. Password Reset Implementation

### Current State

**Problem:** No password reset functionality exists. Users cannot recover forgotten passwords.

### Implementation Plan

#### Step 1: Database Schema

**Add to `prisma/schema.prisma`:**

```prisma
model PasswordResetToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  token     String   @unique @db.VarChar(255) // Secure random token
  expiresAt DateTime @map("expires_at") @db.Timestamptz(6)
  usedAt    DateTime? @map("used_at") @db.Timestamptz(6)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("password_reset_tokens")
}
```

**Add relation to User model:**
```prisma
model User {
  // ... existing fields
  passwordResetTokens PasswordResetToken[]
}
```

#### Step 2: API Routes

**File:** `app/api/auth/password-reset/request/route.js`

```javascript
// POST /api/auth/password-reset/request
// Request password reset (sends email)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { generatePasswordResetToken, sendPasswordResetEmail } from '@/lib/auth/password-reset';

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true }
    });
    
    // Don't reveal if user exists (security best practice)
    if (!user) {
      // Return success even if user doesn't exist (prevent email enumeration)
      return NextResponse.json({ 
        message: 'If an account exists, a password reset email has been sent.' 
      });
    }
    
    // Generate reset token
    const { token, expiresAt } = await generatePasswordResetToken(user.id);
    
    // Send email (implement this)
    await sendPasswordResetEmail(user.email, token);
    
    return NextResponse.json({ 
      message: 'If an account exists, a password reset email has been sent.' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/auth/password-reset/reset/route.js`

```javascript
// POST /api/auth/password-reset/reset
// Reset password with token

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { hashPassword } from '@/lib/auth';
import { verifyPasswordResetToken } from '@/lib/auth/password-reset';

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();
    
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    // Verify token
    const resetToken = await verifyPasswordResetToken(token);
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    
    // Hash new password
    const passwordHash = await hashPassword(newPassword);
    
    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    });
    
    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() }
    });
    
    // Revoke all existing sessions (force re-login)
    await prisma.session.updateMany({
      where: { userId: resetToken.userId },
      data: { isRevoked: true }
    });
    
    return NextResponse.json({ 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Step 3: Utility Functions

**File:** `lib/auth/password-reset.js`

```javascript
import crypto from 'crypto';
import { prisma } from '../database/prisma';

const TOKEN_EXPIRY_HOURS = 24; // 24 hours

/**
 * Generate a secure password reset token
 */
export async function generatePasswordResetToken(userId) {
  // Generate secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);
  
  // Create token record
  const resetToken = await prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });
  
  return { token, expiresAt };
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true }
  });
  
  if (!resetToken) {
    return null; // Token not found
  }
  
  if (resetToken.usedAt) {
    return null; // Token already used
  }
  
  if (resetToken.expiresAt < new Date()) {
    return null; // Token expired
  }
  
  return resetToken;
}

/**
 * Send password reset email
 * TODO: Implement with email service (SendGrid, AWS SES, etc.)
 */
export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  
  // TODO: Implement email sending
  // For now, log the URL (remove in production)
  console.log(`Password reset URL for ${email}: ${resetUrl}`);
  
  // Example with SendGrid:
  // await sgMail.send({
  //   to: email,
  //   from: 'noreply@ligneous.com',
  //   subject: 'Reset Your Password',
  //   html: `Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
  // });
}
```

#### Step 4: Frontend Pages

**File:** `app/reset-password/page.js`

```javascript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/password-reset/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }
      
      // Redirect to login
      router.push('/login?message=Password reset successfully');
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h1>Reset Password</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <p>{error}</p>}
        <button type="submit" disabled={loading}>
          Reset Password
        </button>
      </form>
    </div>
  );
}
```

**File:** `app/forgot-password/page.js` (Request reset)

```javascript
'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      setMessage(data.message || 'If an account exists, a password reset email has been sent.');
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h1>Forgot Password</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {message && <p>{message}</p>}
        <button type="submit" disabled={loading}>
          Send Reset Link
        </button>
      </form>
    </div>
  );
}
```

### Testing Plan

1. **Unit Tests:**
   - Test token generation
   - Test token verification (valid, expired, used)
   - Test password hashing

2. **Integration Tests:**
   - Test password reset request flow
   - Test password reset with valid token
   - Test password reset with invalid/expired token
   - Test session revocation after password reset

---

## 3. Token Refresh Mechanism

### Current State

**Problem:** JWT tokens expire after 7 days, requiring users to re-login. No automatic refresh mechanism exists.

### Implementation Plan

#### Option 1: Refresh Token Pattern (Recommended)

**Architecture:**
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie, used to get new access tokens

#### Step 1: Update Database Schema

**Add to `prisma/schema.prisma`:**

```prisma
model Session {
  // ... existing fields
  refreshTokenHash String?  @unique @map("refresh_token_hash") @db.VarChar(255)
  refreshExpiresAt DateTime? @map("refresh_expires_at") @db.Timestamptz(6)
}
```

#### Step 2: Update Auth Utilities

**File:** `lib/auth.js`

```javascript
// Add refresh token generation
export function generateRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
```

#### Step 3: Update Login/Register Routes

**File:** `app/api/auth/login/route.js`

```javascript
// After generating access token
const accessToken = generateToken(user.id);
const refreshToken = generateRefreshToken();
const refreshTokenHash = hashRefreshToken(refreshToken);

// Create session with refresh token
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

const refreshExpiresAt = new Date();
refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days

await prisma.session.create({
  data: {
    userId: user.id,
    tokenHash: hashToken(accessToken),
    refreshTokenHash,
    expiresAt,
    refreshExpiresAt,
    // ... other fields
  },
});

// Return both tokens
return NextResponse.json({
  user,
  token: accessToken, // Short-lived access token
  refreshToken, // Long-lived refresh token (client stores this)
});
```

#### Step 4: Create Refresh Token Endpoint

**File:** `app/api/auth/refresh/route.js`

```javascript
// POST /api/auth/refresh
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { generateToken, hashToken, hashRefreshToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    // Get refresh token from cookie or body
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value || 
                        (await request.json()).refreshToken;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 401 }
      );
    }
    
    // Verify refresh token
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const session = await prisma.session.findFirst({
      where: {
        refreshTokenHash,
        isRevoked: false,
        refreshExpiresAt: {
          gt: new Date(),
        },
      },
      include: { user: true },
    });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }
    
    // Generate new access token
    const newAccessToken = generateToken(session.userId);
    const newTokenHash = hashToken(newAccessToken);
    
    // Update session with new access token
    await prisma.session.update({
      where: { id: session.id },
      data: {
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        lastUsedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      token: newAccessToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Step 5: Client-Side Token Refresh

**File:** `mycelia/facets/auth.js`

```javascript
// Add auto-refresh logic
const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const { token } = await response.json();
    
    // Update access token
    storeToken(token);
    state.token = token;
    emitStateChange();
    
    return token;
  } catch (error) {
    // Refresh failed, logout user
    await logout();
    throw error;
  }
};

// Auto-refresh before expiration
const setupTokenRefresh = () => {
  // Refresh token 5 minutes before expiration (15 min token = refresh at 10 min)
  const refreshInterval = setInterval(async () => {
    if (state.token && state.isAuthenticated) {
      try {
        await refreshAccessToken();
      } catch (error) {
        console.error('Auto token refresh failed:', error);
      }
    }
  }, 10 * 60 * 1000); // Check every 10 minutes
  
  return () => clearInterval(refreshInterval);
};
```

#### Option 2: Extend Token Expiration (Simpler, Less Secure)

**Alternative:** Instead of refresh tokens, extend token expiration on use.

**Implementation:**
- On each API call, check if token expires soon (< 1 day)
- If so, generate new token and update session
- Return new token to client

**Pros:** Simpler implementation
**Cons:** Less secure (longer-lived tokens), requires API middleware

### Testing Plan

1. **Unit Tests:**
   - Test refresh token generation
   - Test token refresh with valid token
   - Test token refresh with invalid/expired token

2. **Integration Tests:**
   - Test auto-refresh before expiration
   - Test refresh on API call failure
   - Test logout on refresh failure

---

## 4. User Content System

### Requirements

1. **Users can create content** (posts, articles, notes, etc.)
2. **Users own their content** (only creator can edit/delete)
3. **Privacy controls:**
   - **Private**: Only user can see
   - **Followers Only**: User + their followers can see
   - **Public**: Everyone can see
4. **Content types:** Posts, articles, notes, media

### Current State

**Schema:** `UserContent` table already exists in `prisma/schema.prisma`

**Existing Schema:**
```prisma
model UserContent {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  treeId      String?  @map("tree_id") @db.Uuid
  contentType String   @map("content_type") @db.VarChar(50) // 'post', 'article', 'note'
  title       String?  @db.VarChar(255)
  content     String   @db.Text
  isPublic    Boolean  @default(false) @map("is_public")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  // ... relations
}
```

**Issue:** Missing privacy level field (private, followers, public)

### Implementation Plan

#### Step 1: Update Database Schema

**File:** `prisma/schema.prisma`

```prisma
enum PrivacyLevel {
  PRIVATE      // Only user
  FOLLOWERS    // User + followers
  PUBLIC       // Everyone
}

model UserContent {
  // ... existing fields
  privacyLevel PrivacyLevel @default(PRIVATE) @map("privacy_level")
  // ... rest of fields
}
```

#### Step 2: Create Permission Check Function

**File:** `lib/permissions/user-content.js`

```javascript
import { prisma } from '../database/prisma';

/**
 * Check if user can view content
 */
export async function canViewContent(userId, contentId) {
  const content = await prisma.userContent.findUnique({
    where: { id: contentId },
    include: { user: true }
  });
  
  if (!content) {
    return false; // Content doesn't exist
  }
  
  // Creator can always view
  if (content.userId === userId) {
    return true;
  }
  
  // Check privacy level
  switch (content.privacyLevel) {
    case 'PRIVATE':
      return false; // Only creator
      
    case 'FOLLOWERS':
      if (!userId) {
        return false; // Must be authenticated
      }
      // Check if user follows content creator
      const follow = await prisma.follow.findFirst({
        where: {
          followerId: userId,
          followingId: content.userId,
          isActive: true
        }
      });
      return !!follow;
      
    case 'PUBLIC':
      return true; // Everyone can view
      
    default:
      return false;
  }
}

/**
 * Check if user can edit content
 */
export async function canEditContent(userId, contentId) {
  const content = await prisma.userContent.findUnique({
    where: { id: contentId }
  });
  
  if (!content) {
    return false;
  }
  
  // Only creator can edit
  return content.userId === userId;
}

/**
 * Check if user can delete content
 */
export async function canDeleteContent(userId, contentId) {
  // Same as edit (only creator)
  return canEditContent(userId, contentId);
}
```

#### Step 3: Create API Routes

**File:** `app/api/user-content/route.js`

```javascript
// GET /api/user-content - List content (with privacy filtering)
// POST /api/user-content - Create content

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { canViewContent } from '@/lib/permissions/user-content';
import { prisma } from '@/lib/database/prisma';

export async function GET(request) {
  const user = await getAuthenticatedUser(request); // Optional (for public content)
  const { searchParams } = new URL(request.url);
  const privacy = searchParams.get('privacy'); // 'all', 'public', 'followers', 'private'
  const userId = searchParams.get('userId'); // Filter by creator
  
  const where = {};
  
  // Privacy filtering
  if (privacy === 'public') {
    where.privacyLevel = 'PUBLIC';
  } else if (privacy === 'followers' && user) {
    // Get users that current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: user.id, isActive: true },
      select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);
    where.userId = { in: followingIds };
    where.privacyLevel = { in: ['FOLLOWERS', 'PUBLIC'] };
  } else if (privacy === 'private' && user) {
    where.userId = user.id;
    where.privacyLevel = 'PRIVATE';
  } else if (user) {
    // Show user's own content + public content + followed users' content
    const following = await prisma.follow.findMany({
      where: { followerId: user.id, isActive: true },
      select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);
    
    where.OR = [
      { userId: user.id }, // Own content
      { privacyLevel: 'PUBLIC' }, // Public content
      { 
        userId: { in: followingIds },
        privacyLevel: { in: ['FOLLOWERS', 'PUBLIC'] }
      } // Followed users' content
    ];
  } else {
    // Unauthenticated: only public
    where.privacyLevel = 'PUBLIC';
  }
  
  // Filter by creator
  if (userId) {
    where.userId = userId;
  }
  
  const content = await prisma.userContent.findMany({
    where,
    include: {
      user: {
        select: { id: true, username: true, name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return NextResponse.json({ content });
}

export async function POST(request) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const body = await request.json();
  const { contentType, title, content, privacyLevel, treeId } = body;
  
  // Validate
  if (!contentType || !content) {
    return NextResponse.json(
      { error: 'Content type and content are required' },
      { status: 400 }
    );
  }
  
  // Create content
  const userContent = await prisma.userContent.create({
    data: {
      userId: user.id,
      contentType,
      title,
      content,
      privacyLevel: privacyLevel || 'PRIVATE',
      treeId: treeId || null
    },
    include: {
      user: {
        select: { id: true, username: true, name: true }
      }
    }
  });
  
  return NextResponse.json({ content: userContent }, { status: 201 });
}
```

**File:** `app/api/user-content/[id]/route.js`

```javascript
// GET /api/user-content/[id] - Get content
// PUT /api/user-content/[id] - Update content
// DELETE /api/user-content/[id] - Delete content

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { canViewContent, canEditContent, canDeleteContent } from '@/lib/permissions/user-content';
import { prisma } from '@/lib/database/prisma';

export async function GET(request, { params }) {
  const user = await getAuthenticatedUser(request); // Optional
  const { id } = params;
  
  // Check view permission
  const canView = await canViewContent(user?.id, id);
  if (!canView) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  const content = await prisma.userContent.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, username: true, name: true }
      }
    }
  });
  
  return NextResponse.json({ content });
}

export async function PUT(request, { params }) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const { id } = params;
  
  // Check edit permission
  const canEdit = await canEditContent(user.id, id);
  if (!canEdit) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  const body = await request.json();
  const { title, content, privacyLevel } = body;
  
  const updated = await prisma.userContent.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(privacyLevel !== undefined && { privacyLevel })
    },
    include: {
      user: {
        select: { id: true, username: true, name: true }
      }
    }
  });
  
  return NextResponse.json({ content: updated });
}

export async function DELETE(request, { params }) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const { id } = params;
  
  // Check delete permission
  const canDelete = await canDeleteContent(user.id, id);
  if (!canDelete) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  await prisma.userContent.delete({
    where: { id }
  });
  
  return NextResponse.json({ message: 'Content deleted' });
}
```

#### Step 4: Create Mycelia Facet

**File:** `mycelia/facets/user-content.js`

```javascript
'use client';

import { createHook, Facet } from 'mycelia-kernel-plugin';
import { config } from '../../config/index.js';

const API_URL = config.api.nextApi.baseURL;

export const useUserContent = createHook({
  kind: 'userContent',
  version: '1.0.0',
  required: ['listeners', 'auth'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = {
      content: [],
      loading: false,
      error: null,
    };

    const listeners = subsystem.find('listeners');
    const auth = subsystem.find('auth');

    const emitStateChange = () => {
      if (listeners && listeners.hasListeners()) {
        listeners.emit('userContent:stateChanged', {
          type: 'userContent:stateChanged',
          body: { ...state },
        });
      }
    };

    const getContent = async (filters = {}) => {
      state.loading = true;
      emitStateChange();

      try {
        const token = auth.getState().token;
        const queryParams = new URLSearchParams(filters);
        const url = `${API_URL}/user-content?${queryParams}`;

        const headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }

        const data = await response.json();
        state.content = data.content || [];
        state.loading = false;
        emitStateChange();

        return state.content;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    const createContent = async (contentData) => {
      state.loading = true;
      emitStateChange();

      try {
        const token = auth.getState().token;
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`${API_URL}/user-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(contentData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create content');
        }

        const data = await response.json();
        state.loading = false;
        emitStateChange();

        // Refresh content list
        await getContent();

        return data.content;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    const updateContent = async (id, updates) => {
      state.loading = true;
      emitStateChange();

      try {
        const token = auth.getState().token;
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`${API_URL}/user-content/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update content');
        }

        const data = await response.json();
        state.loading = false;
        emitStateChange();

        // Refresh content list
        await getContent();

        return data.content;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    const deleteContent = async (id) => {
      state.loading = true;
      emitStateChange();

      try {
        const token = auth.getState().token;
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`${API_URL}/user-content/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete content');
        }

        state.loading = false;
        emitStateChange();

        // Refresh content list
        await getContent();

        return true;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    return new Facet('userContent', '1.0.0').add({
      getState: () => ({ ...state }),
      getContent,
      createContent,
      updateContent,
      deleteContent,
    });
  },
});

export default useUserContent;
```

### Testing Plan

1. **Unit Tests:**
   - Test privacy level checks
   - Test view permission (private, followers, public)
   - Test edit/delete permission (only creator)

2. **Integration Tests:**
   - Test content creation
   - Test content viewing with different privacy levels
   - Test content editing (creator vs. non-creator)
   - Test content deletion (creator vs. non-creator)
   - Test followers-only visibility

---

## Implementation Priority

### Phase 1: Critical (Immediate)
1. ✅ **Subtree Permissions** - Required for permission system to work correctly
2. ✅ **Token Refresh** - Improves user experience (no forced re-login)

### Phase 2: Important (Next Sprint)
3. ✅ **Password Reset** - Essential for user account recovery
4. ✅ **User Content System** - Enables user-generated content

### Phase 3: Enhancements (Future)
5. Email service integration (SendGrid, AWS SES)
6. Content moderation
7. Content search
8. Content analytics

---

## Summary

### Subtree Permissions
- **Status:** Go API endpoint exists ✅
- **Implementation:** Create helper function, implement `isInSubtree()`, add caching
- **Estimated Time:** 4-6 hours

### Password Reset
- **Status:** Not implemented ❌
- **Implementation:** Database schema, API routes, email service, frontend pages
- **Estimated Time:** 8-12 hours

### Token Refresh
- **Status:** Not implemented ❌
- **Implementation:** Refresh token pattern, API endpoint, client-side auto-refresh
- **Estimated Time:** 6-8 hours

### User Content System
- **Status:** Schema exists, implementation needed ⚠️
- **Implementation:** Privacy levels, permission checks, API routes, Mycelia facet
- **Estimated Time:** 12-16 hours

**Total Estimated Time:** 30-42 hours

