// GET/PATCH/DELETE /api/admin/trees/[id] - Manage a specific tree (superuser only)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireSuperuser } from '@/lib/middleware';

// GET - Get full tree details including all roles and permissions
export async function GET(request, { params }) {
  const { user, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id } = await params;

    const tree = await prisma.tree.findUnique({
      where: { id },
      include: {
        owners: {
          include: {
            user: {
              select: { id: true, username: true, email: true, name: true },
            },
            adder: {
              select: { id: true, username: true },
            },
          },
          orderBy: { isPrimary: 'desc' },
        },
        treeMaintainers: {
          include: {
            user: {
              select: { id: true, username: true, email: true, name: true },
            },
            adder: {
              select: { id: true, username: true },
            },
          },
        },
        permissions: {
          include: {
            user: {
              select: { id: true, username: true, email: true },
            },
            granter: {
              select: { id: true, username: true },
            },
          },
          orderBy: { grantedAt: 'desc' },
        },
        userIndividualLinks: {
          include: {
            user: {
              select: { id: true, username: true, email: true },
            },
          },
        },
        accessRequests: {
          where: { status: 'pending' },
          include: {
            user: {
              select: { id: true, username: true, email: true },
            },
          },
          orderBy: { requestedAt: 'desc' },
        },
        invitationLinks: {
          where: { isRevoked: false },
          include: {
            creator: {
              select: { id: true, username: true },
            },
            _count: {
              select: { uses: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tree) {
      return NextResponse.json(
        { error: 'Tree not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tree });
  } catch (error) {
    console.error('Get tree error:', error);
    return NextResponse.json(
      { error: 'Failed to get tree' },
      { status: 500 }
    );
  }
}

// PATCH - Update tree settings (visibility, name, etc.)
export async function PATCH(request, { params }) {
  const { user, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, isPublic } = body;

    const updateData = {};
    if (typeof name === 'string') updateData.name = name;
    if (typeof description === 'string') updateData.description = description;
    if (typeof isPublic === 'boolean') updateData.isPublic = isPublic;

    const tree = await prisma.tree.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        isPublic: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ tree, message: 'Tree updated successfully' });
  } catch (error) {
    console.error('Update tree error:', error);
    return NextResponse.json(
      { error: 'Failed to update tree' },
      { status: 500 }
    );
  }
}

// DELETE - Delete tree (dangerous!)
export async function DELETE(request, { params }) {
  const { user, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id } = await params;

    const tree = await prisma.tree.findUnique({
      where: { id },
      select: { name: true, fileId: true },
    });

    if (!tree) {
      return NextResponse.json(
        { error: 'Tree not found' },
        { status: 404 }
      );
    }

    // Delete tree (cascades to all related records)
    await prisma.tree.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: `Tree "${tree.name}" deleted successfully`,
      fileId: tree.fileId,
    });
  } catch (error) {
    console.error('Delete tree error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tree' },
      { status: 500 }
    );
  }
}


