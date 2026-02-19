# Integration Tests for GEDCOM Facets

## Overview

These integration tests use **real GEDCOM files** from `/apps/gedcom-go/testdata` and make **real API calls** to the Go API server. Unlike unit tests that mock responses, these tests verify the entire stack works correctly.

## Prerequisites

### 1. Go API Server Must Be Running

```bash
cd /apps/ligneous-gedcom-api
./api
```

The server should be running on `http://localhost:8090`

### 2. Test Data Files

The following GEDCOM files must be available in `/apps/gedcom-go/testdata`:
- `xavier.ged` (101KB, ~150 individuals)
- `gracis.ged` (163KB, ~100 individuals)
- `tree1.ged` (211KB, for larger dataset tests)

## Running Integration Tests

### Run All Integration Tests

```bash
npm run test:integration
```

### Run Specific Integration Test Suite

```bash
# Files integration tests
npm test -- mycelia/facets/__tests__/gedcom-files.integration.test.js

# Individuals integration tests
npm test -- mycelia/facets/__tests__/gedcom-individuals.integration.test.js
```

### Run with Verbose Output

```bash
npm test -- mycelia/facets/__tests__/*.integration.test.js --reporter=verbose
```

## Test Suites

### gedcom-files.integration.test.js

Tests file operations with real GEDCOM files:

**Tests:**
- ✅ Upload real GEDCOM files (xavier.ged, gracis.ged)
- ✅ Get file information
- ✅ Validate uploaded files
- ✅ List files
- ✅ Delete files
- ✅ Event emission
- ✅ Performance metrics

**Key Features:**
- Uploads actual 100KB+ GEDCOM files
- Verifies parsing results
- Measures upload performance
- Tests cleanup (file deletion)

### gedcom-individuals.integration.test.js

Tests individual queries with real GEDCOM data:

**Tests:**
- ✅ Get all individuals from uploaded file
- ✅ Get specific individuals by XREF
- ✅ Search individuals by name/birth year
- ✅ Get parents, children, siblings, spouses
- ✅ State management
- ✅ Event emission
- ✅ Data structure validation

**Known Test Individuals (from xavier.ged):**
- **Augustinho Thomas Gonsalves** (I0069, 1894-1998)
- **Lucia Cecilia Xavier** (I0263, 1896-1967)  
- **Francis Xavier** (I0264, 1866-1909)
- **Carlotta Baptista** (I0265, 1864-1928)

## Expected Test Results

### File Upload Tests
- **Duration**: < 10 seconds per file
- **Success Rate**: 100%
- **File Sizes**: 100KB - 500KB

### Individual Query Tests
- **Duration**: < 5 seconds per query
- **Data**: Real family relationships
- **Validation**: Proper GEDCOM structure

## Test Data Details

### xavier.ged
- **Size**: 101KB
- **Individuals**: ~150
- **Families**: ~75
- **Time Period**: 1864-1998
- **Location**: British Guiana, Guyana, Toronto
- **Features**: 
  - Multi-generational data
  - Large families (9 children)
  - Multiple marriages
  - Real dates and places

### gracis.ged
- **Size**: 163KB
- **Individuals**: ~100
- **Families**: ~50

## Troubleshooting

### "Connection refused" or "ECONNREFUSED"

**Problem**: Go API server is not running

**Solution**:
```bash
cd /apps/ligneous-gedcom-api
./api
```

Verify it's running:
```bash
curl http://localhost:8090/health
```

### "File not found" Errors

**Problem**: GEDCOM test files not available

**Solution**: Ensure files exist in `/apps/gedcom-go/testdata/`:
```bash
ls -lh /apps/gedcom-go/testdata/*.ged
```

### Tests Timing Out

**Problem**: Tests exceed 30 second timeout

**Possible Causes**:
1. Go API is slow/overloaded
2. Large files taking too long to parse
3. Database issues

**Solution**:
- Restart Go API
- Check API logs for errors
- Verify database connectivity

### Tests Fail After First Run

**Problem**: Test files not cleaned up properly

**Solution**: Tests should auto-cleanup, but you can manually delete:
```bash
# Use Go API to list and delete test files
curl -X GET http://localhost:8090/api/v1/files
curl -X DELETE http://localhost:8090/api/v1/files/{file_id}
```

## Continuous Integration

For CI/CD pipelines, ensure:

1. **Go API is started before tests**:
   ```yaml
   - name: Start Go API
     run: |
       cd /apps/ligneous-gedcom-api
       ./api &
       sleep 5  # Wait for API to start
   ```

2. **Test data is available**:
   ```yaml
   - name: Setup test data
     run: |
       ls /apps/gedcom-go/testdata/*.ged
   ```

3. **Cleanup after tests**:
   ```yaml
   - name: Stop Go API
     if: always()
     run: pkill -f ./api
   ```

## Performance Benchmarks

Based on test runs:

| Operation | File Size | Duration | Status |
|-----------|-----------|----------|--------|
| Upload xavier.ged | 101KB | ~2-5s | ✅ |
| Get individuals | - | ~1-2s | ✅ |
| Search individuals | - | ~1-2s | ✅ |
| Get relationships | - | <1s | ✅ |

## Comparison: Unit Tests vs Integration Tests

| Aspect | Unit Tests | Integration Tests |
|--------|------------|-------------------|
| **Speed** | Fast (~270ms) | Slower (~30s+) |
| **API** | Mocked | Real |
| **Files** | Mock data | Real GEDCOM files |
| **Purpose** | Code correctness | System validation |
| **CI** | Always run | Optional/nightly |
| **Dependencies** | None | Go API must run |

## Best Practices

1. **Run unit tests first**: They're faster and catch code issues
2. **Run integration tests before deploys**: Verify full stack
3. **Use integration tests in CI**: Catch integration issues early
4. **Monitor performance**: Track upload/query times
5. **Clean up test data**: Always delete uploaded files

## Future Enhancements

### Additional Test Coverage
- [ ] Test with tree1.ged (211KB, larger dataset)
- [ ] Test with royal92.ged (488KB, complex genealogy)
- [ ] Test malformed GEDCOM files
- [ ] Test concurrent uploads
- [ ] Test large family queries (100+ ancestors/descendants)

### Performance Tests
- [ ] Benchmark upload times for various file sizes
- [ ] Measure query performance with large datasets
- [ ] Test pagination with 1000+ individuals
- [ ] Load testing with multiple concurrent requests

### Error Scenarios
- [ ] Test network failures
- [ ] Test API timeout handling
- [ ] Test invalid GEDCOM formats
- [ ] Test file size limits
- [ ] Test storage cleanup on errors

---

**Last Updated**: January 27, 2026  
**Status**: ✅ Integration tests implemented and documented  
**Test Coverage**: File operations + Individual queries

