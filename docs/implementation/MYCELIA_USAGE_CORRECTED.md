# Mycelia Usage - Corrected Implementation

**Date:** 2026-01-23  
**Issue:** Initial implementation used incorrect API (`createFacet` doesn't exist)  
**Status:** ✅ Fixed

---

## Problem

The initial `useAuth` facet used `createFacet()`, which doesn't exist in Mycelia Kernel Plugin System.

**Incorrect:**
```javascript
export const useAuth = createFacet('auth', {
  state: { ... },
  actions: { ... }
});
```

---

## Solution

Use the correct Mycelia pattern:

1. **Use `createHook()`** to create a hook
2. **Return a `Facet` instance** with `.add()` for methods
3. **Use `.onInit()` and `.onDispose()`** for lifecycle

**Correct:**
```javascript
export const useAuth = createHook({
  kind: 'auth',
  required: [],
  attach: true,
  source: import.meta.url,
  
  fn: (ctx, api, subsystem) => {
    const state = { ... };
    
    return new Facet('auth', { attach: true, source: import.meta.url })
      .add({
        register,
        login,
        logout,
        getCurrentUser,
        getState,
      })
      .onInit(async () => {
        // Initialize
      })
      .onDispose(async () => {
        // Cleanup
      });
  }
});
```

---

## React Component Usage

### Before (Incorrect)
```javascript
const system = useMycelia();
const auth = system?.facets?.auth;
```

### After (Correct)
```javascript
import { useFacet } from 'mycelia-kernel-plugin/react';

const auth = useFacet('auth');
```

---

## Key Differences

### 1. Hook Creation
- ❌ `createFacet()` - doesn't exist
- ✅ `createHook()` - correct way to create hooks

### 2. State Management
- ❌ `this.state` - doesn't work (no `this` context)
- ✅ Closure variables - store state in closure

### 3. Accessing Facets
- ❌ `system.facets.auth` - may not work reliably
- ✅ `useFacet('auth')` - React hook for accessing facets
- ✅ `system.find('auth')` - Direct system access

### 4. Events
- ✅ Use `listeners` facet if available
- ✅ Emit events via `listeners.emit()`

---

## Corrected Files

1. ✅ `mycelia/facets/auth.js` - Rewritten using `createHook()` and `Facet`
2. ✅ `app/login/page.js` - Updated to use `useFacet('auth')`
3. ✅ `app/register/page.js` - Updated to use `useFacet('auth')`
4. ✅ `app/page.js` - Updated to use `useFacet('auth')`

---

## Pattern Summary

### Creating a Hook
```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin';

export const useMyFacet = createHook({
  kind: 'myFacet',
  required: ['listeners'], // Dependencies
  attach: true,
  source: import.meta.url,
  
  fn: (ctx, api, subsystem) => {
    // State in closure
    const state = { ... };
    
    // Get dependencies
    const listeners = subsystem.find('listeners');
    
    // Methods
    const myMethod = () => { ... };
    
    // Return Facet
    return new Facet('myFacet', { attach: true, source: import.meta.url })
      .add({
        myMethod,
      })
      .onInit(async () => {
        // Initialize
      })
      .onDispose(async () => {
        // Cleanup
      });
  }
});
```

### Using in React
```javascript
import { useFacet } from 'mycelia-kernel-plugin/react';

function MyComponent() {
  const myFacet = useFacet('myFacet');
  
  if (!myFacet) return <div>Loading...</div>;
  
  return <button onClick={() => myFacet.myMethod()}>Click</button>;
}
```

---

## References

- Mycelia examples: `/apps/mycelia-kernel-plugin-system/examples/todo-shared/src/todos.hook.js`
- React bindings: `/apps/mycelia-kernel-plugin-system/src/react/index.jsx`
- Core API: `/apps/mycelia-kernel-plugin-system/src/core/create-hook.js`

---

**Status:** ✅ All files corrected to use proper Mycelia API


