/**
 * GEDCOM Events Facet
 * Queries events via Next.js API routes (Prisma).
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent, createEmitStateChange,
  handleApiError, createLoadingUpdater, apiFetch, buildQueryString,
} from '../../../utils/gedcom-api.js';

const initialState = { loading: false, error: null, events: [], currentEvent: null, totalCount: 0 };

export const useGedcomEvents = createHook({
  kind: 'gedcomEvents',
  version: '2.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = { ...initialState };
    const listeners = subsystem.find('listeners');
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'gedcomEvents', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    const listEvents = async (treeId, options = {}) => {
      setLoading(true);
      try {
        const qs = buildQueryString(options);
        const result = await apiFetch(`/api/trees/${treeId}/events${qs}`);
        state.events = result.data || [];
        state.totalCount = result.pagination?.total ?? state.events.length;
        setLoading(false);
        emitEvent('gedcomEvents:loaded', { treeId, count: state.totalCount });
        return state.events;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'listEvents');
        throw error;
      }
    };

    const getEventsByType = async (treeId, eventType) => listEvents(treeId, { type: eventType });

    const getTimeline = async (treeId, options = {}) => {
      const events = await listEvents(treeId, options);
      return events.sort((a, b) => (a.date?.year || 0) - (b.date?.year || 0));
    };

    const clearError = () => { state.error = null; emitStateChange(); };

    return new Facet('gedcomEvents', { attach: true, source: import.meta.url }).add({
      listEvents, getEventsByType, getTimeline, getState, clearError,
    });
  },
});

export default useGedcomEvents;
