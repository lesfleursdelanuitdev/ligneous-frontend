/**
 * GEDCOM Files Facet
 * Handles tree/file listing and metadata via Next.js API routes (Prisma).
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent, createEmitStateChange,
  handleApiError, createLoadingUpdater, apiFetch,
} from '../../../utils/gedcom-api.js';

const initialState = { loading: false, error: null, currentFile: null, files: [] };

export const useGedcomFiles = createHook({
  kind: 'gedcomFiles',
  version: '2.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = { ...initialState };
    const listeners = subsystem.find('listeners');
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'gedcomFiles', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    const listFiles = async (filter) => {
      setLoading(true);
      try {
        const qs = filter ? `?filter=${filter}` : '';
        const result = await apiFetch(`/api/trees${qs}`);
        state.files = result.trees || [];
        setLoading(false);
        return state.files;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'listFiles');
        throw error;
      }
    };

    const getFileInfo = async (treeId) => {
      setLoading(true);
      try {
        const result = await apiFetch(`/api/trees/${treeId}/meta`);
        state.currentFile = result.tree || null;
        setLoading(false);
        return state.currentFile;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getFileInfo');
        throw error;
      }
    };

    const clearError = () => { state.error = null; emitStateChange(); };

    return new Facet('gedcomFiles', { attach: true, source: import.meta.url }).add({
      listFiles,
      getFileInfo,
      getState,
      clearError,
    });
  },
});

export default useGedcomFiles;
