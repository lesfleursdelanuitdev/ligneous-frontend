// GET/POST/DELETE /api/admin/trees/[id]/invitations - Manage invitation links (superuser only)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireSuperuser } from '@/lib/middleware';

// GET - List all invitation links for a tree
export async function GET(request, { params }) {
  const { user, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: treeId } = await params;
    const { searchParams } = new URL(request.url);
    const includeRevoked = searchParams.get('includeRevoked') === 'true';

    const where = { treeId };
    if (!includeRevoked) {
      where.isRevoked = false;
    }

    const invitations = await prisma.invitationLink.findMany({
      where,
      include: {
        creator: {
          select: { id: true, username: true },
        },
        _count: {
          select: { uses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const transformedInvitations = invitations.map(inv => ({
      id: inv.id,
      token: inv.token,
      roleType: inv.roleType,
      individualXref: inv.individualXref,
      expiresAt: inv.expiresAt,
      maxUses: inv.maxUses,
      usedCount: inv._count.uses,
      isRevoked: inv.isRevoked,
      notes: inv.notes,
      createdAt: inv.createdAt,
      createdBy: inv.creator,
    }));

    return NextResponse.json({ invitations: transformedInvitations });
  } catch (error) {
    console.error('List invitations error:', error);
    return NextResponse.json(
      { error: 'Failed to list invitations' },
      { status: 500 }
    );
  }
}

// POST - Create a new invitation link
export async function POST(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: treeId } = await params;
    const body = await request.json();
    const { 
      roleType = 'read', 
      individualXref,
      expiresAt,
      maxUses,
      notes,
    } = body;

    // Validate role type
    if (!['read', 'write', 'maintainer', 'owner'].includes(roleType)) {
      return NextResponse.json(
        { error: 'Invalid role type. Must be: read, write, maintainer, or owner' },
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

    // Create the invitation link
    const invitation = await prisma.invitationLink.create({
      data: {
        treeId,
        createdBy: currentUser.id,
        roleType,
        individualXref: individualXref || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUses: maxUses || null,
        notes: notes || null,
      },
      include: {
        creator: {
          select: { id: true, username: true },
        },
      },
    });

    // Generate full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000';
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        token: invitation.token,
        url: inviteUrl,
        roleType: invitation.roleType,
        individualXref: invitation.individualXref,
        expiresAt: invitation.expiresAt,
        maxUses: invitation.maxUses,
        notes: invitation.notes,
        createdAt: invitation.createdAt,
        createdBy: invitation.creator,
      },
      message: `Invitation link created for ${roleType} access`,
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

// DELETE - Revoke an invitation link
export async function DELETE(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: treeId } = await params;
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitationId');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'invitationId query parameter is required' },
        { status: 400 }
      );
    }

    // Find the invitation
    const invitation = await prisma.invitationLink.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    if (invitation.treeId !== treeId) {
      return NextResponse.json(
        { error: 'Invitation does not belong to this tree' },
        { status: 400 }
      );
    }

    if (invitation.isRevoked) {
      return NextResponse.json(
        { error: 'Invitation is already revoked' },
        { status: 400 }
      );
    }

    // Revoke the invitation
    await prisma.invitationLink.update({
      where: { id: invitationId },
      data: { isRevoked: true },
    });

    return NextResponse.json({
      message: 'Invitation link revoked',
    });
  } catch (error) {
    console.error('Revoke invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke invitation' },
      { status: 500 }
    );
  }
}


