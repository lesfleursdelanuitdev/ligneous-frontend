'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';

export function useTreeCanManage(treeId) {
  const { data, isLoading } = useQuery({
    queryKey: ['trees', treeId, 'manage', 'auth'],
    queryFn: async () => {
      const res = await authFetch(`/api/trees/${treeId}/manage/auth`);
      const json = await res.json().catch(() => ({}));
      return json?.canManage === true;
    },
    enabled: !!treeId,
    staleTime: 5 * 60_000,
  });

  return { canManage: data ?? false, isLoading };
}
