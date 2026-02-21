/**
 * GEDCOM Dates Facet
 * Queries dates via Next.js API routes (Prisma).
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent, createEmitStateChange,
  handleApiError, createLoadingUpdater, apiFetch, buildQueryString,
} from '../../../utils/gedcom-api.js';

const initialState = { loading: false, error: null, dates: [], currentDate: null, totalCount: 0 };

export const useGedcomDates = createHook({
  kind: 'gedcomDates',
  version: '2.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = { ...initialState };
    const listeners = subsystem.find('listeners');
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'gedcomDates', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    const listDates = async (treeId, options = {}) => {
      setLoading(true);
      try {
        const qs = buildQueryString(options);
        const result = await apiFetch(`/api/trees/${treeId}/dates${qs}`);
        state.dates = result.data || [];
        state.totalCount = result.pagination?.total ?? state.dates.length;
        setLoading(false);
        emitEvent('gedcomDates:loaded', { treeId, count: state.totalCount });
        return state.dates;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'listDates');
        throw error;
      }
    };

    const getDatesByYearRange = async (treeId, startYear, endYear) => {
      const params = { year_from: startYear };
      if (endYear) params.year_to = endYear;
      return listDates(treeId, params);
    };

    const clearError = () => { state.error = null; emitStateChange(); };

    return new Facet('gedcomDates', { attach: true, source: import.meta.url }).add({
      listDates, getDatesByYearRange, getState, clearError,
    });
  },
});

export default useGedcomDates;
