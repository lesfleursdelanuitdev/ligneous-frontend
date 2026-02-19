// GET /api/user-content/[id] - Get content
// PUT /api/user-content/[id] - Update content
// DELETE /api/user-content/[id] - Delete content

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { canViewContent, canEditContent, canDeleteContent } from '@/lib/permissions/user-content';
import { prisma } from '@/lib/database/prisma';

export async function GET(request, { params }) {
  const user = await getAuthenticatedUser(request); // Optional
  const { id } = params;
  
  // Check view permission
  const canView = await canViewContent(user?.id, id);
  if (!canView) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  const content = await prisma.userContent.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, username: true, name: true },
      },
    },
  });
  
  return NextResponse.json({ content });
}

export async function PUT(request, { params }) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const { id } = params;
  
  // Check edit permission
  const canEdit = await canEditContent(user.id, id);
  if (!canEdit) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  const body = await request.json();
  const { title, content, visibility } = body;
  
  // Validate visibility if provided
  if (visibility) {
    const validVisibility = ['public', 'followers_only', 'collaborators_only', 'private'];
    if (!validVisibility.includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility level' },
        { status: 400 }
      );
    }
  }
  
  const updated = await prisma.userContent.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(visibility !== undefined && { visibility }),
    },
    include: {
      user: {
        select: { id: true, username: true, name: true },
      },
    },
  });
  
  return NextResponse.json({ content: updated });
}

export async function DELETE(request, { params }) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const { id } = params;
  
  // Check delete permission
  const canDelete = await canDeleteContent(user.id, id);
  if (!canDelete) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Soft delete
  await prisma.userContent.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  
  return NextResponse.json({ message: 'Content deleted' });
}

