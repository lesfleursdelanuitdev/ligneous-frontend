/**
 * GET /api/trees/[treeId]/meta
 * Returns tree metadata (name, description, counts) with read permission check.
 * All data comes from the local database (no Go API dependency).
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { checkTreeAccessForProxy } from '@/lib/tree-access';
import { prisma } from '@/lib/database/prisma';

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    if (!treeId) {
      return NextResponse.json({ error: 'Tree ID is required' }, { status: 400 });
    }

    const { user } = await getAuthenticatedUser(request);
    const userId = user?.id || null;

    const hasAccess = await checkTreeAccessForProxy(userId, treeId, 'read');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this tree' }, { status: 403 });
    }

    const tree = await prisma.tree.findUnique({
      where: { id: treeId },
      include: {
        owners: {
          select: {
            isPrimary: true,
            user: { select: { id: true, username: true, name: true } },
          },
        },
      },
    });

    if (!tree) {
      return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
    }

    const gf = tree.fileId
      ? await prisma.gedcomFile.findUnique({
          where: { fileId: tree.fileId },
          select: {
            individualsCount: true,
            familiesCount: true,
            placesCount: true,
            datesCount: true,
            eventsCount: true,
            notesCount: true,
            sourcesCount: true,
            status: true,
          },
        })
      : null;
    const primaryOwner = tree.owners?.find((o) => o.isPrimary)?.user || tree.owners?.[0]?.user;

    return NextResponse.json({
      success: true,
      tree: {
        id: tree.id,
        fileId: tree.fileId,
        name: tree.name,
        description: tree.description,
        isPublic: tree.isPublic,
        individualsCount: gf?.individualsCount ?? 0,
        familiesCount: gf?.familiesCount ?? 0,
        placesCount: gf?.placesCount ?? 0,
        datesCount: gf?.datesCount ?? 0,
        eventsCount: gf?.eventsCount ?? 0,
        notesCount: gf?.notesCount ?? 0,
        sourcesCount: gf?.sourcesCount ?? 0,
        parseStatus: gf?.status ?? 'unknown',
        owner: primaryOwner
          ? { id: primaryOwner.id, username: primaryOwner.username, name: primaryOwner.name }
          : null,
        updatedAt: tree.updatedAt,
        createdAt: tree.createdAt,
      },
    });
  } catch (error) {
    console.error('Tree meta error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
