/**
 * GEDCOM Individuals Facet
 * Handles individual queries and relationships within GEDCOM files
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
  individuals: [],
  currentIndividual: null,
  parents: [],
  children: [],
  siblings: [],
  spouses: [],
  searchResults: []
};

/**
 * GEDCOM Individuals Facet Hook
 */
export const useGedcomIndividuals = createHook({
  kind: 'gedcomIndividuals',
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
    const emitStateChange = createEmitStateChange(listeners, 'gedcomIndividuals', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    /**
     * Get individuals from a file
     */
    const getIndividuals = async (fileId, params = {}) => {
      setLoading(true);

      try {
        const queryString = buildQueryString(params);
        const url = `${GO_API_URL}/api/v1/files/${fileId}/individuals${queryString}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get individuals');
        }

        const data = await response.json();
        const individualsData = data.data;

        state.individuals = individualsData.individuals || [];
        setLoading(false);

        emitEvent('gedcomIndividuals:loaded', { count: state.individuals.length });

        return individualsData;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getIndividuals', {
          fileId,
          params,
        });
        // Also emit facet-specific error event
        emitEvent('gedcomIndividuals:error', {
          error: error.message || 'Failed to get individuals',
          action: 'getIndividuals',
          originalError: error,
          context: { fileId, params },
        });
        throw error;
      }
    };

    /**
     * Get a specific individual
     */
    const getIndividual = async (fileId, xref) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/individuals/${xref}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get individual');
        }

        const data = await response.json();
        const individual = data.data;

        state.currentIndividual = individual;
        setLoading(false);

        emitEvent('gedcomIndividuals:individual:loaded', { xref, individual });

        return individual;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getIndividual');
        throw error;
      }
    };

    /**
     * Search individuals with advanced criteria
     */
    const searchIndividuals = async (fileId, searchQuery) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/individuals/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchQuery)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to search individuals');
        }

        const data = await response.json();
        // API returns {data: {individuals: [...], meta: {...}}}
        const searchData = data.data || {};
        state.searchResults = searchData.individuals || [];
        setLoading(false);

        emitEvent('gedcomIndividuals:search:complete', { count: state.searchResults.length });

        return state.searchResults;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'searchIndividuals');
        throw error;
      }
    };

    /**
     * Get parents of an individual
     */
    const getParents = async (fileId, xref) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/individuals/${xref}/parents`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get parents');
        }

        const data = await response.json();
        state.parents = data.data || [];
        setLoading(false);

        emitEvent('gedcomIndividuals:parents:loaded', { xref, count: state.parents.length });

        return state.parents;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getParents');
        throw error;
      }
    };

    /**
     * Get children of an individual
     */
    const getChildren = async (fileId, xref) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/individuals/${xref}/children`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get children');
        }

        const data = await response.json();
        state.children = data.data || [];
        setLoading(false);

        emitEvent('gedcomIndividuals:children:loaded', { xref, count: state.children.length });

        return state.children;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getChildren');
        throw error;
      }
    };

    /**
     * Get siblings of an individual
     */
    const getSiblings = async (fileId, xref) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/individuals/${xref}/siblings`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get siblings');
        }

        const data = await response.json();
        state.siblings = data.data || [];
        setLoading(false);

        emitEvent('gedcomIndividuals:siblings:loaded', { xref, count: state.siblings.length });

        return state.siblings;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getSiblings');
        throw error;
      }
    };

    /**
     * Get spouses of an individual
     */
    const getSpouses = async (fileId, xref) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/individuals/${xref}/spouses`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get spouses');
        }

        const data = await response.json();
        state.spouses = data.data || [];
        setLoading(false);

        emitEvent('gedcomIndividuals:spouses:loaded', { xref, count: state.spouses.length });

        return state.spouses;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getSpouses');
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

    /**
     * Clear search results
     */
    const clearSearchResults = () => {
      state.searchResults = [];
      emitStateChange();
    };

    // Return the facet instance
    return new Facet('gedcomIndividuals', {
      attach: true,
      source: import.meta.url
    }).add({
      getIndividuals,
      getIndividual,
      searchIndividuals,
      getParents,
      getChildren,
      getSiblings,
      getSpouses,
      getState,
      clearError,
      clearSearchResults,
    });
  }
});

export default useGedcomIndividuals;

