'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipientId, groupId, content, subject }) => {
      const res = await authFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, groupId, content, subject }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      return data;
    },
    onSuccess: (_, variables) => {
      const id = variables.groupId || variables.recipientId;
      qc.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
      if (id) qc.invalidateQueries({ queryKey: queryKeys.messages.conversation(id) });
      qc.invalidateQueries({ queryKey: queryKeys.messages.unread() });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await authFetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markRead: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark as read');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
      qc.invalidateQueries({ queryKey: queryKeys.messages.unread() });
    },
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description, memberIds, treeId }) => {
      const res = await authFetch('/api/messages/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, memberIds, treeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create group');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.messages.groups() });
      qc.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
    },
  });
}
