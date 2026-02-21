/**
 * GEDCOM Sources Facet
 * Queries sources via Next.js API routes (Prisma).
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent, createEmitStateChange,
  handleApiError, createLoadingUpdater, apiFetch, buildQueryString,
} from '../../../utils/gedcom-api.js';

const initialState = { loading: false, error: null, sources: [], currentSource: null, totalCount: 0 };

export const useGedcomSources = createHook({
  kind: 'gedcomSources',
  version: '2.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = { ...initialState };
    const listeners = subsystem.find('listeners');
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'gedcomSources', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    const listSources = async (treeId, options = {}) => {
      setLoading(true);
      try {
        const qs = buildQueryString(options);
        const result = await apiFetch(`/api/trees/${treeId}/sources${qs}`);
        state.sources = result.data || [];
        state.totalCount = result.pagination?.total ?? state.sources.length;
        setLoading(false);
        emitEvent('gedcomSources:loaded', { treeId, count: state.totalCount });
        return state.sources;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'listSources');
        throw error;
      }
    };

    const searchSources = async (treeId, searchTerm) => listSources(treeId, { search: searchTerm });

    const clearError = () => { state.error = null; emitStateChange(); };

    return new Facet('gedcomSources', { attach: true, source: import.meta.url }).add({
      listSources, searchSources, getState, clearError,
    });
  },
});

export default useGedcomSources;
