/**
 * GEDCOM Individuals Facet
 * Queries individuals and immediate family relationships via Next.js API routes.
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent, createEmitStateChange,
  handleApiError, createLoadingUpdater, apiFetch, buildQueryString,
} from '../../../utils/gedcom-api.js';

const initialState = {
  loading: false, error: null,
  individuals: [], currentIndividual: null,
  parents: [], children: [], siblings: [], spouses: [],
  searchResults: [],
};

export const useGedcomIndividuals = createHook({
  kind: 'gedcomIndividuals',
  version: '2.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = { ...initialState };
    const listeners = subsystem.find('listeners');
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'gedcomIndividuals', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    const getIndividuals = async (treeId, params = {}) => {
      setLoading(true);
      try {
        const qs = buildQueryString(params);
        const result = await apiFetch(`/api/trees/${treeId}/individuals${qs}`);
        state.individuals = result.data || [];
        setLoading(false);
        emitEvent('gedcomIndividuals:loaded', { count: state.individuals.length });
        return result;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getIndividuals', { treeId, params });
        throw error;
      }
    };

    const getIndividual = async (treeId, xref) => {
      setLoading(true);
      try {
        const result = await apiFetch(`/api/trees/${treeId}/individuals/${encodeURIComponent(xref)}`);
        state.currentIndividual = result.data || null;
        setLoading(false);
        emitEvent('gedcomIndividuals:individual:loaded', { xref });
        return state.currentIndividual;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getIndividual');
        throw error;
      }
    };

    const searchIndividuals = async (treeId, query) => {
      setLoading(true);
      try {
        const result = await apiFetch(`/api/trees/${treeId}/individuals?search=${encodeURIComponent(query)}`);
        state.searchResults = result.data || [];
        setLoading(false);
        emitEvent('gedcomIndividuals:search:complete', { count: state.searchResults.length });
        return state.searchResults;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'searchIndividuals');
        throw error;
      }
    };

    const getParents = async (treeId, xref) => {
      setLoading(true);
      try {
        const result = await apiFetch(`/api/trees/${treeId}/individuals/${encodeURIComponent(xref)}/parents`);
        state.parents = result.data || [];
        setLoading(false);
        return state.parents;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getParents');
        throw error;
      }
    };

    const getChildren = async (treeId, xref) => {
      setLoading(true);
      try {
        const result = await apiFetch(`/api/trees/${treeId}/individuals/${encodeURIComponent(xref)}/children`);
        state.children = result.data || [];
        setLoading(false);
        return state.children;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getChildren');
        throw error;
      }
    };

    const getSiblings = async (treeId, xref) => {
      setLoading(true);
      try {
        const result = await apiFetch(`/api/trees/${treeId}/individuals/${encodeURIComponent(xref)}/siblings`);
        state.siblings = result.data || [];
        setLoading(false);
        return state.siblings;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getSiblings');
        throw error;
      }
    };

    const getSpouses = async (treeId, xref) => {
      setLoading(true);
      try {
        const result = await apiFetch(`/api/trees/${treeId}/individuals/${encodeURIComponent(xref)}/spouses`);
        state.spouses = result.data || [];
        setLoading(false);
        return state.spouses;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getSpouses');
        throw error;
      }
    };

    const clearError = () => { state.error = null; emitStateChange(); };
    const clearSearchResults = () => { state.searchResults = []; emitStateChange(); };

    return new Facet('gedcomIndividuals', { attach: true, source: import.meta.url }).add({
      getIndividuals, getIndividual, searchIndividuals,
      getParents, getChildren, getSiblings, getSpouses,
      getState, clearError, clearSearchResults,
    });
  },
});

export default useGedcomIndividuals;
