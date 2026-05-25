/**
 * GET - List topic posts for a most-wanted thread.
 * POST - Create a new topic post.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';

export async function GET(request, { params }) {
  try {
    const { treeId, threadId } = await params;
    const { user, error } = await resolveTreeAuthz(request, treeId, 'openQuestion');
    if (error) return error;
    const userId = user?.id ?? null;

    const thread = await prisma.discussionThread.findFirst({
      where: {
        id: threadId,
        treeId,
        category: 'most_wanted',
      },
      select: { id: true },
    });
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const posts = await prisma.discussionPost.findMany({
      where: { threadId },
      include: {
        user: {
          select: { id: true, username: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const commentCounts = await Promise.all(
      posts.map((p) =>
        prisma.comment.count({
          where: {
            entityType: 'discussion_post',
            entityId: p.id,
            treeId,
            deletedAt: null,
          },
        })
      )
    );

    const postIds = posts.map((p) => p.id);
    const likeCounts =
      postIds.length > 0
        ? await prisma.entityLike.groupBy({
            by: ['entityId'],
            where: {
              entityType: 'discussion_post',
              entityId: { in: postIds },
            },
            _count: { id: true },
          })
        : [];
    const likeCountByPost = Object.fromEntries(
      likeCounts.map((g) => [g.entityId, g._count.id])
    );
    let likedByMePostIds = new Set();
    if (userId && postIds.length > 0) {
      const myLikes = await prisma.entityLike.findMany({
        where: {
          entityType: 'discussion_post',
          entityId: { in: postIds },
          userId,
        },
        select: { entityId: true },
      });
      likedByMePostIds = new Set(myLikes.map((l) => l.entityId));
    }

    const list = posts.map((p, i) => ({
      id: p.id,
      threadId: p.threadId,
      content: p.content,
      userId: p.userId,
      user: p.user,
      isEdited: p.isEdited,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      commentCount: commentCounts[i],
      likeCount: likeCountByPost[p.id] ?? 0,
      likedByMe: likedByMePostIds.has(p.id),
    }));

    return NextResponse.json({ posts: list });
  } catch (err) {
    console.error('Most-wanted posts list error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { treeId, threadId } = await params;
    const { user, error } = await resolveTreeAuthz(request, treeId, 'openQuestion', 'create');
    if (error) return error;
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const thread = await prisma.discussionThread.findFirst({
      where: {
        id: threadId,
        treeId,
        category: 'most_wanted',
      },
      select: { id: true },
    });
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
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

    const post = await prisma.discussionPost.create({
      data: {
        threadId,
        userId,
        content,
      },
      include: {
        user: {
          select: { id: true, username: true, name: true },
        },
      },
    });

    return NextResponse.json({
      post: {
        ...post,
        commentCount: 0,
      },
    });
  } catch (err) {
    console.error('Most-wanted post create error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
