/**
 * Integration Test Suite for useGedcomFamilies Facet
 * 
 * Tests the GEDCOM families facet with REAL GEDCOM files from /apps/temp-family-tree-code/gedcom-go/testdata
 * and REAL API calls to the Go API server.
 * 
 * Prerequisites:
 * - GEDCOM lib API server must be running on http://localhost:8091
 * - GEDCOM test files must be available in /apps/temp-family-tree-code/gedcom-go/testdata
 * 
 * These are integration tests, not unit tests!
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestSystem } from '../../test-system.builder.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const TESTDATA_PATH = '/apps/temp-family-tree-code/gedcom-go/testdata';
const GO_API_URL = 'http://localhost:8091';

// Known families from tree1.ged (from our API testing)
const KNOWN_FAMILIES = {
  alphonso: {
    xref: '@F0364@',
    husband: 'John /Alphonso/',
    wife: 'Delma /Gonsalves/',
    children_count: 5
  }
};

describe('useGedcomFamilies Integration Tests', () => {
  let system;
  let gedcomFiles;
  let gedcomFamilies;
  let listeners;
  let uploadedFileId = null;

  beforeAll(async () => {
    console.log('\n⚠️  Integration tests require GEDCOM lib API running at', GO_API_URL);
    console.log('   Start the Go API with: cd /apps/ligneous-gedcom-api && ./api\n');
    
    // Build system and upload tree1.ged once for all tests
    system = await buildTestSystem('ligneous-integration-test', {
      goApiUrl: GO_API_URL
    });
    
    gedcomFiles = system.find('gedcomFiles');
    gedcomFamilies = system.find('gedcomFamilies');
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

  describe('Get Families from Real File', () => {
    it('should get all families from tree1.ged', async () => {
      const result = await gedcomFamilies.getFamilies(uploadedFileId);

      expect(result).toBeDefined();
      expect(result.families).toBeDefined();
      expect(Array.isArray(result.families)).toBe(true);
      expect(result.families.length).toBeGreaterThan(0);
      expect(result.meta).toBeDefined();
      expect(result.meta.total).toBeGreaterThan(0);

      console.log(`   📊 Found ${result.meta.total} families in tree1.ged`);
      
      // State should be updated
      const state = gedcomFamilies.getState();
      expect(state.families).toEqual(result.families);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    }, 15000);

    it('should get families with pagination', async () => {
      const result = await gedcomFamilies.getFamilies(uploadedFileId, {
        limit: 10,
        offset: 0
      });

      expect(result.families).toBeDefined();
      expect(result.families.length).toBeLessThanOrEqual(10);
      expect(result.meta.total).toBeGreaterThan(10); // tree1.ged has more than 10 families

      console.log(`   📄 Paginated results: ${result.families.length} of ${result.meta.total}`);
    }, 15000);
  });

  describe('Get Specific Families', () => {
    it('should get the Alphonso family', async () => {
      const family = await gedcomFamilies.getFamily(
        uploadedFileId,
        KNOWN_FAMILIES.alphonso.xref
      );

      expect(family).toBeDefined();
      expect(family.xref).toBe(KNOWN_FAMILIES.alphonso.xref);
      
      // Check husband
      expect(family.husband).toBeDefined();
      expect(family.husband.name).toContain('Alphonso');
      
      // Check wife
      expect(family.wife).toBeDefined();
      expect(family.wife.name).toContain('Gonsalves');
      
      // Check children
      expect(family.children).toBeDefined();
      expect(Array.isArray(family.children)).toBe(true);
      expect(family.children_count).toBe(KNOWN_FAMILIES.alphonso.children_count);
      expect(family.children.length).toBe(KNOWN_FAMILIES.alphonso.children_count);

      console.log(`   👨‍👩‍👧‍👦 Alphonso family: ${family.children_count} children`);
      
      // State should be updated
      const state = gedcomFamilies.getState();
      expect(state.currentFamily).toEqual(family);
    }, 15000);

    it('should get a family with multiple children', async () => {
      // First, get families and find one with multiple children
      const result = await gedcomFamilies.getFamilies(uploadedFileId, { limit: 50 });
      const familyWithChildren = result.families.find(f => f.children_count >= 5);
      
      expect(familyWithChildren).toBeDefined();
      
      // Now fetch that specific family
      const family = await gedcomFamilies.getFamily(
        uploadedFileId,
        familyWithChildren.xref
      );

      expect(family).toBeDefined();
      expect(family.xref).toBe(familyWithChildren.xref);
      
      // Verify children match
      expect(family.children_count).toBe(familyWithChildren.children_count);
      expect(family.children.length).toBe(familyWithChildren.children_count);
      expect(family.children.length).toBeGreaterThanOrEqual(5);

      console.log(`   👨‍👩‍👧‍👦 Family ${family.xref}: ${family.children_count} children`);
    }, 15000);
  });

  describe('Family Data Validation', () => {
    it('should have properly formatted family data', async () => {
      const result = await gedcomFamilies.getFamilies(uploadedFileId, { limit: 5 });
      const families = result.families;

      expect(families.length).toBeGreaterThan(0);

      // Check first family structure
      const family = families[0];
      
      expect(family).toHaveProperty('xref');
      expect(family.xref).toMatch(/^@F\d+@$/); // Format: @F0001@
      
      // Husband and wife are optional but should be objects if present
      if (family.husband) {
        expect(family.husband).toHaveProperty('xref');
        expect(family.husband).toHaveProperty('name');
        expect(typeof family.husband.name).toBe('string');
      }
      
      if (family.wife) {
        expect(family.wife).toHaveProperty('xref');
        expect(family.wife).toHaveProperty('name');
        expect(typeof family.wife.name).toBe('string');
      }
      
      // Children array (optional - some families have no children)
      if (family.children) {
        expect(Array.isArray(family.children)).toBe(true);
        
        if (family.children.length > 0) {
          const child = family.children[0];
          expect(child).toHaveProperty('xref');
          expect(child).toHaveProperty('name');
          expect(typeof child.name).toBe('string');
        }
      }
      
      // Children count (optional)
      if (family.children_count !== undefined) {
        expect(typeof family.children_count).toBe('number');
        if (family.children) {
          expect(family.children_count).toBe(family.children.length);
        }
      }

      console.log(`   ✅ Data structure validation passed`);
    }, 15000);

    it('should handle families with missing spouse data', async () => {
      const result = await gedcomFamilies.getFamilies(uploadedFileId, { limit: 50 });
      
      // Look for families with missing husband or wife
      const incompleteFamilies = result.families.filter(f => !f.husband || !f.wife);
      
      if (incompleteFamilies.length > 0) {
        console.log(`   👤 Found ${incompleteFamilies.length} families with missing spouse data`);
        
        // These should still be valid family objects
        incompleteFamilies.forEach(family => {
          expect(family.xref).toBeDefined();
          // Children can be null or undefined, but if present should be an array
          if (family.children !== null && family.children !== undefined) {
            expect(Array.isArray(family.children)).toBe(true);
          }
        });
      } else {
        console.log(`   ✓ All families have complete spouse data`);
      }
    }, 15000);
  });

  describe('State Management', () => {
    it('should update state correctly during operations', async () => {
      // Initial state
      let state = gedcomFamilies.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);

      // Start operation (we can't test loading directly, but we can test after)
      await gedcomFamilies.getFamilies(uploadedFileId, { limit: 5 });
      
      // After operation
      state = gedcomFamilies.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.families).toBeDefined();
      expect(Array.isArray(state.families)).toBe(true);
      expect(state.families.length).toBeGreaterThan(0);

      console.log(`   ✅ State management working correctly`);
    }, 15000);

    it('should clear errors', async () => {
      // Force an error by using invalid file ID
      try {
        await gedcomFamilies.getFamilies('invalid-file-id');
      } catch (error) {
        // Expected to fail
      }
      
      let state = gedcomFamilies.getState();
      expect(state.error).not.toBe(null);
      
      // Clear error
      gedcomFamilies.clearError();
      
      state = gedcomFamilies.getState();
      expect(state.error).toBe(null);

      console.log(`   ✅ Error clearing works`);
    }, 15000);
  });

  describe('Event Emission', () => {
    it('should emit families:loaded event', (done) => {
      let eventReceived = false;

      const unsubscribe = listeners.on('gedcomFamilies:loaded', (event) => {
        eventReceived = true;
        
        expect(event).toBeDefined();
        expect(event.body).toBeDefined();
        expect(event.body.count).toBeGreaterThan(0);
        expect(event.body.total).toBeGreaterThan(0);
        
        console.log(`   📡 Event received: ${event.body.count} families, ${event.body.total} total`);
        
        unsubscribe();
        done();
      });

      // Trigger the event
      gedcomFamilies.getFamilies(uploadedFileId, { limit: 10 }).catch(done);
      
      // Timeout if event not received
      setTimeout(() => {
        if (!eventReceived) {
          unsubscribe();
          done(new Error('Event not received'));
        }
      }, 5000);
    }, 15000);

    it('should emit family:loaded event', (done) => {
      let eventReceived = false;

      const unsubscribe = listeners.on('gedcomFamilies:family:loaded', (event) => {
        eventReceived = true;
        
        expect(event).toBeDefined();
        expect(event.body).toBeDefined();
        expect(event.body.xref).toBe(KNOWN_FAMILIES.alphonso.xref);
        expect(event.body.family).toBeDefined();
        
        console.log(`   📡 Event received: family ${event.body.xref}`);
        
        unsubscribe();
        done();
      });

      // Trigger the event
      gedcomFamilies.getFamily(uploadedFileId, KNOWN_FAMILIES.alphonso.xref).catch(done);
      
      // Timeout if event not received
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
        gedcomFamilies.getFamilies('invalid-file-id')
      ).rejects.toThrow();

      const state = gedcomFamilies.getState();
      expect(state.error).not.toBe(null);
      expect(state.loading).toBe(false);

      console.log(`   ✅ Invalid file ID handled correctly`);
    }, 15000);

    it('should handle invalid family XREF gracefully', async () => {
      await expect(
        gedcomFamilies.getFamily(uploadedFileId, '@F99999@')
      ).rejects.toThrow();

      const state = gedcomFamilies.getState();
      expect(state.error).not.toBe(null);
      expect(state.loading).toBe(false);

      console.log(`   ✅ Invalid family XREF handled correctly`);
    }, 15000);
  });
});

