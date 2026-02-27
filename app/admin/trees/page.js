'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Heart, MapPin, Calendar, BookOpen, FileText } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAdminTrees } from '@/hooks/queries/useAdminData';
import { useAdminUpdateTree, useAdminDeleteTree } from '@/hooks/mutations/useAdminMutations';

function StatItem({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={14} className="text-base-content/40 shrink-0" />
      <span className="text-sm font-semibold text-base-content">{(value ?? 0).toLocaleString()}</span>
      <span className="text-xs text-base-content/50 truncate">{label}</span>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function AdminTreeCard({ tree }) {
  const {
    individualsCount = 0,
    familiesCount = 0,
    placesCount = 0,
    eventsCount = 0,
    sourcesCount = 0,
    notesCount = 0,
  } = tree;
  return (
    <BaseCard className="h-full flex flex-col">
      <div className="space-y-3 flex-1 min-w-0">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link
              href={`/admin/trees/${tree.id}`}
              className="text-lg font-semibold link link-hover link-primary truncate block"
              onClick={(e) => e.stopPropagation()}
            >
              {tree.name}
            </Link>
            <span className={`badge badge-sm ${tree.isPublic ? 'badge-success' : 'badge-error'}`}>
              {tree.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
          <p className="text-sm text-base-content/60">
            File ID: <code className="bg-base-200 px-1 rounded text-xs">{tree.fileId}</code>
          </p>
          {tree.description && (
            <p className="text-sm text-base-content/70 mt-1 line-clamp-2">{tree.description}</p>
          )}
        </div>

        {/* Stats — same pattern as individuals-page entity cards */}
        <div className="grid grid-cols-3 gap-x-3 gap-y-2 py-2 border-t border-base-content/10">
          <StatItem icon={Users} value={individualsCount} label="people" />
          <StatItem icon={Heart} value={familiesCount} label="families" />
          <StatItem icon={MapPin} value={placesCount} label="places" />
          <StatItem icon={Calendar} value={eventsCount} label="events" />
          <StatItem icon={BookOpen} value={sourcesCount} label="sources" />
          <StatItem icon={FileText} value={notesCount} label="notes" />
        </div>

        {/* Owners & Pending — single footer row */}
        <div className="pt-2 border-t border-base-content/10 space-y-1.5 text-xs text-base-content/60">
          <div>
            <span className="text-base-content/50">Owners </span>
            {(tree.owners || []).slice(0, 2).map((o) => (
              <span key={o.id} className={`badge badge-xs mr-1 ${o.isPrimary ? 'badge-secondary' : 'badge-ghost'}`}>
                {o.isPrimary && '👑 '}{o.username}
              </span>
            ))}
            {(tree.owners?.length || 0) > 2 && (
              <span className="text-base-content/50">+{tree.owners.length - 2}</span>
            )}
          </div>
          <div>
            <span className="text-base-content/50">Pending </span>
            <span className="text-base-content/70">
              {(tree.counts?.pendingRequests ?? 0)} requests, {(tree.counts?.activeInvitations ?? 0)} invites
            </span>
          </div>
        </div>

        {/* Dates */}
        <div className="pt-2 border-t border-base-content/10 text-xs text-base-content/50">
          Created {formatDate(tree.createdAt)} • Updated {formatDate(tree.updatedAt)}
        </div>
      </div>
    </BaseCard>
  );
}

export default function AdminTreesPage() {
  const { isReady, isSuperuser } = useRequireAuth({
    requireSuperuser: true,
    superuserRedirectTo: '/dashboard',
  });

  const queryClient = useQueryClient();
  const [queryParams, setQueryParams] = useState({});
  const { data, isLoading: loading, error: queryError, refetch } = useAdminTrees(queryParams);
  const items = data?.trees || [];
  const totalItems = data?.pagination?.total ?? 0;
  const error = queryError?.message || null;
  const updateTree = useAdminUpdateTree();
  const deleteTreeMut = useAdminDeleteTree();
  const actionLoading = updateTree.isPending || deleteTreeMut.isPending;

  const handleToggleVisibility = (tree) => {
    updateTree.mutate(
      { treeId: tree.id, updates: { isPublic: !tree.isPublic } },
      { onError: (err) => alert(err.message) }
    );
  };


  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <span className="loading loading-spinner text-primary loading-lg" />
          <p className="mt-4 text-base-content/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSuperuser) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-base-content">Tree Management</h1>
            <p className="text-base-content/60 text-sm mt-1">
              Manage all family trees, their owners, and permissions
            </p>
          </div>
          <div className="text-sm text-base-content/60">
            Total: <span className="font-semibold text-base-content">{totalItems}</span> trees
          </div>
        </div>

        <DataViewContainer
          items={items}
          loading={loading}
          error={error ? { message: error, onRetry: () => refetch() } : null}
          emptyState={{ title: 'No trees found', message: 'Try adjusting your search or filters.' }}
          defaultView="list"
          renderCard={(tree) => <AdminTreeCard tree={tree} />}
          renderRow={(tree) => (
            <>
              <td className="px-4 py-3">
                <div>
                  <Link href={`/admin/trees/${tree.id}`} className="font-medium link link-primary">
                    {tree.name}
                  </Link>
                  <div className="text-sm text-base-content/60">File ID: {tree.fileId}</div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-base-content/70">
                {(tree.individualsCount ?? 0).toLocaleString()} people
              </td>
              <td className="px-4 py-3">
                <span className={`badge badge-sm ${tree.isPublic ? 'badge-success' : 'badge-error'}`}>
                  {tree.isPublic ? 'Public' : 'Private'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-base-content/70">
                {(tree.owners || []).map((o) => o.username).join(', ') || '—'}
              </td>
              <td className="px-4 py-3 text-sm text-base-content/60">
                {tree.counts?.pendingRequests ?? 0} req, {tree.counts?.activeInvitations ?? 0} invites
              </td>
              <td className="px-4 py-3 text-sm text-base-content/60">{formatDate(tree.updatedAt)}</td>
            </>
          )}
          listHeaders={[
            { label: 'Tree', key: 'name', sortable: true },
            { label: 'People', key: 'individuals_count', sortable: false },
            { label: 'Visibility', key: 'visibility', sortable: false },
            { label: 'Owners', key: 'owners', sortable: false },
            { label: 'Pending', key: 'pending', sortable: false },
            { label: 'Updated', key: 'updatedAt', sortable: true },
          ]}
          searchPlaceholder="Search by name or file ID..."
          searchLabel="Name or file ID"
          advancedSearchFields={[
            { key: 'name',       label: 'Name' },
            { key: 'fileId',     label: 'File ID' },
            { key: 'visibility', label: 'Visibility', type: 'select', options: [
              { value: 'public',  label: 'Public' },
              { value: 'private', label: 'Private' },
            ]},
          ]}
          filters={[
            { key: 'visibility', label: 'Visibility', type: 'select', options: [
              { value: 'public', label: 'Public' },
              { value: 'private', label: 'Private' },
            ]},
          ]}
          sortOptions={[
            { value: 'name', label: 'Name' },
            { value: 'createdAt', label: 'Created' },
            { value: 'updatedAt', label: 'Updated' },
          ]}
          defaultSort="updatedAt"
          defaultSortDirection="desc"
          totalItems={totalItems}
          actions={[
            { key: 'view', label: 'Manage', href: (t) => `/admin/trees/${t.id}` },
            { key: 'toggle', label: 'Toggle visibility', onClick: (t) => !actionLoading && handleToggleVisibility(t) },
            {
              key: 'delete',
              label: 'Delete',
              variant: 'danger',
              confirmMessage: (t) => (
                <>
                  <p className="font-medium">Delete tree &quot;{t.name}&quot;?</p>
                  <p className="mt-2 text-base-content/70">This will remove ALL associated data. This action cannot be undone.</p>
                </>
              ),
              performDelete: async (t) => {
                await deleteTreeMut.mutateAsync({ treeId: t.id });
              },
            },
          ]}
          addNewComponent={<AddNewPlaceholder title="Add Tree" />}
          onParamsChange={setQueryParams}
        />
      </div>
    </DashboardLayout>
  );
}
