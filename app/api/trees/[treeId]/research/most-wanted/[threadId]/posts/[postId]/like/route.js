/**
 * POST - Like a topic post.
 * DELETE - Unlike a topic post.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess } from '@/lib/tree-access';

const ENTITY_TYPE = 'discussion_post';

async function ensurePostInTree(treeId, threadId, postId) {
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
  return post;
}

export async function POST(request, { params }) {
  try {
    const { treeId, threadId, postId } = await params;
    const { user, error } = await resolveTreeAccess(request, treeId, 'read');
    if (error) return error;
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await ensurePostInTree(treeId, threadId, postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await prisma.entityLike.upsert({
      where: {
        entityType_entityId_userId: {
          entityType: ENTITY_TYPE,
          entityId: postId,
          userId,
        },
      },
      create: {
        entityType: ENTITY_TYPE,
        entityId: postId,
        userId,
      },
      update: {},
    });

    const count = await prisma.entityLike.count({
      where: {
        entityType: ENTITY_TYPE,
        entityId: postId,
      },
    });

    return NextResponse.json({ liked: true, likeCount: count });
  } catch (err) {
    console.error('Post like error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { treeId, threadId, postId } = await params;
    const { user, error } = await resolveTreeAccess(request, treeId, 'read');
    if (error) return error;
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await ensurePostInTree(treeId, threadId, postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await prisma.entityLike.deleteMany({
      where: {
        entityType: ENTITY_TYPE,
        entityId: postId,
        userId,
      },
    });

    const count = await prisma.entityLike.count({
      where: {
        entityType: ENTITY_TYPE,
        entityId: postId,
      },
    });

    return NextResponse.json({ liked: false, likeCount: count });
  } catch (err) {
    console.error('Post unlike error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
