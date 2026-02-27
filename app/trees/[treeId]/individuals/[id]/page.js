'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { DashboardMainContentLayout, IndividualDetail } from '@/components';
import { CommentList } from '@/components/features/comments';
import { useIndividualDetail } from '@/hooks/queries/useIndividualDetail';

function stripSlashes(name) {
  if (!name) return name;
  return name.replace(/\//g, '').replace(/\s+/g, ' ').trim();
}

function decodeUntilStable(str) {
  if (!str || typeof str !== 'string') return str;
  let out = str;
  let prev = '';
  while (prev !== out) {
    try {
      prev = out;
      out = decodeURIComponent(out);
    } catch {
      break;
    }
  }
  return out;
}

export default function IndividualDetailPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const entityIdRaw = params?.id;
  const entityId = decodeUntilStable(entityIdRaw) || entityIdRaw;
  const { data: individual, isLoading, error } = useIndividualDetail(treeId, entityId);

  const displayName = individual ? stripSlashes(individual.fullName) || individual.xref : '';

  const breadcrumbs = [
    { label: 'Tree overview', href: `/trees/${treeId}` },
    { label: 'Individuals', href: `/trees/${treeId}/individuals` },
    { label: displayName || 'Individual' },
  ];

  if (!treeId || !entityId) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Individual" breadcrumbs={breadcrumbs}>
        <p className="text-base-content/60">Missing tree or individual ID.</p>
      </DashboardMainContentLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Individual" breadcrumbs={breadcrumbs}>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-sm text-base-content/60">Loading individual...</p>
        </div>
      </DashboardMainContentLayout>
    );
  }

  if (error || !individual) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Individual" breadcrumbs={breadcrumbs}>
        <div className="alert alert-error">
          <span>{error?.message || 'Individual not found.'}</span>
        </div>
      </DashboardMainContentLayout>
    );
  }

  return (
    <DashboardMainContentLayout
      treeId={treeId}
      title={displayName}
      breadcrumbs={breadcrumbs}
      actions={
        <Link
          href={`/trees/${treeId}/individuals/${encodeURIComponent(individual?.xref ?? entityId ?? '')}/edit`}
          className="btn btn-primary btn-sm gap-2"
        >
          <Pencil size={16} />
          Edit
        </Link>
      }
    >
      <IndividualDetail individual={individual} treeId={treeId} />

      <section className="border-t border-base-content/10 pt-6 mt-8">
        <CommentList
          entityType="individual"
          entityId={entityId}
          treeId={treeId}
          canModerate={false}
        />
      </section>
    </DashboardMainContentLayout>
  );
}
