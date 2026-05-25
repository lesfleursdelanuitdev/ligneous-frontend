import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';
import { parsePagination, paginatedResponse } from '@/lib/tree-access';

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { error } = await resolveTreeAuthz(request, treeId, 'album');
    if (error) return error;

    const url = new URL(request.url);
    const { limit, offset, search } = parsePagination(url);

    const where = { treeId, deletedAt: null };
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [albums, total] = await Promise.all([
      prisma.album.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          coverMediaId: true,
          isPublic: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              albumGedcomMedia: true,
              siteMedia: true,
              userMedia: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: offset,
        take: limit,
      }),
      prisma.album.count({ where }),
    ]);

    const data = albums.map((a) => ({
      id: a.id,
      title: a.name,
      description: a.description,
      coverId: a.coverMediaId,
      isPublic: a.isPublic,
      sortOrder: a.sortOrder,
      itemCount: a._count.albumGedcomMedia + a._count.siteMedia + a._count.userMedia,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    return paginatedResponse(data, total, limit, offset);
  } catch (err) {
    console.error('Albums list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { treeId } = await params;
    const { user, error } = await resolveTreeAuthz(request, treeId, 'album', 'create');
    if (error) return error;

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const title = (body.title ?? '').trim();
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const album = await prisma.album.create({
      data: {
        treeId,
        userId: user?.id ?? null,
        scope: 'mixed',
        name: title,
        description: body.description?.trim() || null,
        coverMediaId: body.coverId ?? null,
      },
    });

    return NextResponse.json({
      album: {
        id: album.id,
        title: album.name,
        description: album.description,
        coverId: album.coverMediaId,
        isPublic: album.isPublic,
        sortOrder: album.sortOrder,
        itemCount: 0,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
      },
    }, { status: 201 });
  } catch (err) {
    console.error('Album create error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
