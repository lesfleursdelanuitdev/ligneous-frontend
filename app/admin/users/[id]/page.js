'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { authFetch } from '@/lib/api';

// Component to manage user-individual links
function IndividualLinksSection({ userId, onRefresh }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [trees, setTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState('');
  const [individualXref, setIndividualXref] = useState('');
  const [verified, setVerified] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLinks = useCallback(async () => {
    try {
      const response = await authFetch(`/api/admin/users/${userId}/links`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setLinks(data.links);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchTrees = useCallback(async () => {
    try {
      const response = await authFetch('/api/admin/trees?limit=1000');
      const data = await response.json();
      if (response.ok) {
        setTrees(data.trees || []);
      }
    } catch (err) {
      console.error('Failed to fetch trees:', err);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
    fetchTrees();
  }, [fetchLinks, fetchTrees]);

  const handleAddLink = async () => {
    if (!selectedTree || !individualXref) return;
    setActionLoading(true);
    try {
      const response = await authFetch(`/api/admin/users/${userId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treeId: selectedTree,
          individualXref: individualXref.trim(),
          verified,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAdding(false);
      setSelectedTree('');
      setIndividualXref('');
      setVerified(true);
      fetchLinks();
      onRefresh?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveLink = async (linkId) => {
    if (!confirm('Remove this individual link?')) return;
    try {
      const response = await authFetch(`/api/admin/users/${userId}/links?linkId=${linkId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      fetchLinks();
      onRefresh?.();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleVerified = async (link) => {
    try {
      const response = await authFetch(`/api/admin/users/${userId}/links`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId: link.id,
          verified: !link.verified,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      fetchLinks();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-base-100 rounded-lg border border-base-content/10 p-6">
        <h2 className="text-lg font-semibold text-base-content mb-4">👤 Linked Individuals</h2>
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner text-primary loading-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-100 rounded-lg border border-base-content/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-base-content">👤 Linked Individuals ({links.length})</h2>
        <button
          type="button"
          onClick={() => setAdding(!adding)}
          className="btn btn-primary btn-sm"
        >
          {adding ? 'Cancel' : '+ Link Individual'}
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-base-200 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-1">Tree</label>
            <select
              value={selectedTree}
              onChange={(e) => setSelectedTree(e.target.value)}
              className="input w-full"
            >
              <option value="">Select a tree...</option>
              {trees.map((tree) => (
                <option key={tree.id} value={tree.id}>
                  {tree.name} ({tree.isPublic ? 'Public' : 'Private'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-1">Individual XREF</label>
            <input
              type="text"
              value={individualXref}
              onChange={(e) => setIndividualXref(e.target.value)}
              placeholder="e.g., @I123@"
              className="input input-bordered w-full"
            />
            <p className="text-xs text-base-content/60 mt-1">
              Enter the GEDCOM XREF identifier (e.g., @I123@ or I123)
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            Mark as verified
          </label>
          <button
            type="button"
            onClick={handleAddLink}
            disabled={!selectedTree || !individualXref || actionLoading}
            className="btn btn-success btn-sm"
          >
            {actionLoading ? 'Adding...' : 'Add Link'}
          </button>
        </div>
      )}

      {error && (
        <p className="text-error text-sm mb-4">{error}</p>
      )}

      {links.length > 0 ? (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xl">{link.tree.isPublic ? '🌍' : '🔒'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/admin/trees/${link.tree.id}`}
                      className="font-medium link link-primary"
                    >
                      {link.tree.name}
                    </Link>
                    <span className="text-base-content/60">→</span>
                    <code className="px-2 py-0.5 bg-base-300 rounded text-sm">
                      {link.individualXref}
                    </code>
                    {link.verified ? (
                      <span className="badge badge-sm badge-success">✓ Verified</span>
                    ) : (
                      <span className="badge badge-sm badge-warning">Pending</span>
                    )}
                  </div>
                  <p className="text-xs text-base-content/60">
                    Linked {new Date(link.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleVerified(link)}
                  className="btn btn-ghost btn-xs"
                  title={link.verified ? 'Mark as unverified' : 'Mark as verified'}
                >
                  {link.verified ? '✗ Unverify' : '✓ Verify'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(link.id)}
                  className="btn btn-ghost btn-xs text-error"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-base-content/60 text-center py-4">No linked individuals</p>
      )}
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const { isReady, isSuperuser } = useRequireAuth({
    requireSuperuser: true,
    superuserRedirectTo: '/dashboard',
  });
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const response = await authFetch(`/api/admin/users/${params.id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!isReady || !isSuperuser) return;
    fetchUser();
  }, [isReady, isSuperuser, fetchUser]);

  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      const response = await authFetch(`/api/admin/users/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      fetchUser();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuperuser = async () => {
    if (!confirm(`Are you sure you want to ${user.isWebsiteOwner ? 'remove' : 'grant'} superuser status?`)) return;
    setActionLoading(true);
    try {
      const response = await authFetch(`/api/admin/users/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isWebsiteOwner: !user.isWebsiteOwner }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      fetchUser();
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

  if (!isSuperuser) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <span className="loading loading-spinner text-primary loading-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-error">{error || 'User not found'}</p>
          <Link href="/admin/users" className="link link-primary mt-4 inline-block">
            ← Back to Users
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/admin/users" className="link link-primary text-sm mb-2 inline-block">
              ← Back to Users
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-content text-2xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-base-content">{user.username}</h1>
                <p className="text-base-content/60">{user.email}</p>
                {user.name && <p className="text-sm text-base-content/70">{user.name}</p>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={`btn btn-sm ${user.isActive ? 'btn-warning' : 'btn-success'}`}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              type="button"
              onClick={handleToggleSuperuser}
              disabled={actionLoading}
              className="btn btn-sm btn-secondary"
            >
              {user.isWebsiteOwner ? 'Remove Superuser' : 'Make Superuser'}
            </button>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
            {user.isActive ? '✓ Active' : '✕ Inactive'}
          </span>
          {user.isWebsiteOwner && (
            <span className="badge badge-secondary">⭐ Superuser</span>
          )}
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-base-100 rounded-lg border border-base-content/10 p-4">
            <div className="text-sm text-base-content/60">Created</div>
            <div className="font-medium text-base-content">{formatDate(user.createdAt)}</div>
          </div>
          <div className="bg-base-100 rounded-lg border border-base-content/10 p-4">
            <div className="text-sm text-base-content/60">Last Login</div>
            <div className="font-medium text-base-content">{formatDate(user.lastLoginAt)}</div>
          </div>
          <div className="bg-base-100 rounded-lg border border-base-content/10 p-4">
            <div className="text-sm text-base-content/60">Active Sessions</div>
            <div className="font-medium text-base-content">{user.sessions?.length || 0}</div>
          </div>
        </div>

        {/* Trees Owned */}
        <div className="bg-base-100 rounded-lg border border-base-content/10 p-6">
          <h2 className="text-lg font-semibold text-base-content mb-4">👑 Trees Owned ({user.treeOwners?.length || 0})</h2>
          {user.treeOwners?.length > 0 ? (
            <div className="space-y-2">
              {user.treeOwners.map((ownership) => (
                <div key={ownership.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{ownership.tree.isPublic ? '🌍' : '🔒'}</span>
                    <div>
                      <Link 
                        href={`/admin/trees/${ownership.tree.id}`}
                        className="font-medium link link-primary"
                      >
                        {ownership.tree.name}
                      </Link>
                      {ownership.isPrimary && (
                        <span className="ml-2 badge badge-sm badge-secondary">Primary</span>
                      )}
                      <p className="text-sm text-base-content/60">File: {ownership.tree.fileId}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-base-content/60 text-center py-4">No trees owned</p>
          )}
        </div>

        {/* Trees Maintained */}
        <div className="bg-base-100 rounded-lg border border-base-content/10 p-6">
          <h2 className="text-lg font-semibold text-base-content mb-4">🛠️ Trees Maintained ({user.treeMaintainers?.length || 0})</h2>
          {user.treeMaintainers?.length > 0 ? (
            <div className="space-y-2">
              {user.treeMaintainers.map((maintainer) => (
                <div key={maintainer.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{maintainer.tree.isPublic ? '🌍' : '🔒'}</span>
                    <div>
                      <Link 
                        href={`/admin/trees/${maintainer.tree.id}`}
                        className="font-medium link link-primary"
                      >
                        {maintainer.tree.name}
                      </Link>
                      <p className="text-sm text-base-content/60">File: {maintainer.tree.fileId}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-base-content/60 text-center py-4">No trees maintained</p>
          )}
        </div>

        {/* Linked Individuals */}
        <IndividualLinksSection userId={params.id} onRefresh={fetchUser} />

        {/* Pending Access Requests */}
        {user.accessRequests?.length > 0 && (
          <div className="bg-warning/10 rounded-lg border border-warning/30 p-6">
            <h2 className="text-lg font-semibold text-warning-content mb-4">
              ⏳ Pending Access Requests ({user.accessRequests.length})
            </h2>
            <div className="space-y-2">
              {user.accessRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                  <div>
                    <span className="font-medium text-base-content">{req.tree.name}</span>
                    <span className="text-base-content/60"> • {req.requestType}</span>
                    {req.notes && <p className="text-sm text-base-content/60">"{req.notes}"</p>}
                  </div>
                  <Link
                    href="/admin/requests"
                    className="text-sm link link-primary"
                  >
                    Review →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Sessions */}
        {user.sessions?.length > 0 && (
          <div className="bg-base-100 rounded-lg border border-base-content/10 p-6">
            <h2 className="text-lg font-semibold text-base-content mb-4">
              🔐 Active Sessions ({user.sessions.length})
            </h2>
            <div className="space-y-2">
              {user.sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div>
                    <p className="text-sm text-base-content">
                      Last used: {formatDate(session.lastUsedAt)}
                    </p>
                    {session.ipAddress && (
                      <p className="text-xs text-base-content/60">IP: {session.ipAddress}</p>
                    )}
                  </div>
                  <span className="badge badge-sm badge-success">Active</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

