'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components';
import TreeOverviewSection from '@/components/features/trees/TreeOverviewSection';
import TreeOverviewToolbar from '@/components/features/trees/TreeOverviewToolbar';
import TreeProfileHeader from '@/components/features/trees/TreeProfileHeader';
import TreeStatsRow from '@/components/features/trees/TreeStatsRow';
import TreeRecentActivity from '@/components/features/trees/TreeRecentActivity';
import TreeHealthBadge from '@/components/features/trees/TreeHealthBadge';
import { useTreeMeta } from '@/hooks/queries/useTreeMeta';
import { useTreeCanManage } from '@/hooks/queries/useTreeCanManage';

export default function TreeOverviewPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const { data: metaData, isLoading: loading, error: queryError } = useTreeMeta(treeId);
  const { canManage } = useTreeCanManage(treeId);
  const tree = metaData?.tree || null;
  const error = queryError?.message || null;
  const [toolbarSection, setToolbarSection] = useState(null);

  if (!treeId) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-base-content/60">Missing tree ID.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-base-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-base-200 rounded animate-pulse" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-base-200 rounded-box animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !tree) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="alert alert-error">
            <span>{error || 'Tree not found'}</span>
          </div>
          <Link href="/my-trees" className="link link-primary mt-4 inline-block">
            ← Back to My Trees
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <TreeProfileHeader tree={tree} />
          </div>
          {canManage && (
            <div className="pt-1">
              <TreeHealthBadge treeId={treeId} />
            </div>
          )}
        </div>

        <div className="w-full bg-base-300 rounded-box border border-base-content/10 overflow-hidden">
          <TreeOverviewToolbar
            treeId={treeId}
            activeSection={toolbarSection}
            onSectionChange={setToolbarSection}
          />
          <div className="p-6 space-y-6">
            <TreeStatsRow treeId={treeId} />
            <TreeOverviewSection />
            {canManage ? (
              <TreeRecentActivity treeId={treeId} />
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
