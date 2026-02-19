'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { authFetch } from '@/lib/api';

export default function AdminUsersPage() {
  const { isReady, isAuthenticated, isSuperuser } = useRequireAuth({
    requireSuperuser: true,
    superuserRedirectTo: '/dashboard',
  });
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await authFetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    if (!isReady || !isSuperuser) return;
    fetchUsers();
  }, [isReady, isSuperuser, fetchUsers]);

  const handleToggleStatus = async (user) => {
    setActionLoading(true);
    try {
      const response = await authFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      // Refresh users list
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuperuser = async (user) => {
    if (!confirm(`Are you sure you want to ${user.isWebsiteOwner ? 'remove' : 'grant'} superuser status for ${user.username}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await authFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isWebsiteOwner: !user.isWebsiteOwner }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to DELETE user ${user.username}? This action cannot be undone!`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await authFetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Show loading while checking auth
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

  // If not authorized, hook will redirect
  if (!isSuperuser) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-base-content">👥 User Management</h1>
            <p className="text-base-content/60 text-sm mt-1">
              Manage all registered users on the platform
            </p>
          </div>
          <div className="text-sm text-base-content/60">
            Total: <span className="font-semibold text-base-content">{pagination.total}</span> users
          </div>
        </div>

        {/* Filters */}
        <div className="bg-base-100 rounded-lg p-4 border border-base-content/10 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by username, email, or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="input w-full"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-base-100 rounded-lg border border-base-content/10 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <span className="loading loading-spinner text-primary loading-md" />
              <p className="mt-2 text-base-content/60">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-error">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-base-content/60">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-base-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-base-content/60 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-base-content/60 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-base-content/60 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-base-content/60 uppercase tracking-wider">Trees</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-base-content/60 uppercase tracking-wider">Last Login</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-base-content/60 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-content/10">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-base-200 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link 
                              href={`/admin/users/${user.id}`}
                              className="font-medium link link-primary"
                            >
                              {user.username}
                            </Link>
                            <div className="text-sm text-base-content/60">{user.email}</div>
                            {user.name && <div className="text-xs text-base-content/60">{user.name}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge badge-sm ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.isWebsiteOwner ? (
                          <span className="badge badge-sm badge-secondary">
                            ⭐ Superuser
                          </span>
                        ) : (
                          <span className="text-base-content/60 text-sm">User</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-base-content/70">
                        <div className="flex flex-col gap-1">
                          <span>👑 Owned: {user.treesOwned}</span>
                          <span>🛠️ Maintained: {user.treesMaintained}</span>
                          {user.linkedIndividuals > 0 && (
                            <span>👤 Linked: {user.linkedIndividuals}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-base-content/60">
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            disabled={actionLoading}
                            className={`btn btn-xs ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSuperuser(user)}
                            disabled={actionLoading}
                            className="btn btn-xs btn-secondary"
                          >
                            {user.isWebsiteOwner ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            disabled={actionLoading}
                            className="btn btn-xs btn-error"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-base-content/10 bg-base-200">
              <div className="text-sm text-base-content/60">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="btn btn-ghost btn-sm"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="btn btn-ghost btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

