/**
 * GEDCOM Sources Facet
 * Handles GEDCOM source data queries
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
  sources: [],
  currentSource: null,
  totalCount: 0
};

/**
 * GEDCOM Sources Facet Hook
 */
export const useGedcomSources = createHook({
  kind: 'gedcomSources',
  version: '1.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,
  
  fn: (ctx, api, subsystem) => {
    // Get configuration
    const config = ctx.config?.goAPI || {};
    const GO_API_URL = config.baseURL || 'http://localhost:8090';
    
    const state = { ...initialState };

    // Get listeners facet reference
    const listeners = subsystem.find('listeners');

    // Create helper functions
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'gedcomSources', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    /**
     * List all sources in a file
     * @param {string} fileId - File ID
     * @param {Object} options - Query options
     */
    const listSources = async (fileId, options = {}) => {
      setLoading(true);

      try {
        const queryString = buildQueryString(options);
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/sources${queryString}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to list sources');
        }

        const data = await response.json();
        state.sources = data.data?.sources || [];
        state.totalCount = data.data?.count || 0;
        setLoading(false);

        emitEvent('gedcomSources:loaded', { fileId, count: state.totalCount });
        return state.sources;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'listSources');
        throw error;
      }
    };

    /**
     * Get a specific source by XREF
     * @param {string} fileId - File ID
     * @param {string} xref - Source XREF
     */
    const getSource = async (fileId, xref) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/sources/${encodeURIComponent(xref)}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to get source');
        }

        const data = await response.json();
        state.currentSource = data.data || null;
        setLoading(false);

        return state.currentSource;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getSource');
        throw error;
      }
    };

    /**
     * Get citations for a specific source
     * @param {string} fileId - File ID
     * @param {string} xref - Source XREF
     */
    const getSourceCitations = async (fileId, xref) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/sources/${encodeURIComponent(xref)}/citations`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to get source citations');
        }

        const data = await response.json();
        setLoading(false);

        return {
          citations: data.data?.citations || [],
          count: data.data?.count || 0
        };
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getSourceCitations');
        throw error;
      }
    };

    /**
     * Search sources by title or author
     * @param {string} fileId - File ID
     * @param {string} searchTerm - Search term
     */
    const searchSources = async (fileId, searchTerm) => {
      const allSources = await listSources(fileId);
      const lowerSearch = searchTerm.toLowerCase();
      return allSources.filter(source => 
        source.title?.toLowerCase().includes(lowerSearch) ||
        source.author?.toLowerCase().includes(lowerSearch) ||
        source.abbreviation?.toLowerCase().includes(lowerSearch)
      );
    };

    /**
     * Clear error state
     */
    const clearError = () => {
      state.error = null;
      emitStateChange();
    };

    // Return the facet instance
    return new Facet('gedcomSources', {
      attach: true,
      source: import.meta.url
    }).add({
      listSources,
      getSource,
      getSourceCitations,
      searchSources,
      getState,
      clearError,
    });
  }
});

export default useGedcomSources;


