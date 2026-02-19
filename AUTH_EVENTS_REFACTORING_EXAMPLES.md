# Auth Events Refactoring Examples

**Purpose:** Show how to refactor components from polling pattern to reactive event-based pattern

---

## Pattern Overview

### ❌ Current Pattern (Polling)
```javascript
// Components call getState() directly
const auth = useFacet('auth');
const state = auth.getState(); // One-time read, not reactive
```

### ✅ New Pattern (Reactive)
```javascript
// Components subscribe to events
const auth = useFacet('auth');
const [authState, setAuthState] = useState(auth?.getState() || {});

useListener('auth:stateChanged', (event) => {
  setAuthState(event.body);
});
```

---

## Example 1: Home Page (`app/page.js`)

### Current Code (Polling)
```javascript
'use client';
import { useMycelia, useFacet } from 'mycelia-kernel-plugin/react';
import Link from 'next/link';

export default function Home() {
  const system = useMycelia();
  const auth = useFacet('auth');

  return (
    <div>
      {auth ? (
        <div>
          {auth.getState().isAuthenticated ? (  // ❌ Polling on every render
            <div>
              <span>Logged in as: {auth.getState().user?.username}</span>
              <button onClick={() => auth.logout()}>Logout</button>
            </div>
          ) : (
            <div>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </div>
          )}
        </div>
      ) : (
        <div>Auth facet not loaded</div>
      )}
    </div>
  );
}
```

### Refactored Code (Reactive)
```javascript
'use client';
import { useState, useEffect } from 'react';
import { useMycelia, useFacet } from 'mycelia-kernel-plugin/react';
import { useListener } from '@/mycelia/MyceliaProvider';
import Link from 'next/link';

export default function Home() {
  const system = useMycelia();
  const auth = useFacet('auth');
  
  // Initialize state from current auth state
  const [authState, setAuthState] = useState(() => {
    return auth?.getState() || {
      user: null,
      isAuthenticated: false,
      loading: false,
    };
  });

  // Subscribe to auth state changes
  useListener('auth:stateChanged', (event) => {
    setAuthState(event.body);
  });

  // Also listen to specific login/logout events for immediate updates
  useListener('auth:loggedIn', (event) => {
    setAuthState(prev => ({
      ...prev,
      user: event.body.user,
      isAuthenticated: true,
      loading: false,
    }));
  });

  useListener('auth:loggedOut', () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
  });

  // Update state when auth facet becomes available
  useEffect(() => {
    if (auth) {
      setAuthState(auth.getState());
    }
  }, [auth]);

  return (
    <div>
      {auth ? (
        <div>
          {authState.isAuthenticated ? (  // ✅ Reactive state
            <div>
              <span>Logged in as: {authState.user?.username}</span>
              <button onClick={() => auth.logout()}>Logout</button>
            </div>
          ) : (
            <div>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </div>
          )}
        </div>
      ) : (
        <div>Auth facet not loaded</div>
      )}
    </div>
  );
}
```

---

## Example 2: Dashboard Layout (`components/layout/DashboardLayout.js`)

### Current Code (Polling)
```javascript
'use client';
import { useState, useEffect } from 'react';
import { useFacet } from 'mycelia-kernel-plugin/react';

export default function DashboardLayout({ children }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  // Get user from auth facet
  const authFacet = useFacet('auth');
  const authState = authFacet?.getState() || {};  // ❌ One-time read
  const user = authState.user || null;
  const isSuperuser = user?.isWebsiteOwner === true;

  // ... rest of component
}
```

### Refactored Code (Reactive)
```javascript
'use client';
import { useState, useEffect } from 'react';
import { useFacet } from 'mycelia-kernel-plugin/react';
import { useListener } from '@/mycelia/MyceliaProvider';

export default function DashboardLayout({ children }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Get auth facet
  const authFacet = useFacet('auth');
  
  // Reactive auth state
  const [authState, setAuthState] = useState(() => {
    return authFacet?.getState() || {
      user: null,
      isAuthenticated: false,
    };
  });

  // Subscribe to auth state changes
  useListener('auth:stateChanged', (event) => {
    setAuthState(event.body);
  });

  // Update when auth facet becomes available
  useEffect(() => {
    if (authFacet) {
      setAuthState(authFacet.getState());
    }
  }, [authFacet]);

  // Derived values
  const user = authState.user || null;
  const isSuperuser = user?.isWebsiteOwner === true;

  // ... rest of component (mobile detection, etc.)
}
```

---

## Example 3: useRequireAuth Hook (`hooks/useRequireAuth.js`)

### Current Code (Polling)
```javascript
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFacet } from 'mycelia-kernel-plugin/react';

export function useRequireAuth(options = {}) {
  const config = typeof options === 'string' 
    ? { redirectTo: options }
    : options;
  
  const {
    redirectTo = '/login',
    requireSuperuser = false,
    superuserRedirectTo = '/dashboard',
  } = config;

  const router = useRouter();
  const authFacet = useFacet('auth');
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!authFacet) return;

    const checkAuth = async () => {
      let currentUser = null;
      const state = authFacet.getState();  // ❌ Polling
      
      if (state.isAuthenticated && state.user) {
        currentUser = state.user;
      } else if (!state.isAuthenticated && !state.loading) {
        try {
          currentUser = await authFacet.getCurrentUser();
        } catch (error) {
          console.error('Auth check failed:', error);
        }
      }

      if (!currentUser) {
        const finalState = authFacet.getState();  // ❌ Polling again
        if (!finalState.isAuthenticated) {
          router.push(redirectTo);
          return;
        }
        currentUser = finalState.user;
      }

      if (requireSuperuser && !currentUser?.isWebsiteOwner) {
        router.push(superuserRedirectTo);
        return;
      }

      setUser(currentUser);
      setIsReady(true);
    };

    checkAuth();
  }, [authFacet, router, redirectTo, requireSuperuser, superuserRedirectTo]);

  return {
    isReady,
    user,
    isAuthenticated: !!user,
    isSuperuser: user?.isWebsiteOwner === true,
  };
}
```

### Refactored Code (Reactive)
```javascript
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFacet } from 'mycelia-kernel-plugin/react';
import { useListener } from '@/mycelia/MyceliaProvider';

export function useRequireAuth(options = {}) {
  const config = typeof options === 'string' 
    ? { redirectTo: options }
    : options;
  
  const {
    redirectTo = '/login',
    requireSuperuser = false,
    superuserRedirectTo = '/dashboard',
  } = config;

  const router = useRouter();
  const authFacet = useFacet('auth');
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState(() => {
    return authFacet?.getState() || {
      user: null,
      isAuthenticated: false,
      loading: false,
    };
  });

  // Subscribe to auth state changes
  useListener('auth:stateChanged', (event) => {
    setAuthState(event.body);
  });

  // Handle login event
  useListener('auth:loggedIn', (event) => {
    setAuthState(prev => ({
      ...prev,
      user: event.body.user,
      isAuthenticated: true,
      loading: false,
    }));
  });

  // Handle logout event - redirect immediately
  useListener('auth:loggedOut', () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
    setUser(null);
    setIsReady(false);
    router.push(redirectTo);
  });

  // Check auth and update user state
  const checkAuth = useCallback(async () => {
    if (!authFacet) {
      setIsReady(false);
      return;
    }

    // If authenticated, use current user
    if (authState.isAuthenticated && authState.user) {
      const currentUser = authState.user;
      
      // Check superuser requirement
      if (requireSuperuser && !currentUser?.isWebsiteOwner) {
        router.push(superuserRedirectTo);
        setIsReady(false);
        return;
      }

      setUser(currentUser);
      setIsReady(true);
      return;
    }

    // If not authenticated and not loading, try to get user
    if (!authState.isAuthenticated && !authState.loading) {
      try {
        const currentUser = await authFacet.getCurrentUser();
        if (currentUser) {
          if (requireSuperuser && !currentUser?.isWebsiteOwner) {
            router.push(superuserRedirectTo);
            setIsReady(false);
            return;
          }
          setUser(currentUser);
          setIsReady(true);
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    }

    // Not authenticated - redirect
    if (!authState.loading) {
      router.push(redirectTo);
      setIsReady(false);
    }
  }, [authFacet, authState, requireSuperuser, superuserRedirectTo, redirectTo, router]);

  // Check auth when state changes
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Initial check when auth facet becomes available
  useEffect(() => {
    if (authFacet) {
      setAuthState(authFacet.getState());
      checkAuth();
    }
  }, [authFacet, checkAuth]);

  return {
    isReady,
    user,
    isAuthenticated: !!user,
    isSuperuser: user?.isWebsiteOwner === true,
  };
}
```

---

## Example 4: Login Page (`app/login/page.js`)

### Current Code (No Event Listening)
```javascript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFacet } from 'mycelia-kernel-plugin/react';

export default function LoginPage() {
  const router = useRouter();
  const auth = useFacet('auth');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await auth.login(username, password);
      router.push('/dashboard');  // ❌ Manual redirect, no event listening
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

### Refactored Code (Reactive)
```javascript
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFacet } from 'mycelia-kernel-plugin/react';
import { useListener } from '@/mycelia/MyceliaProvider';

export default function LoginPage() {
  const router = useRouter();
  const auth = useFacet('auth');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Listen to login success event - redirect automatically
  useListener('auth:loggedIn', (event) => {
    router.push('/dashboard');
  });

  // Listen to auth state changes for loading state
  useListener('auth:stateChanged', (event) => {
    if (event.body.loading !== undefined) {
      setLoading(event.body.loading);
    }
    if (event.body.error) {
      setError(event.body.error);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth) {
      setError('Authentication system not available');
      setLoading(false);
      return;
    }

    try {
      await auth.login(username, password);
      // ✅ No manual redirect - useListener('auth:loggedIn') handles it
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
      setLoading(false);
    }
  };

  // ... rest of component
}
```

---

## Example 5: Register Page (`app/register/page.js`)

### Refactored Pattern
```javascript
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFacet } from 'mycelia-kernel-plugin/react';
import { useListener } from '@/mycelia/MyceliaProvider';

export default function RegisterPage() {
  const router = useRouter();
  const auth = useFacet('auth');
  const [formData, setFormData] = useState({ /* ... */ });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Listen to registration success - redirect to login
  useListener('auth:registered', (event) => {
    router.push('/login');
  });

  // Listen to auth state changes
  useListener('auth:stateChanged', (event) => {
    if (event.body.loading !== undefined) {
      setLoading(event.body.loading);
    }
    if (event.body.error) {
      setError(event.body.error);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await auth.register(username, email, password, name);
      // ✅ No manual redirect - useListener('auth:registered') handles it
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
      setLoading(false);
    }
  };

  // ... rest of component
}
```

---

## Example 6: Custom Hook for Reactive Auth State

### Create a new hook: `hooks/useAuthState.js`
```javascript
'use client';
import { useState, useEffect } from 'react';
import { useFacet } from 'mycelia-kernel-plugin/react';
import { useListener } from '@/mycelia/MyceliaProvider';

/**
 * Reactive hook for auth state
 * Automatically updates when auth state changes
 * 
 * @returns {Object} { user, isAuthenticated, loading, error, authFacet }
 */
export function useAuthState() {
  const authFacet = useFacet('auth');
  
  const [authState, setAuthState] = useState(() => {
    return authFacet?.getState() || {
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
  });

  // Subscribe to all auth state changes
  useListener('auth:stateChanged', (event) => {
    setAuthState(event.body);
  });

  // Handle login event
  useListener('auth:loggedIn', (event) => {
    setAuthState(prev => ({
      ...prev,
      user: event.body.user,
      isAuthenticated: true,
      loading: false,
      error: null,
    }));
  });

  // Handle logout event
  useListener('auth:loggedOut', () => {
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });

  // Update when auth facet becomes available
  useEffect(() => {
    if (authFacet) {
      setAuthState(authFacet.getState());
    }
  }, [authFacet]);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    error: authState.error,
    authFacet, // Expose facet for actions (login, logout, etc.)
  };
}
```

### Usage in Components
```javascript
'use client';
import { useAuthState } from '@/hooks/useAuthState';

export default function MyComponent() {
  const { user, isAuthenticated, loading, authFacet } = useAuthState();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <button onClick={() => authFacet.logout()}>Logout</button>
    </div>
  );
}
```

---

## Example 7: TopBar Component (`components/layout/TopBar.js`)

### Current Code
```javascript
export default function TopBar({ 
  user,  // ❌ Receives user as prop, not reactive
  isSuperuser,
  // ...
}) {
  // Component doesn't know when user logs out
}
```

### Refactored Code
```javascript
'use client';
import { useState, useEffect } from 'react';
import { useFacet } from 'mycelia-kernel-plugin/react';
import { useListener } from '@/mycelia/MyceliaProvider';

export default function TopBar({ 
  onNotificationClick,
  onSidebarToggle,
  isSidebarCollapsed,
  notificationCount = 3,
}) {
  const authFacet = useFacet('auth');
  const [user, setUser] = useState(null);
  const [isSuperuser, setIsSuperuser] = useState(false);

  // Subscribe to auth state changes
  useListener('auth:stateChanged', (event) => {
    setUser(event.body.user);
    setIsSuperuser(event.body.user?.isWebsiteOwner === true);
  });

  // Handle login
  useListener('auth:loggedIn', (event) => {
    setUser(event.body.user);
    setIsSuperuser(event.body.user?.isWebsiteOwner === true);
  });

  // Handle logout
  useListener('auth:loggedOut', () => {
    setUser(null);
    setIsSuperuser(false);
  });

  // Initial state
  useEffect(() => {
    if (authFacet) {
      const state = authFacet.getState();
      setUser(state.user);
      setIsSuperuser(state.user?.isWebsiteOwner === true);
    }
  }, [authFacet]);

  // ... rest of component
}
```

---

## Best Practices

### 1. Always Initialize State
```javascript
const [authState, setAuthState] = useState(() => {
  return authFacet?.getState() || defaultState;
});
```

### 2. Subscribe to Multiple Events
```javascript
// Subscribe to general state changes
useListener('auth:stateChanged', (event) => {
  setAuthState(event.body);
});

// Subscribe to specific events for immediate actions
useListener('auth:loggedIn', (event) => {
  // Handle login immediately
  router.push('/dashboard');
});

useListener('auth:loggedOut', () => {
  // Handle logout immediately
  router.push('/login');
});
```

### 3. Update State When Facet Becomes Available
```javascript
useEffect(() => {
  if (authFacet) {
    setAuthState(authFacet.getState());
  }
}, [authFacet]);
```

### 4. Use Custom Hooks for Reusability
```javascript
// Create useAuthState() hook
// Use it in all components that need auth state
```

### 5. Handle Loading States
```javascript
useListener('auth:stateChanged', (event) => {
  if (event.body.loading !== undefined) {
    setLoading(event.body.loading);
  }
});
```

---

## Migration Strategy

### Phase 1: Create Custom Hook
1. Create `hooks/useAuthState.js` (Example 6)
2. Test it in one component

### Phase 2: Refactor Core Components
1. `app/page.js` (home page)
2. `hooks/useRequireAuth.js` (most important)
3. `components/layout/DashboardLayout.js`

### Phase 3: Refactor Auth Pages
1. `app/login/page.js`
2. `app/register/page.js`

### Phase 4: Refactor Other Components
1. `components/layout/TopBar.js`
2. Any other components using auth state

---

## Benefits of Refactoring

1. **Reactive Updates**: Components update automatically when auth state changes
2. **Cross-Tab Sync**: Logout in one tab updates all tabs
3. **Better UX**: No manual redirects needed, events handle navigation
4. **Consistent Pattern**: All components use the same reactive pattern
5. **Less Code**: No need to manually check state in multiple places
6. **Event-Driven**: Follows Mycelia's event-driven architecture

---

## Summary

**Key Changes:**
- Replace `auth.getState()` polling with `useListener('auth:stateChanged', ...)`
- Subscribe to specific events (`auth:loggedIn`, `auth:loggedOut`) for immediate actions
- Use `useState` to store reactive auth state
- Create `useAuthState()` custom hook for reusability
- Remove manual redirects - let event listeners handle navigation

**Pattern:**
```javascript
const auth = useFacet('auth');
const [authState, setAuthState] = useState(auth?.getState() || defaultState);

useListener('auth:stateChanged', (event) => {
  setAuthState(event.body);
});
```

