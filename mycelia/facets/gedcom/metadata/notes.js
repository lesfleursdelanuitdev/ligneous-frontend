/**
 * GEDCOM Notes Facet
 * Queries notes via Next.js API routes (Prisma).
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent, createEmitStateChange,
  handleApiError, createLoadingUpdater, apiFetch, buildQueryString,
} from '../../../utils/gedcom-api.js';

const initialState = { loading: false, error: null, notes: [], currentNote: null, totalCount: 0 };

export const useGedcomNotes = createHook({
  kind: 'gedcomNotes',
  version: '2.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = { ...initialState };
    const listeners = subsystem.find('listeners');
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'gedcomNotes', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    const listNotes = async (treeId, options = {}) => {
      setLoading(true);
      try {
        const qs = buildQueryString(options);
        const result = await apiFetch(`/api/trees/${treeId}/notes${qs}`);
        state.notes = result.data || [];
        state.totalCount = result.pagination?.total ?? state.notes.length;
        setLoading(false);
        emitEvent('gedcomNotes:loaded', { treeId, count: state.totalCount });
        return state.notes;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'listNotes');
        throw error;
      }
    };

    const getTopLevelNotes = async (treeId) => listNotes(treeId, { top_level: 'true' });
    const getInlineNotes = async (treeId) => listNotes(treeId, { top_level: 'false' });

    const searchNotes = async (treeId, searchTerm) => listNotes(treeId, { search: searchTerm });

    const clearError = () => { state.error = null; emitStateChange(); };

    return new Facet('gedcomNotes', { attach: true, source: import.meta.url }).add({
      listNotes, getTopLevelNotes, getInlineNotes, searchNotes, getState, clearError,
    });
  },
});

export default useGedcomNotes;
