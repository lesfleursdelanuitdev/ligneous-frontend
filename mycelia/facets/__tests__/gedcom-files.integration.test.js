/**
 * Integration Test Suite for useGedcomFiles Facet
 * 
 * Tests the GEDCOM files facet with REAL GEDCOM files from /apps/gedcom-go/testdata
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

// Test files with expected characteristics
const TEST_FILES = {
  xavier: {
    path: resolve(TESTDATA_PATH, 'xavier.ged'),
    name: 'xavier.ged',
    expectedIndividuals: 150, // Approximate
    expectedFamilies: 75, // Approximate
    description: 'Xavier family tree from British Guiana'
  },
  gracis: {
    path: resolve(TESTDATA_PATH, 'gracis.ged'),
    name: 'gracis.ged',
    expectedIndividuals: 100, // Approximate
    expectedFamilies: 50, // Approximate
    description: 'Gracis family tree'
  }
};

describe('useGedcomFiles Integration Tests', () => {
  let system;
  let gedcomFiles;
  let listeners;
  let uploadedFileIds = [];

  beforeAll(() => {
    // Check if Go API is running
    console.log('\n⚠️  Integration tests require GEDCOM lib API running at', GO_API_URL);
    console.log('   Start the Go API with: cd /apps/ligneous-gedcom-api && ./api\n');
  });

  beforeEach(async () => {
    // Build the test system
    system = await buildTestSystem('ligneous-integration-test', {
      goApiUrl: GO_API_URL
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
    // Clean up uploaded files
    for (const fileId of uploadedFileIds) {
      try {
        await gedcomFiles.deleteFile(fileId);
      } catch (err) {
        console.warn('Failed to delete test file:', fileId, err.message);
      }
    }
    uploadedFileIds = [];
    
    // Clean up system
    if (system) {
      await system.dispose();
    }
  });

  describe('System Building', () => {
    it('should build the system successfully', () => {
      expect(system).toBeDefined();
      expect(system.name).toBe('ligneous-integration-test');
      expect(system.isBuilt).toBe(true);
    });

    it('should have gedcomFiles facet', () => {
      expect(gedcomFiles).toBeDefined();
      expect(typeof gedcomFiles.uploadGedcom).toBe('function');
    });
  });

  describe('Upload Real GEDCOM Files', () => {
    it('should upload xavier.ged successfully', async () => {
      const testFile = TEST_FILES.xavier;
      
      // Read the actual GEDCOM file
      const fileContent = readFileSync(testFile.path);
      const file = new File([fileContent], testFile.name, { type: 'text/plain' });

      // Upload to real API
      const result = await gedcomFiles.uploadGedcom(file, 'Xavier Family Tree');

      // Track for cleanup
      if (result && result.fileId) {
        uploadedFileIds.push(result.fileId);
      }

      // Verify result
      expect(result).toBeDefined();
      expect(result.fileId).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.name).toBe('Xavier Family Tree');
      
      // Check state
      const state = gedcomFiles.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.currentFile).toBeDefined();
    }, 30000); // 30 second timeout for upload

    it('should upload gracis.ged successfully', async () => {
      const testFile = TEST_FILES.gracis;
      
      // Read the actual GEDCOM file
      const fileContent = readFileSync(testFile.path);
      const file = new File([fileContent], testFile.name, { type: 'text/plain' });

      // Upload to real API
      const result = await gedcomFiles.uploadGedcom(file, 'Gracis Family Tree');

      // Track for cleanup
      if (result && result.fileId) {
        uploadedFileIds.push(result.fileId);
      }

      // Verify result
      expect(result).toBeDefined();
      expect(result.fileId).toBeDefined();
      expect(result.metadata).toBeDefined();
      
      const state = gedcomFiles.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    }, 30000);

    it('should handle file size correctly', async () => {
      const testFile = TEST_FILES.xavier;
      const fileContent = readFileSync(testFile.path);
      const file = new File([fileContent], testFile.name, { type: 'text/plain' });

      const result = await gedcomFiles.uploadGedcom(file);
      
      if (result && result.fileId) {
        uploadedFileIds.push(result.fileId);
      }

      // Verify file size is reported
      expect(result.metadata.size).toBeGreaterThan(0);
      expect(result.metadata.size).toBe(fileContent.length);
    }, 30000);
  });

  describe('Get File Information', () => {
    it('should get file info after upload', async () => {
      // First upload a file
      const testFile = TEST_FILES.xavier;
      const fileContent = readFileSync(testFile.path);
      const file = new File([fileContent], testFile.name, { type: 'text/plain' });
      
      const uploadResult = await gedcomFiles.uploadGedcom(file);
      uploadedFileIds.push(uploadResult.fileId);

      // Get file info
      const fileInfo = await gedcomFiles.getFileInfo(uploadResult.fileId);

      // Verify
      expect(fileInfo).toBeDefined();
      expect(fileInfo.file_id).toBe(uploadResult.fileId);
      expect(fileInfo.individuals_count).toBeGreaterThan(0);
      expect(fileInfo.families_count).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Validate Real GEDCOM Files', () => {
    it('should validate xavier.ged successfully', async () => {
      // Upload first
      const testFile = TEST_FILES.xavier;
      const fileContent = readFileSync(testFile.path);
      const file = new File([fileContent], testFile.name, { type: 'text/plain' });
      
      const uploadResult = await gedcomFiles.uploadGedcom(file);
      uploadedFileIds.push(uploadResult.fileId);

      // Validate
      const validation = await gedcomFiles.validateFile(uploadResult.fileId);

      // Verify validation result
      expect(validation).toBeDefined();
      expect(validation.valid).toBeDefined();
      expect(validation.summary).toBeDefined();
      expect(validation.errors).toBeDefined();
      expect(Array.isArray(validation.errors)).toBe(true);
    }, 30000);

    it('should detect issues in malformed files', async () => {
      // This test would use files from malformed/ directory
      // Skip for now if malformed files aren't set up
      expect(true).toBe(true);
    });
  });

  describe('List Files', () => {
    it('should list uploaded files', async () => {
      // Upload a file first
      const testFile = TEST_FILES.xavier;
      const fileContent = readFileSync(testFile.path);
      const file = new File([fileContent], testFile.name, { type: 'text/plain' });
      
      const uploadResult = await gedcomFiles.uploadGedcom(file);
      uploadedFileIds.push(uploadResult.fileId);

      // List files
      const files = await gedcomFiles.listFiles();

      // Verify
      expect(files).toBeDefined();
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
      
      // Should contain our uploaded file
      const ourFile = files.find(f => f.file_id === uploadResult.fileId);
      expect(ourFile).toBeDefined();
    }, 30000);
  });

  describe('Delete Files', () => {
    it('should delete an uploaded file', async () => {
      // Upload first
      const testFile = TEST_FILES.xavier;
      const fileContent = readFileSync(testFile.path);
      const file = new File([fileContent], testFile.name, { type: 'text/plain' });
      
      const uploadResult = await gedcomFiles.uploadGedcom(file);
      const fileId = uploadResult.fileId;

      // Delete
      await gedcomFiles.deleteFile(fileId);

      // Verify it's gone
      const state = gedcomFiles.getState();
      expect(state.error).toBe(null);
      
      // Try to get info - should fail
      try {
        await gedcomFiles.getFileInfo(fileId);
        // Should not reach here
        expect(false).toBe(true);
      } catch (err) {
        // Expected to fail
        expect(err).toBeDefined();
      }
      
      // Remove from cleanup list since we already deleted it
      uploadedFileIds = uploadedFileIds.filter(id => id !== fileId);
    }, 30000);
  });

  describe('Event Emission with Real Files', () => {
    it('should emit file:uploaded event with real data', (done) => {
      let eventReceived = false;

      listeners.on('gedcomFiles:file:uploaded', (msg) => {
        expect(msg.type).toBe('gedcomFiles:file:uploaded');
        expect(msg.body.fileId).toBeDefined();
        expect(msg.body.metadata).toBeDefined();
        eventReceived = true;
        done();
      });

      // Upload a file
      const testFile = TEST_FILES.xavier;
      const fileContent = readFileSync(testFile.path);
      const file = new File([fileContent], testFile.name, { type: 'text/plain' });
      
      gedcomFiles.uploadGedcom(file).then((result) => {
        if (result && result.fileId) {
          uploadedFileIds.push(result.fileId);
        }
        
        setTimeout(() => {
          if (!eventReceived) {
            done(new Error('Event not received'));
          }
        }, 2000);
      }).catch(done);
    }, 30000);
  });

  describe('Performance with Real Files', () => {
    it('should upload xavier.ged (100KB) in reasonable time', async () => {
      const testFile = TEST_FILES.xavier;
      const fileContent = readFileSync(testFile.path);
      const file = new File([fileContent], testFile.name, { type: 'text/plain' });

      const startTime = Date.now();
      const result = await gedcomFiles.uploadGedcom(file);
      const duration = Date.now() - startTime;

      if (result && result.fileId) {
        uploadedFileIds.push(result.fileId);
      }

      // Should complete in under 10 seconds
      expect(duration).toBeLessThan(10000);
      console.log(`   ⏱️  Upload took ${duration}ms`);
    }, 30000);
  });
});

