/**
 * Comments Facet
 * Entity-scoped comments: list, create, update, delete, resolve.
 * Uses Mycelia Kernel Plugin System for reactive state management.
 */

'use client';

import { createHook, Facet } from 'mycelia-kernel-plugin';
import axios from 'axios';
import { config } from '../../config/index.js';

function getBaseUrl() {
  try {
    const client = config.getClientConfig?.();
    return client?.api?.nextApi?.baseURL ?? '';
  } catch {
    return '';
  }
}

export const useComments = createHook({
  kind: 'comments',
  version: '1.0.0',
  required: ['listeners', 'auth'],
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = {
      comments: [],
      entityContext: null, // { entityType, entityId, treeId }
      loading: false,
      error: null,
    };

    const listeners = subsystem.find('listeners');
    const auth = subsystem.find('auth');

    const emitStateChange = () => {
      if (listeners && listeners.hasListeners()) {
        listeners.emit('comments:stateChanged', {
          type: 'comments:stateChanged',
          body: { ...state },
        });
      }
    };

    const getHeaders = () => {
      const token = auth.getState().token;
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      return headers;
    };

    const baseUrl = getBaseUrl() || '/api';

    const getComments = async (entityType, entityId, treeId, options = {}) => {
      state.loading = true;
      state.entityContext = { entityType, entityId, treeId };
      state.error = null;
      emitStateChange();

      try {
        const params = new URLSearchParams({
          entityType,
          entityId,
          treeId,
          ...(options.limit != null && { limit: String(options.limit) }),
          ...(options.offset != null && { offset: String(options.offset) }),
        });
        const response = await axios.get(`${baseUrl}/comments?${params}`, {
          headers: getHeaders(),
        });
        const data = response.data;
        state.comments = data.comments || [];
        state.loading = false;
        emitStateChange();
        return state.comments;
      } catch (error) {
        state.error = error.response?.data?.error || error.message || 'Failed to fetch comments';
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    const createComment = async (data) => {
      const { entityType, entityId, treeId, content, parentId } = data;
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const token = auth.getState().token;
        if (!token) throw new Error('Authentication required');

        const response = await axios.post(
          `${baseUrl}/comments`,
          { entityType, entityId, treeId, content: content?.trim?.() ?? content, parentId: parentId || undefined },
          {
            headers: { 'Content-Type': 'application/json', ...getHeaders() },
          }
        );
        const comment = response.data.comment;
        state.loading = false;
        if (state.entityContext &&
            state.entityContext.entityType === entityType &&
            state.entityContext.entityId === entityId &&
            state.entityContext.treeId === treeId) {
          state.comments = [...state.comments, comment];
        }
        emitStateChange();
        return comment;
      } catch (error) {
        state.error = error.response?.data?.error || error.message || 'Failed to create comment';
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    const updateComment = async (id, updates) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const token = auth.getState().token;
        if (!token) throw new Error('Authentication required');

        const response = await axios.put(`${baseUrl}/comments/${id}`, updates, {
          headers: { 'Content-Type': 'application/json', ...getHeaders() },
        });
        const comment = response.data.comment;
        state.loading = false;
        const idx = state.comments.findIndex((c) => c.id === id);
        if (idx >= 0) {
          state.comments = [...state.comments];
          state.comments[idx] = comment;
        } else {
          state.comments = state.comments.map((c) =>
            c.replies?.some((r) => r.id === id)
              ? { ...c, replies: c.replies.map((r) => (r.id === id ? comment : r)) }
              : c
          );
        }
        emitStateChange();
        return comment;
      } catch (error) {
        state.error = error.response?.data?.error || error.message || 'Failed to update comment';
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    const deleteComment = async (id) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const token = auth.getState().token;
        if (!token) throw new Error('Authentication required');

        await axios.delete(`${baseUrl}/comments/${id}`, { headers: getHeaders() });
        state.loading = false;
        state.comments = state.comments.filter((c) => c.id !== id);
        state.comments = state.comments.map((c) => ({
          ...c,
          replies: (c.replies || []).filter((r) => r.id !== id),
        }));
        emitStateChange();
        return true;
      } catch (error) {
        state.error = error.response?.data?.error || error.message || 'Failed to delete comment';
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    const resolveComment = async (id, resolved = true) => {
      state.loading = true;
      state.error = null;
      emitStateChange();

      try {
        const token = auth.getState().token;
        if (!token) throw new Error('Authentication required');

        const response = await axios.post(
          `${baseUrl}/comments/${id}/resolve`,
          { resolved },
          { headers: { 'Content-Type': 'application/json', ...getHeaders() } }
        );
        const comment = response.data.comment;
        state.loading = false;
        const updateInList = (list) =>
          list.map((c) => (c.id === id ? comment : c.replies ? { ...c, replies: updateInList(c.replies) } : c));
        state.comments = updateInList(state.comments);
        emitStateChange();
        return comment;
      } catch (error) {
        state.error = error.response?.data?.error || error.message || 'Failed to update comment';
        state.loading = false;
        emitStateChange();
        throw error;
      }
    };

    return new Facet('comments', '1.0.0').add({
      getState: () => ({ ...state }),
      getComments,
      createComment,
      updateComment,
      deleteComment,
      resolveComment,
    });
  },
});

export default useComments;
