'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer } from '@/components/shared/data-display';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAdminRequests } from '@/hooks/queries/useAdminData';
import { useAdminHandleRequest } from '@/hooks/mutations/useAdminMutations';

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

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminRequestsPage() {
  const { isReady, isSuperuser } = useRequireAuth({
    requireSuperuser: true,
    superuserRedirectTo: '/dashboard',
  });

  const queryClient = useQueryClient();
  const [queryParams, setQueryParams] = useState({});
  const { data, isLoading: loading, error: queryError, refetch } = useAdminRequests(queryParams);
  const items = data?.requests || [];
  const totalItems = data?.pagination?.total ?? 0;
  const counts = data?.counts || { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
  const error = queryError?.message || null;
  const [responseNotes, setResponseNotes] = useState({});
  const handleRequestMut = useAdminHandleRequest();
  const actionLoading = handleRequestMut.isPending;

  const handleAction = (requestId, action, notes = '') => {
    handleRequestMut.mutate(
      { requestId, action, responseNotes: notes || responseNotes[requestId] || '' },
      {
        onSuccess: () => {
          setResponseNotes((prev) => {
            const next = { ...prev };
            delete next[requestId];
            return next;
          });
        },
        onError: (err) => alert(err.message),
      }
    );
  };

  if (!isReady) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isSuperuser) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-base-content">Access Requests</h1>
            <p className="text-base-content/60 text-sm mt-1">Review and manage all access requests</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-base-content/60">
            <span>Pending: <strong className="text-warning">{counts.pending}</strong></span>
            <span>Approved: <strong className="text-success">{counts.approved}</strong></span>
            <span>Rejected: <strong className="text-error">{counts.rejected}</strong></span>
          </div>
        </div>

        <DataViewContainer
          items={items}
          loading={loading}
          error={error ? { message: error, onRetry: () => refetch() } : null}
          emptyState={{ title: 'No requests found', message: 'Try adjusting your filters.' }}
          defaultView="card"
          renderCard={(request) => (
            <BaseCard>
              <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-base-200 flex items-center justify-center text-2xl">
                  {REQUEST_TYPE_ICONS[request.requestType] || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-base-content">{request.user?.username}</span>
                    <span className="text-base-content/60 text-sm">({request.user?.email})</span>
                    <span className={`badge badge-sm ${STATUS_STYLES[request.status]}`}>{request.status}</span>
                  </div>
                  <p className="text-base-content/70 text-sm">
                    {REQUEST_TYPE_LABELS[request.requestType]} for{' '}
                    <Link href={`/trees/${request.tree?.id}`} className="link link-primary">
                      {request.tree?.name}
                    </Link>
                  </p>
                  {request.notes && (
                    <div className="mt-2 p-2 bg-base-200 rounded text-sm text-base-content/70 italic">
                      &quot;{request.notes}&quot;
                    </div>
                  )}
                  <div className="mt-2 text-xs text-base-content/60">
                    Requested: {formatDate(request.requestedAt)}
                    {request.respondedAt && (
                      <> · Responded: {formatDate(request.respondedAt)} by {request.responder?.username}</>
                    )}
                  </div>
                  {request.responseNotes && (
                    <div className="mt-2 p-2 bg-info/10 rounded text-sm text-base-content/80">
                      Response: &quot;{request.responseNotes}&quot;
                    </div>
                  )}
                  {request.status === 'pending' && (
                    <div className="mt-4 space-y-2">
                      <textarea
                        value={responseNotes[request.id] || ''}
                        onChange={(e) => setResponseNotes((prev) => ({ ...prev, [request.id]: e.target.value }))}
                        placeholder="Add a response note (optional)..."
                        className="input input-sm w-full resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAction(request.id, 'approve')}
                          disabled={actionLoading}
                          className="btn btn-success btn-sm"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(request.id, 'reject')}
                          disabled={actionLoading}
                          className="btn btn-error btn-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </BaseCard>
          )}
          renderRow={(request) => (
            <>
              <td className="px-4 py-3">
                <div className="min-w-0">
                  <span className="font-medium text-base-content">{request.user?.username}</span>
                  <div className="text-sm text-base-content/60">{request.user?.email}</div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Link href={`/trees/${request.tree?.id}`} className="link link-primary text-sm">
                  {request.tree?.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-base-content/70">
                {REQUEST_TYPE_LABELS[request.requestType]}
              </td>
              <td className="px-4 py-3">
                <span className={`badge badge-sm ${STATUS_STYLES[request.status]}`}>{request.status}</span>
              </td>
              <td className="px-4 py-3 text-sm text-base-content/60">{formatDate(request.requestedAt)}</td>
            </>
          )}
          listHeaders={[
            { label: 'User', key: 'user', sortable: false },
            { label: 'Tree', key: 'tree', sortable: false },
            { label: 'Type', key: 'type', sortable: false },
            { label: 'Status', key: 'status', sortable: false },
            { label: 'Requested', key: 'requestedAt', sortable: false },
          ]}
          searchPlaceholder="Search requests..."
          searchLabel="User or tree"
          defaultFilterValues={{ status: 'pending' }}
          filters={[
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'all', label: 'All' },
              ],
            },
            {
              key: 'type',
              label: 'Type',
              type: 'select',
              options: [
                { value: '', label: 'All types' },
                { value: 'basic_access', label: 'Access Request' },
                { value: 'individual_link', label: 'Identity Claim' },
                { value: 'maintainer_role', label: 'Maintainer Request' },
                { value: 'owner_role', label: 'Ownership Request' },
              ],
            },
          ]}
          totalItems={totalItems}
          defaultPerPage={20}
          actions={[
            { key: 'view', label: 'View Tree', href: (req) => `/trees/${req.tree?.id}` },
          ]}
          onParamsChange={setQueryParams}
        />
      </div>
    </DashboardLayout>
  );
}
