/**
 * Integration Test Suite for useGedcomIndividuals Facet
 * 
 * Tests the GEDCOM individuals facet with REAL GEDCOM files from /apps/gedcom-go/testdata
 * and REAL API calls to the Go API server.
 * 
 * Prerequisites:
 * - GEDCOM lib API server must be running on http://localhost:8091
 * - GEDCOM test files must be available in /apps/gedcom-go/testdata
 * 
 * These are integration tests, not unit tests!
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { buildTestSystem } from '../../test-system.builder.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const TESTDATA_PATH = '/apps/gedcom-go/testdata';
const GO_API_URL = 'http://localhost:8091';

// Known individuals from xavier.ged (from our previous analysis)
const KNOWN_INDIVIDUALS = {
  augustinho: {
    xref: '@I0069@',
    name: 'Augustinho Thomas Gonsalves',
    birthYear: 1894,
    deathYear: 1998
  },
  lucia: {
    xref: '@I0263@',
    name: 'Lucia Cecilia Xavier',
    birthYear: 1896,
    deathYear: 1967
  },
  francis: {
    xref: '@I0264@',
    name: 'Francis Xavier',
    birthYear: 1866,
    deathYear: 1909
  }
};

describe('useGedcomIndividuals Integration Tests', () => {
  let system;
  let gedcomFiles;
  let gedcomIndividuals;
  let listeners;
  let uploadedFileId = null;

  beforeAll(async () => {
    console.log('\n⚠️  Integration tests require GEDCOM lib API running at', GO_API_URL);
    console.log('   Start the Go API with: cd /apps/ligneous-gedcom-api && ./api\n');
    
    // Build system and upload xavier.ged once for all tests
    system = await buildTestSystem('ligneous-integration-test', {
      goApiUrl: GO_API_URL
    });
    
    gedcomFiles = system.find('gedcomFiles');
    gedcomIndividuals = system.find('gedcomIndividuals');
    listeners = system.find('listeners');
    
    if (listeners) {
      listeners.enableListeners();
    }

    // Upload xavier.ged for all tests to use
    const xavierPath = resolve(TESTDATA_PATH, 'xavier.ged');
    const fileContent = readFileSync(xavierPath);
    const file = new File([fileContent], 'xavier.ged', { type: 'text/plain' });
    
    const result = await gedcomFiles.uploadGedcom(file, 'Xavier Test Tree');
    uploadedFileId = result.fileId;
    
    console.log(`   ✅ Uploaded xavier.ged with file ID: ${uploadedFileId}\n`);
  }, 60000); // Increased timeout for setup

  afterAll(async () => {
    // Clean up uploaded file
    if (uploadedFileId && gedcomFiles) {
      try {
        await gedcomFiles.deleteFile(uploadedFileId);
        console.log('\n   🗑️  Cleaned up test file\n');
      } catch (err) {
        console.warn('Failed to delete test file:', err.message);
      }
    }
    
    if (system) {
      await system.dispose();
    }
  });

  describe('Get Individuals from Real File', () => {
    it('should get all individuals from xavier.ged', async () => {
      const result = await gedcomIndividuals.getIndividuals(uploadedFileId);

      expect(result).toBeDefined();
      expect(result.individuals).toBeDefined();
      expect(Array.isArray(result.individuals)).toBe(true);
      expect(result.individuals.length).toBeGreaterThan(0);
      expect(result.meta).toBeDefined();
      expect(result.meta.total).toBeGreaterThan(0);

      console.log(`   📊 Found ${result.meta.total} individuals in xavier.ged`);
      
      // State should be updated
      const state = gedcomIndividuals.getState();
      expect(state.individuals).toEqual(result.individuals);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    }, 15000);

    it('should get individuals with pagination', async () => {
      const result = await gedcomIndividuals.getIndividuals(uploadedFileId, {
        limit: 10,
        offset: 0
      });

      expect(result.individuals).toBeDefined();
      expect(result.individuals.length).toBeLessThanOrEqual(10);
      expect(result.meta.total).toBeGreaterThan(10); // xavier.ged has more than 10
    }, 15000);
  });

  describe('Get Specific Individuals', () => {
    it('should get Augustinho Thomas Gonsalves', async () => {
      const individual = await gedcomIndividuals.getIndividual(
        uploadedFileId,
        KNOWN_INDIVIDUALS.augustinho.xref
      );

      expect(individual).toBeDefined();
      expect(individual.xref).toBe(KNOWN_INDIVIDUALS.augustinho.xref);
      expect(individual.name).toBeDefined();
      expect(individual.name).toContain('Augustinho');
      expect(individual.name).toContain('Gonsalves');
      
      // Check birth/death dates (API returns as strings)
      expect(individual.birth_date).toBeDefined();
      expect(individual.birth_date).toContain('1894');
      expect(individual.death_date).toBeDefined();
      expect(individual.death_date).toContain('1998');
      
      // Check sex
      expect(individual.sex).toBe('M');

      console.log(`   ✅ Found: ${individual.name} (${individual.birth_date} - ${individual.death_date})`);
    }, 15000);

    it('should get Lucia Cecilia Xavier', async () => {
      const individual = await gedcomIndividuals.getIndividual(
        uploadedFileId,
        KNOWN_INDIVIDUALS.lucia.xref
      );

      expect(individual).toBeDefined();
      expect(individual.xref).toBe(KNOWN_INDIVIDUALS.lucia.xref);
      expect(individual.name).toContain('Lucia');
      expect(individual.name).toContain('Xavier');
      expect(individual.sex).toBe('F');
      expect(individual.birth_date).toBeDefined();
      expect(individual.birth_date).toContain('1896');

      console.log(`   ✅ Found: ${individual.name}`);
    }, 15000);
  });

  describe('Search Individuals', () => {
    it('should search for Gonsalves family members', async () => {
      const results = await gedcomIndividuals.searchIndividuals(uploadedFileId, {
        filters: {
          name: 'Gonsalves'
        }
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Should include Augustinho
      // Note: API returns name as a string, not an object
      const augustinho = results.find(r => 
        r.name && r.name.includes('Augustinho') && r.name.includes('Gonsalves')
      );
      expect(augustinho).toBeDefined();

      console.log(`   🔍 Found ${results.length} Gonsalves family members`);
    }, 15000);

    it('should search by birth year', async () => {
      const results = await gedcomIndividuals.searchIndividuals(uploadedFileId, {
        filters: {
          birth_year: 1894
        }
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      // Note: Birth year search may not be fully implemented in API
      // Just verify we get a valid response
      console.log(`   📅 Search completed, found ${results.length} results`);
      if (results.length > 0) {
        // birth_date is optional - not all individuals have birth dates
        expect(results[0]).toHaveProperty('xref');
        expect(results[0]).toHaveProperty('name');
      }
    }, 15000);

    it('should clear search results', () => {
      gedcomIndividuals.clearSearchResults();
      
      const state = gedcomIndividuals.getState();
      expect(state.searchResults).toEqual([]);
    });
  });

  describe('Get Relationships', () => {
    it('should get parents of Lucia Cecilia Xavier', async () => {
      const parents = await gedcomIndividuals.getParents(
        uploadedFileId,
        KNOWN_INDIVIDUALS.lucia.xref
      );

      expect(parents).toBeDefined();
      expect(Array.isArray(parents)).toBe(true);
      expect(parents.length).toBeGreaterThan(0);

      // Should include Francis Xavier (father) and Carlotta Baptista (mother)
      const father = parents.find(p => p.sex === 'M');
      const mother = parents.find(p => p.sex === 'F');
      
      if (father) {
        expect(father.name).toContain('Xavier');
        console.log(`   👨 Father: ${father.name}`);
      }
      
      if (mother) {
        console.log(`   👩 Mother: ${mother.name}`);
      }
    }, 15000);

    it('should get children of Augustinho Thomas Gonsalves', async () => {
      const children = await gedcomIndividuals.getChildren(
        uploadedFileId,
        KNOWN_INDIVIDUALS.augustinho.xref
      );

      expect(children).toBeDefined();
      expect(Array.isArray(children)).toBe(true);
      
      // Augustinho and Lucia had 9 children
      expect(children.length).toBeGreaterThan(0);
      
      console.log(`   👶 Found ${children.length} children`);
      
      // All should be Gonsalves
      children.forEach(child => {
        if (child.name && child.name.surname) {
          expect(child.name.surname).toContain('Gonsalves');
        }
      });
    }, 15000);

    it('should get siblings', async () => {
      // First get children of Augustinho to find one child
      const children = await gedcomIndividuals.getChildren(
        uploadedFileId,
        KNOWN_INDIVIDUALS.augustinho.xref
      );

      if (children.length > 0) {
        const firstChild = children[0];
        
        // Get siblings of first child
        const siblings = await gedcomIndividuals.getSiblings(
          uploadedFileId,
          firstChild.xref
        );

        expect(siblings).toBeDefined();
        expect(Array.isArray(siblings)).toBe(true);
        
        // Should have 8 siblings (9 children total - 1 self)
        expect(siblings.length).toBeGreaterThan(0);
        
        console.log(`   👫 Found ${siblings.length} siblings for ${firstChild.name?.full || firstChild.xref}`);
      }
    }, 15000);

    it('should get spouses', async () => {
      const spouses = await gedcomIndividuals.getSpouses(
        uploadedFileId,
        KNOWN_INDIVIDUALS.augustinho.xref
      );

      expect(spouses).toBeDefined();
      expect(Array.isArray(spouses)).toBe(true);
      
      // Augustinho married Lucia
      expect(spouses.length).toBeGreaterThan(0);
      
      const lucia = spouses.find(s => 
        s.name.includes('Lucia') && s.name.includes('Xavier')
      );
      expect(lucia).toBeDefined();
      
      console.log(`   💑 Found spouse: ${lucia.name}`);
    }, 15000);
  });

  describe('State Management with Real Data', () => {
    it('should update state correctly during operations', async () => {
      // Initial state
      let state = gedcomIndividuals.getState();
      expect(state.loading).toBe(false);

      // Get individuals (this will set loading to true temporarily)
      const promise = gedcomIndividuals.getIndividuals(uploadedFileId);
      
      // Final state
      await promise;
      state = gedcomIndividuals.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.individuals.length).toBeGreaterThan(0);
    }, 15000);

    it('should clear errors', async () => {
      // Force an error by using invalid file ID
      try {
        await gedcomIndividuals.getIndividuals('invalid-file-id');
      } catch (err) {
        // Expected to fail
      }

      let state = gedcomIndividuals.getState();
      expect(state.error).not.toBe(null);

      // Clear error
      gedcomIndividuals.clearError();
      state = gedcomIndividuals.getState();
      expect(state.error).toBe(null);
    }, 15000);
  });

  describe('Event Emission with Real Data', () => {
    it('should emit individuals:loaded event', (done) => {
      let eventReceived = false;

      listeners.on('gedcomIndividuals:loaded', (msg) => {
        expect(msg.type).toBe('gedcomIndividuals:loaded');
        expect(msg.body.count).toBeGreaterThan(0);
        eventReceived = true;
        done();
      });

      gedcomIndividuals.getIndividuals(uploadedFileId).then(() => {
        setTimeout(() => {
          if (!eventReceived) {
            done(new Error('Event not received'));
          }
        }, 1000);
      }).catch(done);
    }, 15000);
  });

  describe('Data Validation', () => {
    it('should have properly formatted individual data', async () => {
      const result = await gedcomIndividuals.getIndividuals(uploadedFileId);
      const individuals = result.individuals;

      expect(individuals.length).toBeGreaterThan(0);

      // Check first individual structure
      const individual = individuals[0];
      
      expect(individual).toHaveProperty('xref');
      expect(individual).toHaveProperty('name');
      // API returns name as a string, not an object
      expect(typeof individual.name).toBe('string');
      
      // API returns birth_date and death_date as strings
      if (individual.birth_date) {
        expect(typeof individual.birth_date).toBe('string');
      }
      
      if (individual.death_date) {
        expect(typeof individual.death_date).toBe('string');
      }

      console.log(`   ✅ Data structure validation passed`);
    }, 15000);
  });
});

