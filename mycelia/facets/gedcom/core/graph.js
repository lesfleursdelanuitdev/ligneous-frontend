/**
 * GEDCOM Graph Facet
 * Handles relationship queries, ancestors, descendants, and graph analytics
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
  relationship: null,
  ancestors: [],
  descendants: [],
  paths: null,
  metrics: null,
  centrality: {},  // Map of xref -> score
  mostConnected: []
};

/**
 * GEDCOM Graph Facet Hook
 */
export const useGedcomGraph = createHook({
  kind: 'gedcomGraph',
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
    const emitStateChange = createEmitStateChange(listeners, 'gedcomGraph', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    /**
     * Get relationship between two individuals
     */
    const getRelationship = async (fileId, xref1, xref2) => {
      setLoading(true);

      try {
        const response = await fetch(
          `${GO_API_URL}/api/v1/files/${fileId}/individuals/${xref1}/relationship/${xref2}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get relationship');
        }

        const data = await response.json();
        state.relationship = data.data;
        setLoading(false);

        emitEvent('gedcomGraph:relationship:calculated', { xref1, xref2, relationship: state.relationship });

        return state.relationship;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getRelationship');
        throw error;
      }
    };

    /**
     * Get paths between two individuals
     */
    const getPaths = async (fileId, xref1, xref2) => {
      setLoading(true);

      try {
        const response = await fetch(
          `${GO_API_URL}/api/v1/files/${fileId}/individuals/${xref1}/paths/${xref2}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get paths');
        }

        const data = await response.json();
        // API returns {data: {shortest_path: {nodes: [...], length: N, type: "..."}}}
        state.paths = data.data?.shortest_path || null;
        setLoading(false);

        emitEvent('gedcomGraph:paths:found', { 
          xref1, 
          xref2, 
          length: state.paths?.length || 0 
        });

        return state.paths;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getPaths');
        throw error;
      }
    };

    /**
     * Get ancestors of an individual
     */
    const getAncestors = async (fileId, xref, maxGenerations = 5) => {
      setLoading(true);

      try {
        const response = await fetch(
          `${GO_API_URL}/api/v1/files/${fileId}/individuals/${xref}/ancestors?max_generations=${maxGenerations}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get ancestors');
        }

        const data = await response.json();
        // API returns {data: {ancestors: [...], meta: {...}}}
        const ancestorsData = data.data || {};
        state.ancestors = ancestorsData.ancestors || [];
        setLoading(false);

        emitEvent('gedcomGraph:ancestors:loaded', { 
          xref, 
          maxGenerations, 
          count: state.ancestors.length,
          total: ancestorsData.meta?.total
        });

        return ancestorsData;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getAncestors');
        throw error;
      }
    };

    /**
     * Get descendants of an individual
     */
    const getDescendants = async (fileId, xref, maxGenerations = 5) => {
      setLoading(true);

      try {
        const response = await fetch(
          `${GO_API_URL}/api/v1/files/${fileId}/individuals/${xref}/descendants?max_generations=${maxGenerations}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get descendants');
        }

        const data = await response.json();
        // API returns {data: {descendants: [...], meta: {...}}}
        const descendantsData = data.data || {};
        state.descendants = descendantsData.descendants || [];
        setLoading(false);

        emitEvent('gedcomGraph:descendants:loaded', { 
          xref, 
          maxGenerations, 
          count: state.descendants.length,
          total: descendantsData.meta?.total
        });

        return descendantsData;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getDescendants');
        throw error;
      }
    };

    /**
     * Get graph metrics (diameter, density, path length, etc.)
     */
    const getMetrics = async (fileId) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/metrics`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get metrics');
        }

        const data = await response.json();
        state.metrics = data.data;
        setLoading(false);

        emitEvent('gedcomGraph:metrics:calculated', { metrics: state.metrics });

        return state.metrics;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getMetrics');
        throw error;
      }
    };

    /**
     * Get centrality measures for all individuals
     */
    const getCentrality = async (fileId, type = 'degree') => {
      setLoading(true);

      try {
        const queryString = buildQueryString({ type });
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/centrality${queryString}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get centrality');
        }

        const data = await response.json();
        // API returns flat map: {data: {"@I0001@": 4, "@I0002@": 8, ...}}
        state.centrality = data.data || {};
        setLoading(false);

        const count = Object.keys(state.centrality).length;
        emitEvent('gedcomGraph:centrality:calculated', { type, count });

        return state.centrality;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getCentrality');
        throw error;
      }
    };

    /**
     * Get most connected individuals
     */
    const getMostConnected = async (fileId, limit = 10, type = 'degree') => {
      setLoading(true);

      try {
        const queryString = buildQueryString({ limit, type });
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/most-connected${queryString}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get most connected');
        }

        const data = await response.json();
        state.mostConnected = data.data || [];
        setLoading(false);

        emitEvent('gedcomGraph:mostConnected:loaded', { limit, type, count: state.mostConnected.length });

        return state.mostConnected;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getMostConnected');
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
    return new Facet('gedcomGraph', {
      attach: true,
      source: import.meta.url
    }).add({
      getRelationship,
      getPaths,
      getAncestors,
      getDescendants,
      getMetrics,
      getCentrality,
      getMostConnected,
      getState,
      clearError,
    });
  }
});

export default useGedcomGraph;

