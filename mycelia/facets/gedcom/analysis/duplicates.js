/**
 * GEDCOM Duplicates Facet
 * Handles duplicate detection within and across GEDCOM files
 * Uses Mycelia Kernel Plugin System for reactive state management
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent,
  createEmitStateChange,
  handleApiError,
  createLoadingUpdater
} from '../../../utils/gedcom-api.js';

// Initial state
const initialState = {
  loading: false,
  error: null,
  duplicates: [],
  comparisonResults: null
};

/**
 * GEDCOM Duplicates Facet Hook
 */
export const useGedcomDuplicates = createHook({
  kind: 'gedcomDuplicates',
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
    const emitStateChange = createEmitStateChange(listeners, 'gedcomDuplicates', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    /**
     * Find duplicates within a file
     */
    const findDuplicates = async (fileId, minScore = 0.8) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/duplicates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ min_score: minScore })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to find duplicates');
        }

        const data = await response.json();
        // API returns {data: {matches: [...], meta: {...}}}
        const duplicatesData = data.data || {};
        state.duplicates = duplicatesData.matches || [];
        setLoading(false);

        emitEvent('gedcomDuplicates:found', { 
          fileId, 
          minScore, 
          count: state.duplicates.length,
          total: duplicatesData.meta?.total_matches
        });

        return duplicatesData;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'findDuplicates');
        throw error;
      }
    };

    /**
     * Compare two files for duplicates
     */
    const compareFiles = async (fileId1, fileId2, minScore = 0.8) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/duplicates/compare`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            file_id1: fileId1,
            file_id2: fileId2,
            min_score: minScore
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to compare files');
        }

        const data = await response.json();
        // API returns {data: {matches: [...], meta: {...}}}
        const comparisonData = data.data || {};
        state.comparisonResults = comparisonData;
        setLoading(false);

        emitEvent('gedcomDuplicates:comparison:complete', {
          fileId1,
          fileId2,
          minScore,
          count: comparisonData.matches?.length || 0,
          total: comparisonData.meta?.total_matches
        });

        return state.comparisonResults;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'compareFiles');
        throw error;
      }
    };

    /**
     * Clear duplicates results
     */
    const clearDuplicates = () => {
      state.duplicates = [];
      emitStateChange();
    };

    /**
     * Clear comparison results
     */
    const clearComparisonResults = () => {
      state.comparisonResults = null;
      emitStateChange();
    };

    /**
     * Clear error state
     */
    const clearError = () => {
      state.error = null;
      emitStateChange();
    };

    // Return the facet instance
    return new Facet('gedcomDuplicates', {
      attach: true,
      source: import.meta.url
    }).add({
      findDuplicates,
      compareFiles,
      clearDuplicates,
      clearComparisonResults,
      getState,
      clearError,
    });
  }
});

export default useGedcomDuplicates;

