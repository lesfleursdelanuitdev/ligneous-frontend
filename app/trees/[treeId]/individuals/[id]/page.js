'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components';
import { CommentList } from '@/components/features/comments';
import { useRequireAuth } from '@/hooks/useRequireAuth';

/**
 * Individual detail page.
 * Shows individual info (placeholder) and comments section.
 * entityId for comments is the URL id (individual XREF or id).
 */
export default function IndividualDetailPage() {
  const params = useParams();
  const { isReady, isAuthenticated } = useRequireAuth('/login');
  const treeId = params?.treeId;
  const entityId = params?.id;

  if (!isReady || !treeId || !entityId) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse h-8 bg-base-200 rounded w-1/3 mb-4" />
          <div className="animate-pulse h-4 bg-base-200 rounded w-2/3" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Link
          href={`/trees/${treeId}`}
          className="link link-primary text-sm"
        >
          ← Back to tree
        </Link>

        <section>
          <h1 className="text-2xl font-bold text-base-content">
            Individual
          </h1>
          <p className="text-base-content/60 mt-1">
            Tree: {treeId} · ID: {entityId}
          </p>
          {/* TODO: Fetch and display full individual details (name, events, family, etc.) */}
        </section>

        <section className="border-t border-base-content/10 pt-6">
          <CommentList
            entityType="individual"
            entityId={entityId}
            treeId={treeId}
            canModerate={false}
          />
        </section>
      </div>
    </DashboardLayout>
  );
}
