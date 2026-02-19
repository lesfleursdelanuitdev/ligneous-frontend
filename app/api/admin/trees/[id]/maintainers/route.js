// POST/DELETE /api/admin/trees/[id]/maintainers - Manage tree maintainers (superuser only)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireSuperuser } from '@/lib/middleware';

// POST - Add a new maintainer to the tree
export async function POST(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: treeId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check if tree exists
    const tree = await prisma.tree.findUnique({
      where: { id: treeId },
      select: { id: true, name: true },
    });

    if (!tree) {
      return NextResponse.json(
        { error: 'Tree not found' },
        { status: 404 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already a maintainer
    const existingMaintainer = await prisma.treeMaintainer.findUnique({
      where: {
        treeId_userId: { treeId, userId },
      },
    });

    if (existingMaintainer) {
      return NextResponse.json(
        { error: 'User is already a maintainer of this tree' },
        { status: 400 }
      );
    }

    // Create the maintainer role
    const maintainer = await prisma.treeMaintainer.create({
      data: {
        treeId,
        userId,
        addedBy: currentUser.id,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    return NextResponse.json({
      maintainer: {
        id: maintainer.id,
        userId: maintainer.user.id,
        username: maintainer.user.username,
        email: maintainer.user.email,
        createdAt: maintainer.createdAt,
      },
      message: `${user.username} added as maintainer`,
    });
  } catch (error) {
    console.error('Add maintainer error:', error);
    return NextResponse.json(
      { error: 'Failed to add maintainer' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a maintainer from the tree
export async function DELETE(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: treeId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    // Find the maintainer
    const maintainer = await prisma.treeMaintainer.findUnique({
      where: {
        treeId_userId: { treeId, userId },
      },
      include: {
        user: { select: { username: true } },
      },
    });

    if (!maintainer) {
      return NextResponse.json(
        { error: 'User is not a maintainer of this tree' },
        { status: 404 }
      );
    }

    // Delete the maintainer role
    await prisma.treeMaintainer.delete({
      where: {
        treeId_userId: { treeId, userId },
      },
    });

    return NextResponse.json({
      message: `${maintainer.user.username} removed as maintainer`,
    });
  } catch (error) {
    console.error('Remove maintainer error:', error);
    return NextResponse.json(
      { error: 'Failed to remove maintainer' },
      { status: 500 }
    );
  }
}


