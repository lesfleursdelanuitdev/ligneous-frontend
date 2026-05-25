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
      select: {
        id: true,
        name: true,
        description: true,
        coverMediaId: true,
        isPublic: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        albumGedcomMedia: {
          select: { id: true, gedcomMediaId: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
        siteMedia: {
          select: { id: true, siteMediaId: true, sortOrder: true, caption: true },
          orderBy: { sortOrder: 'asc' },
        },
        userMedia: {
          select: { id: true, userMediaId: true, sortOrder: true, caption: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const gedcom = album.albumGedcomMedia.map((r) => ({
      id: r.id,
      mediaId: r.gedcomMediaId,
      mediaKind: 'gedcom',
      sortOrder: r.sortOrder,
      caption: null,
    }));
    const site = album.siteMedia.map((r) => ({
      id: r.id,
      mediaId: r.siteMediaId,
      mediaKind: 'site',
      sortOrder: r.sortOrder,
      caption: r.caption,
    }));
    const user = album.userMedia.map((r) => ({
      id: r.id,
      mediaId: r.userMediaId,
      mediaKind: 'user',
      sortOrder: r.sortOrder,
      caption: r.caption,
    }));

    const media = [...gedcom, ...site, ...user].sort((a, b) => a.sortOrder - b.sortOrder);

    return NextResponse.json({
      album: {
        id: album.id,
        title: album.name,
        description: album.description,
        coverId: album.coverMediaId,
        isPublic: album.isPublic,
        sortOrder: album.sortOrder,
        itemCount: media.length,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
        media,
      },
    });
  } catch (err) {
    console.error('Album detail error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { treeId, id } = await params;
    const { error } = await resolveTreeAuthz(request, treeId, 'album', 'update');
    if (error) return error;

    const existing = await prisma.album.findFirst({
      where: { id, treeId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const data = {};
    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) return NextResponse.json({ error: 'title cannot be empty' }, { status: 400 });
      data.name = title;
    }
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.coverId !== undefined) data.coverMediaId = body.coverId || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const album = await prisma.album.update({ where: { id }, data });

    return NextResponse.json({
      album: {
        id: album.id,
        title: album.name,
        description: album.description,
        coverId: album.coverMediaId,
        isPublic: album.isPublic,
        sortOrder: album.sortOrder,
        updatedAt: album.updatedAt,
      },
    });
  } catch (err) {
    console.error('Album update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { treeId, id } = await params;
    const { error } = await resolveTreeAuthz(request, treeId, 'album', 'delete');
    if (error) return error;

    const existing = await prisma.album.findFirst({
      where: { id, treeId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    await prisma.album.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Album delete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
