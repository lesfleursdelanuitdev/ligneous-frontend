'use client';

import Link from 'next/link';
import BaseCard from './BaseCard';
import { Badge } from '../ui/badges';
import Avatar from '../ui/avatars/Avatar';

/**
 * RequestCard Component
 * Card for displaying access requests
 * 
 * @param {Object} props
 * @param {Object} props.request - Access request object
 * @param {Function} props.onApprove - Approve handler
 * @param {Function} props.onReject - Reject handler
 * @param {boolean} props.actionLoading - Loading state for actions
 * @param {string} props.className - Additional CSS classes
 */
export default function RequestCard({ 
  request, 
  onApprove,
  onReject,
  actionLoading = false,
  className = '' 
}) {
  const {
    id,
    requestType,
    status,
    notes,
    responseNotes,
    requestedAt,
    respondedAt,
    user,
    tree,
    responder,
  } = request;

  const requestTypeLabels = {
    basic_access: 'Access Request',
    individual_link: 'Identity Claim',
    maintainer_role: 'Maintainer Request',
    owner_role: 'Ownership Request',
  };

  const requestTypeColors = {
    basic_access: 'info',
    individual_link: 'accent',
    maintainer_role: 'warning',
    owner_role: 'accent',
  };

  const statusColors = {
    pending: 'default',
    approved: 'success',
    rejected: 'error',
    cancelled: 'default',
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <BaseCard
      hoverable={status === 'pending'}
      className={className}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {user && (
              <Avatar
                src={user.profilePhotoUrl}
                name={user.name || user.username}
                size="md"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={requestTypeColors[requestType] || 'default'} size="sm">
                {requestTypeLabels[requestType] || requestType}
              </Badge>
              <Badge variant={statusColors[status] || 'default'} size="sm">
                {status}
              </Badge>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-base-content">{user.name || user.username}</span>
                {user.email && <span className="text-sm text-base-content/60">{user.email}</span>}
              </div>
            )}
            {tree && (
              <div className="text-sm text-base-content/70 mt-1">
                For <Link href={`/trees/${tree.id}`} className="link link-primary font-medium">{tree.name}</Link>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="p-3 bg-base-200 rounded-lg">
            <p className="text-sm text-base-content/80 italic">&ldquo;{notes}&rdquo;</p>
          </div>
        )}

        {responseNotes && (
          <div className="p-3 bg-info/10 rounded-lg border border-info/30">
            <p className="text-xs font-medium text-info mb-1">Response:</p>
            <p className="text-sm text-base-content/80">{responseNotes}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-base-content/10">
          <div className="text-xs text-base-content/60">
            Requested {formatDate(requestedAt)}
            {respondedAt && (
              <span className="ml-2">
                • Responded {formatDate(respondedAt)}
              </span>
            )}
            {responder && (
              <span className="ml-2">
                by {responder.name || responder.username}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {status === 'pending' && (onApprove || onReject) && (
          <div className="flex gap-2 pt-2">
            {onApprove && (
              <button
                type="button"
                onClick={() => onApprove(request)}
                disabled={actionLoading}
                className="btn btn-success btn-sm flex-1"
              >
                ✓ Approve
              </button>
            )}
            {onReject && (
              <button
                type="button"
                onClick={() => onReject(request)}
                disabled={actionLoading}
                className="btn btn-error btn-sm flex-1"
              >
                ✕ Reject
              </button>
            )}
          </div>
        )}
      </div>
    </BaseCard>
  );
}

