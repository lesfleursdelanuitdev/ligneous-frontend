'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { authFetch } from '@/lib/api';

export default function AdminTreesPage() {
  const { isReady, isSuperuser } = useRequireAuth({
    requireSuperuser: true,
    superuserRedirectTo: '/dashboard',
  });
  
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all');

  const fetchTrees = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('search', search);
      if (visibilityFilter !== 'all') params.set('visibility', visibilityFilter);

      const response = await authFetch(`/api/admin/trees?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trees');
      }

      setTrees(data.trees);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, visibilityFilter]);

  useEffect(() => {
    if (!isReady || !isSuperuser) return;
    fetchTrees();
  }, [isReady, isSuperuser, fetchTrees]);

  const handleToggleVisibility = async (tree) => {
    try {
      const response = await authFetch(`/api/admin/trees/${tree.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !tree.isPublic }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tree');
      }

      fetchTrees();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTree = async (tree) => {
    if (!confirm(`Are you sure you want to DELETE "${tree.name}"?\n\nThis will remove ALL associated data including:\n- Owners & Maintainers\n- Permissions\n- Access Requests\n- Invitation Links\n\nThis action CANNOT be undone!`)) {
      return;
    }

    try {
      const response = await authFetch(`/api/admin/trees/${tree.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete tree');
      }

      fetchTrees();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  if (!isSuperuser) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-base-content">🌳 Tree Management</h1>
            <p className="text-base-content/60 text-sm mt-1">
              Manage all family trees, their owners, and permissions
            </p>
          </div>
          <div className="text-sm text-base-content/60">
            Total: <span className="font-semibold text-base-content">{pagination.total}</span> trees
          </div>
        </div>

        {/* Filters */}
        <div className="bg-base-100 rounded-lg p-4 border border-base-content/10 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or file ID..."
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
              value={visibilityFilter}
              onChange={(e) => {
                setVisibilityFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="input"
            >
              <option value="all">All Visibility</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Trees List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-base-100 rounded-lg p-8 border border-base-content/10 text-center">
              <span className="loading loading-spinner text-primary loading-md" />
              <p className="mt-2 text-base-content/60">Loading trees...</p>
            </div>
          ) : error ? (
            <div className="bg-base-100 rounded-lg p-8 border border-base-content/10 text-center text-error">
              {error}
            </div>
          ) : trees.length === 0 ? (
            <div className="bg-base-100 rounded-lg p-8 border border-base-content/10 text-center">
              <span className="text-4xl">🌲</span>
              <p className="mt-2 text-base-content/60">No trees found</p>
            </div>
          ) : (
            trees.map((tree) => (
              <div 
                key={tree.id} 
                className="bg-base-100 rounded-lg border border-base-content/10 overflow-hidden"
              >
                {/* Tree Header */}
                <div className="p-4 border-b border-base-content/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link 
                          href={`/admin/trees/${tree.id}`}
                          className="text-lg font-semibold link link-primary"
                        >
                          {tree.name}
                        </Link>
                        <span className={`badge badge-sm ${tree.isPublic ? 'badge-success' : 'badge-error'}`}>
                          {tree.isPublic ? '🌍 Public' : '🔒 Private'}
                        </span>
                      </div>
                      <p className="text-sm text-base-content/60 mt-1">
                        File ID: <code className="bg-base-200 px-1 rounded">{tree.fileId}</code>
                      </p>
                      {tree.description && (
                        <p className="text-sm text-base-content/70 mt-2 line-clamp-2">
                          {tree.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(tree)}
                        className={`btn btn-xs ${tree.isPublic ? 'btn-warning' : 'btn-success'}`}
                      >
                        Make {tree.isPublic ? 'Private' : 'Public'}
                      </button>
                      <Link
                        href={`/admin/trees/${tree.id}`}
                        className="btn btn-primary btn-xs"
                      >
                        Manage
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteTree(tree)}
                        className="btn btn-error btn-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tree Stats */}
                <div className="p-4 bg-base-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Owners */}
                  <div>
                    <div className="text-xs text-base-content/60 mb-1">Owners</div>
                    <div className="flex flex-wrap gap-1">
                      {tree.owners.length === 0 ? (
                        <span className="text-sm text-base-content/60">None</span>
                      ) : (
                        tree.owners.slice(0, 3).map((owner) => (
                          <span 
                            key={owner.id}
                            className={`badge badge-xs ${owner.isPrimary ? 'badge-secondary' : 'badge-ghost'}`}
                          >
                            {owner.isPrimary && '👑 '}{owner.username}
                          </span>
                        ))
                      )}
                      {tree.owners.length > 3 && (
                        <span className="text-xs text-base-content/60">
                          +{tree.owners.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Maintainers */}
                  <div>
                    <div className="text-xs text-base-content/60 mb-1">Maintainers</div>
                    <div className="flex flex-wrap gap-1">
                      {tree.maintainers.length === 0 ? (
                        <span className="text-sm text-base-content/60">None</span>
                      ) : (
                        tree.maintainers.slice(0, 3).map((maintainer) => (
                          <span 
                            key={maintainer.id}
                            className="badge badge-xs badge-info"
                          >
                            🛠️ {maintainer.username}
                          </span>
                        ))
                      )}
                      {tree.maintainers.length > 3 && (
                        <span className="text-xs text-base-content/60">
                          +{tree.maintainers.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Counts */}
                  <div>
                    <div className="text-xs text-base-content/60 mb-1">Stats</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-base-content/70">
                        {tree.counts.permissions} perms
                      </span>
                      <span className="text-base-content/70">
                        {tree.counts.linkedUsers} links
                      </span>
                    </div>
                  </div>

                  {/* Pending */}
                  <div>
                    <div className="text-xs text-base-content/60 mb-1">Pending</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {tree.counts.pendingRequests > 0 && (
                        <span className="text-warning font-medium">
                          {tree.counts.pendingRequests} requests
                        </span>
                      )}
                      {tree.counts.activeInvitations > 0 && (
                        <span className="text-info">
                          {tree.counts.activeInvitations} invites
                        </span>
                      )}
                      {tree.counts.pendingRequests === 0 && tree.counts.activeInvitations === 0 && (
                        <span className="text-base-content/60">None</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-2 text-xs text-base-content/60 border-t border-base-content/10">
                  Created {formatDate(tree.createdAt)} • Updated {formatDate(tree.updatedAt)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-base-100 rounded-lg p-4 border border-base-content/10">
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
    </DashboardLayout>
  );
}

