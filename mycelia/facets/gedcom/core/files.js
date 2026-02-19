/**
 * GEDCOM Files Facet
 * Handles GEDCOM file upload, validation, and management
 * Uses Mycelia Kernel Plugin System for reactive state management
 */

import { createHook, Facet } from 'mycelia-kernel-plugin';
import {
  createEmitEvent,
  createEmitStateChange,
  handleApiError,
  createLoadingUpdater
} from '../../../utils/gedcom-api.js';

// Initial state
const initialState = {
  loading: false,
  error: null,
  currentFile: null,
  files: []
};

/**
 * GEDCOM Files Facet Hook
 */
export const useGedcomFiles = createHook({
  kind: 'gedcomFiles',
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
    const emitStateChange = createEmitStateChange(listeners, 'gedcomFiles', getState);
    const setLoading = createLoadingUpdater(state, emitStateChange);

    /**
     * Upload GEDCOM file to Go API
     */
    const uploadGedcom = async (file, name) => {
      setLoading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);

        const response = await fetch(`${GO_API_URL}/api/v1/files`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to upload GEDCOM file');
        }

        const data = await response.json();
        const fileMetadata = data.data;

        state.currentFile = fileMetadata;
        setLoading(false);

        // Emit specific event
        emitEvent('gedcomFiles:file:uploaded', { file: fileMetadata });

        return {
          fileId: fileMetadata.file_id,
          metadata: fileMetadata,
        };
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'uploadGedcom', {
          fileName: name,
          fileSize: file?.size,
        });
        // Also emit facet-specific error event
        emitEvent('gedcomFiles:error', {
          error: error.message || 'Failed to upload GEDCOM file',
          action: 'uploadGedcom',
          originalError: error,
          context: { fileName: name, fileSize: file?.size },
        });
        throw error;
      }
    };

    /**
     * Get file information from Go API
     */
    const getFileInfo = async (fileId) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to get file info');
        }

        const data = await response.json();
        const fileInfo = data.data;

        state.currentFile = fileInfo;
        setLoading(false);

        return fileInfo;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'getFileInfo');
        throw error;
      }
    };

    /**
     * List all uploaded files
     */
    const listFiles = async () => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to list files');
        }

        const data = await response.json();
        // API returns {data: {files: [...], meta: {...}}}
        state.files = data.data?.files || [];
        setLoading(false);

        return state.files;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'listFiles');
        throw error;
      }
    };

    /**
     * Validate a GEDCOM file
     */
    const validateFile = async (fileId) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}/validate`, {
          method: 'POST',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to validate file');
        }

        const data = await response.json();
        const validationResult = data.data;

        setLoading(false);
        emitEvent('gedcomFiles:file:validated', { fileId, result: validationResult });

        return validationResult;
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'validateFile');
        throw error;
      }
    };

    /**
     * Delete a file from Go API
     */
    const deleteFile = async (fileId) => {
      setLoading(true);

      try {
        const response = await fetch(`${GO_API_URL}/api/v1/files/${fileId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to delete file');
        }

        // Clear current file if it's the one being deleted
        if (state.currentFile?.file_id === fileId) {
          state.currentFile = null;
        }

        // Remove from files list
        state.files = state.files.filter(f => f.file_id !== fileId);

        setLoading(false);
        emitEvent('gedcomFiles:file:deleted', { fileId });
      } catch (error) {
        handleApiError(error, state, emitEvent, emitStateChange, 'deleteFile');
        throw error;
      }
    };

    /**
     * Clear error state
     */
    const clearError = () => {
      state.error = null;
      emitStateChange();
    };

    // Return the facet instance
    return new Facet('gedcomFiles', {
      attach: true,
      source: import.meta.url
    }).add({
      uploadGedcom,
      getFileInfo,
      listFiles,
      validateFile,
      deleteFile,
      getState,
      clearError,
    });
  }
});

export default useGedcomFiles;

