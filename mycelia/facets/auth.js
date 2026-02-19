/**
 * useAuth Hook
 * 
 * A Mycelia plugin hook that manages authentication state and provides
 * authentication actions (register, login, logout, getCurrentUser).
 * 
 * This hook is framework-agnostic and can be used with React, Vue, or any
 * other framework that integrates with the Mycelia Plugin System.
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import axios from 'axios';
import { config } from '../../config/index.js';

const API_URL = config.api.nextApi.baseURL;

export const useAuth = createHook({
  kind: 'auth',
  required: [], // No dependencies
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    // State is stored in closure (not reactive by default)
    // For reactive state, we'll use events to notify listeners
    const state = {
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };

    // Token refresh interval (will be set up after login)
    let refreshInterval = null;

    // Get listeners if available (for events)
    const listeners = subsystem.find('listeners');

    /**
     * Emit auth state change event
     */
    const emitStateChange = () => {
      if (listeners) {
        const listenersEnabled = listeners.hasListeners?.() || false;
        const eventData = {
          type: 'auth:stateChanged',
          body: {
            user: state.user,
            isAuthenticated: state.isAuthenticated,
            loading: state.loading,
          }
        };
        console.log('[Auth] Emitting auth:stateChanged', {
          isAuthenticated: eventData.body.isAuthenticated,
          hasUser: !!eventData.body.user,
          loading: eventData.body.loading,
          userId: eventData.body.user?.id,
          username: eventData.body.user?.username,
          listenersEnabled,
          hasListenersFacet: !!listeners,
        });
        
        if (listenersEnabled) {
          try {
            const notified = listeners.emit('auth:stateChanged', eventData);
            console.log('[Auth] Successfully emitted auth:stateChanged', {
              notifiedCount: notified,
            });
          } catch (error) {
            console.error('[Auth] Error emitting auth:stateChanged', error);
          }
        } else {
          console.warn('[Auth] Listeners not enabled, cannot emit auth:stateChanged. Call system.listeners.enableListeners() first.');
        }
      } else {
        console.warn('[Auth] Listeners facet not available, cannot emit auth:stateChanged');
      }
    };

    /**
     * Load token from localStorage (client-side only)
     */
    const loadTokenFromStorage = () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
          state.token = storedToken;
          return storedToken;
        }
      }
      return null;
    };

    /**
     * Store token in localStorage (client-side only)
     */
    const storeToken = (token) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
      }
    };

    /**
     * Store refresh token in localStorage (client-side only)
     */
    const storeRefreshToken = (refreshToken) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_refresh_token', refreshToken);
      }
    };

    /**
     * Remove token from localStorage (client-side only)
     */
    const removeToken = () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
      }
    };

    /**
     * Load refresh token from localStorage (client-side only)
     */
    const loadRefreshTokenFromStorage = () => {
      if (typeof window !== 'undefined') {
        const storedRefreshToken = localStorage.getItem('auth_refresh_token');
        if (storedRefreshToken) {
          state.refreshToken = storedRefreshToken;
          return storedRefreshToken;
        }
      }
      return null;
    };

    /**
     * Refresh access token using refresh token
     */
    const refreshAccessToken = async () => {
      const refreshToken = state.refreshToken || loadRefreshTokenFromStorage();
      
      if (!refreshToken) {
        console.warn('[Auth] No refresh token available');
        return null;
      }

      try {
        console.log('[Auth] Refreshing access token...');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        if (!response.data || !response.data.token) {
          throw new Error('Invalid refresh response');
        }

        const newToken = response.data.token;

        // Update token
        storeToken(newToken);
        state.token = newToken;
        emitStateChange();

        console.log('[Auth] Access token refreshed successfully');
        return newToken;
      } catch (error) {
        console.error('[Auth] Token refresh failed:', error);
        // Refresh failed, logout user
        await logout();
        return null;
      }
    };

    /**
     * Setup automatic token refresh
     * Refreshes token every 10 minutes (before 15-minute expiration)
     */
    const setupTokenRefresh = () => {
      // Clear existing interval
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }

      // Only setup if we have a refresh token
      if (!state.refreshToken && !loadRefreshTokenFromStorage()) {
        return;
      }

      // Refresh token every 10 minutes
      refreshInterval = setInterval(async () => {
        if (state.isAuthenticated && (state.refreshToken || loadRefreshTokenFromStorage())) {
          try {
            await refreshAccessToken();
          } catch (error) {
            console.error('[Auth] Auto token refresh failed:', error);
          }
        }
      }, 10 * 60 * 1000); // 10 minutes

      console.log('[Auth] Token auto-refresh setup complete');
    };

    /**
     * Clear token refresh interval
     */
    const clearTokenRefresh = () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    };

    /**
     * Register a new user
     */
    const register = async (username, email, password, name) => {
      console.log('[Auth] register() called', { username, email, hasPassword: !!password, name });
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await axios.post(`${API_URL}/auth/register`, {
          username,
          email,
          password,
          name,
        });

        const { user, token, refreshToken } = response.data;

        // Store tokens
        storeToken(token);
        if (refreshToken) {
          storeRefreshToken(refreshToken);
          state.refreshToken = refreshToken;
        }

        // Update state
        state.user = user;
        state.token = token;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;

        // Setup auto-refresh
        setupTokenRefresh();

        // Emit events
        emitStateChange();
        if (listeners) {
          const eventData = {
            type: 'auth:registered',
            body: { user }
          };
          console.log('[Auth] Emitting auth:registered', {
            userId: user.id,
            username: user.username,
            email: user.email,
          });
          try {
            listeners.emit('auth:registered', eventData);
            console.log('[Auth] Successfully emitted auth:registered event');
          } catch (error) {
            console.error('[Auth] Error emitting auth:registered event', error);
          }
        } else {
          console.warn('[Auth] Listeners facet not available, cannot emit auth:registered');
        }

        return { user, token };
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        console.error('[Auth] register() failed', { 
          username, 
          email, 
          error: errorMessage,
          status: error.response?.status 
        });
        state.error = errorMessage;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Login with username and password
     */
    const login = async (username, password) => {
      console.log('[Auth] login() called', { username, hasPassword: !!password });
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          username,
          password,
        });

        const { user, token, refreshToken } = response.data;

        // Store tokens
        storeToken(token);
        if (refreshToken) {
          storeRefreshToken(refreshToken);
          state.refreshToken = refreshToken;
        }

        // Update state
        state.user = user;
        state.token = token;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;

        // Setup auto-refresh
        setupTokenRefresh();

        // Emit events
        emitStateChange();
        
        // Emit the event if listeners are enabled
        if (listeners) {
          const listenersEnabled = listeners.hasListeners?.() || false;
          const eventData = {
            type: 'auth:loggedIn',
            body: { user }
          };
          console.log('[Auth] Emitting auth:loggedIn', {
            userId: user.id,
            username: user.username,
            email: user.email,
            hasListenersFacet: !!listeners,
            listenersEnabled,
          });
          
          if (listenersEnabled) {
            try {
              const notified = listeners.emit('auth:loggedIn', eventData);
              console.log('[Auth] Successfully emitted auth:loggedIn event', {
                notifiedCount: notified,
              });
            } catch (error) {
              console.error('[Auth] Error emitting auth:loggedIn event', error);
            }
          } else {
            console.warn('[Auth] Listeners not enabled, cannot emit auth:loggedIn. Call system.listeners.enableListeners() first.');
          }
        } else {
          console.warn('[Auth] Listeners facet not available, cannot emit auth:loggedIn');
        }

        return { user, token };
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        console.error('[Auth] login() failed', { 
          username, 
          error: errorMessage,
          status: error.response?.status 
        });
        state.error = errorMessage;
        state.loading = false;
        emitStateChange();
        
        // Emit error event for errors facet
        if (listeners && listeners.hasListeners()) {
          listeners.emit('auth:error', {
            type: 'auth:error',
            body: {
              error: errorMessage,
              action: 'login',
              originalError: error,
              context: { username },
            },
          });
        }
        
        throw error;
      }
    };

    /**
     * Logout current user
     */
    const logout = async () => {
      console.log('[Auth] logout() called', { 
        currentUser: state.user?.username,
        userId: state.user?.id 
      });
      state.loading = true;
      emitStateChange();

      try {
        if (state.token) {
          await axios.post(
            `${API_URL}/auth/logout`,
            {},
            {
              headers: {
                Authorization: `Bearer ${state.token}`,
              },
            }
          );
        }
      } catch (error) {
        console.error('Logout error:', error);
        // Continue with logout even if API call fails
      } finally {
        // Clear state
        removeToken();
        clearTokenRefresh();
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;

        // Emit events
        emitStateChange();
        if (listeners) {
          const eventData = {
            type: 'auth:loggedOut',
            body: {}
          };
          console.log('[Auth] Emitting auth:loggedOut');
          try {
            listeners.emit('auth:loggedOut', eventData);
            console.log('[Auth] Successfully emitted auth:loggedOut event');
          } catch (error) {
            console.error('[Auth] Error emitting auth:loggedOut event', error);
          }
        } else {
          console.warn('[Auth] Listeners facet not available, cannot emit auth:loggedOut');
        }
      }
    };

    /**
     * Get current user from API
     */
    const getCurrentUser = async () => {
      if (!state.token) {
        return null;
      }

      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${state.token}`,
          },
        });

        const { user } = response.data;
        state.user = user;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        emitStateChange();

        return user;
      } catch (error) {
        // Token invalid, clear it
        removeToken();
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null; // Don't show error for invalid token
        emitStateChange();

        return null;
      }
    };

    /**
     * Get current state (for reactive frameworks)
     */
    const getState = () => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      loading: state.loading,
      error: state.error,
    });

    return new Facet('auth', { attach: true, source: import.meta.url })
      .add({
        register,
        login,
        logout,
        getCurrentUser,
        refreshAccessToken,
        getState,
      })
      .onInit(async () => {
        console.log('[Auth] Facet initialized');
        // Load tokens from localStorage on init
        const token = loadTokenFromStorage();
        const refreshToken = loadRefreshTokenFromStorage();
        
        if (token) {
          console.log('[Auth] Token found in storage, fetching user');
          state.token = token;
          if (refreshToken) {
            state.refreshToken = refreshToken;
          }
          // Try to get user info
          await getCurrentUser();
          // Setup auto-refresh if we have refresh token
          if (refreshToken) {
            setupTokenRefresh();
          }
        } else {
          console.log('[Auth] No token in storage');
        }
      })
      .onDispose(async () => {
        // Cleanup if needed
        // Token is kept in localStorage for persistence
      });
  }
});
