'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Users, Heart, MapPin, Calendar, CalendarDays, BookOpen, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components';
import TreeOverviewSection from '@/components/features/trees/TreeOverviewSection';
import TreeUpdatesSection from '@/components/features/trees/TreeUpdatesSection';
import TreeOverviewToolbar from '@/components/features/trees/TreeOverviewToolbar';
import TreeProfileHeader from '@/components/features/trees/TreeProfileHeader';
import { useTreeMeta } from '@/hooks/queries/useTreeMeta';

export default function TreeOverviewPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const { data: metaData, isLoading: loading, error: queryError } = useTreeMeta(treeId);
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-base-200 rounded-box animate-pulse" />
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

  const statCards = [
    { label: 'Individuals', href: `/trees/${treeId}/individuals`, value: tree.individualsCount ?? 0, icon: Users },
    { label: 'Families', href: `/trees/${treeId}/families`, value: tree.familiesCount ?? 0, icon: Heart },
    { label: 'Places', href: `/trees/${treeId}/places`, value: tree.placesCount ?? 0, icon: MapPin },
    { label: 'Events', href: `/trees/${treeId}/events`, value: tree.eventsCount ?? 0, icon: Calendar },
    { label: 'Dates', href: `/trees/${treeId}/dates`, value: tree.datesCount ?? 0, icon: CalendarDays },
    { label: 'Sources', href: `/trees/${treeId}/sources`, value: tree.sourcesCount ?? 0, icon: BookOpen },
    { label: 'Notes', href: `/trees/${treeId}/notes`, value: tree.notesCount ?? 0, icon: FileText },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <TreeProfileHeader tree={tree} />

        <div className="w-full bg-base-300 rounded-box border border-base-content/10 overflow-hidden">
          <TreeOverviewToolbar
            treeId={treeId}
            activeSection={toolbarSection}
            onSectionChange={setToolbarSection}
          />
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {statCards.map(({ label, href, value, icon: Icon }) => (
            <div
              key={label}
              className="card bg-base-200 rounded-box p-4 flex flex-col gap-3"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-base-content">
                  {(value ?? 0).toLocaleString()}
                </div>
                <div className="text-sm text-base-content/60">{label}</div>
              </div>
              <Link
                href={href}
                className="btn btn-primary btn-sm w-full"
              >
                View
              </Link>
            </div>
          ))}
            </div>
            <TreeOverviewSection />
            <TreeUpdatesSection />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
