# Auth Infinite Loop Analysis

## Problem
`useRequireAuth` hook is causing an infinite re-render loop with the error:
```
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, 
but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
```

## Data Flow Analysis

### 1. Event Emission (auth.js)
- `auth.js` facet emits `auth:stateChanged` event whenever state changes
- Events are emitted from:
  - `login()` → `emitStateChange()` (line 205)
  - `logout()` → `emitStateChange()` (line 289)
  - `getCurrentUser()` → `emitStateChange()` (line 332)
  - `register()` → `emitStateChange()` (line 140)

### 2. Event Reception (useRequireAuth.js)
- **Line 45-54**: `useListener('auth:stateChanged', ...)` handler calls `setAuthState(event.body)`
- **Line 57-70**: `useListener('auth:loggedIn', ...)` handler calls `setAuthState(prev => ({ ...prev, ... }))`
- **Line 73-83**: `useListener('auth:loggedOut', ...)` handler calls `setAuthState({ ... })`

### 3. The Infinite Loop Chain

```
1. auth:stateChanged event emitted
   ↓
2. useListener handler calls setAuthState(event.body)
   ↓
3. authState object reference changes (even if values are same)
   ↓
4. checkAuth useCallback depends on authState (line 156)
   ↓
5. checkAuth function is recreated (new reference)
   ↓
6. useEffect(() => { checkAuth(); }, [checkAuth]) runs (line 159)
   ↓
7. checkAuth() executes
   ↓
8. If authenticated, calls setUser(currentUser) (line 118)
   ↓
9. setUser doesn't trigger events, BUT...
   ↓
10. If getCurrentUser() is called (line 127), it emits auth:stateChanged again
    ↓
11. Loop repeats from step 1
```

## Root Causes

### Cause 1: `checkAuth` depends on entire `authState` object
**Location**: `useRequireAuth.js:156`
```javascript
const checkAuth = useCallback(async () => {
  // ... uses authState.isAuthenticated, authState.user, authState.loading
}, [authFacet, authState, requireSuperuser, superuserRedirectTo, redirectTo, router]);
```

**Problem**: 
- `authState` is an object that gets a new reference on every `setAuthState()` call
- Even if the values are the same, the object reference changes
- This causes `checkAuth` to be recreated on every `auth:stateChanged` event
- Which triggers the `useEffect` that depends on `checkAuth`

### Cause 2: Multiple `useEffect` hooks calling `checkAuth`
**Location**: `useRequireAuth.js:159-169`
```javascript
// Effect 1: Runs when checkAuth changes
useEffect(() => {
  checkAuth();
}, [checkAuth]);

// Effect 2: Runs when authFacet or checkAuth changes
useEffect(() => {
  if (authFacet) {
    setAuthState(authFacet.getState());
    checkAuth();
  }
}, [authFacet, checkAuth]);
```

**Problem**:
- Both effects call `checkAuth()`
- Effect 2 also calls `setAuthState()`, which might trigger more events
- This creates a double-trigger scenario

### Cause 3: `getCurrentUser()` might emit events during `checkAuth`
**Location**: `useRequireAuth.js:127`
```javascript
const currentUser = await authFacet.getCurrentUser();
```

**Problem**:
- `getCurrentUser()` in `auth.js` calls `emitStateChange()` (line 332)
- This emits `auth:stateChanged` event
- Which triggers the `useListener` handler
- Which calls `setAuthState()`
- Which recreates `checkAuth`
- Which triggers the `useEffect`
- Creating an infinite loop

### Cause 4: Redundant state management
**Location**: `useRequireAuth.js:36-42, 102-121`
```javascript
const [authState, setAuthState] = useState(...);
const [user, setUser] = useState(null);

// Later in checkAuth:
if (authState.isAuthenticated && authState.user) {
  setUser(currentUser); // Redundant - user is already in authState
}
```

**Problem**:
- `useRequireAuth` maintains its own `authState` and `user` state
- But `authState` already contains `user`
- This creates duplicate state that needs to be kept in sync
- `setUser()` doesn't trigger events, but it's still redundant

## Simplification Opportunities

### 1. Use `useAuthState` instead of duplicating state
- `useAuthState` already provides reactive auth state
- `useRequireAuth` should use `useAuthState` instead of managing its own state
- This eliminates the need for `useListener` in `useRequireAuth`

### 2. Make `checkAuth` depend on specific values, not the entire object
Instead of:
```javascript
}, [authFacet, authState, ...]);
```

Use:
```javascript
}, [authFacet, authState.isAuthenticated, authState.user?.id, authState.loading, ...]);
```

### 3. Remove redundant `useEffect` hooks
- Consolidate the two `useEffect` hooks into one
- Only call `checkAuth()` when necessary (not on every state change)

### 4. Prevent `getCurrentUser()` from emitting events during initial check
- Add a flag to prevent event emission during initial auth check
- Or, check if user is already in state before calling `getCurrentUser()`

## Recommended Solution

**Simplify `useRequireAuth` to use `useAuthState`:**

```javascript
export function useRequireAuth(options = {}) {
  const { user, isAuthenticated, loading, authFacet } = useAuthState();
  const router = useRouter();
  
  // Only check auth when necessary (not on every state change)
  useEffect(() => {
    if (!authFacet) return;
    if (loading) return; // Wait for initial load
    
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }
    
    if (requireSuperuser && !user?.isWebsiteOwner) {
      router.push(superuserRedirectTo);
      return;
    }
    
    setIsReady(true);
  }, [isAuthenticated, loading, user, requireSuperuser, redirectTo, superuserRedirectTo, router, authFacet]);
  
  return {
    isReady: isAuthenticated && !loading,
    user,
    isAuthenticated,
    isSuperuser: user?.isWebsiteOwner === true,
  };
}
```

This eliminates:
- Duplicate state management
- `useListener` handlers (handled by `useAuthState`)
- `checkAuth` callback (replaced with simple `useEffect`)
- Redundant `getCurrentUser()` calls
- Multiple `useEffect` hooks

## Current Architecture Issues

1. **State Duplication**: Both `useAuthState` and `useRequireAuth` manage auth state
2. **Event Chain**: Events → `setAuthState` → `checkAuth` recreation → `useEffect` → potential more events
3. **Object Reference Changes**: `authState` object reference changes even when values are the same
4. **Redundant API Calls**: `getCurrentUser()` might be called unnecessarily

## Next Steps

1. Refactor `useRequireAuth` to use `useAuthState` (eliminate duplicate state)
2. Remove `useListener` from `useRequireAuth` (handled by `useAuthState`)
3. Simplify `checkAuth` logic (no need for complex callback)
4. Test that login/logout still works correctly
5. Verify that redirects work as expected

