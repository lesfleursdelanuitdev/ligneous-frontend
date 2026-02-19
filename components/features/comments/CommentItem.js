'use client';

import { useState } from 'react';
import CommentForm from './CommentForm';

/**
 * Single comment (or reply) with author, content, actions, and nested replies.
 * @param {Object} props
 * @param {Object} props.comment - Comment object { id, content, user, createdAt, isEdited, isResolved, isPinned, replies?, ... }
 * @param {boolean} [props.isReply] - If true, render with reply styling (indent)
 * @param {function} props.onEdit - (id, content) => Promise
 * @param {function} props.onDelete - (id) => Promise
 * @param {function} props.onResolve - (id, resolved) => Promise
 * @param {function} props.onReply - (parentId, content) => Promise
 * @param {boolean} [props.canEdit] - Show edit/delete
 * @param {boolean} [props.canModerate] - Show resolve/pin
 */
export default function CommentItem({
  comment,
  isReply = false,
  onEdit,
  onDelete,
  onResolve,
  onReply,
  canEdit = false,
  canModerate = false,
}) {
  const [editing, setEditing] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const author = comment.user?.name || comment.user?.username || 'Unknown';
  const date = comment.createdAt
    ? new Date(comment.createdAt).toLocaleDateString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '';

  const handleEditSubmit = async (content) => {
    await onEdit(comment.id, content);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;
    setDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setDeleting(false);
    }
  };

  const handleReplySubmit = async (content) => {
    await onReply(comment.id, content);
    setShowReplyForm(false);
  };

  const replies = comment.replies || [];

  return (
    <div
      className={`${isReply ? 'ml-6 mt-2 pl-3 border-l-2 border-base-content/10' : ''}`}
      data-comment-id={comment.id}
    >
      <div className="py-2">
        <div className="flex items-center gap-2 text-sm text-base-content/60">
          <span className="font-medium text-base-content">{author}</span>
          <span>{date}</span>
          {comment.isEdited && <span>(edited)</span>}
          {comment.isResolved && <span className="text-success">Resolved</span>}
          {comment.isPinned && <span className="text-warning">Pinned</span>}
        </div>
        {editing ? (
          <CommentForm
            initialContent={comment.content}
            commentId={comment.id}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <p className="mt-1 text-base-content whitespace-pre-wrap">{comment.content}</p>
        )}
        {!editing && (
          <div className="mt-2 flex flex-wrap gap-2">
            {canEdit && (
              <>
                <button type="button" onClick={() => setEditing(true)} className="link link-primary text-sm">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="link text-sm text-error hover:underline disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
            {canModerate && (
              <button type="button" onClick={() => onResolve(comment.id, !comment.isResolved)} className="link link-hover text-sm text-base-content/70">
                {comment.isResolved ? 'Unresolve' : 'Resolve'}
              </button>
            )}
            {onReply && !isReply && (
              <button type="button" onClick={() => setShowReplyForm((v) => !v)} className="link link-primary text-sm">
                {showReplyForm ? 'Cancel' : 'Reply'}
              </button>
            )}
          </div>
        )}
      </div>

      {showReplyForm && onReply && (
        <div className="mt-2">
          <CommentForm
            parentId={comment.id}
            onSubmit={(content) => handleReplySubmit(content)}
            onSuccess={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="mt-2 space-y-1">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply
              onEdit={onEdit}
              onDelete={onDelete}
              onResolve={onResolve}
              onReply={onReply}
              canEdit={canEdit}
              canModerate={canModerate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
