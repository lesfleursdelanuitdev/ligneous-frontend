# Testing Guide

**Date:** 2026-01-23  
**Status:** ✅ Test Suite Created

---

## Test Setup

### Dependencies
- **vitest** - Test framework (compatible with Mycelia examples)
- **@vitest/ui** - Test UI for visual debugging

### Configuration
- `vitest.config.js` - Vitest configuration
- Tests in `mycelia/facets/__tests__/` directory

---

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run specific test file
```bash
npm test -- mycelia/facets/__tests__/auth.test.js
```

---

## Test Structure

### Test System Builder
`mycelia/test-system.builder.js` - Builds a test system with auth facet for testing

### Test Files
- `mycelia/facets/__tests__/auth.test.js` - Complete test suite for useAuth facet

---

## useAuth Facet Tests

### Test Coverage

✅ **System Building** (3 tests)
- System builds successfully
- Auth facet exists with all methods
- Listeners facet available

✅ **Initial State** (1 test)
- Starts with unauthenticated state

✅ **Registration** (3 tests)
- Successful registration
- Error handling
- Event emission

✅ **Login** (3 tests)
- Successful login
- Error handling
- Event emission

✅ **Logout** (3 tests)
- Successful logout
- Logout even if API fails
- Event emission

✅ **Get Current User** (3 tests)
- Get user successfully
- Returns null if no token
- Clears state if token invalid

✅ **State Management** (2 tests)
- Loading state updates
- getState() returns copy

✅ **Event System** (1 test)
- Emits state change events

✅ **Integration** (1 test)
- Full authentication flow

**Total: 20 tests, all passing ✅**

---

## Test Patterns

### Mocking localStorage
```javascript
// Mock window and localStorage for Node.js
global.window = {
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
};
global.localStorage = global.window.localStorage;
```

### Mocking axios
```javascript
import axios from 'axios';
vi.mock('axios');

// Mock successful response
axios.post.mockResolvedValueOnce({
  data: { user: mockUser, token: mockToken },
});

// Mock error
axios.post.mockRejectedValueOnce({
  response: { data: { error: 'Error message' } },
});
```

### Testing Events
```javascript
const listeners = system.find('listeners');
let eventReceived = false;

listeners.on('auth:loggedIn', (msg) => {
  expect(msg.type).toBe('auth:loggedIn');
  eventReceived = true;
  done();
});

await auth.login('username', 'password');
```

### Testing State
```javascript
const state = auth.getState();
expect(state.isAuthenticated).toBe(true);
expect(state.user).toEqual(mockUser);
```

---

## Test Results

```
✓ mycelia/facets/__tests__/auth.test.js (20 tests) 136ms

Test Files  1 passed (1)
     Tests  20 passed (20)
```

---

## Adding New Tests

### For a new facet:

1. **Create test file:**
   ```
   mycelia/facets/__tests__/myFacet.test.js
   ```

2. **Import test system builder:**
   ```javascript
   import { buildTestSystem } from '../../test-system.builder.js';
   ```

3. **Follow the pattern:**
   ```javascript
   describe('useMyFacet', () => {
     let system;
     let myFacet;

     beforeEach(async () => {
       system = await buildTestSystem('test-app');
       myFacet = system.find('myFacet');
     });

     afterEach(async () => {
       if (system) await system.dispose();
     });

     // Tests...
   });
   ```

---

## Notes

- Tests run in Node.js environment (not browser)
- localStorage is mocked via `global.window.localStorage`
- axios is mocked for all HTTP calls
- Events are tested via listeners facet
- All tests clean up after themselves

---

**Status:** ✅ Test suite complete and all tests passing!


