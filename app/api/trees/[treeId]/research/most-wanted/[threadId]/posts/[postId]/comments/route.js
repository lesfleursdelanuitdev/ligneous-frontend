/**
 * GET - List comments on a most-wanted topic post.
 * POST - Create a comment (or reply) on the post.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';
import { canComment, canModerateComments } from '@/lib/permissions/comments';

const ENTITY_TYPE = 'discussion_post';
const userSelect = { id: true, username: true, name: true };

export async function GET(request, { params }) {
  try {
    const { treeId, threadId, postId } = await params;
    const { user, error } = await resolveTreeAuthz(request, treeId, 'openQuestion');
    if (error) return error;

    const post = await prisma.discussionPost.findFirst({
      where: {
        id: postId,
        threadId,
        thread: {
          treeId,
          category: 'most_wanted',
        },
      },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const userId = user?.id ?? null;
    const canModerate = userId ? await canModerateComments(userId, treeId) : false;

    const where = {
      entityType: ENTITY_TYPE,
      entityId: postId,
      treeId,
      deletedAt: null,
      parentId: null,
    };
    if (!canModerate) {
      where.isHidden = false;
    }

    const comments = await prisma.comment.findMany({
      where,
      include: {
        user: { select: userSelect },
        replies: {
          where: { deletedAt: null, ...(canModerate ? {} : { isHidden: false }) },
          include: { user: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
    });

    const commentIds = [
      ...comments.map((c) => c.id),
      ...comments.flatMap((c) => (c.replies || []).map((r) => r.id)),
    ].filter(Boolean);
    let likeCountByComment = {};
    let likedByMeCommentIds = new Set();
    if (commentIds.length > 0) {
      const likeCounts = await prisma.entityLike.groupBy({
        by: ['entityId'],
        where: {
          entityType: 'comment',
          entityId: { in: commentIds },
        },
        _count: { id: true },
      });
      likeCountByComment = Object.fromEntries(
        likeCounts.map((g) => [g.entityId, g._count.id])
      );
      if (userId) {
        const myLikes = await prisma.entityLike.findMany({
          where: {
            entityType: 'comment',
            entityId: { in: commentIds },
            userId,
          },
          select: { entityId: true },
        });
        likedByMeCommentIds = new Set(myLikes.map((l) => l.entityId));
      }
    }

    const enrich = (c) => ({
      ...c,
      likeCount: likeCountByComment[c.id] ?? 0,
      likedByMe: likedByMeCommentIds.has(c.id),
      replies: (c.replies || []).map((r) => ({
        ...r,
        likeCount: likeCountByComment[r.id] ?? 0,
        likedByMe: likedByMeCommentIds.has(r.id),
      })),
    });
    const enrichedComments = comments.map(enrich);

    const total = comments.length;

    return NextResponse.json({
      comments: enrichedComments,
      pagination: { total, limit: total, offset: 0 },
    });
  } catch (err) {
    console.error('Most-wanted comments list error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { treeId, threadId, postId } = await params;
    const { user, error } = await resolveTreeAuthz(request, treeId, 'openQuestion', 'create');
    if (error) return error;
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await prisma.discussionPost.findFirst({
      where: {
        id: postId,
        threadId,
        thread: {
          treeId,
          category: 'most_wanted',
        },
      },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const canAdd = await canComment(userId, ENTITY_TYPE, postId, treeId);
    if (!canAdd) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const content = (body.content ?? '').trim();
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }
    const parentId = body.parentId || null;

    const comment = await prisma.comment.create({
      data: {
        entityType: ENTITY_TYPE,
        entityId: postId,
        treeId,
        userId,
        content,
        parentId,
      },
      include: {
        user: { select: userSelect },
        parent: parentId ? { select: { id: true } } : false,
      },
    });

    return NextResponse.json({ comment });
  } catch (err) {
    console.error('Most-wanted comment create error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
