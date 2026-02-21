/**
 * GEDCOM Duplicates Facet
 * Duplicate detection is deferred -- stubs only.
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent, createEmitStateChange, createLoadingUpdater,
} from '../../../utils/gedcom-api.js';

const initialState = { loading: false, error: null, duplicates: [], comparisonResults: null };

export const useGedcomDuplicates = createHook({
  kind: 'gedcomDuplicates',
  version: '2.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = { ...initialState };
    const listeners = subsystem.find('listeners');
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'gedcomDuplicates', getState);

    const findDuplicates = async () => { state.duplicates = []; return { matches: [] }; };
    const compareFiles = async () => { state.comparisonResults = null; return null; };
    const clearDuplicates = () => { state.duplicates = []; emitStateChange(); };
    const clearComparisonResults = () => { state.comparisonResults = null; emitStateChange(); };
    const clearError = () => { state.error = null; emitStateChange(); };

    return new Facet('gedcomDuplicates', { attach: true, source: import.meta.url }).add({
      findDuplicates, compareFiles, clearDuplicates, clearComparisonResults, getState, clearError,
    });
  },
});

export default useGedcomDuplicates;
