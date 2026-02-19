'use client';
import { useState } from 'react';
import { useFacet, useListener } from 'mycelia-kernel-plugin/react';

/**
 * Reactive hook for auth state
 * Automatically updates when auth state changes
 * 
 * @returns {Object} { user, isAuthenticated, loading, error, authFacet }
 */
export function useAuthState() {
  const authFacet = useFacet('auth');
  
  // Initialize state from current auth facet state (if available)
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
    console.log('[useAuthState] Received auth:stateChanged', {
      isAuthenticated: event.body.isAuthenticated,
      hasUser: !!event.body.user,
      loading: event.body.loading,
      userId: event.body.user?.id,
    });
    setAuthState(event.body);
  });

  // Handle login event
  useListener('auth:loggedIn', (event) => {
    console.log('[useAuthState] Received auth:loggedIn', {
      userId: event.body.user?.id,
      username: event.body.user?.username,
    });
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
    console.log('[useAuthState] Received auth:loggedOut');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    error: authState.error,
    isSuperuser: authState.user?.isWebsiteOwner === true,
    authFacet, // Expose facet for actions (login, logout, etc.)
  };
}

export default useAuthState;

