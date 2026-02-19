'use client';

/**
 * useRequireAuth Hook
 * 
 * A hook that ensures the user is authenticated before rendering protected content.
 * Redirects to login if not authenticated.
 * Uses useAuthState for reactive auth state (no duplicate state management).
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.redirectTo - Where to redirect if not authenticated (default: '/login')
 * @param {boolean} options.requireSuperuser - Whether to require superuser access (default: false)
 * @param {string} options.superuserRedirectTo - Where to redirect if not superuser (default: '/dashboard')
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from './useAuthState';

export function useRequireAuth(options = {}) {
  // Support legacy string argument for redirectTo
  const config = typeof options === 'string' 
    ? { redirectTo: options }
    : options;
  
  const {
    redirectTo = '/login',
    requireSuperuser = false,
    superuserRedirectTo = '/dashboard',
  } = config;

  const router = useRouter();
  const { user, isAuthenticated, loading, authFacet } = useAuthState();
  
  // Track if we've already redirected to prevent multiple redirects
  const hasRedirectedRef = useRef(false);
  const lastAuthStateRef = useRef({ isAuthenticated: false, loading: true, userId: null, isSuperuser: false });

  // Handle authentication checks and redirects
  useEffect(() => {
    // Wait for initial load to complete
    if (loading) {
      console.log('[useRequireAuth] Still loading, waiting...');
      hasRedirectedRef.current = false;
      return;
    }

    // Extract values we care about (inside effect to ensure consistent dependency array)
    const userId = user?.id ?? null;
    const isSuperuser = Boolean(user?.isWebsiteOwner);
    
    // Check if auth state actually changed (prevent unnecessary checks)
    const currentAuthState = {
      isAuthenticated,
      loading,
      userId,
      isSuperuser,
    };
    
    const authStateChanged = 
      lastAuthStateRef.current.isAuthenticated !== currentAuthState.isAuthenticated ||
      lastAuthStateRef.current.loading !== currentAuthState.loading ||
      lastAuthStateRef.current.userId !== currentAuthState.userId ||
      lastAuthStateRef.current.isSuperuser !== currentAuthState.isSuperuser;

    if (!authStateChanged && hasRedirectedRef.current) {
      // State hasn't changed and we've already handled it
      return;
    }

    lastAuthStateRef.current = currentAuthState;

    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      if (!hasRedirectedRef.current) {
        console.log('[useRequireAuth] Not authenticated, redirecting to', redirectTo);
        hasRedirectedRef.current = true;
        router.push(redirectTo);
      }
      return;
    }

    // Check superuser requirement
    if (requireSuperuser && !isSuperuser) {
      if (!hasRedirectedRef.current) {
        console.log('[useRequireAuth] Superuser required but user is not superuser, redirecting to', superuserRedirectTo);
        hasRedirectedRef.current = true;
        router.push(superuserRedirectTo);
      }
      return;
    }

    // User is authenticated and meets requirements
    console.log('[useRequireAuth] User authenticated and authorized', {
      userId: user?.id,
      username: user?.username,
      isSuperuser,
      requireSuperuser,
    });
    hasRedirectedRef.current = false; // Reset redirect flag when authorized
  }, [isAuthenticated, loading, user, requireSuperuser, redirectTo, superuserRedirectTo, router]);

  // Reset redirect flag when user logs out (handled by useAuthState listener)
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      hasRedirectedRef.current = false;
    }
  }, [isAuthenticated, loading]);

  return {
    isReady: isAuthenticated && !loading && (!requireSuperuser || user?.isWebsiteOwner),
    user,
    isAuthenticated,
    isSuperuser: user?.isWebsiteOwner === true,
  };
}

export default useRequireAuth;

