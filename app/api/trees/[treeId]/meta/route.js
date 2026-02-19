/**
 * GET /api/trees/[treeId]/meta
 * Returns tree metadata (name, description, counts) with read permission check.
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { checkTreeAccessForProxy, getFileIdFromTreeId } from '@/lib/tree-access';
import { prisma } from '@/lib/database/prisma';
import { config } from '@/config/index.js';

const GO_API_URL = config.api?.goApi?.baseURL || process.env.NEXT_PUBLIC_GO_API_URL || 'http://localhost:8090';

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
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this tree' },
        { status: 403 }
      );
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

    let individualsCount = 0;
    let familiesCount = 0;

    try {
      const goRes = await fetch(`${GO_API_URL}/api/v1/files/${tree.fileId}`, {
        next: { revalidate: 60 },
      });
      if (goRes.ok) {
        const goData = await goRes.json();
        const fileInfo = goData.data || goData;
        individualsCount = fileInfo.individuals_count ?? 0;
        familiesCount = fileInfo.families_count ?? 0;
      }
    } catch (e) {
      console.warn('Go API stats fetch failed for tree', treeId, e.message);
    }

    const primaryOwner = tree.owners?.find((o) => o.isPrimary)?.user || tree.owners?.[0]?.user;

    return NextResponse.json({
      success: true,
      tree: {
        id: tree.id,
        fileId: tree.fileId,
        name: tree.name,
        description: tree.description,
        isPublic: tree.isPublic,
        individualsCount,
        familiesCount,
        owner: primaryOwner
          ? { id: primaryOwner.id, username: primaryOwner.username, name: primaryOwner.name }
          : null,
        updatedAt: tree.updatedAt,
        createdAt: tree.createdAt,
      },
    });
  } catch (error) {
    console.error('Tree meta error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
