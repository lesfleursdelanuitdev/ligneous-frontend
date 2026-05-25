# GEDCOM Facets Test Summary

## Realistic Test Data

All tests now use realistic test data from actual GEDCOM files:

**Test Data Source**: `/apps/temp-family-tree-code/gedcom-go/testdata/xavier.ged`  
**Test Data Module**: `mycelia/facets/__tests__/test-data.js`

The test data includes:
- **Real individuals** from the Xavier family tree:
  - Augustinho Thomas Gonsalves (I0069, 1894-1998)
  - Lucia Cecilia Xavier (I0263, 1896-1967)
  - Francis Xavier (I0264, 1866-1909)
  - Carlotta Baptista (I0265, 1864-1928)
  - Antonio Rodrigues (I0176, 1889-1934)
  
- **Actual family relationships**:
  - Family F0297: Augustinho & Lucia with 9 children
  - Family F0374: Francis & Carlotta (Lucia's parents)
  - Multiple marriages and complex relationships
  
- **Realistic locations and dates**:
  - British Guiana, Toronto, Guyana
  - Full date formats (18 FEB 1894, 23 AUG 1967)
  - Multi-generational data spanning 100+ years
  
- **Real-world scenarios**:
  - Missing dates, incomplete records
  - Multiple spouses, remarriages
  - Large families (9+ children)
  - Name variations and nicknames

This ensures our tests reflect actual GEDCOM parsing scenarios and API responses.

## Test Results

### ✅ useGedcomFiles - All Tests Passing (27/27)

**Test File:** `gedcom-files.test.js`  
**Status:** ✅ PASSING  
**Tests:** 27 passed  
**Duration:** ~134ms

### ✅ useGedcomIndividuals - All Tests Passing (30/30)

**Test File:** `gedcom-individuals.test.js`  
**Status:** ✅ PASSING  
**Tests:** 30 passed  
**Duration:** ~135ms

#### Test Coverage

##### System Building (3 tests)
- ✅ should build the system successfully
- ✅ should have gedcomFiles facet
- ✅ should have listeners facet

##### Initial State (1 test)
- ✅ should start with clean state

##### Upload GEDCOM (4 tests)
- ✅ should upload a file successfully
- ✅ should handle upload errors
- ✅ should emit gedcomFiles:file:uploaded event on success
- ✅ should emit stateChanged event during upload

##### Get File Info (2 tests)
- ✅ should get file information successfully
- ✅ should handle get file info errors

##### List Files (3 tests)
- ✅ should list all files successfully
- ✅ should handle empty file list
- ✅ should handle list files errors

##### Validate File (3 tests)
- ✅ should validate a file successfully
- ✅ should emit gedcomFiles:file:validated event
- ✅ should handle validation errors

##### Delete File (4 tests)
- ✅ should delete a file successfully
- ✅ should remove deleted file from files list
- ✅ should emit gedcomFiles:file:deleted event
- ✅ should handle delete errors

##### State Management (3 tests)
- ✅ should update loading state during operations
- ✅ should return a copy of state from getState()
- ✅ should clear error state with clearError()

##### Error Handling (3 tests)
- ✅ should emit error event on failed operations
- ✅ should handle network errors gracefully
- ✅ should handle malformed JSON responses

##### Integration (1 test)
- ✅ should handle full file lifecycle

#### Test Coverage (useGedcomIndividuals)

##### System Building (3 tests)
- ✅ should build the system successfully
- ✅ should have gedcomIndividuals facet
- ✅ should have listeners facet

##### Initial State (1 test)
- ✅ should start with clean state

##### Get Individuals (4 tests)
- ✅ should get individuals list successfully
- ✅ should get individuals with query parameters
- ✅ should emit gedcomIndividuals:loaded event
- ✅ should handle get individuals errors

##### Get Individual (3 tests)
- ✅ should get a specific individual successfully
- ✅ should emit gedcomIndividuals:individual:loaded event
- ✅ should handle get individual errors

##### Search Individuals (3 tests)
- ✅ should search individuals successfully
- ✅ should emit gedcomIndividuals:search:complete event
- ✅ should clear search results

##### Get Parents (3 tests)
- ✅ should get parents successfully
- ✅ should emit gedcomIndividuals:parents:loaded event
- ✅ should handle no parents case

##### Get Children (2 tests)
- ✅ should get children successfully
- ✅ should emit gedcomIndividuals:children:loaded event

##### Get Siblings (2 tests)
- ✅ should get siblings successfully
- ✅ should emit gedcomIndividuals:siblings:loaded event

##### Get Spouses (2 tests)
- ✅ should get spouses successfully
- ✅ should emit gedcomIndividuals:spouses:loaded event

##### State Management (4 tests)
- ✅ should update loading state during operations
- ✅ should return a copy of state from getState()
- ✅ should clear error state with clearError()
- ✅ should emit stateChanged event

##### Error Handling (2 tests)
- ✅ should emit error event on failed operations
- ✅ should handle network errors gracefully

##### Integration (1 test)
- ✅ should handle full individual workflow

---

## Test Structure

Each test suite follows this pattern:

```javascript
describe('useGedcomFiles Facet', () => {
  let system, gedcomFiles, listeners;
  
  beforeEach(async () => {
    // Build test system
    // Clear mocks
    // Get facet references
  });
  
  afterEach(async () => {
    // Cleanup system
    // Clear mocks
  });
  
  describe('Feature', () => {
    it('should do something', async () => {
      // Arrange: Mock API responses
      // Act: Call facet methods
      // Assert: Check results, state, events
    });
  });
});
```

---

## Key Testing Patterns

### 1. API Mocking
```javascript
global.fetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: mockData })
});
```

### 2. State Verification
```javascript
const state = gedcomFiles.getState();
expect(state.loading).toBe(false);
expect(state.error).toBe(null);
expect(state.currentFile).toEqual(mockFile);
```

### 3. Event Listening
```javascript
listeners.on('gedcomFiles:file:uploaded', (msg) => {
  expect(msg.type).toBe('gedcomFiles:file:uploaded');
  expect(msg.body.file).toEqual(mockFile);
  done();
});
```

### 4. Error Handling
```javascript
await expect(
  gedcomFiles.uploadGedcom(file, name)
).rejects.toThrow(errorMessage);

expect(state.error).toBe(errorMessage);
```

---

## Coverage Analysis

### Methods Tested
- ✅ `uploadGedcom()` - Fully tested
- ✅ `getFileInfo()` - Fully tested
- ✅ `listFiles()` - Fully tested
- ✅ `validateFile()` - Fully tested
- ✅ `deleteFile()` - Fully tested
- ✅ `getState()` - Fully tested
- ✅ `clearError()` - Fully tested

### Events Tested
- ✅ `gedcomFiles:file:uploaded`
- ✅ `gedcomFiles:file:validated`
- ✅ `gedcomFiles:file:deleted`
- ✅ `gedcomFiles:stateChanged`
- ✅ `gedcomFiles:error`

### Edge Cases Covered
- ✅ Network errors
- ✅ Malformed JSON responses
- ✅ Empty responses
- ✅ File not found errors
- ✅ State management during async operations
- ✅ Event emission timing
- ✅ File lifecycle (upload → validate → delete)

---

## Next Steps

### 🔄 Remaining Facets to Test

1. **useGedcomFamilies**
   - getFamilies()
   - getFamily()

3. **useGedcomGraph**
   - getRelationship()
   - getPaths()
   - getAncestors()
   - getDescendants()
   - getMetrics()
   - getCentrality()
   - getMostConnected()

4. **useGedcomDuplicates**
   - findDuplicates()
   - compareFiles()

---

## Test Infrastructure

### Test System Builder
**File:** `mycelia/test-system.builder.js`

Provides a dedicated test system with all facets:
```javascript
export const buildTestSystem = async (appName = 'ligneous-test', options = {}) => {
  return useBase(appName)
    .config('listeners', { registrationPolicy: 'multiple' })
    .config('api', { baseURL: apiUrl, timeout: 30000 })
    .config('goAPI', { baseURL: goApiUrl, timeout: 30000 })
    .use(useListeners)
    .use(useAuth)
    .use(useGedcomFiles)
    .use(useGedcomIndividuals)
    .use(useGedcomFamilies)
    .use(useGedcomGraph)
    .use(useGedcomDuplicates)
    .build();
};
```

### Vitest Configuration
**File:** `vitest.config.js`

```javascript
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.js', '**/*.test.jsx'],
    globals: true,
    coverage: {
      reportsDirectory: 'coverage',
    },
  },
});
```

---

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npm test -- mycelia/facets/__tests__/gedcom-files.test.js
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

---

## Test Quality Metrics

### useGedcomFiles Facet

| Metric | Value | Status |
|--------|-------|--------|
| **Total Tests** | 27 | ✅ |
| **Passing Tests** | 27 | ✅ 100% |
| **Method Coverage** | 7/7 | ✅ 100% |
| **Event Coverage** | 5/5 | ✅ 100% |
| **Edge Cases** | 7 | ✅ Covered |
| **Integration Tests** | 1 | ✅ |
| **Duration** | 134ms | ✅ Fast |

### useGedcomIndividuals Facet

| Metric | Value | Status |
|--------|-------|--------|
| **Total Tests** | 30 | ✅ |
| **Passing Tests** | 30 | ✅ 100% |
| **Method Coverage** | 10/10 | ✅ 100% |
| **Event Coverage** | 9/9 | ✅ 100% |
| **Edge Cases** | 5 | ✅ Covered |
| **Integration Tests** | 1 | ✅ |
| **Duration** | 135ms | ✅ Fast |

---

## Best Practices Applied

1. ✅ **Isolated Tests** - Each test is independent
2. ✅ **Mock External Dependencies** - All API calls mocked
3. ✅ **Test State Changes** - Verify state before and after
4. ✅ **Test Events** - Verify all events are emitted
5. ✅ **Test Error Paths** - Cover error scenarios
6. ✅ **Cleanup** - Proper afterEach cleanup
7. ✅ **Descriptive Names** - Clear test descriptions
8. ✅ **Integration Tests** - Test full workflows

---

## Example: Adding New Tests

To add tests for a new facet, follow this pattern:

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildTestSystem } from '../../test-system.builder.js';

global.fetch = vi.fn();

describe('useNewFacet', () => {
  let system, newFacet, listeners;

  beforeEach(async () => {
    vi.clearAllMocks();
    system = await buildTestSystem();
    listeners = system.find('listeners');
    if (listeners) listeners.enableListeners();
    newFacet = system.find('newFacet');
  });

  afterEach(async () => {
    if (system) await system.dispose();
    vi.clearAllMocks();
  });

  describe('Method Name', () => {
    it('should do something', async () => {
      // Mock API
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData })
      });

      // Call method
      const result = await newFacet.methodName();

      // Assertions
      expect(result).toBeDefined();
      expect(newFacet.getState().loading).toBe(false);
    });
  });
});
```

---

**Status:** ✅ useGedcomFiles testing complete | ✅ useGedcomIndividuals testing complete  
**Last Updated:** January 27, 2026  
**Next:** Test useGedcomFamilies

---

## Summary Statistics

| Facet | Tests | Passed | Methods | Events | Duration |
|-------|-------|--------|---------|--------|----------|
| useGedcomFiles | 27 | ✅ 27 | 7/7 | 5/5 | 134ms |
| useGedcomIndividuals | 30 | ✅ 30 | 10/10 | 9/9 | 135ms |
| **Total** | **57** | **✅ 57** | **17/17** | **14/14** | **~270ms** |

---

## Recent Updates

### January 27, 2026 - Realistic Test Data Migration

**Updated test data to use actual GEDCOM structures:**

1. **Created `test-data.js` module**:
   - Extracted realistic data structures from `xavier.ged`
   - Defined mock responses matching Go API format
   - Added helper functions (`wrapApiResponse`, `createPaginatedResponse`)

2. **Updated `gedcom-files.test.js`**:
   - Replaced generic mock data with `mockFileMetadata` from xavier.ged
   - File now shows 150 individuals, 75 families (realistic numbers)
   - Uses actual GEDCOM metadata (Gramps 4.0.3, UTF-8, etc.)

3. **Updated `gedcom-individuals.test.js`**:
   - Used real individuals: Augustinho Thomas Gonsalves, Lucia Cecilia Xavier, etc.
   - Tested with actual family IDs (F0297, F0374, etc.)
   - Search queries use real names and dates (Gonsalves, 1894)
   - Relationship tests use actual parent/child/sibling data

**Benefits:**
- Tests now reflect real-world GEDCOM structures
- Better validation of API response formats
- Catch edge cases from actual data (missing dates, multiple marriages)
- More confidence in production readiness

**All tests continue to pass:** ✅ 57/57 (100%)

