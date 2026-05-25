import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';

async function findJunctionRow(albumId, junctionId) {
  const [gedcom, site, user] = await Promise.all([
    prisma.albumGedcomMedia.findFirst({ where: { id: junctionId, albumId } }),
    prisma.albumSiteMedia.findFirst({ where: { id: junctionId, albumId } }),
    prisma.albumUserMedia.findFirst({ where: { id: junctionId, albumId } }),
  ]);
  if (gedcom) return { row: gedcom, kind: 'gedcom' };
  if (site) return { row: site, kind: 'site' };
  if (user) return { row: user, kind: 'user' };
  return null;
}

async function reindexAlbumMedia(albumId) {
  const [gedcomRows, siteRows, userRows] = await Promise.all([
    prisma.albumGedcomMedia.findMany({ where: { albumId }, select: { id: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.albumSiteMedia.findMany({ where: { albumId }, select: { id: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.albumUserMedia.findMany({ where: { albumId }, select: { id: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } }),
  ]);

  const all = [
    ...gedcomRows.map((r) => ({ ...r, kind: 'gedcom' })),
    ...siteRows.map((r) => ({ ...r, kind: 'site' })),
    ...userRows.map((r) => ({ ...r, kind: 'user' })),
  ].sort((a, b) => a.sortOrder - b.sortOrder);

  await Promise.all(
    all.map((item, i) => {
      if (item.kind === 'gedcom') return prisma.albumGedcomMedia.update({ where: { id: item.id }, data: { sortOrder: i } });
      if (item.kind === 'site') return prisma.albumSiteMedia.update({ where: { id: item.id }, data: { sortOrder: i } });
      return prisma.albumUserMedia.update({ where: { id: item.id }, data: { sortOrder: i } });
    })
  );
}

export async function PATCH(request, { params }) {
  try {
    const { treeId, id, mediaId } = await params;
    const { error } = await resolveTreeAuthz(request, treeId, 'album', 'update');
    if (error) return error;

    const album = await prisma.album.findFirst({
      where: { id, treeId, deletedAt: null },
      select: { id: true },
    });
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const found = await findJunctionRow(id, mediaId);
    if (!found) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const data = {};
    if (body.sortOrder !== undefined) data.sortOrder = parseInt(body.sortOrder, 10);
    if (body.caption !== undefined && found.kind !== 'gedcom') data.caption = body.caption ?? null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    let updated;
    if (found.kind === 'gedcom') {
      updated = await prisma.albumGedcomMedia.update({ where: { id: mediaId }, data });
      return NextResponse.json({ item: { id: updated.id, mediaId: updated.gedcomMediaId, mediaKind: 'gedcom', sortOrder: updated.sortOrder, caption: null } });
    } else if (found.kind === 'site') {
      updated = await prisma.albumSiteMedia.update({ where: { id: mediaId }, data });
      return NextResponse.json({ item: { id: updated.id, mediaId: updated.siteMediaId, mediaKind: 'site', sortOrder: updated.sortOrder, caption: updated.caption } });
    } else {
      updated = await prisma.albumUserMedia.update({ where: { id: mediaId }, data });
      return NextResponse.json({ item: { id: updated.id, mediaId: updated.userMediaId, mediaKind: 'user', sortOrder: updated.sortOrder, caption: updated.caption } });
    }
  } catch (err) {
    console.error('Album media update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { treeId, id, mediaId } = await params;
    const { error } = await resolveTreeAuthz(request, treeId, 'album', 'delete');
    if (error) return error;

    const album = await prisma.album.findFirst({
      where: { id, treeId, deletedAt: null },
      select: { id: true },
    });
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const found = await findJunctionRow(id, mediaId);
    if (!found) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 });
    }

    if (found.kind === 'gedcom') await prisma.albumGedcomMedia.delete({ where: { id: mediaId } });
    else if (found.kind === 'site') await prisma.albumSiteMedia.delete({ where: { id: mediaId } });
    else await prisma.albumUserMedia.delete({ where: { id: mediaId } });

    await reindexAlbumMedia(id);

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Album media remove error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
