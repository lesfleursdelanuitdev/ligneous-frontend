/**
 * GEDCOM Families Facet
 * Queries families via Next.js API routes (Prisma).
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent, createEmitStateChange,
  handleApiError, createLoadingUpdater, apiFetch, buildQueryString,
} from '../../../utils/gedcom-api.js';

const initialState = { loading: false, error: null, families: [], currentFamily: null };

export const useGedcomFamilies = createHook({
  kind: 'gedcomFamilies',
  version: '2.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = { ...initialState };
    const listeners = subsystem.find('listeners');
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'gedcomFamilies', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    const getFamilies = async (treeId, params = {}) => {
      if (!treeId) return { data: [], pagination: {} };
      setLoading(true);
      try {
        const qs = buildQueryString(params);
        const result = await apiFetch(`/api/trees/${treeId}/families${qs}`);
        state.families = result.data || [];
        setLoading(false);
        emitEvent('gedcomFamilies:loaded', { count: state.families.length });
        return result;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getFamilies');
        throw error;
      }
    };

    const getFamiliesByTreeId = getFamilies;

    const clearError = () => { state.error = null; emitStateChange(); };

    return new Facet('gedcomFamilies', { attach: true, source: import.meta.url }).add({
      getFamilies,
      getFamiliesByTreeId,
      getState,
      clearError,
    });
  },
});

export default useGedcomFamilies;
