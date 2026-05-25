'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { DashboardMainContentLayout } from '@/components';
import FamilyDetail from '@/components/features/families/FamilyDetail';
import { CommentList } from '@/components/features/comments';
import { useFamilyDetail } from '@/hooks/queries/useFamilyDetail';
import { stripSlashes } from '@/lib/individual-utils';

function getFamilyTitle(family) {
  if (!family) return 'Family';
  const husband = family.husband ? stripSlashes(family.husband.fullName) : null;
  const wife = family.wife ? stripSlashes(family.wife.fullName) : null;
  const parts = [husband, wife].filter(Boolean);
  return parts.length > 0 ? parts.join(' & ') : family.xref || 'Family';
}

export default function FamilyDetailPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const familyId = params?.id;
  const { data: family, isLoading, error } = useFamilyDetail(treeId, familyId);

  const displayTitle = getFamilyTitle(family);

  const breadcrumbs = [
    { label: 'Tree overview', href: `/trees/${treeId}` },
    { label: 'Families', href: `/trees/${treeId}/families` },
    { label: displayTitle },
  ];

  if (!treeId || !familyId) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Family" breadcrumbs={breadcrumbs}>
        <p className="text-base-content/60">Missing tree or family ID.</p>
      </DashboardMainContentLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Family" breadcrumbs={breadcrumbs}>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-sm text-base-content/60">Loading family...</p>
        </div>
      </DashboardMainContentLayout>
    );
  }

  if (error || !family) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Family" breadcrumbs={breadcrumbs}>
        <div className="alert alert-error">
          <span>{error?.message || 'Family not found.'}</span>
        </div>
      </DashboardMainContentLayout>
    );
  }

  return (
    <DashboardMainContentLayout
      treeId={treeId}
      title={displayTitle}
      breadcrumbs={breadcrumbs}
      actions={
        <Link
          href={`/trees/${treeId}/families/${familyId}/edit`}
          className="btn btn-primary btn-sm gap-2"
        >
          <Pencil size={16} />
          Edit
        </Link>
      }
    >
      <FamilyDetail family={family} treeId={treeId} />

      <section className="border-t border-base-content/10 pt-6 mt-8">
        <CommentList
          entityType="family"
          entityId={familyId}
          treeId={treeId}
          canModerate={false}
        />
      </section>
    </DashboardMainContentLayout>
  );
}
