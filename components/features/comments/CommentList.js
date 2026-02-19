'use client';

import { useEffect, useState } from 'react';
import { useFacet, useListener } from 'mycelia-kernel-plugin/react';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import LoadingState from '@/components/shared/feedback/LoadingState';
import EmptyState from '@/components/shared/feedback/EmptyState';
import { useAuthState } from '@/hooks/useAuthState';

/**
 * Lists comments for an entity and provides a form to add a new comment.
 * @param {Object} props
 * @param {string} props.entityType - e.g. 'individual', 'family', 'event', 'media'
 * @param {string} props.entityId - Entity identifier
 * @param {string} props.treeId - Tree UUID
 * @param {boolean} [props.canModerate] - Whether current user can moderate (pin, hide, resolve)
 * @param {string} [props.className] - Optional wrapper class
 */
export default function CommentList({
  entityType,
  entityId,
  treeId,
  canModerate = false,
  className = '',
}) {
  const commentsFacet = useFacet('comments');
  const { user } = useAuthState();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadComments = () => {
    if (!entityType || !entityId || !treeId) return;
    setLoading(true);
    setError(null);
    commentsFacet
      .getComments(entityType, entityId, treeId)
      .then((list) => {
        setComments(list);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadComments();
  }, [entityType, entityId, treeId]);

  useListener('comments:stateChanged', (event) => {
    if (
      event.body?.entityContext?.entityType === entityType &&
      event.body?.entityContext?.entityId === entityId &&
      event.body?.entityContext?.treeId === treeId
    ) {
      setComments(event.body.comments || []);
      setLoading(!!event.body.loading);
      setError(event.body.error || null);
    }
  });

  const handleCreate = (content) =>
    commentsFacet.createComment({ entityType, entityId, treeId, content });

  const handleReply = (parentId, content) =>
    commentsFacet.createComment({ entityType, entityId, treeId, content, parentId });

  const handleEdit = (id, content) => commentsFacet.updateComment(id, { content });
  const handleDelete = (id) => commentsFacet.deleteComment(id);
  const handleResolve = (id, resolved) => commentsFacet.resolveComment(id, resolved);

  if (loading && comments.length === 0) {
    return (
      <div className={className}>
        <h3 className="text-lg font-medium text-base-content mb-3">Comments</h3>
        <LoadingState message="Loading comments..." size="sm" />
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-medium text-base-content mb-3">
        Comments
        {comments.length > 0 && (
          <span className="ml-2 text-sm font-normal text-base-content/60">({comments.length})</span>
        )}
      </h3>

      {error && (
        <p className="text-sm text-error mb-3" role="alert">{error}</p>
      )}

      {user && (
        <div className="mb-4">
          <CommentForm onSubmit={handleCreate} />
        </div>
      )}

      {!user && comments.length === 0 && (
        <EmptyState
          title="No comments yet"
          message="Sign in to leave a comment."
        />
      )}

      {comments.length === 0 && user && (
        <EmptyState
          title="No comments yet"
          message="Be the first to comment."
        />
      )}

      {comments.length > 0 && (
        <ul className="space-y-3 list-none pl-0">
          {comments.map((comment) => (
            <li key={comment.id}>
              <CommentItem
                comment={comment}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onResolve={handleResolve}
                onReply={handleReply}
                canEdit={user?.id === comment.userId}
                canModerate={canModerate}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
