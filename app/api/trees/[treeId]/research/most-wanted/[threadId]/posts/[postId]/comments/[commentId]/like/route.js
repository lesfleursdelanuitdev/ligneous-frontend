/**
 * POST - Like a comment.
 * DELETE - Unlike a comment.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess } from '@/lib/tree-access';

const ENTITY_TYPE = 'comment';

async function ensureCommentInPost(treeId, threadId, postId, commentId) {
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
  if (!post) return null;
  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      entityType: 'discussion_post',
      entityId: postId,
      treeId,
      deletedAt: null,
    },
    select: { id: true },
  });
  return comment;
}

export async function POST(request, { params }) {
  try {
    const { treeId, threadId, postId, commentId } = await params;
    const { user, error } = await resolveTreeAccess(request, treeId, 'read');
    if (error) return error;
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const comment = await ensureCommentInPost(treeId, threadId, postId, commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    await prisma.entityLike.upsert({
      where: {
        entityType_entityId_userId: {
          entityType: ENTITY_TYPE,
          entityId: commentId,
          userId,
        },
      },
      create: {
        entityType: ENTITY_TYPE,
        entityId: commentId,
        userId,
      },
      update: {},
    });

    const count = await prisma.entityLike.count({
      where: {
        entityType: ENTITY_TYPE,
        entityId: commentId,
      },
    });

    return NextResponse.json({ liked: true, likeCount: count });
  } catch (err) {
    console.error('Comment like error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { treeId, threadId, postId, commentId } = await params;
    const { user, error } = await resolveTreeAccess(request, treeId, 'read');
    if (error) return error;
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const comment = await ensureCommentInPost(treeId, threadId, postId, commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    await prisma.entityLike.deleteMany({
      where: {
        entityType: ENTITY_TYPE,
        entityId: commentId,
        userId,
      },
    });

    const count = await prisma.entityLike.count({
      where: {
        entityType: ENTITY_TYPE,
        entityId: commentId,
      },
    });

    return NextResponse.json({ liked: false, likeCount: count });
  } catch (err) {
    console.error('Comment unlike error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
