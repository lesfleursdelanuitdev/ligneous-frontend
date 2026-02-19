/**
 * GEDCOM Places Facet
 * Handles GEDCOM place data queries
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
  places: [],
  currentPlace: null,
  totalCount: 0
};

/**
 * GEDCOM Places Facet Hook
 */
export const useGedcomPlaces = createHook({
  kind: 'gedcomPlaces',
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
    const emitStateChange = createEmitStateChange(listeners, 'gedcomPlaces', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    /**
     * List all places in a file
     * @param {string} fileId - File ID
     * @param {Object} options - Query options (country, name)
     */
    const listPlaces = async (fileId, options = {}) => {
      setLoading(true);

      try {
        const queryString = buildQueryString(options);
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/places${queryString}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to list places');
        }

        const data = await response.json();
        state.places = data.data?.places || [];
        state.totalCount = data.data?.count || 0;
        setLoading(false);

        emitEvent('gedcomPlaces:loaded', { fileId, count: state.totalCount });
        return state.places;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'listPlaces');
        throw error;
      }
    };

    /**
     * Get a specific place by ID
     * @param {string} fileId - File ID
     * @param {string} placeId - Place ID
     */
    const getPlace = async (fileId, placeId) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/places/${placeId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to get place');
        }

        const data = await response.json();
        state.currentPlace = data.data?.place || null;
        setLoading(false);

        return {
          place: state.currentPlace,
          events: data.data?.events || [],
          eventsCount: data.data?.events_count || 0
        };
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getPlace');
        throw error;
      }
    };

    /**
     * Get events at a specific place
     * @param {string} fileId - File ID
     * @param {string} placeId - Place ID
     */
    const getPlaceEvents = async (fileId, placeId) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/places/${placeId}/events`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to get place events');
        }

        const data = await response.json();
        setLoading(false);

        return {
          events: data.data?.events || [],
          count: data.data?.count || 0
        };
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getPlaceEvents');
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
    return new Facet('gedcomPlaces', {
      attach: true,
      source: import.meta.url
    }).add({
      listPlaces,
      getPlace,
      getPlaceEvents,
      getState,
      clearError,
    });
  }
});

export default useGedcomPlaces;


