import { NextResponse } from 'next/server';
import { StoryKind, StoryStatus } from '@ligneous/prisma';
import { slugifyStoryTitle, createDefaultSectionBlocks } from '@ligneous/story-creator';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';
import { parsePagination, paginatedResponse } from '@/lib/tree-access';

async function allocateUniqueStorySlug(treeId, title) {
  const base = slugifyStoryTitle(title);
  for (let i = 0; i < 80; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const taken = await prisma.story.findFirst({
      where: { treeId, slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function requestKindToPrisma(kindRaw) {
  if (kindRaw === 'article') return StoryKind.article;
  if (kindRaw === 'post') return StoryKind.post;
  if (kindRaw === 'folklore') return StoryKind.folklore;
  return StoryKind.story;
}

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { error } = await resolveTreeAuthz(request, treeId, 'story');
    if (error) return error;

    const url = new URL(request.url);
    const { limit, offset, search, sort, order } = parsePagination(url);
    const kindFilter = url.searchParams.get('kind') || null;
    const statusFilter = url.searchParams.get('status') || null;

    const where = { treeId, deletedAt: null };
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (kindFilter) where.kind = kindFilter;
    if (statusFilter) where.status = statusFilter;

    const orderBy = sort === 'title' ? { title: order } : { updatedAt: order };

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        select: {
          id: true,
          title: true,
          kind: true,
          status: true,
          slug: true,
          excerpt: true,
          isPublished: true,
          updatedAt: true,
          authorId: true,
          tags: true,
          author: { select: { id: true, name: true, email: true } },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.story.count({ where }),
    ]);

    const data = stories.map((s) => ({
      id: s.id,
      title: s.title,
      kind: s.kind,
      status: s.status,
      slug: s.slug,
      excerpt: s.excerpt,
      isPublished: s.isPublished,
      updatedAt: s.updatedAt.toISOString(),
      authorId: s.authorId,
      authorName: s.author?.name ?? null,
      tags: s.tags ?? [],
    }));

    return paginatedResponse(data, total, limit, offset);
  } catch (err) {
    console.error('Stories list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { treeId } = await params;
    const { user, error } = await resolveTreeAuthz(request, treeId, 'story', 'create');
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const titleRaw = typeof body.title === 'string' ? body.title.trim() : '';
    const title = titleRaw || 'Untitled story';
    const kind = requestKindToPrisma(body.kind);

    const slug = await allocateUniqueStorySlug(treeId, title);

    const story = await prisma.story.create({
      data: {
        treeId,
        authorId: user.id,
        title,
        slug,
        kind,
        status: StoryStatus.draft,
        tags: [],
        body: JSON.stringify({
          v: 'ligneous-story-meta/1',
          authors: [],
          author: null,
          authorPrefixMode: null,
          authorPrefixCustom: null,
        }),
        contentVersion: 1,
        isPublished: false,
      },
    });

    const ch = await prisma.storyChapter.create({
      data: { storyId: story.id, title: 'Section 1', sortOrder: 0 },
    });

    await prisma.storySection.create({
      data: {
        chapterId: ch.id,
        title: 'Section 1',
        sortOrder: 0,
        contentJson: { blocks: createDefaultSectionBlocks() },
      },
    });

    return NextResponse.json({ id: story.id, slug: story.slug }, { status: 201 });
  } catch (err) {
    console.error('Stories create error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
