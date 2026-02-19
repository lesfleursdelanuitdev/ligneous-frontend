'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { authFetch } from '@/lib/api';

// Tab components
function OwnersTab({ tree, onRefresh, allUsers }) {
  const [adding, setAdding] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddOwner = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const response = await authFetch(`/api/admin/trees/${tree.id}/owners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser, isPrimary }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAdding(false);
      setSelectedUser('');
      setIsPrimary(false);
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOwner = async (userId, username) => {
    if (!confirm(`Remove ${username} as owner?`)) return;
    try {
      const response = await authFetch(`/api/admin/trees/${tree.id}/owners?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-base-content">👑 Tree Owners</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="btn btn-primary btn-sm"
        >
          {adding ? 'Cancel' : '+ Add Owner'}
        </button>
      </div>

      {adding && (
        <div className="p-4 bg-base-200 rounded-lg space-y-3">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="input w-full"
          >
            <option value="">Select a user...</option>
            {allUsers
              .filter(u => !tree.owners.some(o => o.user.id === u.id))
              .map(u => (
                <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
              ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded"
            />
            Make primary owner
          </label>
          <button
            onClick={handleAddOwner}
            disabled={!selectedUser || loading}
            className="btn btn-success btn-sm"
          >
            {loading ? 'Adding...' : 'Add Owner'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {tree.owners.map((owner) => (
          <div key={owner.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-content font-semibold">
                {owner.user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-base-content">{owner.user.username}</span>
                  {owner.isPrimary && (
                    <span className="px-2 py-0.5 rounded text-xs badge badge-secondary">
                      Primary
                    </span>
                  )}
                </div>
                <span className="text-sm text-base-content/60">{owner.user.email}</span>
              </div>
            </div>
            <button
              onClick={() => handleRemoveOwner(owner.user.id, owner.user.username)}
              className="btn btn-error btn-xs"
            >
              Remove
            </button>
          </div>
        ))}
        {tree.owners.length === 0 && (
          <p className="text-center text-base-content/60 py-4">No owners assigned</p>
        )}
      </div>
    </div>
  );
}

function MaintainersTab({ tree, onRefresh, allUsers }) {
  const [adding, setAdding] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMaintainer = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const response = await authFetch(`/api/admin/trees/${tree.id}/maintainers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAdding(false);
      setSelectedUser('');
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMaintainer = async (userId, username) => {
    if (!confirm(`Remove ${username} as maintainer?`)) return;
    try {
      const response = await authFetch(`/api/admin/trees/${tree.id}/maintainers?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-base-content">🛠️ Tree Maintainers</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="btn btn-primary btn-sm"
        >
          {adding ? 'Cancel' : '+ Add Maintainer'}
        </button>
      </div>

      {adding && (
        <div className="p-4 bg-base-200 rounded-lg space-y-3">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="input w-full"
          >
            <option value="">Select a user...</option>
            {allUsers
              .filter(u => !tree.treeMaintainers.some(m => m.user.id === u.id))
              .map(u => (
                <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
              ))}
          </select>
          <button
            onClick={handleAddMaintainer}
            disabled={!selectedUser || loading}
            className="btn btn-success btn-sm"
          >
            {loading ? 'Adding...' : 'Add Maintainer'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {tree.treeMaintainers.map((maintainer) => (
          <div key={maintainer.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {maintainer.user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-medium text-base-content">{maintainer.user.username}</span>
                <br />
                <span className="text-sm text-base-content/60">{maintainer.user.email}</span>
              </div>
            </div>
            <button
              onClick={() => handleRemoveMaintainer(maintainer.user.id, maintainer.user.username)}
              className="btn btn-error btn-xs"
            >
              Remove
            </button>
          </div>
        ))}
        {tree.treeMaintainers.length === 0 && (
          <p className="text-center text-base-content/60 py-4">No maintainers assigned</p>
        )}
      </div>
    </div>
  );
}

function PermissionsTab({ tree, onRefresh, allUsers }) {
  const [adding, setAdding] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [permissionType, setPermissionType] = useState('read');
  const [loading, setLoading] = useState(false);

  const handleAddPermission = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const response = await authFetch(`/api/admin/trees/${tree.id}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser, permissionType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAdding(false);
      setSelectedUser('');
      setPermissionType('read');
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokePermission = async (permissionId, username) => {
    if (!confirm(`Revoke permission from ${username}?`)) return;
    try {
      const response = await authFetch(`/api/admin/trees/${tree.id}/permissions?permissionId=${permissionId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const permissionColors = {
    read: 'badge badge-success',
    write: 'badge badge-info',
    delete: 'badge badge-warning',
    admin: 'badge badge-secondary',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-base-content">🔑 Permissions</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="btn btn-primary btn-sm"
        >
          {adding ? 'Cancel' : '+ Grant Permission'}
        </button>
      </div>

      {adding && (
        <div className="p-4 bg-base-200 rounded-lg space-y-3">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="input w-full"
          >
            <option value="">Select a user...</option>
            {allUsers.map(u => (
              <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
            ))}
          </select>
          <select
            value={permissionType}
            onChange={(e) => setPermissionType(e.target.value)}
            className="input w-full"
          >
            <option value="read">Read - View tree content</option>
            <option value="write">Write - Edit tree content</option>
            <option value="delete">Delete - Remove records</option>
            <option value="admin">Admin - Full control</option>
          </select>
          <button
            onClick={handleAddPermission}
            disabled={!selectedUser || loading}
            className="btn btn-success btn-sm"
          >
            {loading ? 'Granting...' : 'Grant Permission'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {tree.permissions.map((perm) => (
          <div key={perm.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-base-content/20 flex items-center justify-center text-base-content font-semibold">
                {perm.user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-base-content">{perm.user.username}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${permissionColors[perm.permissionType]}`}>
                    {perm.permissionType}
                  </span>
                </div>
                <span className="text-sm text-base-content/60">
                  {perm.resourceType} • Granted by {perm.granter?.username || 'System'}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleRevokePermission(perm.id, perm.user.username)}
              className="btn btn-error btn-xs"
            >
              Revoke
            </button>
          </div>
        ))}
        {tree.permissions.length === 0 && (
          <p className="text-center text-base-content/60 py-4">No permissions granted</p>
        )}
      </div>
    </div>
  );
}

function InvitationsTab({ tree, onRefresh }) {
  const [creating, setCreating] = useState(false);
  const [roleType, setRoleType] = useState('read');
  const [maxUses, setMaxUses] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [newInviteUrl, setNewInviteUrl] = useState('');

  const handleCreateInvitation = async () => {
    setLoading(true);
    try {
      const response = await authFetch(`/api/admin/trees/${tree.id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roleType, 
          maxUses: maxUses ? parseInt(maxUses) : null,
          notes: notes || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNewInviteUrl(data.invitation.url);
      setCreating(false);
      setRoleType('read');
      setMaxUses('');
      setNotes('');
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeInvitation = async (invitationId) => {
    if (!confirm('Revoke this invitation link?')) return;
    try {
      const response = await authFetch(`/api/admin/trees/${tree.id}/invitations?invitationId=${invitationId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-base-content">🔗 Invitation Links</h3>
        <button
          onClick={() => setCreating(!creating)}
          className="btn btn-primary btn-sm"
        >
          {creating ? 'Cancel' : '+ Create Invitation'}
        </button>
      </div>

      {newInviteUrl && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-300 mb-2">✓ Invitation created! Share this link:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newInviteUrl}
              readOnly
              className="input flex-1 text-sm"
            />
            <button
              onClick={() => copyToClipboard(newInviteUrl)}
              className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => setNewInviteUrl('')}
            className="mt-2 text-sm link link-primary"
          >
            Dismiss
          </button>
        </div>
      )}

      {creating && (
        <div className="p-4 bg-base-200 rounded-lg space-y-3">
          <select
            value={roleType}
            onChange={(e) => setRoleType(e.target.value)}
            className="input w-full"
          >
            <option value="read">Read Access</option>
            <option value="write">Write Access</option>
            <option value="maintainer">Maintainer Role</option>
            <option value="owner">Owner Role</option>
          </select>
          <input
            type="number"
            placeholder="Max uses (leave empty for unlimited)"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            className="input w-full"
            min="1"
          />
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input w-full"
          />
          <button
            onClick={handleCreateInvitation}
            disabled={loading}
            className="btn btn-success btn-sm"
          >
            {loading ? 'Creating...' : 'Create Invitation Link'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {tree.invitationLinks.filter(inv => !inv.isRevoked).map((inv) => (
          <div key={inv.id} className="p-3 bg-base-200 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge badge-sm badge-info">
                    {inv.roleType}
                  </span>
                  {inv.maxUses && (
                    <span className="text-xs text-base-content/60">
                      {inv._count?.uses || 0}/{inv.maxUses} uses
                    </span>
                  )}
                </div>
                {inv.notes && (
                  <p className="text-sm text-base-content/70 mt-1">{inv.notes}</p>
                )}
                <code className="text-xs text-base-content/60 block mt-1 truncate">
                  {inv.token}
                </code>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/invite/${inv.token}`)}
                  className="btn btn-ghost btn-xs"
                >
                  Copy
                </button>
                <button
                  onClick={() => handleRevokeInvitation(inv.id)}
                  className="btn btn-error btn-xs"
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>
        ))}
        {tree.invitationLinks.filter(inv => !inv.isRevoked).length === 0 && (
          <p className="text-center text-base-content/60 py-4">No active invitation links</p>
        )}
      </div>
    </div>
  );
}

function UserLinksTab({ tree, onRefresh }) {
  const handleToggleVerified = async (linkId, currentlyVerified) => {
    try {
      const response = await authFetch(`/api/admin/trees/${tree.id}/links`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId, verified: !currentlyVerified }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveLink = async (linkId, username) => {
    if (!confirm(`Remove link for ${username}?`)) return;
    try {
      const response = await authFetch(`/api/admin/trees/${tree.id}/links?linkId=${linkId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-base-content">👤 User-Individual Links</h3>
      <p className="text-sm text-base-content/60">
        Users who have claimed to be specific individuals in this tree
      </p>

      <div className="space-y-2">
        {tree.userIndividualLinks.map((link) => (
          <div key={link.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-semibold">
                {link.user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-base-content">{link.user.username}</span>
                  <span className="text-base-content/60">→</span>
                  <code className="text-sm bg-base-200 px-1 rounded">{link.individualXref}</code>
                  {link.verified ? (
                    <span className="badge badge-sm badge-success">✓ Verified</span>
                  ) : (
                    <span className="badge badge-sm badge-warning">Unverified</span>
                  )}
                </div>
                <span className="text-sm text-base-content/60">{link.user.email}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleVerified(link.id, link.verified)}
                className={`btn btn-xs ${link.verified ? 'btn-warning' : 'btn-success'}`}
              >
                {link.verified ? 'Unverify' : 'Verify'}
              </button>
              <button
                onClick={() => handleRemoveLink(link.id, link.user.username)}
                className="btn btn-error btn-xs"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {tree.userIndividualLinks.length === 0 && (
          <p className="text-center text-base-content/60 py-4">No user-individual links</p>
        )}
      </div>
    </div>
  );
}

// Main component
export default function AdminTreeDetailPage() {
  const params = useParams();
  const { isReady, isSuperuser } = useRequireAuth({
    requireSuperuser: true,
    superuserRedirectTo: '/dashboard',
  });
  
  const [tree, setTree] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('owners');

  const fetchTree = useCallback(async () => {
    try {
      const response = await authFetch(`/api/admin/trees/${params.id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTree(data.tree);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await authFetch('/api/admin/users?limit=1000');
      const data = await response.json();
      if (response.ok) {
        setAllUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  useEffect(() => {
    if (!isReady || !isSuperuser) return;
    fetchTree();
    fetchUsers();
  }, [isReady, isSuperuser, fetchTree, fetchUsers]);

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

  if (error || !tree) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-error">{error || 'Tree not found'}</p>
          <Link href="/admin/trees" className="link link-primary hover:underline mt-4 inline-block">
            ← Back to Trees
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'owners', label: '👑 Owners', count: tree.owners.length },
    { id: 'maintainers', label: '🛠️ Maintainers', count: tree.treeMaintainers.length },
    { id: 'permissions', label: '🔑 Permissions', count: tree.permissions.length },
    { id: 'invitations', label: '🔗 Invitations', count: tree.invitationLinks.filter(i => !i.isRevoked).length },
    { id: 'links', label: '👤 User Links', count: tree.userIndividualLinks.length },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/admin/trees" className="text-sm link link-primary hover:underline mb-2 inline-block">
              ← Back to Trees
            </Link>
            <h1 className="text-2xl font-bold text-base-content">{tree.name}</h1>
            <p className="text-sm text-base-content/60 mt-1">
              File ID: <code className="bg-base-200 px-1 rounded">{tree.fileId}</code>
              <span className="mx-2">•</span>
              <span className={tree.isPublic ? 'text-success' : 'text-error'}>
                {tree.isPublic ? '🌍 Public' : '🔒 Private'}
              </span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-base-content/10 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 badge badge-sm ${activeTab === tab.id ? 'bg-white/20 text-primary-content' : 'badge-ghost'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-base-100 rounded-lg border border-base-content/10 p-6">
          {activeTab === 'owners' && <OwnersTab tree={tree} onRefresh={fetchTree} allUsers={allUsers} />}
          {activeTab === 'maintainers' && <MaintainersTab tree={tree} onRefresh={fetchTree} allUsers={allUsers} />}
          {activeTab === 'permissions' && <PermissionsTab tree={tree} onRefresh={fetchTree} allUsers={allUsers} />}
          {activeTab === 'invitations' && <InvitationsTab tree={tree} onRefresh={fetchTree} />}
          {activeTab === 'links' && <UserLinksTab tree={tree} onRefresh={fetchTree} />}
        </div>

        {/* Pending Requests */}
        {tree.accessRequests.length > 0 && (
          <div className="bg-warning/10 rounded-lg border border-warning/30 p-4">
            <h3 className="text-lg font-semibold text-base-content mb-3">
              ⏳ Pending Access Requests ({tree.accessRequests.length})
            </h3>
            <div className="space-y-2">
              {tree.accessRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-white dark:bg-base-100 rounded">
                  <div>
                    <span className="font-medium">{req.user.username}</span>
                    <span className="text-base-content/60"> • {req.requestType}</span>
                  </div>
                  <Link
                    href="/admin/requests"
                    className="text-sm link link-primary hover:underline"
                  >
                    Review →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

