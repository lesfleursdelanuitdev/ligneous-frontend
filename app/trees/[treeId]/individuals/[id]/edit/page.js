'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DashboardMainContentLayout, IndividualEdit } from '@/components';
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

export default function IndividualEditPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const entityIdRaw = params?.id;
  const entityId = decodeUntilStable(entityIdRaw) || entityIdRaw;
  const { data: individual, isLoading, error } = useIndividualDetail(treeId, entityId);

  const displayName = individual ? stripSlashes(individual.fullName) || individual.xref : '';

  const breadcrumbs = [
    { label: 'Tree overview', href: `/trees/${treeId}` },
    { label: 'Individuals', href: `/trees/${treeId}/individuals` },
    { label: displayName || 'Individual', href: `/trees/${treeId}/individuals/${encodeURIComponent(entityId ?? '')}` },
    { label: 'Edit' },
  ];

  if (!treeId || !entityId) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Edit individual" breadcrumbs={breadcrumbs}>
        <p className="text-base-content/60">Missing tree or individual ID.</p>
      </DashboardMainContentLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Edit individual" breadcrumbs={breadcrumbs}>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-sm text-base-content/60">Loading individual...</p>
        </div>
      </DashboardMainContentLayout>
    );
  }

  if (error || !individual) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Edit individual" breadcrumbs={breadcrumbs}>
        <div className="alert alert-error">
          <span>{error?.message || 'Individual not found.'}</span>
        </div>
      </DashboardMainContentLayout>
    );
  }

  return (
    <DashboardMainContentLayout
      treeId={treeId}
      title={`Edit ${displayName}`}
      breadcrumbs={breadcrumbs}
    >
      <IndividualEdit individual={individual} treeId={treeId} />
    </DashboardMainContentLayout>
  );
}
