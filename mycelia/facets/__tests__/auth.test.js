/**
 * Test suite for useAuth Facet
 * 
 * Tests the authentication facet functionality including:
 * - Registration
 * - Login
 * - Logout
 * - Get current user
 * - State management
 * - Event emission
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildTestSystem } from '../../test-system.builder.js';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('useAuth Facet', () => {
  let system;
  let auth;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Mock window and localStorage for Node.js environment
    global.window = {
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    };
    
    // Also set global.localStorage for direct access
    global.localStorage = global.window.localStorage;
    
    // Build the test system
    system = await buildTestSystem('ligneous-test');
    
    // Enable listeners for event testing
    if (system.listeners) {
      system.listeners.enableListeners();
    }
    
    // Get auth facet
    auth = system.find('auth');
  });

  afterEach(async () => {
    // Clean up after each test
    if (system) {
      await system.dispose();
    }
    // Clean up window mock
    delete global.window;
    delete global.localStorage;
    vi.clearAllMocks();
  });

  describe('System Building', () => {
    it('should build the system successfully', () => {
      expect(system).toBeDefined();
      expect(system.name).toBe('ligneous-test');
      expect(system.isBuilt).toBe(true);
    });

    it('should have auth facet', () => {
      expect(auth).toBeDefined();
      expect(typeof auth.register).toBe('function');
      expect(typeof auth.login).toBe('function');
      expect(typeof auth.logout).toBe('function');
      expect(typeof auth.getCurrentUser).toBe('function');
      expect(typeof auth.getState).toBe('function');
    });

    it('should have listeners facet', () => {
      const listeners = system.find('listeners');
      expect(listeners).toBeDefined();
      expect(listeners.hasListeners()).toBe(true);
    });
  });

  describe('Initial State', () => {
    it('should start with unauthenticated state', () => {
      const state = auth.getState();
      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('Registration', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        isWebsiteOwner: false,
        createdAt: new Date().toISOString(),
      };
      const mockToken = 'mock-jwt-token';

      axios.post.mockResolvedValueOnce({
        data: {
          user: mockUser,
          token: mockToken,
        },
      });

      const result = await auth.register('testuser', 'test@example.com', 'password123', 'Test User');

      expect(result).toEqual({
        user: mockUser,
        token: mockToken,
      });

      // Check state
      const state = auth.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);

      // Check localStorage
      expect(global.window.localStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken);

      // Check API call
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/auth/register',
        {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        }
      );
    });

    it('should handle registration errors', async () => {
      const errorMessage = 'Username already exists';
      axios.post.mockRejectedValueOnce({
        response: {
          data: { error: errorMessage },
        },
      });

      await expect(
        auth.register('testuser', 'test@example.com', 'password123')
      ).rejects.toThrow();

      const state = auth.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should emit auth:registered event on successful registration', async (done) => {
      const mockUser = { id: 'user-123', username: 'testuser' };
      const mockToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      });

      const listeners = system.find('listeners');
      let eventReceived = false;

      listeners.on('auth:registered', (msg) => {
        expect(msg.type).toBe('auth:registered');
        expect(msg.body.user).toEqual(mockUser);
        eventReceived = true;
        done();
      });

      await auth.register('testuser', 'test@example.com', 'password123');

      setTimeout(() => {
        if (!eventReceived) {
          done(new Error('Event not received'));
        }
      }, 100);
    });
  });

  describe('Login', () => {
    it('should login successfully', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        isWebsiteOwner: false,
      };
      const mockToken = 'mock-jwt-token';

      axios.post.mockResolvedValueOnce({
        data: {
          user: mockUser,
          token: mockToken,
        },
      });

      const result = await auth.login('testuser', 'password123');

      expect(result).toEqual({
        user: mockUser,
        token: mockToken,
      });

      // Check state
      const state = auth.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);

      // Check localStorage
      expect(global.window.localStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken);

      // Check API call
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/auth/login',
        {
          username: 'testuser',
          password: 'password123',
        }
      );
    });

    it('should handle login errors', async () => {
      const errorMessage = 'Invalid credentials';
      axios.post.mockRejectedValueOnce({
        response: {
          data: { error: errorMessage },
        },
      });

      await expect(
        auth.login('testuser', 'wrongpassword')
      ).rejects.toThrow();

      const state = auth.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should emit auth:loggedIn event on successful login', async (done) => {
      const mockUser = { id: 'user-123', username: 'testuser' };
      const mockToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      });

      const listeners = system.find('listeners');
      let eventReceived = false;

      listeners.on('auth:loggedIn', (msg) => {
        expect(msg.type).toBe('auth:loggedIn');
        expect(msg.body.user).toEqual(mockUser);
        eventReceived = true;
        done();
      });

      await auth.login('testuser', 'password123');

      setTimeout(() => {
        if (!eventReceived) {
          done(new Error('Event not received'));
        }
      }, 100);
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      // First login
      const mockUser = { id: 'user-123', username: 'testuser' };
      const mockToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      });

      await auth.login('testuser', 'password123');

      // Mock logout API call
      axios.post.mockResolvedValueOnce({});

      await auth.logout();

      // Check state
      const state = auth.getState();
      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);

      // Check localStorage (via window.localStorage in Node.js mock)
      expect(global.window.localStorage.removeItem).toHaveBeenCalledWith('auth_token');

      // Check API call
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/auth/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('should logout even if API call fails', async () => {
      // First login
      const mockUser = { id: 'user-123', username: 'testuser' };
      const mockToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      });

      await auth.login('testuser', 'password123');

      // Mock logout API call failure
      axios.post.mockRejectedValueOnce(new Error('Network error'));

      await auth.logout();

      // Should still clear state
      const state = auth.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(global.window.localStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should emit auth:loggedOut event on logout', async (done) => {
      // First login
      const mockUser = { id: 'user-123', username: 'testuser' };
      const mockToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      });

      await auth.login('testuser', 'password123');

      // Mock logout
      axios.post.mockResolvedValueOnce({});

      const listeners = system.find('listeners');
      let eventReceived = false;

      listeners.on('auth:loggedOut', (msg) => {
        expect(msg.type).toBe('auth:loggedOut');
        eventReceived = true;
        done();
      });

      await auth.logout();

      setTimeout(() => {
        if (!eventReceived) {
          done(new Error('Event not received'));
        }
      }, 100);
    });
  });

  describe('Get Current User', () => {
    it('should get current user successfully', async () => {
      // First login
      const mockUser = { id: 'user-123', username: 'testuser' };
      const mockToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      });

      await auth.login('testuser', 'password123');

      // Mock get current user
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      axios.get.mockResolvedValueOnce({
        data: { user: updatedUser },
      });

      const user = await auth.getCurrentUser();

      expect(user).toEqual(updatedUser);

      // Check state
      const state = auth.getState();
      expect(state.user).toEqual(updatedUser);
      expect(state.isAuthenticated).toBe(true);

      // Check API call
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:4000/api/auth/me',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('should return null if no token', async () => {
      const user = await auth.getCurrentUser();
      expect(user).toBe(null);
    });

    it('should clear state if token is invalid', async () => {
      // Set a token in state (simulate stored token)
      const mockToken = 'invalid-token';
      global.window.localStorage.getItem.mockReturnValueOnce(mockToken);

      // Rebuild system to trigger onInit
      await system.dispose();
      system = await buildTestSystem('ligneous-test');
      auth = system.find('auth');
      
      if (system.listeners) {
        system.listeners.enableListeners();
      }

      // Mock get current user to fail
      axios.get.mockRejectedValueOnce({
        response: { status: 401 },
      });

      const user = await auth.getCurrentUser();

      expect(user).toBe(null);

      // Check state is cleared
      const state = auth.getState();
      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should update loading state during operations', async () => {
      // Mock a slow API call
      axios.post.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({
          data: { user: { id: '123' }, token: 'token' }
        }), 100))
      );

      const loginPromise = auth.login('testuser', 'password');

      // Check loading state immediately
      let state = auth.getState();
      expect(state.loading).toBe(true);

      await loginPromise;

      // Check loading state after completion
      state = auth.getState();
      expect(state.loading).toBe(false);
    });

    it('should return a copy of state from getState()', () => {
      const state1 = auth.getState();
      const state2 = auth.getState();

      // Should be different objects
      expect(state1).not.toBe(state2);
      // But should have same structure
      expect(state1).toEqual(state2);
    });
  });

  describe('Event System', () => {
    it('should emit auth:stateChanged events', async (done) => {
      const mockUser = { id: 'user-123', username: 'testuser' };
      const mockToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      });

      const listeners = system.find('listeners');
      let eventCount = 0;

      listeners.on('auth:stateChanged', (msg) => {
        eventCount++;
        expect(msg.type).toBe('auth:stateChanged');
        expect(msg.body).toHaveProperty('user');
        expect(msg.body).toHaveProperty('isAuthenticated');
        expect(msg.body).toHaveProperty('loading');

        // After login completes, should have user
        if (eventCount >= 2 && msg.body.isAuthenticated) {
          expect(msg.body.user).toEqual(mockUser);
          done();
        }
      });

      await auth.login('testuser', 'password123');

      setTimeout(() => {
        if (eventCount < 2) {
          done(new Error('Not enough state change events'));
        }
      }, 100);
    });
  });

  describe('Integration', () => {
    it('should handle full authentication flow', async () => {
      // Register
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };
      const mockToken = 'mock-token';

      axios.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      });

      await auth.register('testuser', 'test@example.com', 'password123');

      let state = auth.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user.username).toBe('testuser');

      // Logout
      axios.post.mockResolvedValueOnce({});
      await auth.logout();

      state = auth.getState();
      expect(state.isAuthenticated).toBe(false);

      // Login again
      axios.post.mockResolvedValueOnce({
        data: { user: mockUser, token: mockToken },
      });

      await auth.login('testuser', 'password123');

      state = auth.getState();
      expect(state.isAuthenticated).toBe(true);
    });
  });
});

