/**
 * Integration Test Suite for useGedcomGraph Facet
 * 
 * Tests the GEDCOM graph facet with REAL GEDCOM files from /apps/gedcom-go/testdata
 * and REAL API calls to the Go API server.
 * 
 * Prerequisites:
 * - Go API server must be running on http://localhost:8090
 * - GEDCOM test files must be available in /apps/gedcom-go/testdata
 * 
 * These are integration tests, not unit tests!
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestSystem } from '../../test-system.builder.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const TESTDATA_PATH = '/apps/gedcom-go/testdata';
const GO_API_URL = 'http://localhost:8090';

// Known individuals from tree1.ged (Norman's family)
const KNOWN_INDIVIDUALS = {
  norman: '@I0087@',      // Norman Peter Gonsalves
  monica: '@I0096@',      // Norman's daughter Monica
  alfred: '@I0082@',      // Norman's father Alfred
  ulfat: '@I0083@'        // Norman's mother Ulfat
};

describe('useGedcomGraph Integration Tests', () => {
  let system;
  let gedcomFiles;
  let gedcomGraph;
  let listeners;
  let uploadedFileId = null;

  beforeAll(async () => {
    console.log('\n⚠️  Integration tests require Go API running at', GO_API_URL);
    console.log('   Start the Go API with: cd /apps/ligneous-gedcom-api && ./api\n');
    
    // Build system and upload tree1.ged once for all tests
    system = await buildTestSystem('ligneous-integration-test', {
      goApiUrl: GO_API_URL
    });
    
    gedcomFiles = system.find('gedcomFiles');
    gedcomGraph = system.find('gedcomGraph');
    listeners = system.find('listeners');
    
    if (listeners) {
      listeners.enableListeners();
    }

    // Upload tree1.ged for all tests to use (has Norman's family data)
    const tree1Path = resolve(TESTDATA_PATH, 'tree1.ged');
    const fileContent = readFileSync(tree1Path);
    const file = new File([fileContent], 'tree1.ged', { type: 'text/plain' });
    
    const result = await gedcomFiles.uploadGedcom(file, 'Tree1 Test');
    uploadedFileId = result.fileId;
    
    console.log(`   ✅ Uploaded tree1.ged with file ID: ${uploadedFileId}\n`);
  }, 60000); // Increased timeout for setup

  afterAll(async () => {
    // Clean up uploaded file
    if (uploadedFileId && gedcomFiles) {
      try {
        await gedcomFiles.deleteFile(uploadedFileId);
        console.log('\n   🗑️  Cleaned up test file\n');
      } catch (error) {
        console.warn('   ⚠️  Failed to clean up test file:', error.message);
      }
    }
  }, 30000);

  describe('Get Ancestors', () => {
    it('should get Norman\'s ancestors', async () => {
      const result = await gedcomGraph.getAncestors(
        uploadedFileId,
        KNOWN_INDIVIDUALS.norman,
        2 // 2 generations
      );

      expect(result).toBeDefined();
      expect(result.ancestors).toBeDefined();
      expect(Array.isArray(result.ancestors)).toBe(true);
      expect(result.ancestors.length).toBeGreaterThan(0);

      // Should have meta data
      expect(result.meta).toBeDefined();
      expect(result.meta.total).toBeGreaterThan(0);

      // Ancestors should have generation field
      const firstAncestor = result.ancestors[0];
      expect(firstAncestor).toHaveProperty('generation');
      expect(firstAncestor).toHaveProperty('xref');
      expect(firstAncestor).toHaveProperty('name');

      console.log(`   👴 Found ${result.ancestors.length} ancestors in ${2} generations`);
      
      // State should be updated
      const state = gedcomGraph.getState();
      expect(state.ancestors).toEqual(result.ancestors);
    }, 15000);

    it('should include generation numbers in ancestor data', async () => {
      const result = await gedcomGraph.getAncestors(
        uploadedFileId,
        KNOWN_INDIVIDUALS.norman,
        3
      );

      // Group by generation
      const byGeneration = {};
      result.ancestors.forEach(ancestor => {
        const gen = ancestor.generation;
        byGeneration[gen] = (byGeneration[gen] || 0) + 1;
      });

      console.log('   📊 Ancestors by generation:', byGeneration);
      
      // Should have generation 1 (parents)
      expect(byGeneration[1]).toBeGreaterThan(0);
      
      // Should have proper generation values
      result.ancestors.forEach(ancestor => {
        expect(ancestor.generation).toBeGreaterThanOrEqual(1);
        expect(ancestor.generation).toBeLessThanOrEqual(3);
      });
    }, 15000);
  });

  describe('Get Descendants', () => {
    it('should get Norman\'s descendants', async () => {
      const result = await gedcomGraph.getDescendants(
        uploadedFileId,
        KNOWN_INDIVIDUALS.norman,
        2 // 2 generations
      );

      expect(result).toBeDefined();
      expect(result.descendants).toBeDefined();
      expect(Array.isArray(result.descendants)).toBe(true);
      expect(result.descendants.length).toBeGreaterThan(0);

      // Should have meta data
      expect(result.meta).toBeDefined();

      // Descendants should have proper structure
      const firstDescendant = result.descendants[0];
      expect(firstDescendant).toHaveProperty('xref');
      expect(firstDescendant).toHaveProperty('name');

      console.log(`   👶 Found ${result.descendants.length} descendants`);
      
      // State should be updated
      const state = gedcomGraph.getState();
      expect(state.descendants).toEqual(result.descendants);
    }, 15000);

    it('should find Norman\'s children', async () => {
      const result = await gedcomGraph.getDescendants(
        uploadedFileId,
        KNOWN_INDIVIDUALS.norman,
        1 // Just children
      );

      // Norman has 4 children
      expect(result.descendants.length).toBeGreaterThan(0);
      
      // Monica should be one of them
      const monica = result.descendants.find(d => 
        d.xref === KNOWN_INDIVIDUALS.monica
      );
      expect(monica).toBeDefined();

      console.log(`   ✅ Found ${result.descendants.length} children including Monica`);
    }, 15000);
  });

  describe('Get Relationship', () => {
    it('should calculate relationship between Norman and Monica (parent-child)', async () => {
      const relationship = await gedcomGraph.getRelationship(
        uploadedFileId,
        KNOWN_INDIVIDUALS.norman,
        KNOWN_INDIVIDUALS.monica
      );

      expect(relationship).toBeDefined();
      expect(relationship.from).toBeDefined();
      expect(relationship.from.xref).toBe(KNOWN_INDIVIDUALS.norman);
      expect(relationship.to).toBeDefined();
      expect(relationship.to.xref).toBe(KNOWN_INDIVIDUALS.monica);
      
      // Should identify as parent relationship
      expect(relationship.relationship_type).toBeDefined();
      expect(relationship.is_direct).toBe(true);
      
      // Should have path information
      expect(relationship.path).toBeDefined();
      expect(relationship.path.nodes).toBeDefined();
      expect(Array.isArray(relationship.path.nodes)).toBe(true);

      console.log(`   👨‍👧 Relationship: ${relationship.relationship_type}`);
      console.log(`   📏 Path length: ${relationship.path.length}`);
      
      // State should be updated
      const state = gedcomGraph.getState();
      expect(state.relationship).toEqual(relationship);
    }, 15000);

    it('should calculate relationship between Norman and his father', async () => {
      const relationship = await gedcomGraph.getRelationship(
        uploadedFileId,
        KNOWN_INDIVIDUALS.norman,
        KNOWN_INDIVIDUALS.alfred
      );

      expect(relationship).toBeDefined();
      expect(relationship.relationship_type).toBeDefined();
      expect(typeof relationship.is_direct).toBe('boolean');
      
      console.log(`   👨‍👦 Norman → Alfred: ${relationship.relationship_type} (direct: ${relationship.is_direct})`);
    }, 15000);
  });

  describe('Get Paths', () => {
    it('should find shortest path between Norman and Monica', async () => {
      const paths = await gedcomGraph.getPaths(
        uploadedFileId,
        KNOWN_INDIVIDUALS.norman,
        KNOWN_INDIVIDUALS.monica
      );

      expect(paths).toBeDefined();
      expect(paths.nodes).toBeDefined();
      expect(Array.isArray(paths.nodes)).toBe(true);
      expect(paths.nodes.length).toBeGreaterThan(0);
      
      // Should have both individuals in path
      expect(paths.nodes).toContain(KNOWN_INDIVIDUALS.norman);
      expect(paths.nodes).toContain(KNOWN_INDIVIDUALS.monica);
      
      // Should have length and type
      expect(paths.length).toBeDefined();
      expect(typeof paths.length).toBe('number');
      expect(paths.type).toBeDefined();

      console.log(`   🛤️  Shortest path: ${paths.length} nodes`);
      console.log(`   📍 Path type: ${paths.type}`);
      
      // State should be updated
      const state = gedcomGraph.getState();
      expect(state.paths).toEqual(paths);
    }, 15000);

    it('should find path between Norman and his mother', async () => {
      const paths = await gedcomGraph.getPaths(
        uploadedFileId,
        KNOWN_INDIVIDUALS.norman,
        KNOWN_INDIVIDUALS.ulfat
      );

      expect(paths).toBeDefined();
      expect(paths.nodes.length).toBeGreaterThanOrEqual(2);
      
      console.log(`   🛤️  Norman → Ulfat: ${paths.length} nodes`);
    }, 15000);
  });

  describe('Get Centrality', () => {
    it('should calculate centrality measures for all individuals', async () => {
      const centrality = await gedcomGraph.getCentrality(
        uploadedFileId,
        'degree'
      );

      expect(centrality).toBeDefined();
      expect(typeof centrality).toBe('object');
      
      // Should be a map of xref -> score
      const xrefs = Object.keys(centrality);
      expect(xrefs.length).toBeGreaterThan(0);
      
      // Norman should be in the results
      expect(centrality[KNOWN_INDIVIDUALS.norman]).toBeDefined();
      expect(typeof centrality[KNOWN_INDIVIDUALS.norman]).toBe('number');

      console.log(`   📊 Calculated centrality for ${xrefs.length} individuals`);
      console.log(`   🎯 Norman's centrality: ${centrality[KNOWN_INDIVIDUALS.norman]}`);
      
      // State should be updated
      const state = gedcomGraph.getState();
      expect(state.centrality).toEqual(centrality);
    }, 30000); // Longer timeout for centrality calculation
  });

  describe('Get Most Connected', () => {
    it('should get top 10 most connected individuals', async () => {
      const mostConnected = await gedcomGraph.getMostConnected(
        uploadedFileId,
        10,
        'degree'
      );

      expect(mostConnected).toBeDefined();
      expect(Array.isArray(mostConnected)).toBe(true);
      expect(mostConnected.length).toBeGreaterThan(0);
      expect(mostConnected.length).toBeLessThanOrEqual(10);
      
      // Each item should have xref, name, and centrality
      const first = mostConnected[0];
      expect(first).toHaveProperty('xref');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('centrality');
      expect(typeof first.centrality).toBe('number');
      
      // Should be sorted by centrality (highest first)
      if (mostConnected.length > 1) {
        expect(mostConnected[0].centrality).toBeGreaterThanOrEqual(
          mostConnected[1].centrality
        );
      }

      console.log(`   🏆 Top 3 most connected:`);
      mostConnected.slice(0, 3).forEach((person, i) => {
        console.log(`   ${i + 1}. ${person.name} (${person.centrality})`);
      });
      
      // State should be updated
      const state = gedcomGraph.getState();
      expect(state.mostConnected).toEqual(mostConnected);
    }, 30000); // Longer timeout
  });

  describe('Data Validation', () => {
    it('should have properly formatted ancestor data', async () => {
      const result = await gedcomGraph.getAncestors(
        uploadedFileId,
        KNOWN_INDIVIDUALS.norman,
        2
      );

      const ancestor = result.ancestors[0];
      
      // Required fields
      expect(ancestor).toHaveProperty('xref');
      expect(ancestor.xref).toMatch(/^@I\d+@$/);
      expect(ancestor).toHaveProperty('name');
      expect(typeof ancestor.name).toBe('string');
      expect(ancestor).toHaveProperty('generation');
      expect(typeof ancestor.generation).toBe('number');
      
      // Optional but common fields
      if (ancestor.birth_date) {
        expect(typeof ancestor.birth_date).toBe('string');
      }
      if (ancestor.sex) {
        expect(['M', 'F', 'U']).toContain(ancestor.sex);
      }

      console.log(`   ✅ Ancestor data structure validated`);
    }, 15000);

    it('should have properly formatted relationship data', async () => {
      const relationship = await gedcomGraph.getRelationship(
        uploadedFileId,
        KNOWN_INDIVIDUALS.norman,
        KNOWN_INDIVIDUALS.monica
      );

      // Required fields
      expect(relationship).toHaveProperty('from');
      expect(relationship.from).toHaveProperty('xref');
      expect(relationship.from).toHaveProperty('name');
      
      expect(relationship).toHaveProperty('to');
      expect(relationship.to).toHaveProperty('xref');
      expect(relationship.to).toHaveProperty('name');
      
      expect(relationship).toHaveProperty('relationship_type');
      expect(typeof relationship.relationship_type).toBe('string');
      
      expect(relationship).toHaveProperty('is_direct');
      expect(typeof relationship.is_direct).toBe('boolean');
      
      expect(relationship).toHaveProperty('path');
      expect(relationship.path).toHaveProperty('nodes');
      expect(Array.isArray(relationship.path.nodes)).toBe(true);

      console.log(`   ✅ Relationship data structure validated`);
    }, 15000);
  });

  describe('State Management', () => {
    it('should update state correctly during operations', async () => {
      // Initial state
      let state = gedcomGraph.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);

      // Perform operation
      await gedcomGraph.getAncestors(uploadedFileId, KNOWN_INDIVIDUALS.norman, 2);
      
      // After operation
      state = gedcomGraph.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.ancestors).toBeDefined();
      expect(Array.isArray(state.ancestors)).toBe(true);

      console.log(`   ✅ State management working correctly`);
    }, 15000);

    it('should clear errors', async () => {
      // Force an error
      try {
        await gedcomGraph.getRelationship('invalid-file-id', '@I0001@', '@I0002@');
      } catch (error) {
        // Expected to fail
      }
      
      let state = gedcomGraph.getState();
      expect(state.error).not.toBe(null);
      
      // Clear error
      gedcomGraph.clearError();
      
      state = gedcomGraph.getState();
      expect(state.error).toBe(null);

      console.log(`   ✅ Error clearing works`);
    }, 15000);
  });

  describe('Event Emission', () => {
    it('should emit ancestors:loaded event', (done) => {
      let eventReceived = false;

      const unsubscribe = listeners.on('gedcomGraph:ancestors:loaded', (event) => {
        eventReceived = true;
        
        expect(event).toBeDefined();
        expect(event.body).toBeDefined();
        expect(event.body.xref).toBe(KNOWN_INDIVIDUALS.norman);
        expect(event.body.count).toBeGreaterThan(0);
        
        console.log(`   📡 Event received: ${event.body.count} ancestors`);
        
        unsubscribe();
        done();
      });

      gedcomGraph.getAncestors(uploadedFileId, KNOWN_INDIVIDUALS.norman, 2).catch(done);
      
      setTimeout(() => {
        if (!eventReceived) {
          unsubscribe();
          done(new Error('Event not received'));
        }
      }, 5000);
    }, 15000);

    it('should emit relationship:calculated event', (done) => {
      let eventReceived = false;

      const unsubscribe = listeners.on('gedcomGraph:relationship:calculated', (event) => {
        eventReceived = true;
        
        expect(event).toBeDefined();
        expect(event.body).toBeDefined();
        expect(event.body.xref1).toBe(KNOWN_INDIVIDUALS.norman);
        expect(event.body.xref2).toBe(KNOWN_INDIVIDUALS.monica);
        
        console.log(`   📡 Relationship event received`);
        
        unsubscribe();
        done();
      });

      gedcomGraph.getRelationship(
        uploadedFileId,
        KNOWN_INDIVIDUALS.norman,
        KNOWN_INDIVIDUALS.monica
      ).catch(done);
      
      setTimeout(() => {
        if (!eventReceived) {
          unsubscribe();
          done(new Error('Event not received'));
        }
      }, 5000);
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle invalid file ID gracefully', async () => {
      await expect(
        gedcomGraph.getAncestors('invalid-file-id', '@I0001@', 2)
      ).rejects.toThrow();

      const state = gedcomGraph.getState();
      expect(state.error).not.toBe(null);
      expect(state.loading).toBe(false);

      console.log(`   ✅ Invalid file ID handled correctly`);
    }, 15000);

    it('should handle invalid individual XREF gracefully', async () => {
      await expect(
        gedcomGraph.getAncestors(uploadedFileId, '@I99999@', 2)
      ).rejects.toThrow();

      const state = gedcomGraph.getState();
      expect(state.error).not.toBe(null);
      expect(state.loading).toBe(false);

      console.log(`   ✅ Invalid XREF handled correctly`);
    }, 15000);
  });
});

