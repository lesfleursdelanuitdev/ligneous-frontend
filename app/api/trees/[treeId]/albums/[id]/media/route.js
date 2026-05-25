import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';

export async function GET(request, { params }) {
  try {
    const { treeId, id } = await params;
    const { error } = await resolveTreeAuthz(request, treeId, 'album');
    if (error) return error;

    const album = await prisma.album.findFirst({
      where: { id, treeId, deletedAt: null },
      select: { id: true },
    });
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const [gedcomRows, siteRows, userRows] = await Promise.all([
      prisma.albumGedcomMedia.findMany({
        where: { albumId: id },
        select: { id: true, gedcomMediaId: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.albumSiteMedia.findMany({
        where: { albumId: id },
        select: { id: true, siteMediaId: true, sortOrder: true, caption: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.albumUserMedia.findMany({
        where: { albumId: id },
        select: { id: true, userMediaId: true, sortOrder: true, caption: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    const media = [
      ...gedcomRows.map((r) => ({ id: r.id, mediaId: r.gedcomMediaId, mediaKind: 'gedcom', sortOrder: r.sortOrder, caption: null })),
      ...siteRows.map((r) => ({ id: r.id, mediaId: r.siteMediaId, mediaKind: 'site', sortOrder: r.sortOrder, caption: r.caption })),
      ...userRows.map((r) => ({ id: r.id, mediaId: r.userMediaId, mediaKind: 'user', sortOrder: r.sortOrder, caption: r.caption })),
    ].sort((a, b) => a.sortOrder - b.sortOrder);

    return NextResponse.json({ media });
  } catch (err) {
    console.error('Album media list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { treeId, id } = await params;
    const { user, error } = await resolveTreeAuthz(request, treeId, 'album', 'create');
    if (error) return error;

    const album = await prisma.album.findFirst({
      where: { id, treeId, deletedAt: null },
      select: { id: true },
    });
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    let items;
    try {
      const body = await request.json();
      items = Array.isArray(body) ? body : body.items;
    } catch {
      items = null;
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Body must be an array of media items' }, { status: 400 });
    }

    // Find current max sortOrder across all three tables
    const [maxGedcom, maxSite, maxUser] = await Promise.all([
      prisma.albumGedcomMedia.aggregate({ where: { albumId: id }, _max: { sortOrder: true } }),
      prisma.albumSiteMedia.aggregate({ where: { albumId: id }, _max: { sortOrder: true } }),
      prisma.albumUserMedia.aggregate({ where: { albumId: id }, _max: { sortOrder: true } }),
    ]);
    let nextSort = Math.max(
      maxGedcom._max.sortOrder ?? -1,
      maxSite._max.sortOrder ?? -1,
      maxUser._max.sortOrder ?? -1,
    ) + 1;

    const created = [];
    for (const item of items) {
      const { mediaId, mediaKind, caption } = item;
      if (!mediaId || !mediaKind) continue;

      const addedBy = user?.id ?? null;
      const sortOrder = nextSort++;

      if (mediaKind === 'gedcom') {
        const row = await prisma.albumGedcomMedia.upsert({
          where: { albumId_gedcomMediaId: { albumId: id, gedcomMediaId: mediaId } },
          create: { albumId: id, gedcomMediaId: mediaId, sortOrder, addedBy },
          update: {},
        });
        created.push({ id: row.id, mediaId: row.gedcomMediaId, mediaKind: 'gedcom', sortOrder: row.sortOrder, caption: null });
      } else if (mediaKind === 'site') {
        const row = await prisma.albumSiteMedia.upsert({
          where: { albumId_siteMediaId: { albumId: id, siteMediaId: mediaId } },
          create: { albumId: id, siteMediaId: mediaId, sortOrder, caption: caption ?? null, addedBy },
          update: {},
        });
        created.push({ id: row.id, mediaId: row.siteMediaId, mediaKind: 'site', sortOrder: row.sortOrder, caption: row.caption });
      } else if (mediaKind === 'user') {
        const row = await prisma.albumUserMedia.upsert({
          where: { albumId_userMediaId: { albumId: id, userMediaId: mediaId } },
          create: { albumId: id, userMediaId: mediaId, sortOrder, caption: caption ?? null, addedBy },
          update: {},
        });
        created.push({ id: row.id, mediaId: row.userMediaId, mediaKind: 'user', sortOrder: row.sortOrder, caption: row.caption });
      }
    }

    return NextResponse.json({ media: created }, { status: 201 });
  } catch (err) {
    console.error('Album media add error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
