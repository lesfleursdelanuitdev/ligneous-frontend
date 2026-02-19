'use client';

import { useState } from 'react';

/**
 * Form to create a new comment or reply, or to edit existing comment content.
 * @param {Object} props
 * @param {string} props.entityType - e.g. 'individual', 'family', 'event', 'media'
 * @param {string} props.entityId - Entity identifier
 * @param {string} props.treeId - Tree UUID
 * @param {string} [props.parentId] - For replies, parent comment ID
 * @param {string} [props.initialContent] - For edit mode, current content
 * @param {string} [props.commentId] - For edit mode, comment ID to update
 * @param {function} [props.onSuccess] - Called after successful submit
 * @param {function} [props.onCancel] - For edit mode, cancel callback
 * @param {function} [props.onSubmit] - Optional override: (content) => Promise
 */
export default function CommentForm({
  entityType,
  entityId,
  treeId,
  parentId,
  initialContent = '',
  commentId,
  onSuccess,
  onCancel,
  onSubmit,
}) {
  const [content, setContent] = useState(initialContent);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isEdit = Boolean(commentId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Please enter a comment.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(trimmed);
      } else {
        // Consumer must pass useFacet('comments') and pass onSubmit, or we could useFacet here
        throw new Error('CommentForm requires onSubmit or comments facet');
      }
      setContent('');
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={isEdit ? 'Edit your comment...' : parentId ? 'Write a reply...' : 'Write a comment...'}
        rows={isEdit ? 2 : 3}
        className="textarea textarea-bordered w-full text-base-content"
        disabled={submitting}
      />
      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="btn btn-primary btn-sm"
        >
          {submitting ? 'Saving...' : isEdit ? 'Save' : parentId ? 'Reply' : 'Comment'}
        </button>
        {isEdit && onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
