/**
 * GEDCOM Families Facet
 * Handles family queries within GEDCOM files
 * Uses Mycelia Kernel Plugin System for reactive state management
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent,
  createEmitStateChange,
  handleApiError,
  createLoadingUpdater,
  buildQueryString
} from '../../../utils/gedcom-api.js';

// Initial state
const initialState = {
  loading: false,
  error: null,
  families: [],
  currentFamily: null
};

/**
 * GEDCOM Families Facet Hook
 */
export const useGedcomFamilies = createHook({
  kind: 'gedcomFamilies',
  version: '1.0.0',
  required: ['listeners', 'auth'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    // Get configuration: goAPI for direct Go calls, api for Next.js app API
    const goConfig = ctx.config?.goAPI || {};
    const nextConfig = ctx.config?.api || {};
    const GO_API_URL = goConfig.baseURL || 'http://localhost:8090';
    const NEXT_API_URL = nextConfig.baseURL || (typeof window !== 'undefined' ? '' : '');

    const state = { ...initialState };

    // Get listeners facet reference
    const listeners = subsystem.find('listeners');
    const auth = subsystem.find('auth');

    // Create helper functions
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'gedcomFamilies', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    const getAuthHeaders = () => {
      const headers = {};
      if (auth && typeof auth.getState === 'function') {
        const token = auth.getState().token;
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      return headers;
    };

    // Normalize response: Go returns { data: { families, meta } }, proxy forwards as-is
    const normalizeFamiliesResponse = (data) => {
      const payload = data?.data ?? data;
      return {
        families: payload?.families ?? payload?.data?.families ?? [],
        meta: payload?.meta ?? data?.meta,
      };
    };

    /**
     * Get families by tree ID (uses Next.js API with auth and tree→file mapping)
     * Use this from app pages under /trees/[treeId]/...
     */
    const getFamiliesByTreeId = async (treeId, params = {}) => {
      if (!treeId) return { families: [], meta: {} };
      setLoading(true);

      try {
        const queryString = buildQueryString(params);
        const base = NEXT_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
        const url = `${base}/api/trees/${treeId}/families${queryString}`;

        const response = await fetch(url, { headers: getAuthHeaders() });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const msg = typeof data?.error === 'string' ? data.error : (data?.error?.message ?? data?.message ?? 'Failed to get families');
          throw new Error(msg);
        }

        const { families: list, meta } = normalizeFamiliesResponse(data);
        state.families = list;
        state.error = null;
        setLoading(false);

        emitEvent('gedcomFamilies:loaded', { count: list.length, total: meta?.total });

        return { families: list, meta };
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getFamiliesByTreeId');
        throw error;
      }
    };

    /**
     * Get families from a file (direct Go API call by fileId)
     */
    const getFamilies = async (fileId, params = {}) => {
      setLoading(true);

      try {
        const queryString = buildQueryString(params);
        const url = `${GO_API_URL}/api/v1/files/${fileId}/families${queryString}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || 'Failed to get families');
        }

        const data = await response.json();
        const { families: list, meta } = normalizeFamiliesResponse(data);

        state.families = list;
        setLoading(false);

        emitEvent('gedcomFamilies:loaded', {
          count: list.length,
          total: meta?.total,
        });

        return { families: list, meta };
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getFamilies');
        throw error;
      }
    };

    /**
     * Get a specific family
     */
    const getFamily = async (fileId, xref) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/families/${xref}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get family');
        }

        const data = await response.json();
        const family = data.data;

        state.currentFamily = family;
        setLoading(false);

        emitEvent('gedcomFamilies:family:loaded', { xref, family });

        return family;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getFamily');
        throw error;
      }
    };

    /**
     * Clear error state
     */
    const clearError = () => {
      state.error = null;
      emitStateChange();
    };

    // Return the facet instance
    return new Facet('gedcomFamilies', {
      attach: true,
      source: import.meta.url
    }).add({
      getFamilies,
      getFamiliesByTreeId,
      getFamily,
      getState,
      clearError,
    });
  }
});

export default useGedcomFamilies;

