/**
 * Test suite for useGedcomIndividuals Facet
 * 
 * Tests the GEDCOM individuals facet functionality including:
 * - Get individuals list
 * - Get individual details
 * - Search individuals
 * - Get parents, children, siblings, spouses
 * - State management
 * - Event emission
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildTestSystem } from '../../test-system.builder.js';
import {
  mockIndividuals,
  mockParents,
  mockChildren,
  mockSiblings,
  mockSpouses,
  mockSearchResults,
  wrapApiResponse,
  createPaginatedResponse
} from './test-data.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('useGedcomIndividuals Facet', () => {
  let system;
  let gedcomIndividuals;
  let listeners;

  const waitForEvent = (eventName, { timeoutMs = 500, assert } = {}) =>
    new Promise((resolve, reject) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error(`Event not received: ${eventName}`));
      }, timeoutMs);

      listeners.on(eventName, (msg) => {
        if (settled) return;
        try {
          if (assert) assert(msg);
          settled = true;
          clearTimeout(timer);
          resolve(msg);
        } catch (e) {
          settled = true;
          clearTimeout(timer);
          reject(e);
        }
      });
    });

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
    
    // Get gedcomIndividuals facet
    gedcomIndividuals = system.find('gedcomIndividuals');
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

    it('should have gedcomIndividuals facet', () => {
      expect(gedcomIndividuals).toBeDefined();
      expect(typeof gedcomIndividuals.getIndividuals).toBe('function');
      expect(typeof gedcomIndividuals.getIndividual).toBe('function');
      expect(typeof gedcomIndividuals.searchIndividuals).toBe('function');
      expect(typeof gedcomIndividuals.getParents).toBe('function');
      expect(typeof gedcomIndividuals.getChildren).toBe('function');
      expect(typeof gedcomIndividuals.getSiblings).toBe('function');
      expect(typeof gedcomIndividuals.getSpouses).toBe('function');
      expect(typeof gedcomIndividuals.getState).toBe('function');
      expect(typeof gedcomIndividuals.clearError).toBe('function');
      expect(typeof gedcomIndividuals.clearSearchResults).toBe('function');
    });

    it('should have listeners facet', () => {
      expect(listeners).toBeDefined();
      expect(listeners.hasListeners()).toBe(true);
    });
  });

  describe('Initial State', () => {
    it('should start with clean state', () => {
      const state = gedcomIndividuals.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.individuals).toEqual([]);
      expect(state.currentIndividual).toBe(null);
      expect(state.parents).toEqual([]);
      expect(state.children).toEqual([]);
      expect(state.siblings).toEqual([]);
      expect(state.spouses).toEqual([]);
      expect(state.searchResults).toEqual([]);
    });
  });

  describe('Get Individuals', () => {
    it('should get individuals list successfully', async () => {
      // Use realistic test data from xavier.ged
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => wrapApiResponse({ 
          individuals: mockIndividuals,
          total: mockIndividuals.length
        })
      });

      const result = await gedcomIndividuals.getIndividuals('xavier-test-123');

      expect(result.individuals).toEqual(mockIndividuals);
      expect(result.total).toBe(mockIndividuals.length);

      // Check state
      const state = gedcomIndividuals.getState();
      expect(state.individuals).toEqual(mockIndividuals);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);

      // Check API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8091/api/v1/files/xavier-test-123/individuals'
      );
    });

    it('should get individuals with query parameters', async () => {
      const mockIndividuals = [
        { xref: 'I1', name: { full: 'John Doe' } }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { individuals: mockIndividuals } })
      });

      await gedcomIndividuals.getIndividuals('file-123', {
        limit: 10,
        offset: 0,
        name: 'John'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8091/api/v1/files/file-123/individuals?limit=10&offset=0&name=John'
      );
    });

    it('should emit gedcomIndividuals:loaded event', async () => {
      const mockIndividuals = [
        { xref: 'I1', name: { full: 'John Doe' } }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { individuals: mockIndividuals } })
      });

      const eventP = waitForEvent('gedcomIndividuals:loaded', {
        assert: (msg) => {
          expect(msg.type).toBe('gedcomIndividuals:loaded');
          expect(msg.body.count).toBe(1);
        }
      });

      await gedcomIndividuals.getIndividuals('file-123');
      await eventP;
    });

    it('should handle get individuals errors', async () => {
      const errorMessage = 'File not found';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      await expect(
        gedcomIndividuals.getIndividuals('nonexistent')
      ).rejects.toThrow(errorMessage);

      const state = gedcomIndividuals.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
    });
  });

  describe('Get Individual', () => {
    it('should get a specific individual successfully', async () => {
      // Use Augustinho Thomas Gonsalves from xavier.ged
      const mockIndividual = mockIndividuals[0]; // I0069

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => wrapApiResponse(mockIndividual)
      });

      const result = await gedcomIndividuals.getIndividual('file-123', 'I1');

      expect(result).toEqual(mockIndividual);

      // Check state
      const state = gedcomIndividuals.getState();
      expect(state.currentIndividual).toEqual(mockIndividual);
      expect(state.loading).toBe(false);

      // Check API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8091/api/v1/files/file-123/individuals/I1'
      );
    });

    it('should emit gedcomIndividuals:individual:loaded event', async () => {
      const mockIndividual = { xref: 'I1', name: { full: 'John Doe' } };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockIndividual })
      });

      const eventP = waitForEvent('gedcomIndividuals:individual:loaded', {
        assert: (msg) => {
          expect(msg.type).toBe('gedcomIndividuals:individual:loaded');
          expect(msg.body.xref).toBe('I1');
          expect(msg.body.individual).toEqual(mockIndividual);
        }
      });

      await gedcomIndividuals.getIndividual('file-123', 'I1');
      await eventP;
    });

    it('should handle get individual errors', async () => {
      const errorMessage = 'Individual not found';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      await expect(
        gedcomIndividuals.getIndividual('file-123', 'I999')
      ).rejects.toThrow(errorMessage);

      const state = gedcomIndividuals.getState();
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('Search Individuals', () => {
    it('should search individuals successfully', async () => {
      const searchQuery = {
        name: 'Gonsalves',
        birth_year: 1894
      };

      // Use realistic search results from xavier.ged
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => wrapApiResponse({ individuals: mockSearchResults })
      });

      const result = await gedcomIndividuals.searchIndividuals('xavier-test-123', searchQuery);

      expect(result).toEqual(mockSearchResults);

      // Check state
      const state = gedcomIndividuals.getState();
      expect(state.searchResults).toEqual(mockSearchResults);
      expect(state.loading).toBe(false);

      // Check API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8091/api/v1/files/xavier-test-123/individuals/search',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchQuery)
        })
      );
    });

    it('should emit gedcomIndividuals:search:complete event', async () => {
      const mockResults = [{ xref: 'I1' }, { xref: 'I2' }];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { individuals: mockResults } })
      });

      const eventP = waitForEvent('gedcomIndividuals:search:complete', {
        assert: (msg) => {
          expect(msg.type).toBe('gedcomIndividuals:search:complete');
          expect(msg.body.count).toBe(2);
        }
      });

      await gedcomIndividuals.searchIndividuals('file-123', { name: 'John' });
      await eventP;
    });

    it('should clear search results', () => {
      // Set some search results first
      gedcomIndividuals.getState().searchResults = [{ xref: 'I1' }];

      gedcomIndividuals.clearSearchResults();

      const state = gedcomIndividuals.getState();
      expect(state.searchResults).toEqual([]);
    });
  });

  describe('Get Parents', () => {
    it('should get parents successfully', async () => {
      // Get parents of Lucia Cecilia Xavier (I0263) - Francis & Carlotta
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => wrapApiResponse(mockParents)
      });

      const result = await gedcomIndividuals.getParents('xavier-test-123', 'I0263');

      expect(result).toEqual(mockParents);

      // Check state
      const state = gedcomIndividuals.getState();
      expect(state.parents).toEqual(mockParents);
      expect(state.loading).toBe(false);

      // Check API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8091/api/v1/files/xavier-test-123/individuals/I0263/parents'
      );
    });

    it('should emit gedcomIndividuals:parents:loaded event', async () => {
      const mockParents = [{ xref: 'I10' }];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockParents })
      });

      const eventP = waitForEvent('gedcomIndividuals:parents:loaded', {
        assert: (msg) => {
          expect(msg.type).toBe('gedcomIndividuals:parents:loaded');
          expect(msg.body.xref).toBe('I1');
          expect(msg.body.count).toBe(1);
        }
      });

      await gedcomIndividuals.getParents('file-123', 'I1');
      await eventP;
    });

    it('should handle no parents case', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      });

      const result = await gedcomIndividuals.getParents('file-123', 'I1');

      expect(result).toEqual([]);
      expect(gedcomIndividuals.getState().parents).toEqual([]);
    });
  });

  describe('Get Children', () => {
    it('should get children successfully', async () => {
      // Get children of Augustinho & Lucia (I0069) from family F0297
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => wrapApiResponse(mockChildren)
      });

      const result = await gedcomIndividuals.getChildren('xavier-test-123', 'I0069');

      expect(result).toEqual(mockChildren);
      expect(result).toHaveLength(mockChildren.length);

      // Check state
      const state = gedcomIndividuals.getState();
      expect(state.children).toEqual(mockChildren);

      // Check API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8091/api/v1/files/xavier-test-123/individuals/I0069/children'
      );
    });

    it('should emit gedcomIndividuals:children:loaded event', async () => {
      const mockChildren = [{ xref: 'I20' }, { xref: 'I21' }];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockChildren })
      });

      const eventP = waitForEvent('gedcomIndividuals:children:loaded', {
        assert: (msg) => {
          expect(msg.type).toBe('gedcomIndividuals:children:loaded');
          expect(msg.body.xref).toBe('I1');
          expect(msg.body.count).toBe(2);
        }
      });

      await gedcomIndividuals.getChildren('file-123', 'I1');
      await eventP;
    });
  });

  describe('Get Siblings', () => {
    it('should get siblings successfully', async () => {
      // Get siblings of Child One (I0266) - they share parents F0297
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => wrapApiResponse(mockSiblings)
      });

      const result = await gedcomIndividuals.getSiblings('xavier-test-123', 'I0266');

      expect(result).toEqual(mockSiblings);

      // Check state
      const state = gedcomIndividuals.getState();
      expect(state.siblings).toEqual(mockSiblings);

      // Check API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8091/api/v1/files/xavier-test-123/individuals/I0266/siblings'
      );
    });

    it('should emit gedcomIndividuals:siblings:loaded event', async () => {
      const mockSiblings = [{ xref: 'I2' }];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSiblings })
      });

      const eventP = waitForEvent('gedcomIndividuals:siblings:loaded', {
        assert: (msg) => {
          expect(msg.type).toBe('gedcomIndividuals:siblings:loaded');
          expect(msg.body.xref).toBe('I1');
          expect(msg.body.count).toBe(1);
        }
      });

      await gedcomIndividuals.getSiblings('file-123', 'I1');
      await eventP;
    });
  });

  describe('Get Spouses', () => {
    it('should get spouses successfully', async () => {
      // Get spouses of Antonio Rodrigues (I0176) - had 3 marriages
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => wrapApiResponse(mockSpouses)
      });

      const result = await gedcomIndividuals.getSpouses('xavier-test-123', 'I0176');

      expect(result).toEqual(mockSpouses);

      // Check state
      const state = gedcomIndividuals.getState();
      expect(state.spouses).toEqual(mockSpouses);

      // Check API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8091/api/v1/files/xavier-test-123/individuals/I0176/spouses'
      );
    });

    it('should emit gedcomIndividuals:spouses:loaded event', async () => {
      const mockSpouses = [{ xref: 'I50' }];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockSpouses })
      });

      const eventP = waitForEvent('gedcomIndividuals:spouses:loaded', {
        assert: (msg) => {
          expect(msg.type).toBe('gedcomIndividuals:spouses:loaded');
          expect(msg.body.xref).toBe('I1');
          expect(msg.body.count).toBe(1);
        }
      });

      await gedcomIndividuals.getSpouses('file-123', 'I1');
      await eventP;
    });
  });

  describe('State Management', () => {
    it('should update loading state during operations', async () => {
      // Mock a slow API call
      global.fetch.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ data: { individuals: [] } })
        }), 100))
      );

      const getPromise = gedcomIndividuals.getIndividuals('file-123');

      // Check loading state immediately
      let state = gedcomIndividuals.getState();
      expect(state.loading).toBe(true);

      await getPromise;

      // Check loading state after completion
      state = gedcomIndividuals.getState();
      expect(state.loading).toBe(false);
    });

    it('should return a copy of state from getState()', () => {
      const state1 = gedcomIndividuals.getState();
      const state2 = gedcomIndividuals.getState();

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

      await expect(
        gedcomIndividuals.getIndividuals('file-123')
      ).rejects.toThrow();

      let state = gedcomIndividuals.getState();
      expect(state.error).toBe('Test error');

      // Clear error
      gedcomIndividuals.clearError();

      state = gedcomIndividuals.getState();
      expect(state.error).toBe(null);
    });

    it('should emit stateChanged event', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { individuals: [] } })
      });

      const eventP = new Promise((resolve, reject) => {
        let eventCount = 0;
        const timer = setTimeout(() => reject(new Error('Expected stateChanged events not received')), 800);

        listeners.on('gedcomIndividuals:stateChanged', (msg) => {
          eventCount++;
          expect(msg.type).toBe('gedcomIndividuals:stateChanged');
          if (eventCount >= 2) {
            clearTimeout(timer);
            resolve(true);
          }
        });
      });

      await gedcomIndividuals.getIndividuals('file-123');
      await eventP;
    });
  });

  describe('Error Handling', () => {
    it('should emit error event on failed operations', async () => {
      const errorMessage = 'API error';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      const eventP = waitForEvent('gedcomIndividuals:error', {
        assert: (msg) => {
          expect(msg.type).toBe('gedcomIndividuals:error');
          expect(msg.body.error).toBe(errorMessage);
          expect(msg.body.action).toBe('getIndividuals');
        }
      });

      await expect(gedcomIndividuals.getIndividuals('file-123')).rejects.toThrow(errorMessage);
      await eventP;
    });

    it('should handle network errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        gedcomIndividuals.getIndividuals('file-123')
      ).rejects.toThrow('Network failure');

      const state = gedcomIndividuals.getState();
      expect(state.error).toBe('Network failure');
      expect(state.loading).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should handle full individual workflow', async () => {
      // Get individuals list
      const mockIndividuals = [
        { xref: 'I1', name: { full: 'John Doe' } }
      ];
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { individuals: mockIndividuals } })
      });

      await gedcomIndividuals.getIndividuals('file-123');
      expect(gedcomIndividuals.getState().individuals).toEqual(mockIndividuals);

      // Get individual details
      const mockIndividual = {
        xref: 'I1',
        name: { full: 'John Doe' },
        birth: { date: '1950' }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockIndividual })
      });

      await gedcomIndividuals.getIndividual('file-123', 'I1');
      expect(gedcomIndividuals.getState().currentIndividual).toEqual(mockIndividual);

      // Get parents
      const mockParents = [{ xref: 'I10' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockParents })
      });

      await gedcomIndividuals.getParents('file-123', 'I1');
      expect(gedcomIndividuals.getState().parents).toEqual(mockParents);

      // Get children
      const mockChildren = [{ xref: 'I20' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockChildren })
      });

      await gedcomIndividuals.getChildren('file-123', 'I1');
      expect(gedcomIndividuals.getState().children).toEqual(mockChildren);

      // Search
      const mockResults = [{ xref: 'I1' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { individuals: mockResults } })
      });

      await gedcomIndividuals.searchIndividuals('file-123', { name: 'John' });
      expect(gedcomIndividuals.getState().searchResults).toEqual(mockResults);

      // Clear search
      gedcomIndividuals.clearSearchResults();
      expect(gedcomIndividuals.getState().searchResults).toEqual([]);
    });
  });
});

