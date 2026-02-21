/**
 * GEDCOM Places Facet
 * Queries places via Next.js API routes (Prisma).
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent, createEmitStateChange,
  handleApiError, createLoadingUpdater, apiFetch, buildQueryString,
} from '../../../utils/gedcom-api.js';

const initialState = { loading: false, error: null, places: [], currentPlace: null, totalCount: 0 };

export const useGedcomPlaces = createHook({
  kind: 'gedcomPlaces',
  version: '2.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = { ...initialState };
    const listeners = subsystem.find('listeners');
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'gedcomPlaces', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    const listPlaces = async (treeId, options = {}) => {
      setLoading(true);
      try {
        const qs = buildQueryString(options);
        const result = await apiFetch(`/api/trees/${treeId}/places${qs}`);
        state.places = result.data || [];
        state.totalCount = result.pagination?.total ?? state.places.length;
        setLoading(false);
        emitEvent('gedcomPlaces:loaded', { treeId, count: state.totalCount });
        return state.places;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'listPlaces');
        throw error;
      }
    };

    const clearError = () => { state.error = null; emitStateChange(); };

    return new Facet('gedcomPlaces', { attach: true, source: import.meta.url }).add({
      listPlaces, getState, clearError,
    });
  },
});

export default useGedcomPlaces;
