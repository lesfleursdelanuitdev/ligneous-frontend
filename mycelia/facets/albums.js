/**
 * Albums Facet
 * Handles album management (CRUD, media, sharing)
 * Uses Mycelia Kernel Plugin System for reactive state management
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import { config } from '../../config/index.js';

const initialState = {
  loading: false,
  error: null,
  albums: [],
  currentAlbum: null,
};

/**
 * Albums Facet Hook
 */
export const useAlbums = createHook({
  kind: 'albums',
  version: '1.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = { ...initialState };

    // Get listeners facet reference
    const listeners = subsystem.find('listeners');

    /**
     * Emit state change event
     */
    const emitStateChange = () => {
      if (listeners && listeners.hasListeners()) {
        listeners.emit('albums:stateChanged', {
          type: 'albums:stateChanged',
          body: { ...state },
        });
      }
    };

    /**
     * Get auth token
     */
    const getAuthToken = () => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('auth_token');
      }
      return null;
    };

    /**
     * Get API URL - handle both server and client side
     */
    const getAPIUrl = () => {
      try {
        if (typeof window !== 'undefined') {
          // Client side: use client config
          const clientConfig = config.getClientConfig();
          return clientConfig?.api?.nextApi?.baseURL || config.api?.nextApi?.baseURL || '';
        }
        // Server side: use env directly
        return config.api?.nextApi?.baseURL || '';
      } catch (error) {
        // Fallback if config fails
        console.warn('Failed to get API URL from config:', error);
        return '';
      }
    };

    /**
     * Make authenticated API request
     */
    const authFetch = async (url, options = {}) => {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const apiUrl = getAPIUrl();
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }
      return fetch(`${apiUrl}${url}`, {
        ...options,
        headers,
      });
    };

    /**
     * List albums
     */
    const listAlbums = async (filter = null) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const url = filter ? `/albums?filter=${filter}` : '/albums';
        const response = await authFetch(url);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to list albums');
        }

        const data = await response.json();
        state.albums = data.data || [];
        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('albums:listed', {
            type: 'albums:listed',
            body: { albums: state.albums },
          });
        }

        return state.albums;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Create album
     */
    const createAlbum = async (albumData) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch('/albums', {
          method: 'POST',
          body: JSON.stringify(albumData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create album');
        }

        const data = await response.json();
        const album = data.data;

        state.albums.push(album);
        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('albums:created', {
            type: 'albums:created',
            body: { album },
          });
        }

        return album;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Get album details
     */
    const getAlbum = async (albumId) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(`/albums/${albumId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to get album');
        }

        const data = await response.json();
        state.currentAlbum = data.data;
        state.loading = false;
        emitStateChange();

        return state.currentAlbum;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Update album
     */
    const updateAlbum = async (albumId, albumData) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(`/albums/${albumId}`, {
          method: 'PUT',
          body: JSON.stringify(albumData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update album');
        }

        const data = await response.json();
        const album = data.data;

        // Update in albums list
        const index = state.albums.findIndex(a => a.id === albumId);
        if (index !== -1) {
          state.albums[index] = album;
        }

        if (state.currentAlbum?.id === albumId) {
          state.currentAlbum = album;
        }

        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('albums:updated', {
            type: 'albums:updated',
            body: { album },
          });
        }

        return album;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Delete album
     */
    const deleteAlbum = async (albumId) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(`/albums/${albumId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete album');
        }

        // Remove from albums list
        state.albums = state.albums.filter(a => a.id !== albumId);

        if (state.currentAlbum?.id === albumId) {
          state.currentAlbum = null;
        }

        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('albums:deleted', {
            type: 'albums:deleted',
            body: { albumId },
          });
        }

        return { success: true };
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Get album media (with enrichment from Go API)
     */
    const getAlbumMedia = async (albumId) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(`/albums/${albumId}/media`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to get album media');
        }

        const data = await response.json();
        state.loading = false;
        emitStateChange();

        return data.data || [];
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Add media to album
     */
    const addMediaToAlbum = async (albumId, fileId, mediaId, sortOrder) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(`/albums/${albumId}/media`, {
          method: 'POST',
          body: JSON.stringify({ fileId, mediaId, sortOrder }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to add media to album');
        }

        const data = await response.json();
        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('albums:media:added', {
            type: 'albums:media:added',
            body: { albumId, media: data.data },
          });
        }

        return data.data;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Remove media from album
     */
    const removeMediaFromAlbum = async (albumId, mediaId) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(`/albums/${albumId}/media/${mediaId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to remove media from album');
        }

        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('albums:media:removed', {
            type: 'albums:media:removed',
            body: { albumId, mediaId },
          });
        }

        return { success: true };
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Reorder media in album
     */
    const reorderAlbumMedia = async (albumId, mediaOrder) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(`/albums/${albumId}/media`, {
          method: 'PUT',
          body: JSON.stringify({ mediaOrder }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to reorder album media');
        }

        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('albums:media:reordered', {
            type: 'albums:media:reordered',
            body: { albumId, mediaOrder },
          });
        }

        return { success: true };
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Share album with user
     */
    const shareAlbum = async (albumId, userId, canEdit = false) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(`/albums/${albumId}/share`, {
          method: 'POST',
          body: JSON.stringify({ userId, canEdit }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to share album');
        }

        const data = await response.json();
        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('albums:shared', {
            type: 'albums:shared',
            body: { albumId, share: data.data },
          });
        }

        return data.data;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Unshare album
     */
    const unshareAlbum = async (albumId, userId) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(`/albums/${albumId}/share/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to unshare album');
        }

        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('albums:unshared', {
            type: 'albums:unshared',
            body: { albumId, userId },
          });
        }

        return { success: true };
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Get current state
     */
    const getState = () => ({ ...state });

    /**
     * Clear error
     */
    const clearError = () => {
      state.error = null;
      emitStateChange();
    };

    // Build methods object and validate
    const methods = {
      listAlbums,
      createAlbum,
      getAlbum,
      updateAlbum,
      deleteAlbum,
      getAlbumMedia,
      addMediaToAlbum,
      removeMediaFromAlbum,
      reorderAlbumMedia,
      shareAlbum,
      unshareAlbum,
      getState,
      clearError,
    };

    // Debug: Check which method is undefined
    for (const [name, method] of Object.entries(methods)) {
      if (method === undefined || method === null) {
        console.error(`Albums facet: method '${name}' is ${method}`);
        throw new Error(`Albums facet: method '${name}' is ${method}`);
      }
      if (typeof method !== 'function') {
        console.error(`Albums facet: method '${name}' is not a function, type: ${typeof method}`);
        throw new Error(`Albums facet: method '${name}' is not a function, type: ${typeof method}`);
      }
    }

    // Return facet using object pattern (same as auth facet)
    return new Facet('albums', '1.0.0').add(methods);
  },
});

export default useAlbums;

