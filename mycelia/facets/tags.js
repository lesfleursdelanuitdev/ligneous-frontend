/**
 * Tags Facet
 * Handles tag management (global and user tags, tagging entities)
 * Uses Mycelia Kernel Plugin System for reactive state management
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import { config } from '../../config/index.js';

const initialState = {
  loading: false,
  error: null,
  tags: [],
  globalTags: [],
  currentTag: null,
};

/**
 * Tags Facet Hook
 */
export const useTags = createHook({
  kind: 'tags',
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
        listeners.emit('tags:stateChanged', {
          type: 'tags:stateChanged',
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
     * List tags (user tags + global tags)
     */
    const listTags = async () => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch('/tags');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to list tags');
        }

        const data = await response.json();
        const allTags = data.data || [];
        
        state.tags = allTags.filter(t => !t.isGlobal);
        state.globalTags = allTags.filter(t => t.isGlobal);
        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('tags:listed', {
            type: 'tags:listed',
            body: { tags: state.tags, globalTags: state.globalTags },
          });
        }

        return { tags: state.tags, globalTags: state.globalTags };
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * List global tags
     */
    const listGlobalTags = async () => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch('/tags/global');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to list global tags');
        }

        const data = await response.json();
        state.globalTags = data.data || [];
        state.loading = false;
        emitStateChange();

        return state.globalTags;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Create user tag
     */
    const createTag = async (tagData) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch('/tags', {
          method: 'POST',
          body: JSON.stringify(tagData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create tag');
        }

        const data = await response.json();
        const tag = data.data;

        state.tags.push(tag);
        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('tags:created', {
            type: 'tags:created',
            body: { tag },
          });
        }

        return tag;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Create global tag (admin only)
     */
    const createGlobalTag = async (tagData) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch('/tags/global', {
          method: 'POST',
          body: JSON.stringify(tagData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create global tag');
        }

        const data = await response.json();
        const tag = data.data;

        state.globalTags.push(tag);
        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('tags:global:created', {
            type: 'tags:global:created',
            body: { tag },
          });
        }

        return tag;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Get tag details
     */
    const getTag = async (tagId) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(`/tags/${tagId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to get tag');
        }

        const data = await response.json();
        state.currentTag = data.data;
        state.loading = false;
        emitStateChange();

        return state.currentTag;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Update tag
     */
    const updateTag = async (tagId, tagData) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(`/tags/${tagId}`, {
          method: 'PUT',
          body: JSON.stringify(tagData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update tag');
        }

        const data = await response.json();
        const tag = data.data;

        // Update in appropriate list
        if (tag.isGlobal) {
          const index = state.globalTags.findIndex(t => t.id === tagId);
          if (index !== -1) {
            state.globalTags[index] = tag;
          }
        } else {
          const index = state.tags.findIndex(t => t.id === tagId);
          if (index !== -1) {
            state.tags[index] = tag;
          }
        }

        if (state.currentTag?.id === tagId) {
          state.currentTag = tag;
        }

        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('tags:updated', {
            type: 'tags:updated',
            body: { tag },
          });
        }

        return tag;
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Delete tag
     */
    const deleteTag = async (tagId) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(`/tags/${tagId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete tag');
        }

        // Remove from appropriate list
        state.tags = state.tags.filter(t => t.id !== tagId);
        state.globalTags = state.globalTags.filter(t => t.id !== tagId);

        if (state.currentTag?.id === tagId) {
          state.currentTag = null;
        }

        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('tags:deleted', {
            type: 'tags:deleted',
            body: { tagId },
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
     * Get tags for an entity
     */
    const getEntityTags = async (treeId, entityType, entityId) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(
          `/trees/${treeId}/entities/${entityType}/${entityId}/tags`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to get entity tags');
        }

        const data = await response.json();
        state.loading = false;
        emitStateChange();

        return data.data || { globalTags: [], userTags: [] };
      } catch (error) {
        state.error = error.message;
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    /**
     * Add tag to entity
     */
    const tagEntity = async (treeId, entityType, entityId, tagId, entityXref) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(
          `/trees/${treeId}/entities/${entityType}/${entityId}/tags`,
          {
            method: 'POST',
            body: JSON.stringify({ tagId, entityXref }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to tag entity');
        }

        const data = await response.json();
        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('tags:entity:tagged', {
            type: 'tags:entity:tagged',
            body: {
              treeId,
              entityType,
              entityId,
              tag: data.data,
            },
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
     * Remove tag from entity
     */
    const untagEntity = async (treeId, entityType, entityId, tagId) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const response = await authFetch(
          `/trees/${treeId}/entities/${entityType}/${entityId}/tags?tagId=${tagId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to untag entity');
        }

        state.loading = false;
        emitStateChange();

        if (listeners) {
          listeners.emit('tags:entity:untagged', {
            type: 'tags:entity:untagged',
            body: {
              treeId,
              entityType,
              entityId,
              tagId,
            },
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
     * Get entities with a tag
     */
    const getTaggedItems = async (tagId, entityType = null) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const url = entityType
          ? `/tags/${tagId}/items?entityType=${entityType}`
          : `/tags/${tagId}/items`;
        const response = await authFetch(url);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to get tagged items');
        }

        const data = await response.json();
        state.loading = false;
        emitStateChange();

        return data.data || {};
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
      listTags,
      listGlobalTags,
      createTag,
      createGlobalTag,
      getTag,
      updateTag,
      deleteTag,
      getEntityTags,
      tagEntity,
      untagEntity,
      getTaggedItems,
      getState,
      clearError,
    };

    // Debug: Check which method is undefined
    for (const [name, method] of Object.entries(methods)) {
      if (method === undefined || method === null) {
        console.error(`Tags facet: method '${name}' is ${method}`);
        throw new Error(`Tags facet: method '${name}' is ${method}`);
      }
      if (typeof method !== 'function') {
        console.error(`Tags facet: method '${name}' is not a function, type: ${typeof method}`);
        throw new Error(`Tags facet: method '${name}' is not a function, type: ${typeof method}`);
      }
    }

    // Return facet using object pattern (same as auth facet)
    return new Facet('tags', '1.0.0').add(methods);
  },
});

export default useTags;

