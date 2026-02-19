# Architecture Decision: Auth Utilities Location

## Current Structure

### `lib/auth.js` (Server-side utilities)
- `hashPassword()` - Used by API routes
- `verifyPassword()` - Used by API routes
- `generateToken()` - Used by API routes
- `verifyToken()` - Used by API routes and middleware
- `hashToken()` - Used by API routes and middleware

### `mycelia/facets/auth.js` (Client-side facet)
- State management (user, token, isAuthenticated)
- Actions that make HTTP calls to API routes
- Client-side only

## Why Keep Them Separate?

### 1. **Server vs Client Separation**
- **API routes** (`app/api/auth/*/route.js`) run on the **server**
- **Mycelia facets** run on the **client** (browser)
- Server-side code cannot import client-side Mycelia facets
- The utilities are needed on the server for password hashing, JWT generation, etc.

### 2. **Different Responsibilities**
- `lib/auth.js`: **Pure utility functions** (no state, no side effects)
- `mycelia/facets/auth.js`: **State management and HTTP calls** (reactive state, API calls)

### 3. **Reusability**
- Utilities can be used by:
  - API routes
  - Middleware
  - Other server-side code
- Facet is only for client-side React components

## Alternative: Move to Facet?

If we moved utilities to the facet:
- ❌ API routes couldn't import them (server-side can't use Mycelia)
- ❌ Would need to export utilities separately anyway
- ❌ Breaks separation of concerns
- ✅ More "self-contained" (but at the cost of architecture)

## Recommendation

**Keep the current structure:**
- ✅ `lib/auth.js` - Server-side utilities (used by API routes)
- ✅ `mycelia/facets/auth.js` - Client-side state management (used by React components)
- ✅ Clear separation of server vs client code
- ✅ Each has a single responsibility

## Current Usage

### Server-side (API routes):
```javascript
// app/api/auth/register/route.js
import { hashPassword, generateToken, hashToken } from '@/lib/auth';
```

### Client-side (React components):
```javascript
// app/login/page.js
const auth = system?.facets?.auth;
await auth.login(username, password);
```

This separation is correct and follows Next.js best practices!


