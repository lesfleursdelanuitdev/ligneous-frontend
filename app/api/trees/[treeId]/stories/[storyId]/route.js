import { NextResponse } from 'next/server';
import { STORY_DB_READ_INCLUDE, dbRecordToStoryDocument, validateStoryDocumentStrictBlocks } from '@ligneous/story-creator';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';
import { replaceStoryFromDocumentInTx } from '@/lib/stories/persist-story-from-document';

export async function GET(request, { params }) {
  try {
    const { treeId, storyId } = await params;
    const { error } = await resolveTreeAuthz(request, treeId, 'story');
    if (error) return error;

    // storyId param may be a slug or a UUID — try both
    const story = await prisma.story.findFirst({
      where: {
        treeId,
        deletedAt: null,
        OR: [{ id: storyId }, { slug: storyId }],
      },
      include: STORY_DB_READ_INCLUDE,
    });
    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    const doc = dbRecordToStoryDocument(story);
    return NextResponse.json(doc);
  } catch (err) {
    console.error('Story get error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { treeId, storyId } = await params;
    const { user, error } = await resolveTreeAuthz(request, treeId, 'story', 'update');
    if (error) return error;

    const story = await prisma.story.findFirst({
      where: { treeId, deletedAt: null, OR: [{ id: storyId }, { slug: storyId }] },
      select: { id: true, authorId: true },
    });
    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Body must be a story document object' }, { status: 400 });
    }
    if (body.id !== story.id) {
      return NextResponse.json({ error: 'Document id must match story id' }, { status: 400 });
    }
    if (body.version !== 1) {
      return NextResponse.json({ error: 'Unsupported document version' }, { status: 400 });
    }
    if (!Array.isArray(body.sections)) {
      return NextResponse.json({ error: 'sections must be an array' }, { status: 400 });
    }

    const strictValidation = validateStoryDocumentStrictBlocks(body);
    if (!strictValidation.ok) {
      return NextResponse.json(
        { error: 'Unsupported or legacy block shape in document', detail: strictValidation.error },
        { status: 400 },
      );
    }

    const { updatedAt } = await prisma.$transaction((tx) =>
      replaceStoryFromDocumentInTx(tx, { storyId: story.id, userId: user.id, doc: body }),
    );
    return NextResponse.json({ updatedAt: updatedAt.toISOString() });
  } catch (err) {
    console.error('Story update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { treeId, storyId } = await params;
    const { error } = await resolveTreeAuthz(request, treeId, 'story', 'delete');
    if (error) return error;

    const story = await prisma.story.findFirst({
      where: { treeId, deletedAt: null, OR: [{ id: storyId }, { slug: storyId }] },
      select: { id: true },
    });
    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    await prisma.story.update({
      where: { id: story.id },
      data: { deletedAt: new Date(), slug: null },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('Story delete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
