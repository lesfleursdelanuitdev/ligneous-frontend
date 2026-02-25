'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { Badge } from '@/components/shared/ui/badges';
import Avatar from '@/components/shared/ui/avatars/Avatar';
import { authFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useThreadDetail, useThreadPosts } from '@/hooks/queries/useThreadDetail';
import { useCreatePost } from '@/hooks/mutations/useThreadMutations';
import { ChevronDown, Heart, MessageCircle, Send } from 'lucide-react';
import RichTextEditor from '@/components/shared/RichTextEditor';

function TopicPost({ post, treeId, threadId, expanded, onToggle, onCommentAdded, onPostLikeToggled }) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [likedByMe, setLikedByMe] = useState(!!post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await authFetch(
        `/api/trees/${treeId}/research/most-wanted/${threadId}/posts/${post.id}/comments`
      );
      if (!res.ok) throw new Error('Failed to load comments');
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error(err);
      setComments([]);
    } finally {
      setLoadingComments(false);
      setCommentsLoaded(true);
    }
  }, [treeId, threadId, post.id]);

  useEffect(() => {
    if (expanded && !commentsLoaded && !loadingComments) {
      loadComments();
    }
  }, [expanded, commentsLoaded, loadingComments, loadComments]);

  useEffect(() => {
    setLikedByMe(!!post.likedByMe);
    setLikeCount(post.likeCount ?? 0);
  }, [post.likedByMe, post.likeCount]);

  const handlePostLikeToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const url = `/api/trees/${treeId}/research/most-wanted/${threadId}/posts/${post.id}/like`;
      if (likedByMe) {
        const res = await authFetch(url, { method: 'DELETE' });
        if (res.ok) {
          const data = await res.json();
          setLikedByMe(false);
          setLikeCount(data.likeCount ?? likeCount - 1);
        }
      } else {
        const res = await authFetch(url, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setLikedByMe(true);
          setLikeCount(data.likeCount ?? likeCount + 1);
        }
      }
      onPostLikeToggled?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleCommentLikeToggle = async (commentId, currentlyLiked, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const base = `/api/trees/${treeId}/research/most-wanted/${threadId}/posts/${post.id}/comments/${commentId}/like`;
      if (currentlyLiked) {
        await authFetch(base, { method: 'DELETE' });
      } else {
        await authFetch(base, { method: 'POST' });
      }
      await loadComments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e, parentId = null) => {
    e.preventDefault();
    const raw = typeof replyContent === 'string' ? replyContent.trim() : '';
    const content = raw === '<p></p>' || !raw ? '' : raw;
    const isEmpty = !content || content.replace(/<[^>]*>/g, '').trim() === '';
    if (isEmpty || submitting) return;
    setSubmitting(true);
    try {
      const res = await authFetch(
        `/api/trees/${treeId}/research/most-wanted/${threadId}/posts/${post.id}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, parentId: parentId || undefined }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      setReplyContent('');
      setReplyingToId(null);
      await loadComments();
      onCommentAdded?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = (c, isReply = false) => (
    <div
      key={c.id}
      className={`rounded-lg border border-base-content/10 bg-base-200/50 p-3 ${isReply ? 'ml-6 mt-2' : 'mt-2'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        {c.user && (
          <>
            <Avatar
              name={c.user.name || c.user.username}
              size="sm"
            />
            <span className="text-sm font-medium text-base-content">
              {c.user.name || c.user.username}
            </span>
          </>
        )}
        <span className="text-xs text-base-content/50">
          {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
        </span>
      </div>
      <div
        className="text-sm text-base-content/80 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: c.content || '' }}
      />
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={(e) => handleCommentLikeToggle(c.id, c.likedByMe, e)}
          className="inline-flex items-center gap-1 btn btn-ghost btn-xs min-h-0 h-auto"
          title={c.likedByMe ? 'Unlike' : 'Like'}
        >
          <Heart size={14} className={c.likedByMe ? 'fill-error text-error' : ''} />
          <span>{c.likeCount ?? 0}</span>
        </button>
        <button
          type="button"
          onClick={() => { setReplyingToId(c.id); setReplyContent(''); }}
          className="btn btn-ghost btn-xs"
        >
          Reply
        </button>
      </div>
      {replyingToId === c.id && (
        <form onSubmit={(e) => handleAddComment(e, c.id)} className="mt-2 flex flex-col gap-2">
          <RichTextEditor
            value={replyContent}
            onChange={setReplyContent}
            placeholder="Write a reply..."
            minHeight="80px"
            className="flex-1"
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { setReplyingToId(null); setReplyContent(''); }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting || !(typeof replyContent === 'string' && replyContent.replace(/<[^>]*>/g, '').trim())}
            >
              <Send size={16} />
              Reply
            </button>
          </div>
        </form>
      )}
      {c.replies?.length > 0 && (
        <div className="mt-2 space-y-1">
          {c.replies.map((r) => renderComment(r, true))}
        </div>
      )}
    </div>
  );

  return (
    <BaseCard className="p-0 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 text-left flex items-center justify-between gap-2 hover:bg-base-200/50 transition-colors"
      >
          <div className="min-w-0 flex-1">
            <div
              className="font-medium text-base-content line-clamp-2 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />
          <div className="flex items-center gap-2 mt-1 text-xs text-base-content/60">
            {post.user && (
              <span>{post.user.name || post.user.username}</span>
            )}
            <span>·</span>
            <button
              type="button"
              onClick={handlePostLikeToggle}
              disabled={likeLoading}
              className="inline-flex items-center gap-1 btn btn-ghost btn-xs min-h-0 h-auto p-0"
              title={likedByMe ? 'Unlike' : 'Like'}
            >
              <Heart size={14} className={likedByMe ? 'fill-error text-error' : ''} />
              <span>{likeCount}</span>
            </button>
            <span>·</span>
            <span>{post.commentCount ?? 0} comment{(post.commentCount ?? 0) !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <span className={`inline-block shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDown />
        </span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-base-content/10">
          {loadingComments && !commentsLoaded ? (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner loading-sm" />
            </div>
          ) : commentsLoaded ? (
            <>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-base-content/60 py-2">No comments yet.</p>
                ) : (
                  comments.map((c) => renderComment(c))
                )}
              </div>
                {replyingToId === null && (
                  <form onSubmit={(e) => handleAddComment(e)} className="mt-4 flex flex-col gap-2">
                    <RichTextEditor
                      value={replyContent}
                      onChange={setReplyContent}
                      placeholder="Add a comment..."
                      minHeight="80px"
                      className="flex-1"
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm self-start"
                      disabled={submitting || !(typeof replyContent === 'string' && replyContent.replace(/<[^>]*>/g, '').trim())}
                    >
                      <Send size={16} />
                      Add comment
                    </button>
                  </form>
                )}
            </>
          ) : null}
        </div>
      )}
    </BaseCard>
  );
}

export default function MostWantedThreadPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const treeId = params?.treeId;
  const threadId = params?.threadId;

  const { data: threadData, isLoading: threadLoading, error: threadError } = useThreadDetail(treeId, threadId);
  const { data: postsData, isLoading: postsLoading } = useThreadPosts(treeId, threadId);

  const thread = threadData?.thread || null;
  const posts = postsData?.posts || [];
  const loading = threadLoading || postsLoading;
  const error = threadError?.message || null;

  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopicContent, setNewTopicContent] = useState('');
  const [expandedPostId, setExpandedPostId] = useState(null);

  const invalidatePosts = () => queryClient.invalidateQueries({ queryKey: queryKeys.threads.posts(treeId, threadId) });
  const createPost = useCreatePost(treeId, threadId);

  const handleNewTopic = (e) => {
    e.preventDefault();
    const raw = typeof newTopicContent === 'string' ? newTopicContent.trim() : '';
    const content = raw === '<p></p>' || !raw ? '' : raw;
    const isEmpty = !content || content.replace(/<[^>]*>/g, '').trim() === '';
    if (isEmpty || createPost.isPending) return;
    createPost.mutate({ content }, {
      onSuccess: () => {
        setNewTopicContent('');
        setShowNewTopic(false);
      },
    });
  };

  if (!treeId || !threadId) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Thread" maxWidth="4xl">
        <p className="text-base-content/60">Missing tree or thread.</p>
      </DashboardMainContentLayout>
    );
  }

  if (loading && !thread) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Loading..." maxWidth="4xl">
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </DashboardMainContentLayout>
    );
  }

  if (error && !thread) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Error" maxWidth="4xl">
        <div className="alert alert-error">{error}</div>
        <Link href={`/trees/${treeId}/research/most-wanted`} className="btn btn-ghost btn-sm mt-2">
          Back to Most wanted
        </Link>
      </DashboardMainContentLayout>
    );
  }

  return (
    <DashboardMainContentLayout
      treeId={treeId}
      title={thread?.title ?? 'Thread'}
      subtitle={thread?.description ? thread.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : ''}
      maxWidth="4xl"
      breadcrumbs={[
        { label: 'Tree overview', href: `/trees/${treeId}` },
        { label: 'Brick wall', href: `/trees/${treeId}/research/most-wanted` },
        { label: thread?.title ?? 'Topic' },
      ]}
      actions={
        thread?.isClosed ? (
          <Badge variant="default" size="sm" className="self-center">
            Resolved
          </Badge>
        ) : null
      }
    >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Topic discussions</h2>
          <button
            type="button"
            onClick={() => setShowNewTopic(true)}
            className="btn btn-primary btn-sm gap-1"
          >
            <MessageCircle />
            New topic
          </button>
        </div>

        {showNewTopic && (
          <BaseCard className="p-4">
            <form onSubmit={handleNewTopic}>
              <RichTextEditor
                value={newTopicContent}
                onChange={setNewTopicContent}
                placeholder="e.g. Possible link to Madeira"
                minHeight="100px"
                className="mb-3"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setShowNewTopic(false); setNewTopicContent(''); }}
                  disabled={createPost.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={createPost.isPending || !(typeof newTopicContent === 'string' && newTopicContent.replace(/<[^>]*>/g, '').trim())}
                >
                  {createPost.isPending ? 'Adding…' : 'Add topic'}
                </button>
              </div>
            </form>
          </BaseCard>
        )}

        {posts.length === 0 && !showNewTopic ? (
          <BaseCard>
            <p className="text-center py-8 text-base-content/60">
              No topic discussions yet. Add one to start the conversation.
            </p>
          </BaseCard>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <TopicPost
                  post={post}
                  treeId={treeId}
                  threadId={threadId}
                  expanded={expandedPostId === post.id}
                  onToggle={() => setExpandedPostId((id) => (id === post.id ? null : post.id))}
                  onCommentAdded={invalidatePosts}
                  onPostLikeToggled={invalidatePosts}
                />
              </li>
            ))}
          </ul>
        )}
    </DashboardMainContentLayout>
  );
}
