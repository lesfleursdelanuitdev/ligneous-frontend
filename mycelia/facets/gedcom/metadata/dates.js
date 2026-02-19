/**
 * GEDCOM Dates Facet
 * Handles GEDCOM date data queries
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
  dates: [],
  currentDate: null,
  totalCount: 0
};

/**
 * GEDCOM Dates Facet Hook
 */
export const useGedcomDates = createHook({
  kind: 'gedcomDates',
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
    const emitStateChange = createEmitStateChange(listeners, 'gedcomDates', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    /**
     * List all dates in a file
     * @param {string} fileId - File ID
     * @param {Object} options - Query options (year, type)
     */
    const listDates = async (fileId, options = {}) => {
      setLoading(true);

      try {
        const queryString = buildQueryString(options);
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/dates${queryString}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to list dates');
        }

        const data = await response.json();
        state.dates = data.data?.dates || [];
        state.totalCount = data.data?.count || 0;
        setLoading(false);

        emitEvent('gedcomDates:loaded', { fileId, count: state.totalCount });
        return state.dates;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'listDates');
        throw error;
      }
    };

    /**
     * Get a specific date by ID
     * @param {string} fileId - File ID
     * @param {string} dateId - Date ID
     */
    const getDate = async (fileId, dateId) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/dates/${dateId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to get date');
        }

        const data = await response.json();
        state.currentDate = data.data?.date || null;
        setLoading(false);

        return {
          date: state.currentDate,
          events: data.data?.events || [],
          eventsCount: data.data?.events_count || 0
        };
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getDate');
        throw error;
      }
    };

    /**
     * Get events with a specific date
     * @param {string} fileId - File ID
     * @param {string} dateId - Date ID
     */
    const getDateEvents = async (fileId, dateId) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/dates/${dateId}/events`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to get date events');
        }

        const data = await response.json();
        setLoading(false);

        return {
          events: data.data?.events || [],
          count: data.data?.count || 0
        };
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getDateEvents');
        throw error;
      }
    };

    /**
     * Get dates by year range
     * @param {string} fileId - File ID
     * @param {number} startYear - Start year
     * @param {number} endYear - End year (optional)
     */
    const getDatesByYearRange = async (fileId, startYear, endYear) => {
      // Note: This could be extended when the API supports range queries
      // For now, we filter client-side or make multiple requests
      const allDates = await listDates(fileId);
      return allDates.filter(d => {
        if (!d.year) return false;
        if (endYear) {
          return d.year >= startYear && d.year <= endYear;
        }
        return d.year === startYear;
      });
    };

    /**
     * Clear error state
     */
    const clearError = () => {
      state.error = null;
      emitStateChange();
    };

    // Return the facet instance
    return new Facet('gedcomDates', {
      attach: true,
      source: import.meta.url
    }).add({
      listDates,
      getDate,
      getDateEvents,
      getDatesByYearRange,
      getState,
      clearError,
    });
  }
});

export default useGedcomDates;


