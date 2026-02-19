// GET/POST/DELETE /api/admin/users/[id]/links - Manage user-individual links for a user (superuser only)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireSuperuser } from '@/lib/middleware';

// GET - List all individual links for a user
export async function GET(request, { params }) {
  const { user, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: userId } = await params;

    // Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const links = await prisma.userIndividualLink.findMany({
      where: { userId },
      include: {
        tree: {
          select: { id: true, name: true, fileId: true, isPublic: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ links });
  } catch (error) {
    console.error('List user links error:', error);
    return NextResponse.json(
      { error: 'Failed to list user individual links' },
      { status: 500 }
    );
  }
}

// POST - Create a new individual link for a user
export async function POST(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { treeId, individualXref, verified = true } = body;

    if (!treeId || !individualXref) {
      return NextResponse.json(
        { error: 'treeId and individualXref are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify tree exists
    const tree = await prisma.tree.findUnique({
      where: { id: treeId },
      select: { id: true },
    });

    if (!tree) {
      return NextResponse.json(
        { error: 'Tree not found' },
        { status: 404 }
      );
    }

    // Check if link already exists
    const existingLink = await prisma.userIndividualLink.findFirst({
      where: {
        userId,
        treeId,
        individualXref,
      },
    });

    if (existingLink) {
      return NextResponse.json(
        { error: 'User is already linked to this individual' },
        { status: 400 }
      );
    }

    const link = await prisma.userIndividualLink.create({
      data: {
        userId,
        treeId,
        individualXref,
        verified,
      },
      include: {
        tree: {
          select: { id: true, name: true, fileId: true, isPublic: true },
        },
      },
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error('Create user link error:', error);
    return NextResponse.json(
      { error: 'Failed to create user individual link' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an individual link from a user
export async function DELETE(request, { params }) {
  const { user, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');

    if (!linkId) {
      return NextResponse.json(
        { error: 'linkId is required' },
        { status: 400 }
      );
    }

    // Verify the link exists and belongs to this user
    const link = await prisma.userIndividualLink.findFirst({
      where: {
        id: linkId,
        userId,
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    await prisma.userIndividualLink.delete({
      where: { id: linkId },
    });

    return NextResponse.json({ success: true, message: 'Link removed' });
  } catch (error) {
    console.error('Delete user link error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user individual link' },
      { status: 500 }
    );
  }
}

// PATCH - Update an individual link (verify/unverify)
export async function PATCH(request, { params }) {
  const { user, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { linkId, verified } = body;

    if (!linkId || typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'linkId and verified (boolean) are required' },
        { status: 400 }
      );
    }

    // Verify the link exists and belongs to this user
    const link = await prisma.userIndividualLink.findFirst({
      where: {
        id: linkId,
        userId,
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    const updatedLink = await prisma.userIndividualLink.update({
      where: { id: linkId },
      data: { verified },
      include: {
        tree: {
          select: { id: true, name: true, fileId: true, isPublic: true },
        },
      },
    });

    return NextResponse.json({ link: updatedLink });
  } catch (error) {
    console.error('Update user link error:', error);
    return NextResponse.json(
      { error: 'Failed to update user individual link' },
      { status: 500 }
    );
  }
}


