'use client';

import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import LoadingState from '@/components/shared/feedback/LoadingState';
import EmptyState from '@/components/shared/feedback/EmptyState';
import { useAuthState } from '@/hooks/useAuthState';
import { useComments } from '@/hooks/queries/useComments';
import {
  useCreateEntityComment,
  useUpdateEntityComment,
  useDeleteEntityComment,
  useResolveEntityComment,
} from '@/hooks/mutations/useEntityCommentMutations';

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
  const { user } = useAuthState();

  const { data: comments = [], isLoading, error } = useComments(entityType, entityId, treeId);

  const createComment = useCreateEntityComment(entityType, entityId, treeId);
  const updateComment = useUpdateEntityComment(entityType, entityId);
  const deleteComment = useDeleteEntityComment(entityType, entityId);
  const resolveComment = useResolveEntityComment(entityType, entityId);

  const handleCreate = (content) => createComment.mutate({ content });
  const handleReply = (parentId, content) => createComment.mutate({ content, parentId });
  const handleEdit = (id, content) => updateComment.mutate({ commentId: id, content });
  const handleDelete = (id) => deleteComment.mutate({ commentId: id });
  const handleResolve = (id, resolved) => resolveComment.mutate({ commentId: id, resolved });

  if (isLoading && comments.length === 0) {
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
        <p className="text-sm text-error mb-3" role="alert">{error.message}</p>
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
