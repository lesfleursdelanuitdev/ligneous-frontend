/**
 * GEDCOM Notes Facet
 * Handles GEDCOM note data queries
 * Uses Mycelia Kernel Plugin System for reactive state management
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent,
  createEmitStateChange,
  handleApiError,
  createLoadingUpdater,
  buildQueryString
} from '../../../utils/gedcom-api.js';

// Initial state
const initialState = {
  loading: false,
  error: null,
  notes: [],
  currentNote: null,
  totalCount: 0
};

/**
 * GEDCOM Notes Facet Hook
 */
export const useGedcomNotes = createHook({
  kind: 'gedcomNotes',
  version: '1.0.0',
  required: ['listeners'],
  attach: true,
  source: import.meta.url,
  
  fn: (ctx, api, subsystem) => {
    // Get configuration
    const config = ctx.config?.goAPI || {};
    const GO_API_URL = config.baseURL || 'http://localhost:8090';
    
    const state = { ...initialState };

    // Get listeners facet reference
    const listeners = subsystem.find('listeners');

    // Create helper functions
    const emitEvent = createEmitEvent(listeners);
    const getState = () => ({ ...state });
    const emitStateChange = createEmitStateChange(listeners, 'gedcomNotes', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    /**
     * List all notes in a file
     * @param {string} fileId - File ID
     * @param {Object} options - Query options
     */
    const listNotes = async (fileId, options = {}) => {
      setLoading(true);

      try {
        const queryString = buildQueryString(options);
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/notes${queryString}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to list notes');
        }

        const data = await response.json();
        state.notes = data.data?.notes || [];
        state.totalCount = data.data?.count || 0;
        setLoading(false);

        emitEvent('gedcomNotes:loaded', { fileId, count: state.totalCount });
        return state.notes;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'listNotes');
        throw error;
      }
    };

    /**
     * Get a specific note by XREF
     * @param {string} fileId - File ID
     * @param {string} xref - Note XREF
     */
    const getNote = async (fileId, xref) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/notes/${encodeURIComponent(xref)}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to get note');
        }

        const data = await response.json();
        state.currentNote = data.data || null;
        setLoading(false);

        return state.currentNote;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getNote');
        throw error;
      }
    };

    /**
     * Get top-level notes only (NOTE records with XREFs)
     * @param {string} fileId - File ID
     */
    const getTopLevelNotes = async (fileId) => {
      const allNotes = await listNotes(fileId);
      return allNotes.filter(note => note.is_top_level);
    };

    /**
     * Get inline notes only (embedded within other records)
     * @param {string} fileId - File ID
     */
    const getInlineNotes = async (fileId) => {
      const allNotes = await listNotes(fileId);
      return allNotes.filter(note => !note.is_top_level);
    };

    /**
     * Search notes by content
     * @param {string} fileId - File ID
     * @param {string} searchTerm - Search term
     */
    const searchNotes = async (fileId, searchTerm) => {
      const allNotes = await listNotes(fileId);
      const lowerSearch = searchTerm.toLowerCase();
      return allNotes.filter(note => 
        note.content?.toLowerCase().includes(lowerSearch)
      );
    };

    /**
     * Clear error state
     */
    const clearError = () => {
      state.error = null;
      emitStateChange();
    };

    // Return the facet instance
    return new Facet('gedcomNotes', {
      attach: true,
      source: import.meta.url
    }).add({
      listNotes,
      getNote,
      getTopLevelNotes,
      getInlineNotes,
      searchNotes,
      getState,
      clearError,
    });
  }
});

export default useGedcomNotes;


