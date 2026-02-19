/**
 * User Content Facet
 * Handles user-generated content (posts, articles, notes, etc.)
 * Uses Mycelia Kernel Plugin System for reactive state management
 */

'use client';

import { createHook, Facet } from 'mycelia-kernel-plugin';
import axios from 'axios';
import { config } from '../../config/index.js';

const API_URL = config.api.nextApi.baseURL;

export const useUserContent = createHook({
  kind: 'userContent',
  version: '1.0.0',
  required: ['listeners', 'auth'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = {
      content: [],
      loading: false,
      error: null,
    };

    const listeners = subsystem.find('listeners');
    const auth = subsystem.find('auth');

    const emitStateChange = () => {
      if (listeners && listeners.hasListeners()) {
        listeners.emit('userContent:stateChanged', {
          type: 'userContent:stateChanged',
          body: { ...state },
        });
      }
    };

    const getContent = async (filters = {}) => {
      state.loading = true;
      emitStateChange();

      try {
        const token = auth.getState().token;
        const queryParams = new URLSearchParams(filters);
        const url = `${API_URL}/user-content?${queryParams}`;

        const headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios.get(url, { headers });
        const data = response.data;
        state.content = data.content || [];
        state.loading = false;
        emitStateChange();

        return state.content;
      } catch (error) {
        state.error = error.response?.data?.error || error.message || 'Failed to fetch content';
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    const createContent = async (contentData) => {
      state.loading = true;
      emitStateChange();

      try {
        const token = auth.getState().token;
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await axios.post(`${API_URL}/user-content`, contentData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;
        state.loading = false;
        emitStateChange();

        // Refresh content list
        await getContent();

        return data.content;
      } catch (error) {
        state.error = error.response?.data?.error || error.message || 'Failed to create content';
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    const updateContent = async (id, updates) => {
      state.loading = true;
      emitStateChange();

      try {
        const token = auth.getState().token;
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await axios.put(`${API_URL}/user-content/${id}`, updates, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;
        state.loading = false;
        emitStateChange();

        // Refresh content list
        await getContent();

        return data.content;
      } catch (error) {
        state.error = error.response?.data?.error || error.message || 'Failed to update content';
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    const deleteContent = async (id) => {
      state.loading = true;
      emitStateChange();

      try {
        const token = auth.getState().token;
        if (!token) {
          throw new Error('Authentication required');
        }

        await axios.delete(`${API_URL}/user-content/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        state.loading = false;
        emitStateChange();

        // Refresh content list
        await getContent();

        return true;
      } catch (error) {
        state.error = error.response?.data?.error || error.message || 'Failed to delete content';
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    return new Facet('userContent', '1.0.0').add({
      getState: () => ({ ...state }),
      getContent,
      createContent,
      updateContent,
      deleteContent,
    });
  },
});

export default useUserContent;

