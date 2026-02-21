'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components';
import { DataViewContainer } from '@/components/shared/data-display';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { authFetch } from '@/lib/api';

function formatDate(dateString) {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ isActive }) {
  return (
    <span className={`badge badge-sm ${isActive ? 'badge-success' : 'badge-error'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function RoleBadge({ isWebsiteOwner }) {
  if (isWebsiteOwner) {
    return <span className="badge badge-sm badge-secondary">Superuser</span>;
  }
  return <span className="text-base-content/60 text-sm">User</span>;
}

function UserAvatar({ username }) {
  return (
    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-semibold shrink-0">
      {username?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

export default function AdminUsersPage() {
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
      if (filters?.status && filters.status !== 'all') qs.set('status', filters.status);
      if (sort) qs.set('sort', sort);
      qs.set('order', sortDirection);
      if (advancedConditions?.length > 0) qs.set('advanced_conditions', JSON.stringify(advancedConditions));

      const res = await authFetch(`/api/admin/users?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch users');

      setItems(data.users || []);
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

  const handleToggleStatus = async (user) => {
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');
      refetch();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuperuser = async (user) => {
    if (!confirm(`Are you sure you want to ${user.isWebsiteOwner ? 'remove' : 'grant'} superuser status for ${user.username}?`)) return;
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isWebsiteOwner: !user.isWebsiteOwner }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');
      refetch();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to DELETE user ${user.username}? This action cannot be undone!`)) return;
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');
      refetch();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
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
            <h1 className="text-2xl font-bold text-base-content">User Management</h1>
            <p className="text-base-content/60 text-sm mt-1">Manage all registered users on the platform</p>
          </div>
          <div className="text-sm text-base-content/60">
            Total: <span className="font-semibold text-base-content">{totalItems}</span> users
          </div>
        </div>

        <DataViewContainer
          items={items}
          loading={loading}
          error={error ? { message: error, onRetry: refetch } : null}
          emptyState={{ title: 'No users found', message: 'Try adjusting your search or filters.' }}
          defaultView="list"
          renderCard={(user) => (
            <div className="card bg-base-100 border border-base-content/10 rounded-box p-4 space-y-3">
              <div className="flex items-center gap-3">
                <UserAvatar username={user.username} />
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/users/${user.id}`} className="font-medium link link-primary truncate block">
                    {user.username}
                  </Link>
                  <div className="text-sm text-base-content/60 truncate">{user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge isActive={user.isActive} />
                <RoleBadge isWebsiteOwner={user.isWebsiteOwner} />
              </div>
              <div className="text-xs text-base-content/60 space-y-0.5">
                <div>Owned: {user.treesOwned ?? 0} &middot; Maintained: {user.treesMaintained ?? 0}</div>
                <div>Last login: {formatDate(user.lastLoginAt)}</div>
              </div>
            </div>
          )}
          renderRow={(user) => (
            <>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <UserAvatar username={user.username} />
                  <div className="min-w-0">
                    <Link href={`/admin/users/${user.id}`} className="font-medium link link-primary">
                      {user.username}
                    </Link>
                    <div className="text-sm text-base-content/60">{user.email}</div>
                    {user.name && <div className="text-xs text-base-content/60">{user.name}</div>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><StatusBadge isActive={user.isActive} /></td>
              <td className="px-4 py-3"><RoleBadge isWebsiteOwner={user.isWebsiteOwner} /></td>
              <td className="px-4 py-3 text-sm text-base-content/70">
                <div className="flex flex-col gap-0.5">
                  <span>Owned: {user.treesOwned ?? 0}</span>
                  <span>Maintained: {user.treesMaintained ?? 0}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-base-content/60">{formatDate(user.lastLoginAt)}</td>
            </>
          )}
          listHeaders={[
            { label: 'User', key: 'username', sortable: true },
            { label: 'Status', key: 'status', sortable: false },
            { label: 'Role', key: 'role', sortable: false },
            { label: 'Trees', key: 'trees', sortable: false },
            { label: 'Last Login', key: 'lastLoginAt', sortable: true },
          ]}
          searchPlaceholder="Search by username, email, or name..."
          searchLabel="Username, email, or name"
          advancedSearchFields={[
            { key: 'username', label: 'Username' },
            { key: 'email', label: 'Email' },
            { key: 'name', label: 'Name' },
          ]}
          filters={[
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
          sortOptions={[
            { value: 'username', label: 'Username' },
            { value: 'email', label: 'Email' },
            { value: 'createdAt', label: 'Date Created' },
            { value: 'lastLoginAt', label: 'Last Login' },
          ]}
          defaultSort="createdAt"
          defaultSortDirection="desc"
          totalItems={totalItems}
          actions={[
            {
              key: 'view',
              label: 'View',
              href: (user) => `/admin/users/${user.id}`,
            },
            {
              key: 'activate',
              label: 'Toggle Status',
              onClick: (user) => !actionLoading && handleToggleStatus(user),
            },
            {
              key: 'admin',
              label: 'Toggle Admin',
              onClick: (user) => !actionLoading && handleToggleSuperuser(user),
            },
            {
              key: 'delete',
              label: 'Delete',
              variant: 'danger',
              onClick: (user) => !actionLoading && handleDeleteUser(user),
            },
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
