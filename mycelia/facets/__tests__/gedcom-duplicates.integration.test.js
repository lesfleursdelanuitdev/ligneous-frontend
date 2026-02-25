/**
 * Integration Test Suite for useGedcomDuplicates Facet
 * 
 * Tests the GEDCOM duplicates facet with REAL GEDCOM files from /apps/gedcom-go/testdata
 * and REAL API calls to the Go API server.
 * 
 * Prerequisites:
 * - GEDCOM lib API server must be running on http://localhost:8091
 * - GEDCOM test files must be available in /apps/gedcom-go/testdata
 * 
 * These are integration tests, not unit tests!
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestSystem } from '../../test-system.builder.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const TESTDATA_PATH = '/apps/gedcom-go/testdata';
const GO_API_URL = 'http://localhost:8091';

describe('useGedcomDuplicates Integration Tests', () => {
  let system;
  let gedcomFiles;
  let gedcomDuplicates;
  let listeners;
  let uploadedFileId1 = null;
  let uploadedFileId2 = null;

  beforeAll(async () => {
    console.log('\n⚠️  Integration tests require GEDCOM lib API running at', GO_API_URL);
    console.log('   Start the Go API with: cd /apps/ligneous-gedcom-api && ./api\n');
    
    // Build system
    system = await buildTestSystem('ligneous-integration-test', {
      goApiUrl: GO_API_URL
    });
    
    gedcomFiles = system.find('gedcomFiles');
    gedcomDuplicates = system.find('gedcomDuplicates');
    listeners = system.find('listeners');
    
    if (listeners) {
      listeners.enableListeners();
    }

    // Upload tree1.ged for within-file duplicate testing
    const tree1Path = resolve(TESTDATA_PATH, 'tree1.ged');
    const file1Content = readFileSync(tree1Path);
    const file1 = new File([file1Content], 'tree1.ged', { type: 'text/plain' });
    
    const result1 = await gedcomFiles.uploadGedcom(file1, 'Tree1 Test');
    uploadedFileId1 = result1.fileId;
    
    console.log(`   ✅ Uploaded tree1.ged with file ID: ${uploadedFileId1}`);

    // Upload xavier.ged for cross-file comparison testing
    const xavierPath = resolve(TESTDATA_PATH, 'xavier.ged');
    const file2Content = readFileSync(xavierPath);
    const file2 = new File([file2Content], 'xavier.ged', { type: 'text/plain' });
    
    const result2 = await gedcomFiles.uploadGedcom(file2, 'Xavier Test');
    uploadedFileId2 = result2.fileId;
    
    console.log(`   ✅ Uploaded xavier.ged with file ID: ${uploadedFileId2}\n`);
  }, 60000); // Increased timeout for setup

  afterAll(async () => {
    // Clean up uploaded files
    if (uploadedFileId1 && gedcomFiles) {
      try {
        await gedcomFiles.deleteFile(uploadedFileId1);
        console.log('\n   🗑️  Cleaned up tree1.ged');
      } catch (error) {
        console.warn('   ⚠️  Failed to clean up tree1.ged:', error.message);
      }
    }
    
    if (uploadedFileId2 && gedcomFiles) {
      try {
        await gedcomFiles.deleteFile(uploadedFileId2);
        console.log('   🗑️  Cleaned up xavier.ged\n');
      } catch (error) {
        console.warn('   ⚠️  Failed to clean up xavier.ged:', error.message);
      }
    }
  }, 30000);

  describe('Find Duplicates Within File', () => {
    it('should find potential duplicates in tree1.ged with default threshold', async () => {
      const result = await gedcomDuplicates.findDuplicates(
        uploadedFileId1,
        0.8 // 80% similarity threshold
      );

      expect(result).toBeDefined();
      expect(result.matches).toBeDefined();
      expect(Array.isArray(result.matches)).toBe(true);
      
      // Should have meta data (may be undefined if no matches)
      if (result.meta) {
        expect(result.meta).toHaveProperty('total_matches');
        console.log(`   📊 Total matches: ${result.meta.total_matches}`);
      }

      console.log(`   🔍 Found ${result.matches.length} potential duplicates`);
      
      // State should be updated
      const state = gedcomDuplicates.getState();
      expect(state.duplicates).toEqual(result.matches);
    }, 30000); // Duplicates can take longer

    it('should have properly formatted duplicate match data', async () => {
      const result = await gedcomDuplicates.findDuplicates(uploadedFileId1, 0.8);

      if (result.matches.length > 0) {
        const match = result.matches[0];
        
        // Required fields
        expect(match).toHaveProperty('individual1');
        expect(match.individual1).toHaveProperty('xref');
        expect(match.individual1).toHaveProperty('name');
        
        expect(match).toHaveProperty('individual2');
        expect(match.individual2).toHaveProperty('xref');
        expect(match.individual2).toHaveProperty('name');
        
        expect(match).toHaveProperty('similarity_score');
        expect(typeof match.similarity_score).toBe('number');
        
        expect(match).toHaveProperty('confidence');
        expect(typeof match.confidence).toBe('string');
        
        expect(match).toHaveProperty('matching_fields');
        expect(Array.isArray(match.matching_fields)).toBe(true);
        
        expect(match).toHaveProperty('differences');
        expect(Array.isArray(match.differences)).toBe(true);
        
        expect(match).toHaveProperty('breakdown');
        expect(typeof match.breakdown).toBe('object');
        
        console.log(`   ✅ Match data structure validated`);
        console.log(`   📋 Example match:`);
        console.log(`      ${match.individual1.name} ⟷ ${match.individual2.name}`);
        console.log(`      Similarity: ${match.similarity_score}, Confidence: ${match.confidence}`);
      } else {
        console.log(`   ℹ️  No duplicates found with 0.8 threshold`);
      }
    }, 30000);

    it('should find more duplicates with lower threshold', async () => {
      const highThreshold = await gedcomDuplicates.findDuplicates(uploadedFileId1, 0.9);
      const lowThreshold = await gedcomDuplicates.findDuplicates(uploadedFileId1, 0.7);

      // Lower threshold should find equal or more duplicates
      expect(lowThreshold.matches.length).toBeGreaterThanOrEqual(highThreshold.matches.length);

      console.log(`   📊 Matches at 0.9 threshold: ${highThreshold.matches.length}`);
      console.log(`   📊 Matches at 0.7 threshold: ${lowThreshold.matches.length}`);
    }, 60000); // Running twice
  });

  describe('Compare Files for Duplicates', () => {
    it.skip('should compare tree1.ged and xavier.ged for duplicates (endpoint may not be implemented)', async () => {
      // Note: The /duplicates/compare endpoint may not be implemented yet
      try {
        const result = await gedcomDuplicates.compareFiles(
          uploadedFileId1,
          uploadedFileId2,
          0.8
        );

        expect(result).toBeDefined();
        expect(result.matches).toBeDefined();
        expect(Array.isArray(result.matches)).toBe(true);
        
        console.log(`   🔄 Cross-file comparison complete`);
        console.log(`   📊 Found ${result.matches.length} potential matches between files`);
        
        // State should be updated
        const state = gedcomDuplicates.getState();
        expect(state.comparisonResults).toEqual(result);
      } catch (error) {
        console.log(`   ℹ️  Cross-file comparison endpoint not available: ${error.message}`);
      }
    }, 60000); // Cross-file comparison can take longer

    it.skip('should include file_id in cross-file match data (endpoint may not be implemented)', async () => {
      // Note: The /duplicates/compare endpoint may not be implemented yet
      try {
        const result = await gedcomDuplicates.compareFiles(
          uploadedFileId1,
          uploadedFileId2,
          0.8
        );

        if (result.matches && result.matches.length > 0) {
          const match = result.matches[0];
          
          // Individuals should have file_id to distinguish source
          expect(match.individual1).toHaveProperty('xref');
          expect(match.individual2).toHaveProperty('xref');
          
          console.log(`   ✅ Cross-file match structure validated`);
          console.log(`   📋 Example match across files:`);
          console.log(`      ${match.individual1.name} ⟷ ${match.individual2.name}`);
          console.log(`      Confidence: ${match.confidence}`);
        } else {
          console.log(`   ℹ️  No cross-file duplicates found with 0.8 threshold`);
        }
      } catch (error) {
        console.log(`   ℹ️  Cross-file comparison endpoint not available: ${error.message}`);
      }
    }, 60000);
  });

  describe('Duplicate Detection Analysis', () => {
    it('should provide breakdown scores for matches', async () => {
      const result = await gedcomDuplicates.findDuplicates(uploadedFileId1, 0.7);

      if (result.matches.length > 0) {
        const match = result.matches[0];
        const breakdown = match.breakdown;
        
        // Should have score breakdowns
        expect(breakdown).toHaveProperty('name_score');
        expect(breakdown).toHaveProperty('date_score');
        expect(breakdown).toHaveProperty('place_score');
        expect(breakdown).toHaveProperty('sex_score');
        expect(breakdown).toHaveProperty('relationship_score');
        
        // All scores should be numbers
        expect(typeof breakdown.name_score).toBe('number');
        expect(typeof breakdown.date_score).toBe('number');
        expect(typeof breakdown.place_score).toBe('number');
        expect(typeof breakdown.sex_score).toBe('number');
        expect(typeof breakdown.relationship_score).toBe('number');

        console.log(`   📊 Score breakdown for match:`);
        console.log(`      Name: ${breakdown.name_score.toFixed(2)}`);
        console.log(`      Date: ${breakdown.date_score.toFixed(2)}`);
        console.log(`      Place: ${breakdown.place_score.toFixed(2)}`);
        console.log(`      Sex: ${breakdown.sex_score.toFixed(2)}`);
        console.log(`      Relationship: ${breakdown.relationship_score.toFixed(2)}`);
      }
    }, 30000);

    it('should list matching and differing fields', async () => {
      const result = await gedcomDuplicates.findDuplicates(uploadedFileId1, 0.7);

      if (result.matches.length > 0) {
        const match = result.matches[0];
        
        expect(Array.isArray(match.matching_fields)).toBe(true);
        expect(Array.isArray(match.differences)).toBe(true);

        console.log(`   ✅ Matching fields: ${match.matching_fields.join(', ')}`);
        console.log(`   ⚠️  Differences: ${match.differences.join(', ')}`);
      }
    }, 30000);
  });

  describe('State Management', () => {
    it('should update state correctly during operations', async () => {
      // Initial state
      let state = gedcomDuplicates.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);

      // Perform operation
      await gedcomDuplicates.findDuplicates(uploadedFileId1, 0.8);
      
      // After operation
      state = gedcomDuplicates.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.duplicates).toBeDefined();
      expect(Array.isArray(state.duplicates)).toBe(true);

      console.log(`   ✅ State management working correctly`);
    }, 30000);

    it('should clear duplicates', async () => {
      // Find duplicates first
      await gedcomDuplicates.findDuplicates(uploadedFileId1, 0.8);
      
      let state = gedcomDuplicates.getState();
      expect(state.duplicates.length).toBeGreaterThanOrEqual(0);
      
      // Clear duplicates
      gedcomDuplicates.clearDuplicates();
      
      state = gedcomDuplicates.getState();
      expect(state.duplicates).toEqual([]);

      console.log(`   ✅ Duplicates clearing works`);
    }, 30000);

    it.skip('should clear comparison results (requires compareFiles endpoint)', async () => {
      // Skipped because compareFiles endpoint may not be implemented
      // Compare files first
      try {
        await gedcomDuplicates.compareFiles(uploadedFileId1, uploadedFileId2, 0.8);
        
        let state = gedcomDuplicates.getState();
        expect(state.comparisonResults).not.toBe(null);
        
        // Clear comparison results
        gedcomDuplicates.clearComparisonResults();
        
        state = gedcomDuplicates.getState();
        expect(state.comparisonResults).toBe(null);

        console.log(`   ✅ Comparison results clearing works`);
      } catch (error) {
        console.log(`   ℹ️  CompareFiles endpoint not available`);
      }
    }, 60000);

    it('should clear errors', async () => {
      // Force an error
      try {
        await gedcomDuplicates.findDuplicates('invalid-file-id', 0.8);
      } catch (error) {
        // Expected to fail
      }
      
      let state = gedcomDuplicates.getState();
      expect(state.error).not.toBe(null);
      
      // Clear error
      gedcomDuplicates.clearError();
      
      state = gedcomDuplicates.getState();
      expect(state.error).toBe(null);

      console.log(`   ✅ Error clearing works`);
    }, 30000);
  });

  describe('Event Emission', () => {
    it('should emit duplicates:found event', (done) => {
      let eventReceived = false;

      const unsubscribe = listeners.on('gedcomDuplicates:found', (event) => {
        eventReceived = true;
        
        expect(event).toBeDefined();
        expect(event.body).toBeDefined();
        expect(event.body.fileId).toBe(uploadedFileId1);
        expect(event.body.count).toBeGreaterThanOrEqual(0);
        
        console.log(`   📡 Event received: ${event.body.count} duplicates found`);
        
        unsubscribe();
        done();
      });

      gedcomDuplicates.findDuplicates(uploadedFileId1, 0.8).catch(done);
      
      setTimeout(() => {
        if (!eventReceived) {
          unsubscribe();
          done(new Error('Event not received'));
        }
      }, 35000);
    }, 40000);

    it.skip('should emit comparison:complete event (requires compareFiles endpoint)', async () => {
      // Skipped because compareFiles endpoint may not be implemented
      console.log(`   ℹ️  Test skipped - compareFiles endpoint not available`);
    }, 70000);
  });

  describe('Error Handling', () => {
    it('should handle invalid file ID gracefully', async () => {
      await expect(
        gedcomDuplicates.findDuplicates('invalid-file-id', 0.8)
      ).rejects.toThrow();

      const state = gedcomDuplicates.getState();
      expect(state.error).not.toBe(null);
      expect(state.loading).toBe(false);

      console.log(`   ✅ Invalid file ID handled correctly`);
    }, 30000);

    it('should handle invalid threshold values', async () => {
      // Threshold should be between 0 and 1
      // API might reject or clamp invalid values
      try {
        await gedcomDuplicates.findDuplicates(uploadedFileId1, 1.5);
        console.log(`   ℹ️  API accepted threshold > 1.0`);
      } catch (error) {
        console.log(`   ✅ API rejected invalid threshold`);
        expect(error).toBeDefined();
      }
    }, 30000);
  });
});

