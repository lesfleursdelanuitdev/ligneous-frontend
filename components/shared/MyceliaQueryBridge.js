'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useListener } from 'mycelia-kernel-plugin/react';
import { queryKeys } from '@/lib/query-keys';

export default function MyceliaQueryBridge() {
  const queryClient = useQueryClient();

  useListener('auth:loggedIn', () => {
    queryClient.invalidateQueries();
  });

  useListener('auth:loggedOut', () => {
    queryClient.clear();
  });

  useListener('auth:stateChanged', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
  });

  return null;
}
