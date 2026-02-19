# Auth Hooks Explanation

## Difference Between `useFacet('auth')` and `useAuthState()`

### `useFacet('auth')` (or `useAuth`)
- **What it is**: Direct access to the auth facet from Mycelia
- **Returns**: The auth facet object with methods like `login()`, `logout()`, `register()`, `getState()`, etc.
- **State management**: You need to manually call `getState()` to get current state
- **Reactivity**: Not reactive by default - you need to set up your own event listeners
- **Use case**: When you need to call auth methods (login, logout) or want full control over state management

**Example:**
```javascript
const auth = useFacet('auth');
const state = auth.getState(); // One-time read, not reactive

// Manual event listening
useListener('auth:loggedIn', (event) => {
  // Handle login
});
```

### `useAuthState()`
- **What it is**: A custom hook that wraps `useFacet('auth')` and adds reactive state management
- **Returns**: `{ user, isAuthenticated, loading, error, authFacet }` - reactive state values
- **State management**: Automatically updates when auth state changes via events
- **Reactivity**: Fully reactive - state updates automatically when events fire
- **Use case**: When you want reactive auth state without manually managing listeners

**Example:**
```javascript
const { user, isAuthenticated, loading, authFacet } = useAuthState();
// user, isAuthenticated, loading are reactive - they update automatically
```

## When to Use Which

### Use `useFacet('auth')` when:
- You only need to call auth methods (login, logout, register)
- You want full control over event handling
- You're building a simple form that just needs to call `auth.login()`

### Use `useAuthState()` when:
- You need reactive auth state in your component
- You want the component to automatically update when auth state changes
- You're building components that display user information
- You want simpler code without manual event listener setup

## Current Issue

The LoginPage is using `useFacet('auth')` directly and manually setting up listeners. This should work, but there might be a timing issue where:
1. The event is emitted before the listener is registered
2. The listener isn't properly registered
3. The event format doesn't match what the listener expects

## Recommendation

For LoginPage, we could either:
1. **Keep current approach** but fix the event listener registration
2. **Switch to `useAuthState()`** for simpler reactive state management

The issue is likely that `useListener` from `mycelia-kernel-plugin/react` expects a dependency array, and we need to ensure the listener is properly registered before the event fires.

