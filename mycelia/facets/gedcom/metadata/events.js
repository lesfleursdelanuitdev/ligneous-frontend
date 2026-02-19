/**
 * GEDCOM Events Facet
 * Handles GEDCOM event data queries
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
  events: [],
  currentEvent: null,
  totalCount: 0
};

/**
 * GEDCOM Events Facet Hook
 */
export const useGedcomEvents = createHook({
  kind: 'gedcomEvents',
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
    const emitStateChange = createEmitStateChange(listeners, 'gedcomEvents', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    /**
     * List all events in a file
     * @param {string} fileId - File ID
     * @param {Object} options - Query options (type, owner_xref, limit, offset)
     */
    const listEvents = async (fileId, options = {}) => {
      setLoading(true);

      try {
        const queryString = buildQueryString(options);
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/events${queryString}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to list events');
        }

        const data = await response.json();
        state.events = data.data?.events || [];
        state.totalCount = data.data?.total_count || data.data?.count || 0;
        setLoading(false);

        emitEvent('gedcomEvents:loaded', { fileId, count: state.totalCount });
        return state.events;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'listEvents');
        throw error;
      }
    };

    /**
     * Get a specific event by ID
     * @param {string} fileId - File ID
     * @param {string} eventId - Event ID
     */
    const getEvent = async (fileId, eventId) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/events/${eventId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to get event');
        }

        const data = await response.json();
        state.currentEvent = data.data || null;
        setLoading(false);

        return state.currentEvent;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getEvent');
        throw error;
      }
    };

    /**
     * Get events by type (BIRT, DEAT, MARR, etc.)
     * @param {string} fileId - File ID
     * @param {string} eventType - Event type
     */
    const getEventsByType = async (fileId, eventType) => {
      return listEvents(fileId, { type: eventType });
    };

    /**
     * Get events for a specific individual
     * @param {string} fileId - File ID
     * @param {string} xref - Individual XREF
     */
    const getIndividualEvents = async (fileId, xref) => {
      return listEvents(fileId, { owner_xref: xref, owner_type: 'INDIVIDUAL' });
    };

    /**
     * Get events for a specific family
     * @param {string} fileId - File ID
     * @param {string} xref - Family XREF
     */
    const getFamilyEvents = async (fileId, xref) => {
      return listEvents(fileId, { owner_xref: xref, owner_type: 'FAMILY' });
    };

    /**
     * Get timeline of events sorted by date
     * @param {string} fileId - File ID
     * @param {Object} options - Additional options
     */
    const getTimeline = async (fileId, options = {}) => {
      const events = await listEvents(fileId, options);
      // Sort by year (events from API should already be sorted, but ensure it)
      return events.sort((a, b) => {
        const yearA = a.year || 0;
        const yearB = b.year || 0;
        return yearA - yearB;
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
    return new Facet('gedcomEvents', {
      attach: true,
      source: import.meta.url
    }).add({
      listEvents,
      getEvent,
      getEventsByType,
      getIndividualEvents,
      getFamilyEvents,
      getTimeline,
      getState,
      clearError,
    });
  }
});

export default useGedcomEvents;


