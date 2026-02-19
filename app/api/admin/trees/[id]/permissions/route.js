// GET/POST/DELETE /api/admin/trees/[id]/permissions - Manage tree permissions (superuser only)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireSuperuser } from '@/lib/middleware';

// GET - List all permissions for a tree
export async function GET(request, { params }) {
  const { user, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: treeId } = await params;

    const permissions = await prisma.permission.findMany({
      where: { treeId },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
        granter: {
          select: { id: true, username: true },
        },
      },
      orderBy: { grantedAt: 'desc' },
    });

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('List permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to list permissions' },
      { status: 500 }
    );
  }
}

// POST - Grant a new permission
export async function POST(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: treeId } = await params;
    const body = await request.json();
    const { 
      userId, 
      resourceType = 'tree', 
      resourceId, 
      permissionType = 'read',
      expiresAt,
      notes,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate permission type
    if (!['read', 'write', 'delete', 'admin'].includes(permissionType)) {
      return NextResponse.json(
        { error: 'Invalid permission type' },
        { status: 400 }
      );
    }

    // Validate resource type
    if (!['tree', 'individual', 'family', 'subtree'].includes(resourceType)) {
      return NextResponse.json(
        { error: 'Invalid resource type' },
        { status: 400 }
      );
    }

    // Check if tree exists
    const tree = await prisma.tree.findUnique({
      where: { id: treeId },
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

    // Use treeId as resourceId for tree-level permissions
    const actualResourceId = resourceId || treeId;

    // Check if permission already exists
    const existing = await prisma.permission.findUnique({
      where: {
        userId_treeId_resourceType_resourceId_permissionType: {
          userId,
          treeId,
          resourceType,
          resourceId: actualResourceId,
          permissionType,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This exact permission already exists' },
        { status: 400 }
      );
    }

    // Create the permission
    const permission = await prisma.permission.create({
      data: {
        userId,
        treeId,
        resourceType,
        resourceId: actualResourceId,
        permissionType,
        grantedBy: currentUser.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    return NextResponse.json({
      permission,
      message: `${permissionType} permission granted to ${user.username}`,
    });
  } catch (error) {
    console.error('Grant permission error:', error);
    return NextResponse.json(
      { error: 'Failed to grant permission' },
      { status: 500 }
    );
  }
}

// DELETE - Revoke a permission
export async function DELETE(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: treeId } = await params;
    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get('permissionId');

    if (!permissionId) {
      return NextResponse.json(
        { error: 'permissionId query parameter is required' },
        { status: 400 }
      );
    }

    // Find the permission
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        user: { select: { username: true } },
      },
    });

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    if (permission.treeId !== treeId) {
      return NextResponse.json(
        { error: 'Permission does not belong to this tree' },
        { status: 400 }
      );
    }

    // Delete the permission
    await prisma.permission.delete({
      where: { id: permissionId },
    });

    return NextResponse.json({
      message: `Permission revoked from ${permission.user.username}`,
    });
  } catch (error) {
    console.error('Revoke permission error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke permission' },
      { status: 500 }
    );
  }
}


