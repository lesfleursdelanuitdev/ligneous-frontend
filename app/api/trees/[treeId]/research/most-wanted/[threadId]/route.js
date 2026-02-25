/**
 * GET - Get a single most-wanted thread.
 * PATCH - Update thread (e.g. isClosed for Mark resolved / Reopen).
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess } from '@/lib/tree-access';

export async function GET(request, { params }) {
  try {
    const { treeId, threadId } = await params;
    const { error } = await resolveTreeAccess(request, treeId, 'read');
    if (error) return error;

    const thread = await prisma.discussionThread.findFirst({
      where: {
        id: threadId,
        treeId,
        category: 'most_wanted',
      },
      include: {
        creator: {
          select: { id: true, username: true, name: true },
        },
        _count: { select: { posts: true } },
        linkedEntities: { select: { id: true, entityType: true, entityId: true } },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json({ thread });
  } catch (err) {
    console.error('Most-wanted thread get error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { treeId, threadId } = await params;
    const { user, error } = await resolveTreeAccess(request, treeId, 'write');
    if (error) return error;
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.discussionThread.findFirst({
      where: {
        id: threadId,
        treeId,
        category: 'most_wanted',
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const data = {};
    if (typeof body.isClosed === 'boolean') data.isClosed = body.isClosed;
    if (body.title !== undefined) data.title = String(body.title).trim().slice(0, 255);
    if (body.description !== undefined) data.description = String(body.description).trim() || null;

    const thread = await prisma.discussionThread.update({
      where: { id: threadId },
      data,
      include: {
        creator: {
          select: { id: true, username: true, name: true },
        },
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ thread });
  } catch (err) {
    console.error('Most-wanted thread patch error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
