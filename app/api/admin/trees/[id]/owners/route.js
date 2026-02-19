// POST/DELETE /api/admin/trees/[id]/owners - Manage tree owners (superuser only)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireSuperuser } from '@/lib/middleware';

// POST - Add a new owner to the tree
export async function POST(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: treeId } = await params;
    const body = await request.json();
    const { userId, isPrimary = false } = body;

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

    // Check if already an owner
    const existingOwner = await prisma.treeOwner.findUnique({
      where: {
        treeId_userId: { treeId, userId },
      },
    });

    if (existingOwner) {
      return NextResponse.json(
        { error: 'User is already an owner of this tree' },
        { status: 400 }
      );
    }

    // If setting as primary, unset other primary owners
    if (isPrimary) {
      await prisma.treeOwner.updateMany({
        where: { treeId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // Create the ownership
    const owner = await prisma.treeOwner.create({
      data: {
        treeId,
        userId,
        isPrimary,
        addedBy: currentUser.id,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    return NextResponse.json({
      owner: {
        id: owner.id,
        userId: owner.user.id,
        username: owner.user.username,
        email: owner.user.email,
        isPrimary: owner.isPrimary,
        createdAt: owner.createdAt,
      },
      message: `${user.username} added as ${isPrimary ? 'primary ' : ''}owner`,
    });
  } catch (error) {
    console.error('Add owner error:', error);
    return NextResponse.json(
      { error: 'Failed to add owner' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an owner from the tree
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

    // Find the ownership
    const owner = await prisma.treeOwner.findUnique({
      where: {
        treeId_userId: { treeId, userId },
      },
      include: {
        user: { select: { username: true } },
      },
    });

    if (!owner) {
      return NextResponse.json(
        { error: 'User is not an owner of this tree' },
        { status: 404 }
      );
    }

    // Check if this is the only owner
    const ownerCount = await prisma.treeOwner.count({
      where: { treeId },
    });

    if (ownerCount === 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last owner. Transfer ownership first.' },
        { status: 400 }
      );
    }

    // Delete the ownership
    await prisma.treeOwner.delete({
      where: {
        treeId_userId: { treeId, userId },
      },
    });

    // If they were primary, promote another owner
    if (owner.isPrimary) {
      const nextOwner = await prisma.treeOwner.findFirst({
        where: { treeId },
        orderBy: { createdAt: 'asc' },
      });
      if (nextOwner) {
        await prisma.treeOwner.update({
          where: { id: nextOwner.id },
          data: { isPrimary: true },
        });
      }
    }

    return NextResponse.json({
      message: `${owner.user.username} removed as owner`,
    });
  } catch (error) {
    console.error('Remove owner error:', error);
    return NextResponse.json(
      { error: 'Failed to remove owner' },
      { status: 500 }
    );
  }
}


