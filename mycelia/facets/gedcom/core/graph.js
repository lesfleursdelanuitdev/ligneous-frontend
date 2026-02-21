/**
 * GEDCOM Graph Facet
 * Relationship queries via Next.js API routes.
 * Advanced analytics (metrics, centrality, paths) are deferred.
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent, createEmitStateChange,
  handleApiError, createLoadingUpdater, apiFetch,
} from '../../../utils/gedcom-api.js';

const initialState = {
  loading: false, error: null,
  relationship: null, ancestors: [], descendants: [],
  paths: null, metrics: null, centrality: {}, mostConnected: [],
};

export const useGedcomGraph = createHook({
  kind: 'gedcomGraph',
  version: '2.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = { ...initialState };
    const listeners = subsystem.find('listeners');
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'gedcomGraph', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    const enc = (xref) => encodeURIComponent(xref);

    const getAncestors = async (treeId, xref, maxGenerations = 5) => {
      setLoading(true);
      try {
        const result = await apiFetch(`/api/trees/${treeId}/individuals/${enc(xref)}/parents`);
        state.ancestors = result.data || [];
        setLoading(false);
        emitEvent('gedcomGraph:ancestors:loaded', { xref, count: state.ancestors.length });
        return { ancestors: state.ancestors };
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getAncestors');
        throw error;
      }
    };

    const getDescendants = async (treeId, xref, maxGenerations = 5) => {
      setLoading(true);
      try {
        const result = await apiFetch(`/api/trees/${treeId}/individuals/${enc(xref)}/children`);
        state.descendants = result.data || [];
        setLoading(false);
        emitEvent('gedcomGraph:descendants:loaded', { xref, count: state.descendants.length });
        return { descendants: state.descendants };
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getDescendants');
        throw error;
      }
    };

    // Stubs for features not yet ported (deferred)
    const getRelationship = async () => { state.relationship = null; return null; };
    const getPaths = async () => { state.paths = null; return null; };
    const getMetrics = async () => { state.metrics = null; return null; };
    const getCentrality = async () => { state.centrality = {}; return {}; };
    const getMostConnected = async () => { state.mostConnected = []; return []; };

    const clearError = () => { state.error = null; emitStateChange(); };

    return new Facet('gedcomGraph', { attach: true, source: import.meta.url }).add({
      getRelationship, getPaths,
      getAncestors, getDescendants,
      getMetrics, getCentrality, getMostConnected,
      getState, clearError,
    });
  },
});

export default useGedcomGraph;
