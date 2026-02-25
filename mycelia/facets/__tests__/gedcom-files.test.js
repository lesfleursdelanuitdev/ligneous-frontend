/**
 * Test suite for useGedcomFiles Facet
 * 
 * Tests the GEDCOM files facet functionality including:
 * - File upload
 * - File information retrieval
 * - File listing
 * - File validation
 * - File deletion
 * - State management
 * - Event emission
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildTestSystem } from '../../test-system.builder.js';
import {
  mockFileMetadata,
  mockIndividuals,
  mockValidationResult,
  wrapApiResponse
} from './test-data.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('useGedcomFiles Facet', () => {
  let system;
  let gedcomFiles;
  let listeners;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Build the test system
    system = await buildTestSystem('ligneous-test', {
      goApiUrl: 'http://localhost:8091'
    });
    
    // Enable listeners for event testing
    listeners = system.find('listeners');
    if (listeners) {
      listeners.enableListeners();
    }
    
    // Get gedcomFiles facet
    gedcomFiles = system.find('gedcomFiles');
  });

  afterEach(async () => {
    // Clean up after each test
    if (system) {
      await system.dispose();
    }
    vi.clearAllMocks();
  });

  describe('System Building', () => {
    it('should build the system successfully', () => {
      expect(system).toBeDefined();
      expect(system.name).toBe('ligneous-test');
      expect(system.isBuilt).toBe(true);
    });

    it('should have gedcomFiles facet', () => {
      expect(gedcomFiles).toBeDefined();
      expect(typeof gedcomFiles.uploadGedcom).toBe('function');
      expect(typeof gedcomFiles.getFileInfo).toBe('function');
      expect(typeof gedcomFiles.listFiles).toBe('function');
      expect(typeof gedcomFiles.validateFile).toBe('function');
      expect(typeof gedcomFiles.deleteFile).toBe('function');
      expect(typeof gedcomFiles.getState).toBe('function');
      expect(typeof gedcomFiles.clearError).toBe('function');
    });

    it('should have listeners facet', () => {
      expect(listeners).toBeDefined();
      expect(listeners.hasListeners()).toBe(true);
    });
  });

  describe('Initial State', () => {
    it('should start with clean state', () => {
      const state = gedcomFiles.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.currentFile).toBe(null);
      expect(state.files).toEqual([]);
    });
  });

  describe('Upload GEDCOM', () => {
    it('should upload a file successfully', async () => {
      const mockFile = new File(['GEDCOM content'], 'xavier.ged', { type: 'text/plain' });

      // Mock successful upload using realistic test data
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => wrapApiResponse(mockFileMetadata)
      });

      const result = await gedcomFiles.uploadGedcom(mockFile, 'Xavier Family Tree');

      expect(result).toEqual({
        fileId: mockFileMetadata.file_id,
        metadata: mockFileMetadata,
      });

      // Check state
      const state = gedcomFiles.getState();
      expect(state.currentFile).toEqual(mockFileMetadata);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);

      // Check API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8091/api/v1/files',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['content'], 'test.ged');
      const errorMessage = 'Invalid GEDCOM format';

      // Mock failed upload
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      await expect(
        gedcomFiles.uploadGedcom(mockFile, 'Test Tree')
      ).rejects.toThrow(errorMessage);

      const state = gedcomFiles.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
      expect(state.currentFile).toBe(null);
    });

    it('should emit gedcomFiles:file:uploaded event on success', (done) => {
      const mockFile = new File(['content'], 'test.ged');
      const mockFileMetadata = {
        file_id: 'file-123',
        name: 'Test Tree',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockFileMetadata })
      });

      let eventReceived = false;

      listeners.on('gedcomFiles:file:uploaded', (msg) => {
        expect(msg.type).toBe('gedcomFiles:file:uploaded');
        expect(msg.body.file).toEqual(mockFileMetadata);
        eventReceived = true;
        done();
      });

      gedcomFiles.uploadGedcom(mockFile, 'Test Tree').then(() => {
        setTimeout(() => {
          if (!eventReceived) {
            done(new Error('Event not received'));
          }
        }, 100);
      });
    });

    it('should emit stateChanged event during upload', (done) => {
      const mockFile = new File(['content'], 'test.ged');
      const mockFileMetadata = { file_id: 'file-123' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockFileMetadata })
      });

      let eventCount = 0;

      listeners.on('gedcomFiles:stateChanged', (msg) => {
        eventCount++;
        expect(msg.type).toBe('gedcomFiles:stateChanged');
        
        if (eventCount === 1) {
          // First event: loading starts
          expect(msg.body.loading).toBe(true);
        } else if (eventCount === 2) {
          // Second event: loading ends
          expect(msg.body.loading).toBe(false);
          expect(msg.body.currentFile).toEqual(mockFileMetadata);
          done();
        }
      });

      gedcomFiles.uploadGedcom(mockFile, 'Test Tree');
    });
  });

  describe('Get File Info', () => {
    it('should get file information successfully', async () => {
      const mockFileInfo = {
        file_id: 'file-123',
        name: 'Test Tree',
        size: 2048,
        individual_count: 100,
        family_count: 50
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockFileInfo })
      });

      const result = await gedcomFiles.getFileInfo('file-123');

      expect(result).toEqual(mockFileInfo);

      // Check state
      const state = gedcomFiles.getState();
      expect(state.currentFile).toEqual(mockFileInfo);
      expect(state.loading).toBe(false);

      // Check API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8091/api/v1/files/file-123'
      );
    });

    it('should handle get file info errors', async () => {
      const errorMessage = 'File not found';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      await expect(
        gedcomFiles.getFileInfo('nonexistent')
      ).rejects.toThrow(errorMessage);

      const state = gedcomFiles.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
    });
  });

  describe('List Files', () => {
    it('should list all files successfully', async () => {
      const mockFiles = [
        { file_id: 'file-1', name: 'Tree 1' },
        { file_id: 'file-2', name: 'Tree 2' },
        { file_id: 'file-3', name: 'Tree 3' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { files: mockFiles, meta: { total: 3, limit: 50, offset: 0 } } })
      });

      const result = await gedcomFiles.listFiles();

      expect(result).toEqual(mockFiles);

      // Check state
      const state = gedcomFiles.getState();
      expect(state.files).toEqual(mockFiles);
      expect(state.loading).toBe(false);

      // Check API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8091/api/v1/files'
      );
    });

    it('should handle empty file list', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { files: [], meta: { total: 0, limit: 50, offset: 0 } } })
      });

      const result = await gedcomFiles.listFiles();

      expect(result).toEqual([]);
      expect(gedcomFiles.getState().files).toEqual([]);
    });

    it('should handle list files errors', async () => {
      const errorMessage = 'Failed to fetch files';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      await expect(
        gedcomFiles.listFiles()
      ).rejects.toThrow(errorMessage);

      const state = gedcomFiles.getState();
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('Validate File', () => {
    it('should validate a file successfully', async () => {
      const mockValidationResult = {
        valid: true,
        errors: [],
        warnings: ['Minor date format issue'],
        individual_count: 50,
        family_count: 25
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockValidationResult })
      });

      const result = await gedcomFiles.validateFile('file-123');

      expect(result).toEqual(mockValidationResult);
      expect(result.valid).toBe(true);

      // Check API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8091/api/v1/files/file-123/validate',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should emit gedcomFiles:file:validated event', (done) => {
      const mockValidationResult = {
        valid: false,
        errors: ['Invalid tag'],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockValidationResult })
      });

      let eventReceived = false;

      listeners.on('gedcomFiles:file:validated', (msg) => {
        expect(msg.type).toBe('gedcomFiles:file:validated');
        expect(msg.body.fileId).toBe('file-123');
        expect(msg.body.result).toEqual(mockValidationResult);
        eventReceived = true;
        done();
      });

      gedcomFiles.validateFile('file-123').then(() => {
        setTimeout(() => {
          if (!eventReceived) {
            done(new Error('Event not received'));
          }
        }, 100);
      });
    });

    it('should handle validation errors', async () => {
      const errorMessage = 'Validation service unavailable';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      await expect(
        gedcomFiles.validateFile('file-123')
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('Delete File', () => {
    it('should delete a file successfully', async () => {
      // First set a current file
      const mockFile = { file_id: 'file-123', name: 'Test Tree' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockFile })
      });
      await gedcomFiles.getFileInfo('file-123');

      // Now delete it
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await gedcomFiles.deleteFile('file-123');

      // Check state - current file should be cleared
      const state = gedcomFiles.getState();
      expect(state.currentFile).toBe(null);
      expect(state.loading).toBe(false);

      // Check API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8091/api/v1/files/file-123',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    it('should remove deleted file from files list', async () => {
      // First load files list
      const mockFiles = [
        { file_id: 'file-1', name: 'Tree 1' },
        { file_id: 'file-2', name: 'Tree 2' },
        { file_id: 'file-3', name: 'Tree 3' }
      ];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { files: mockFiles, meta: { total: 3, limit: 50, offset: 0 } } })
      });
      await gedcomFiles.listFiles();

      // Delete file-2
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });
      await gedcomFiles.deleteFile('file-2');

      // Check that file-2 is removed from files list
      const state = gedcomFiles.getState();
      expect(state.files).toHaveLength(2);
      expect(state.files.find(f => f.file_id === 'file-2')).toBeUndefined();
      expect(state.files.find(f => f.file_id === 'file-1')).toBeDefined();
      expect(state.files.find(f => f.file_id === 'file-3')).toBeDefined();
    });

    it('should emit gedcomFiles:file:deleted event', (done) => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      let eventReceived = false;

      listeners.on('gedcomFiles:file:deleted', (msg) => {
        expect(msg.type).toBe('gedcomFiles:file:deleted');
        expect(msg.body.fileId).toBe('file-123');
        eventReceived = true;
        done();
      });

      gedcomFiles.deleteFile('file-123').then(() => {
        setTimeout(() => {
          if (!eventReceived) {
            done(new Error('Event not received'));
          }
        }, 100);
      });
    });

    it('should handle delete errors', async () => {
      const errorMessage = 'File not found or already deleted';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      await expect(
        gedcomFiles.deleteFile('nonexistent')
      ).rejects.toThrow(errorMessage);

      const state = gedcomFiles.getState();
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('State Management', () => {
    it('should update loading state during operations', async () => {
      // Mock a slow API call
      global.fetch.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ data: [] })
        }), 100))
      );

      const listPromise = gedcomFiles.listFiles();

      // Check loading state immediately
      let state = gedcomFiles.getState();
      expect(state.loading).toBe(true);

      await listPromise;

      // Check loading state after completion
      state = gedcomFiles.getState();
      expect(state.loading).toBe(false);
    });

    it('should return a copy of state from getState()', () => {
      const state1 = gedcomFiles.getState();
      const state2 = gedcomFiles.getState();

      // Should be different objects
      expect(state1).not.toBe(state2);
      // But should have same structure
      expect(state1).toEqual(state2);
    });

    it('should clear error state with clearError()', async () => {
      // Cause an error
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Test error' })
      });

      await expect(gedcomFiles.listFiles()).rejects.toThrow();

      let state = gedcomFiles.getState();
      expect(state.error).toBe('Test error');

      // Clear error
      gedcomFiles.clearError();

      state = gedcomFiles.getState();
      expect(state.error).toBe(null);
    });
  });

  describe('Error Handling', () => {
    it('should emit error event on failed operations', (done) => {
      const errorMessage = 'Network error';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      let eventReceived = false;

      listeners.on('gedcomFiles:error', (msg) => {
        expect(msg.type).toBe('gedcomFiles:error');
        expect(msg.body.error).toBe(errorMessage);
        expect(msg.body.action).toBe('listFiles');
        eventReceived = true;
        done();
      });

      gedcomFiles.listFiles().catch(() => {
        setTimeout(() => {
          if (!eventReceived) {
            done(new Error('Error event not received'));
          }
        }, 100);
      });
    });

    it('should handle network errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        gedcomFiles.listFiles()
      ).rejects.toThrow('Network failure');

      const state = gedcomFiles.getState();
      expect(state.error).toBe('Network failure');
      expect(state.loading).toBe(false);
    });

    it('should handle malformed JSON responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(
        gedcomFiles.listFiles()
      ).rejects.toThrow();

      const state = gedcomFiles.getState();
      expect(state.error).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should handle full file lifecycle', async () => {
      const mockFile = new File(['content'], 'test.ged');
      const mockFileMetadata = {
        file_id: 'file-123',
        name: 'Test Tree',
      };

      // Upload
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockFileMetadata })
      });

      const uploadResult = await gedcomFiles.uploadGedcom(mockFile, 'Test Tree');
      expect(uploadResult.fileId).toBe('file-123');

      let state = gedcomFiles.getState();
      expect(state.currentFile).toEqual(mockFileMetadata);

      // List files
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { files: [mockFileMetadata], meta: { total: 1, limit: 50, offset: 0 } } })
      });

      const files = await gedcomFiles.listFiles();
      expect(files).toHaveLength(1);

      // Validate
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { valid: true, errors: [] } })
      });

      const validation = await gedcomFiles.validateFile('file-123');
      expect(validation.valid).toBe(true);

      // Delete
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await gedcomFiles.deleteFile('file-123');

      state = gedcomFiles.getState();
      expect(state.currentFile).toBe(null);
      expect(state.files).toHaveLength(0);
    });
  });
});

