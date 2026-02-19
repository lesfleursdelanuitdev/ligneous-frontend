'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { authFetch } from '@/lib/api';

const REQUEST_TYPE_LABELS = {
  basic_access: 'Access Request',
  individual_link: 'Identity Claim',
  maintainer_role: 'Maintainer Request',
  owner_role: 'Ownership Request',
};

const REQUEST_TYPE_ICONS = {
  basic_access: '🔑',
  individual_link: '👤',
  maintainer_role: '🛠️',
  owner_role: '👑',
};

const STATUS_STYLES = {
  pending: 'badge badge-warning',
  approved: 'badge badge-success',
  rejected: 'badge badge-error',
  cancelled: 'badge badge-ghost',
};

export default function AdminRequestsPage() {
  const { isReady, isSuperuser } = useRequireAuth({
    requireSuperuser: true,
    superuserRedirectTo: '/dashboard',
  });
  
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [responseNotes, setResponseNotes] = useState({});

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
      });
      if (typeFilter) params.set('type', typeFilter);

      const response = await authFetch(`/api/admin/requests?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch requests');
      }

      setRequests(data.requests);
      setCounts(data.counts);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, typeFilter]);

  useEffect(() => {
    if (!isReady || !isSuperuser) return;
    fetchRequests();
  }, [isReady, isSuperuser, fetchRequests]);

  const handleAction = async (requestId, action) => {
    setActionLoading(true);
    try {
      const response = await authFetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          responseNotes: responseNotes[requestId] || '' 
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      // Clear notes for this request
      setResponseNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[requestId];
        return newNotes;
      });

      // Refresh requests
      fetchRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
            <h1 className="text-2xl font-bold text-base-content">📋 Access Requests</h1>
            <p className="text-base-content/60 text-sm mt-1">
              Review and manage all access requests
            </p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {['pending', 'approved', 'rejected', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-ghost'}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && counts[status] > 0 && (
                <span className={`ml-2 badge badge-sm ${
                  statusFilter === status ? 'bg-white/20 text-primary-content' : 'badge-ghost'
                }`}>
                  {counts[status]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-base-100 rounded-lg p-4 border border-base-content/10">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="input"
          >
            <option value="">All Request Types</option>
            <option value="basic_access">Access Requests</option>
            <option value="individual_link">Identity Claims</option>
            <option value="maintainer_role">Maintainer Requests</option>
            <option value="owner_role">Ownership Requests</option>
          </select>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-base-100 rounded-lg p-8 border border-base-content/10 text-center">
              <span className="loading loading-spinner text-primary loading-md" />
              <p className="mt-2 text-base-content/60">Loading requests...</p>
            </div>
          ) : error ? (
            <div className="bg-base-100 rounded-lg p-8 border border-base-content/10 text-center text-error">
              {error}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-base-100 rounded-lg p-8 border border-base-content/10 text-center">
              <span className="text-4xl">📭</span>
              <p className="mt-2 text-base-content/60">No requests found</p>
            </div>
          ) : (
            requests.map((request) => (
              <div 
                key={request.id} 
                className="bg-base-100 rounded-lg border border-base-content/10 p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-base-200 flex items-center justify-center text-2xl">
                    {REQUEST_TYPE_ICONS[request.requestType] || '📋'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-semibold text-base-content">
                        {request.user.username}
                      </span>
                      <span className="text-base-content/60">({request.user.email})</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[request.status]}`}>
                        {request.status}
                      </span>
                    </div>

                    <p className="text-base-content/70">
                      {REQUEST_TYPE_LABELS[request.requestType]} for{' '}
                      <Link href={`/trees/${request.tree.id}`} className="link link-primary">
                        {request.tree.name}
                      </Link>
                    </p>

                    {request.notes && (
                      <div className="mt-2 p-2 bg-base-200 rounded text-sm text-base-content/70 italic">
                        "{request.notes}"
                      </div>
                    )}

                    <div className="mt-2 text-xs text-base-content/60 flex flex-wrap gap-4">
                      <span>Requested: {formatDate(request.requestedAt)}</span>
                      {request.respondedAt && (
                        <span>Responded: {formatDate(request.respondedAt)} by {request.responder?.username}</span>
                      )}
                    </div>

                    {request.responseNotes && (
                      <div className="mt-2 p-2 bg-info/10 rounded text-sm text-base-content/80">
                        Response: "{request.responseNotes}"
                      </div>
                    )}

                    {/* Actions for pending requests */}
                    {request.status === 'pending' && (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={responseNotes[request.id] || ''}
                          onChange={(e) => setResponseNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                          placeholder="Add a response note (optional)..."
                          className="input w-full text-sm h-16 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAction(request.id, 'approve')}
                            disabled={actionLoading}
                            className="btn btn-success btn-sm"
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(request.id, 'reject')}
                            disabled={actionLoading}
                            className="btn btn-error btn-sm"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-base-100 rounded-lg p-4 border border-base-content/10">
            <div className="text-sm text-base-content/60">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
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

