// GET/POST/PATCH/DELETE /api/admin/trees/[id]/links - Manage user-individual links (superuser only)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { requireSuperuser } from '@/lib/middleware';

// GET - List all user-individual links for a tree
export async function GET(request, { params }) {
  const { user, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: treeId } = await params;

    const links = await prisma.userIndividualLink.findMany({
      where: { treeId },
      include: {
        user: {
          select: { id: true, username: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ links });
  } catch (error) {
    console.error('List links error:', error);
    return NextResponse.json(
      { error: 'Failed to list user-individual links' },
      { status: 500 }
    );
  }
}

// POST - Create a new user-individual link
export async function POST(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: treeId } = await params;
    const body = await request.json();
    const { userId, individualXref, verified = true } = body;

    if (!userId || !individualXref) {
      return NextResponse.json(
        { error: 'userId and individualXref are required' },
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

    // Check if link already exists
    const existing = await prisma.userIndividualLink.findUnique({
      where: {
        userId_treeId_individualXref: {
          userId,
          treeId,
          individualXref,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This link already exists' },
        { status: 400 }
      );
    }

    // Create the link
    const link = await prisma.userIndividualLink.create({
      data: {
        userId,
        treeId,
        individualXref,
        verified,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    return NextResponse.json({
      link,
      message: `${user.username} linked to ${individualXref}`,
    });
  } catch (error) {
    console.error('Create link error:', error);
    return NextResponse.json(
      { error: 'Failed to create user-individual link' },
      { status: 500 }
    );
  }
}

// PATCH - Update link (verify/unverify)
export async function PATCH(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: treeId } = await params;
    const body = await request.json();
    const { linkId, verified } = body;

    if (!linkId || typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'linkId and verified (boolean) are required' },
        { status: 400 }
      );
    }

    // Find the link
    const link = await prisma.userIndividualLink.findUnique({
      where: { id: linkId },
      include: {
        user: { select: { username: true } },
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    if (link.treeId !== treeId) {
      return NextResponse.json(
        { error: 'Link does not belong to this tree' },
        { status: 400 }
      );
    }

    // Update the link
    const updatedLink = await prisma.userIndividualLink.update({
      where: { id: linkId },
      data: { verified },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    return NextResponse.json({
      link: updatedLink,
      message: `Link ${verified ? 'verified' : 'unverified'}`,
    });
  } catch (error) {
    console.error('Update link error:', error);
    return NextResponse.json(
      { error: 'Failed to update link' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a user-individual link
export async function DELETE(request, { params }) {
  const { user: currentUser, response } = await requireSuperuser(request);
  if (response) return response;

  try {
    const { id: treeId } = await params;
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');

    if (!linkId) {
      return NextResponse.json(
        { error: 'linkId query parameter is required' },
        { status: 400 }
      );
    }

    // Find the link
    const link = await prisma.userIndividualLink.findUnique({
      where: { id: linkId },
      include: {
        user: { select: { username: true } },
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    if (link.treeId !== treeId) {
      return NextResponse.json(
        { error: 'Link does not belong to this tree' },
        { status: 400 }
      );
    }

    // Delete the link
    await prisma.userIndividualLink.delete({
      where: { id: linkId },
    });

    return NextResponse.json({
      message: `Link removed for ${link.user.username}`,
    });
  } catch (error) {
    console.error('Delete link error:', error);
    return NextResponse.json(
      { error: 'Failed to delete link' },
      { status: 500 }
    );
  }
}

