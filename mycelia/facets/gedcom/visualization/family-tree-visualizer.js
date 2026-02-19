/**
 * Family Tree Visualizer Facet
 * Handles family tree visualization state, layout calculation, and data coordination
 * Uses Mycelia Kernel Plugin System for reactive state management
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent,
  createEmitStateChange,
  handleApiError,
  createLoadingUpdater
} from '../../../utils/gedcom-api.js';
// Dynamic imports to avoid SSR issues
let calculateTreeLayout, generateConnectors;

// Initial state
const initialState = {
  loading: false,
  error: null,
  rootPersonXref: null,
  generations: 4,
  viewType: 'pedigree',
  layout: {
    nodeSeparation: 250,
    levelSeparation: 150,
    boxWidth: 200,
    boxHeight: 80,
    leftIndent: 50,
    orientation: 'vertical'
  },
  viewport: {
    zoom: 1.0,
    panX: 0,
    panY: 0
  },
  selectedPerson: null,
  highlightedPersons: [],
  treeData: null,
  treeLayout: null
};

/**
 * Family Tree Visualizer Facet Hook
 */
export const useFamilyTreeVisualizer = createHook({
  kind: 'familyTreeVisualizer',
  version: '1.0.0',
  required: ['listeners', 'gedcomGraph', 'gedcomIndividuals'],
  attach: true,
  source: import.meta.url,
  
  fn: (ctx, api, subsystem) => {
    // Get required facets
    const listeners = subsystem.find('listeners');
    const graph = subsystem.find('gedcomGraph');
    const individuals = subsystem.find('gedcomIndividuals');
    
    if (!listeners || !graph || !individuals) {
      throw new Error('Required facets not found: listeners, gedcomGraph, gedcomIndividuals');
    }
    
    const state = { ...initialState };

    // Helper functions
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'familyTreeVisualizer', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    /**
     * Load tree data and calculate layout
     */
    const loadTree = async (fileId, rootXref, options = {}) => {
      setLoading(true);
      state.error = null;

      try {
        const generations = options.generations || state.generations;
        
        // 1. Fetch ancestors using graph facet
        const ancestorsData = await graph.getAncestors(fileId, rootXref, generations);
        const ancestors = ancestorsData.ancestors || [];
        
        // 2. Fetch root person details
        const rootPerson = await individuals.getIndividual(fileId, rootXref);
        
        // 3. Fetch details for all ancestors
        const personDetails = await Promise.all(
          ancestors.map(anc => 
            individuals.getIndividual(fileId, anc.xref).catch(() => anc)
          )
        );

        // 4. Dynamically import layout utilities (to avoid SSR issues)
        if (!calculateTreeLayout || !generateConnectors) {
          const layoutModule = await import('../../../../family-tree-vis/core/TreeLayout.js');
          const connectorModule = await import('../../../../family-tree-vis/core/ConnectorGenerator.js');
          calculateTreeLayout = layoutModule.calculateTreeLayout;
          generateConnectors = connectorModule.generateConnectors;
        }

        // 5. Calculate tree layout using d3.js
        const treeLayout = calculateTreeLayout({
          ancestors: personDetails,
          rootPerson,
          generations,
          layout: { ...state.layout, ...options.layout }
        });

        // 6. Generate connectors
        const connectors = generateConnectors({
          nodes: treeLayout.nodes,
          layout: {
            nodeSeparation: state.layout.nodeSeparation,
            levelSeparation: state.layout.levelSeparation
          }
        });

        // Update tree layout with connectors
        treeLayout.links = connectors;

        // 7. Update state
        state.treeData = {
          ancestors: personDetails,
          rootPerson,
          personDetails
        };
        state.treeLayout = treeLayout;
        state.rootPersonXref = rootXref;
        if (options.generations) {
          state.generations = options.generations;
        }

        setLoading(false);
        emitEvent('familyTreeVisualizer:tree:loaded', { 
          rootXref, 
          treeLayout,
          generations 
        });
        emitStateChange();

        return treeLayout;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'loadTree');
        throw error;
      }
    };

    /**
     * Set root person
     */
    const setRootPerson = (xref) => {
      state.rootPersonXref = xref;
      emitEvent('familyTreeVisualizer:rootPerson:changed', { xref });
      emitStateChange();
    };

    /**
     * Set number of generations
     */
    const setGenerations = (count) => {
      state.generations = count;
      emitEvent('familyTreeVisualizer:generations:changed', { generations: count });
      emitStateChange();
    };

    /**
     * Set layout options
     */
    const setLayout = (options) => {
      state.layout = { ...state.layout, ...options };
      emitEvent('familyTreeVisualizer:layout:changed', { layout: state.layout });
      emitStateChange();
    };

    /**
     * Set viewport (zoom, pan)
     */
    const setViewport = (zoom, panX, panY) => {
      state.viewport = { zoom, panX, panY };
      emitEvent('familyTreeVisualizer:viewport:changed', { viewport: state.viewport });
      emitStateChange();
    };

    /**
     * Select a person
     */
    const selectPerson = (xref) => {
      state.selectedPerson = xref;
      emitEvent('familyTreeVisualizer:person:selected', { xref });
      emitStateChange();
    };

    /**
     * Highlight multiple persons
     */
    const highlightPersons = (xrefs) => {
      state.highlightedPersons = Array.isArray(xrefs) ? xrefs : [xrefs];
      emitEvent('familyTreeVisualizer:persons:highlighted', { xrefs: state.highlightedPersons });
      emitStateChange();
    };

    /**
     * Zoom to a specific person
     */
    const zoomToPerson = (xref) => {
      if (!state.treeLayout) return;
      
      const node = state.treeLayout.nodes.find(n => n.data.xref === xref);
      if (node) {
        // Calculate zoom and pan to center on person
        const zoom = 1.5;
        const panX = -node.x + (state.treeLayout.dimensions.width / 2);
        const panY = -node.y + (state.treeLayout.dimensions.height / 2);
        
        setViewport(zoom, panX, panY);
        selectPerson(xref);
      }
    };

    /**
     * Reset viewport
     */
    const resetView = () => {
      setViewport(1.0, 0, 0);
    };

    /**
     * Clear error
     */
    const clearError = () => {
      state.error = null;
      emitStateChange();
    };

    // Return the facet instance
    return new Facet('familyTreeVisualizer', {
      attach: true,
      source: import.meta.url
    }).add({
      loadTree,
      setRootPerson,
      setGenerations,
      setLayout,
      setViewport,
      selectPerson,
      highlightPersons,
      zoomToPerson,
      resetView,
      getState,
      clearError
    });
  }
});

export default useFamilyTreeVisualizer;

