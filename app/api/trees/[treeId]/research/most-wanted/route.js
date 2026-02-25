/**
 * GET - List most-wanted (brick wall) threads for the tree.
 * POST - Create a new most-wanted thread.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess } from '@/lib/tree-access';

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { error } = await resolveTreeAccess(request, treeId, 'read');
    if (error) return error;

    const threads = await prisma.discussionThread.findMany({
      where: {
        treeId,
        category: 'most_wanted',
      },
      select: {
        id: true,
        title: true,
        description: true,
        isClosed: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        creator: {
          select: { id: true, username: true, name: true },
        },
        posts: { select: { id: true } },
        linkedEntities: { select: { id: true, entityType: true, entityId: true } },
      },
    });

    const list = await Promise.all(
      threads.map(async (t) => {
        const commentCount = await prisma.comment.count({
          where: {
            entityType: 'discussion_post',
            entityId: { in: t.posts.map((p) => p.id) },
            treeId,
            deletedAt: null,
          },
        });
        return {
          id: t.id,
          title: t.title,
          description: t.description,
          isClosed: t.isClosed,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          createdBy: t.createdBy,
          creator: t.creator,
          postCount: t.posts.length,
          commentCount,
          linkedEntities: t.linkedEntities || [],
        };
      })
    );

    return NextResponse.json({ threads: list });
  } catch (err) {
    console.error('Most-wanted list error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { treeId } = await params;
    const { user, error } = await resolveTreeAccess(request, treeId, 'write');
    if (error) return error;
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const title = (body.title ?? '').trim();
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const thread = await prisma.discussionThread.create({
      data: {
        treeId,
        category: 'most_wanted',
        title: title.slice(0, 255),
        description: (body.description ?? '').trim() || null,
        createdBy: userId,
      },
      include: {
        creator: {
          select: { id: true, username: true, name: true },
        },
      },
    });

    return NextResponse.json({
      thread: {
        ...thread,
        postCount: 0,
        commentCount: 0,
      },
    });
  } catch (err) {
    console.error('Most-wanted create error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
