// GET/PATCH/DELETE /api/admin/users/[id] - Manage a specific user (superuser only)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireSuperuser } from '@/lib/middleware';

// GET - Get single user details
export async function GET(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        isWebsiteOwner: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        treeOwners: {
          include: {
            tree: {
              select: { id: true, name: true, fileId: true, isPublic: true },
            },
          },
        },
        treeMaintainers: {
          include: {
            tree: {
              select: { id: true, name: true, fileId: true, isPublic: true },
            },
          },
        },
        accessRequests: {
          where: { status: 'pending' },
          include: {
            tree: {
              select: { id: true, name: true },
            },
          },
          orderBy: { requestedAt: 'desc' },
        },
        sessions: {
          where: {
            isRevoked: false,
            expiresAt: { gt: new Date() },
          },
          select: {
            id: true,
            createdAt: true,
            lastUsedAt: true,
            ipAddress: true,
          },
          orderBy: { lastUsedAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

// PATCH - Update user (activate/deactivate, change role)
export async function PATCH(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive, isWebsiteOwner } = body;

    // Prevent superuser from demoting themselves
    if (id === currentUser.id && isWebsiteOwner === false) {
      return NextResponse.json(
        { error: 'Cannot remove your own superuser status' },
        { status: 400 }
      );
    }

    // Prevent superuser from deactivating themselves
    if (id === currentUser.id && isActive === false) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    const updateData = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (typeof isWebsiteOwner === 'boolean') updateData.isWebsiteOwner = isWebsiteOwner;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        isWebsiteOwner: true,
        isActive: true,
      },
    });

    // If deactivating user, revoke all their sessions
    if (isActive === false) {
      await prisma.session.updateMany({
        where: { userId: id },
        data: { isRevoked: true },
      });
    }

    return NextResponse.json({ user, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (careful!)
export async function DELETE(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id } = await params;

    // Prevent superuser from deleting themselves
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { username: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user (cascades to sessions, etc.)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: `User ${user.username} deleted successfully` });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}


