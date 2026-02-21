'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Users, Heart, MapPin, Calendar, BookOpen, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components';
import { DataViewContainer } from '@/components/shared/data-display';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { authFetch } from '@/lib/api';

function StatItem({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
      <span>{(value ?? 0).toLocaleString()} {label}</span>
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
    <div className="card bg-base-100 border border-base-content/10 overflow-hidden">
      <div className="p-4 border-b border-base-content/10">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <Link href={`/admin/trees/${tree.id}`} className="text-lg font-semibold link link-primary">
            {tree.name}
          </Link>
          <span className={`badge badge-sm ${tree.isPublic ? 'badge-success' : 'badge-error'}`}>
            {tree.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
        <p className="text-sm text-base-content/60">
          File ID: <code className="bg-base-200 px-1 rounded">{tree.fileId}</code>
        </p>
        {tree.description && (
          <p className="text-sm text-base-content/70 mt-2 line-clamp-2">{tree.description}</p>
        )}
      </div>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-3 gap-y-2 text-sm text-base-content/70 border-b border-base-content/10">
        <StatItem icon={Users} value={individualsCount} label="people" />
        <StatItem icon={Heart} value={familiesCount} label="families" />
        <StatItem icon={MapPin} value={placesCount} label="places" />
        <StatItem icon={Calendar} value={eventsCount} label="events" />
        <StatItem icon={BookOpen} value={sourcesCount} label="sources" />
        <StatItem icon={FileText} value={notesCount} label="notes" />
      </div>
      <div className="p-4 bg-base-200 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-base-content/60 mb-0.5">Owners</div>
          <div className="flex flex-wrap gap-1">
            {(tree.owners || []).slice(0, 2).map((o) => (
              <span key={o.id} className={`badge badge-xs ${o.isPrimary ? 'badge-secondary' : 'badge-ghost'}`}>
                {o.isPrimary && '👑 '}{o.username}
              </span>
            ))}
            {(tree.owners?.length || 0) > 2 && (
              <span className="text-base-content/60">+{tree.owners.length - 2}</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-base-content/60 mb-0.5">Pending</div>
          <span className="text-base-content/70">
            {(tree.counts?.pendingRequests ?? 0)} requests, {(tree.counts?.activeInvitations ?? 0)} invites
          </span>
        </div>
      </div>
      <div className="px-4 py-2 text-xs text-base-content/60 border-t border-base-content/10">
        Created {formatDate(tree.createdAt)} • Updated {formatDate(tree.updatedAt)}
      </div>
    </div>
  );
}

export default function AdminTreesPage() {
  const { isReady, isSuperuser } = useRequireAuth({
    requireSuperuser: true,
    superuserRedirectTo: '/dashboard',
  });

  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const retryRef = useRef(null);
  const latestParams = useRef(null);

  const fetchData = useCallback(async ({ search, advancedConditions, filters, sort, sortDirection, page, perPage }) => {
    try {
      setLoading(true);
      setError(null);

      const qs = new URLSearchParams();
      qs.set('page', String(page));
      qs.set('limit', String(perPage));
      if (search) qs.set('search', search);
      if (filters?.visibility && filters.visibility !== 'all') qs.set('visibility', filters.visibility);
      if (sort) qs.set('sort', sort);
      qs.set('order', sortDirection);
      if (advancedConditions?.length > 0) qs.set('advanced_conditions', JSON.stringify(advancedConditions));

      const res = await authFetch(`/api/admin/trees?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch trees');

      setItems(data.trees || []);
      setTotalItems(data.pagination?.total ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = () => {
    if (latestParams.current) fetchData(latestParams.current);
  };

  const handleToggleVisibility = async (tree) => {
    try {
      const res = await authFetch(`/api/admin/trees/${tree.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !tree.isPublic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update tree');
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTree = async (tree) => {
    if (!confirm(`Are you sure you want to DELETE "${tree.name}"?\n\nThis will remove ALL associated data. This action CANNOT be undone!`)) return;
    try {
      const res = await authFetch(`/api/admin/trees/${tree.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete tree');
      refetch();
    } catch (err) {
      alert(err.message);
    }
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
          error={error ? { message: error, onRetry: refetch } : null}
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
            { key: 'name', label: 'Name' },
            { key: 'fileId', label: 'File ID' },
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
            { key: 'delete', label: 'Delete', variant: 'danger', onClick: (t) => !actionLoading && handleDeleteTree(t) },
          ]}
          onParamsChange={(p) => {
            latestParams.current = p;
            retryRef.current = () => fetchData(p);
            fetchData(p);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
