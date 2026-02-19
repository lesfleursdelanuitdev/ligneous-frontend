/**
 * Test suite for useUserContent Facet
 * 
 * Tests the user content facet functionality including:
 * - Getting content
 * - Creating content
 * - Updating content
 * - Deleting content
 * - State management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildTestSystem } from '../../test-system.builder.js';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('useUserContent Facet', () => {
  let system;
  let userContent;
  let auth;

  async function loginWithToken(token = 'test-token') {
    axios.post.mockResolvedValueOnce({
      data: {
        user: { id: 'user-123', username: 'testuser', email: 'test@example.com' },
        token,
        refreshToken: 'refresh-token',
      },
    });

    await auth.login('testuser', 'password');
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock window and localStorage
    global.window = {
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    };
    global.localStorage = global.window.localStorage;
    
    // Build the test system
    system = await buildTestSystem('ligneous-test');
    
    // Enable listeners
    if (system.listeners) {
      system.listeners.enableListeners();
    }
    
    auth = system.find('auth');
    userContent = system.find('userContent');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have initial state', () => {
      const state = userContent.getState();
      
      expect(state).toEqual({
        content: [],
        loading: false,
        error: null,
      });
    });
  });

  describe('getContent', () => {
    it('should fetch content list', async () => {
      const mockContent = [
        {
          id: 'content-1',
          userId: 'user-123',
          contentType: 'post',
          title: 'Test Post',
          content: 'Test content',
          visibility: 'public',
        },
      ];

      axios.get.mockResolvedValue({
        data: { content: mockContent },
      });

      await loginWithToken('test-token');

      const result = await userContent.getContent();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/user-content'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );

      expect(result).toEqual(mockContent);
      
      const state = userContent.getState();
      expect(state.content).toEqual(mockContent);
      expect(state.loading).toBe(false);
    });

    it('should handle errors', async () => {
      const error = new Error('Network error');
      axios.get.mockRejectedValue(error);

      await loginWithToken('test-token');

      await expect(userContent.getContent()).rejects.toThrow('Network error');

      const state = userContent.getState();
      expect(state.error).toBeTruthy();
      expect(state.loading).toBe(false);
    });

    it('should work without authentication (for public content)', async () => {
      const mockContent = [
        {
          id: 'content-1',
          userId: 'user-123',
          contentType: 'post',
          visibility: 'public',
        },
      ];

      axios.get.mockResolvedValue({
        data: { content: mockContent },
      });

      const result = await userContent.getContent();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/user-content'),
        expect.objectContaining({
          headers: {},
        })
      );

      expect(result).toEqual(mockContent);
    });
  });

  describe('createContent', () => {
    it('should create new content', async () => {
      const contentData = {
        contentType: 'post',
        title: 'New Post',
        content: 'Post content',
        visibility: 'public',
      };

      const createdContent = {
        id: 'content-new',
        ...contentData,
        userId: 'user-123',
        createdAt: new Date(),
      };

      // 1) login
      // 2) create content
      axios.post.mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', username: 'testuser', email: 'test@example.com' },
          token: 'test-token',
          refreshToken: 'refresh-token',
        },
      }).mockResolvedValueOnce({
        status: 201,
        data: { content: createdContent },
      });

      axios.get.mockResolvedValue({
        data: { content: [createdContent] },
      });

      await auth.login('testuser', 'password');

      const result = await userContent.createContent(contentData);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/user-content'),
        contentData,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
        })
      );

      expect(result).toEqual(createdContent);
    });

    it('should require authentication', async () => {
      await expect(
        userContent.createContent({ contentType: 'post', content: 'test' })
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('updateContent', () => {
    it('should update existing content', async () => {
      const contentId = 'content-1';
      const updates = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      const updatedContent = {
        id: contentId,
        userId: 'user-123',
        ...updates,
      };

      axios.put.mockResolvedValue({
        data: { content: updatedContent },
      });

      axios.get.mockResolvedValue({
        data: { content: [updatedContent] },
      });

      await loginWithToken('test-token');

      const result = await userContent.updateContent(contentId, updates);

      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining(`/user-content/${contentId}`),
        updates,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );

      expect(result).toEqual(updatedContent);
    });
  });

  describe('deleteContent', () => {
    it('should delete content', async () => {
      const contentId = 'content-1';

      axios.delete.mockResolvedValue({
        data: { message: 'Content deleted' },
      });

      axios.get.mockResolvedValue({
        data: { content: [] },
      });

      await loginWithToken('test-token');

      const result = await userContent.deleteContent(contentId);

      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining(`/user-content/${contentId}`),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );

      expect(result).toBe(true);
    });
  });
});

