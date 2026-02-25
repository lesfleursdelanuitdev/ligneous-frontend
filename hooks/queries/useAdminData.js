'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

function buildAdminParams(params) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.perPage) qs.set('limit', String(params.perPage));
  if (params.search) qs.set('search', params.search);
  if (params.sort) qs.set('sort', params.sort);
  if (params.sortDirection) qs.set('order', params.sortDirection);
  if (params.advancedConditions?.length > 0) {
    qs.set('advanced_conditions', JSON.stringify(params.advancedConditions));
  }
  if (params.filters && typeof params.filters === 'object') {
    for (const [key, value] of Object.entries(params.filters)) {
      if (value && value !== 'all') qs.set(key, String(value));
    }
  }
  return qs;
}

export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: queryKeys.admin.users(params),
    queryFn: async () => {
      const qs = buildAdminParams(params);
      const res = await authFetch(`/api/admin/users?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminTrees(params = {}) {
  return useQuery({
    queryKey: queryKeys.admin.trees(params),
    queryFn: async () => {
      const qs = buildAdminParams(params);
      const res = await authFetch(`/api/admin/trees?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch trees');
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminRequests(params = {}) {
  return useQuery({
    queryKey: queryKeys.admin.requests().concat([params]),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params.page) qs.set('page', String(params.page));
      if (params.perPage) qs.set('limit', String(params.perPage));
      const status = params.filters?.status || 'pending';
      qs.set('status', status);
      if (params.filters?.type) qs.set('type', params.filters.type);
      const res = await authFetch(`/api/admin/requests?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch requests');
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminUserDetail(userId) {
  return useQuery({
    queryKey: queryKeys.admin.userDetail(userId),
    queryFn: async () => {
      const res = await authFetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch user');
      return data;
    },
    enabled: !!userId,
  });
}

export function useAdminTreeDetail(treeId) {
  return useQuery({
    queryKey: queryKeys.admin.treeDetail(treeId),
    queryFn: async () => {
      const res = await authFetch(`/api/admin/trees/${treeId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch tree');
      return data;
    },
    enabled: !!treeId,
  });
}
