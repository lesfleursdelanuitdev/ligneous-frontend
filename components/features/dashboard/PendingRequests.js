'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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

function RequestCard({ request, onAction, actionLoading }) {
  const [responseNotes, setResponseNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAction = (action) => {
    onAction(request.id, action, responseNotes);
    setShowNotesInput(false);
    setResponseNotes('');
  };

  return (
    <div className="p-4 bg-base-100 rounded-box border border-base-content/10 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-base-200 flex items-center justify-center text-xl">
          {REQUEST_TYPE_ICONS[request.requestType] || '📋'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-base-content">{request.user.username}</span>
            <span className="text-base-content/50">•</span>
            <span className="text-sm text-base-content/60">{request.user.email}</span>
          </div>
          
          <div className="mt-1 text-sm text-base-content/70">
            Requesting <span className="font-medium">{REQUEST_TYPE_LABELS[request.requestType]}</span> for{' '}
            <Link href={`/trees/${request.tree.id}`} className="link link-primary">
              {request.tree.name}
            </Link>
          </div>

          {request.notes && (
            <div className="mt-2 p-2 bg-base-200 rounded-lg text-sm text-base-content/70 italic">
              "{request.notes}"
            </div>
          )}

          <div className="mt-2 text-xs text-base-content/50">
            Requested {formatDate(request.requestedAt)}
          </div>

          {showNotesInput && (
            <div className="mt-3">
              <textarea
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder="Add a note (optional)..."
                className="textarea textarea-bordered w-full text-sm min-h-20 resize-none"
              />
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {!showNotesInput ? (
              <>
                <button type="button" onClick={() => handleAction('approve')} disabled={actionLoading} className="btn btn-success btn-sm">
                  ✓ Approve
                </button>
                <button type="button" onClick={() => handleAction('reject')} disabled={actionLoading} className="btn btn-error btn-sm">
                  ✕ Reject
                </button>
                <button type="button" onClick={() => setShowNotesInput(true)} className="btn btn-ghost btn-sm">
                  + Add Note
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => handleAction('approve')} disabled={actionLoading} className="btn btn-success btn-sm">
                  ✓ Approve with Note
                </button>
                <button type="button" onClick={() => handleAction('reject')} disabled={actionLoading} className="btn btn-error btn-sm">
                  ✕ Reject with Note
                </button>
                <button type="button" onClick={() => { setShowNotesInput(false); setResponseNotes(''); }} className="btn btn-ghost btn-sm">
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PendingRequests({ maxItems = 5, showViewAll = true }) {
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch(`/api/admin/requests?status=pending&limit=${maxItems}`);
      
      if (response.status === 403) {
        // Not a superuser - hide this component
        setRequests([]);
        setCounts({ pending: 0, approved: 0, rejected: 0 });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch requests');
      }

      setRequests(data.requests);
      setCounts(data.counts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (requestId, action, responseNotes) => {
    setActionLoading(true);
    try {
      const response = await authFetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, responseNotes }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      // Refresh requests
      fetchRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Don't render if not authorized or no pending requests
  if (!loading && requests.length === 0 && counts.pending === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="rounded-box border border-warning/30 bg-warning/5 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-warning/20 bg-warning/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="text-2xl">📬</span>
              {counts.pending > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-error text-error-content text-xs rounded-full flex items-center justify-center font-bold">
                  {counts.pending > 9 ? '9+' : counts.pending}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-base-content">Pending Requests</h2>
              <p className="text-sm text-base-content/60">{counts.pending} awaiting your review</p>
            </div>
          </div>
          {showViewAll && counts.pending > maxItems && (
            <Link href="/admin/requests" className="link link-primary text-sm">
              View All ({counts.pending}) →
            </Link>
          )}
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <span className="loading loading-spinner text-primary loading-md" />
              <p className="mt-2 text-sm text-base-content/60">Loading requests...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-error">{error}</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🎉</span>
              <p className="mt-2 text-base-content/60">All caught up! No pending requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onAction={handleAction}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </div>

        {!loading && (counts.approved > 0 || counts.rejected > 0) && (
          <div className="flex items-center justify-center gap-6 p-3 border-t border-warning/20 bg-warning/5 text-sm">
            <span className="text-success">✓ {counts.approved} approved</span>
            <span className="text-error">✕ {counts.rejected} rejected</span>
          </div>
        )}
      </div>
    </section>
  );
}

