'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ManageSidebarNav from '@/components/features/manage/ManageSidebarNav';
import { useTreeCanManage } from '@/hooks/queries/useTreeCanManage';

export default function ManageLayout({ children }) {
  const router = useRouter();
  const params = useParams();
  const treeId = params?.treeId;
  const { canManage, isLoading } = useTreeCanManage(treeId);

  useEffect(() => {
    if (!isLoading && !canManage && treeId) {
      router.replace(`/trees/${treeId}`);
    }
  }, [isLoading, canManage, treeId, router]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!canManage) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex gap-8 items-start">
        <ManageSidebarNav treeId={treeId} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </DashboardLayout>
  );
}
