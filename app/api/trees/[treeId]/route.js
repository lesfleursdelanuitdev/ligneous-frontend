import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/middleware';
import { isTreeOwner } from '@ligneous/authz';
import { prisma } from '@/lib/database/prisma';

export async function DELETE(request, { params }) {
  try {
    const { treeId } = await params;
    if (!treeId) return NextResponse.json({ error: 'Tree ID is required' }, { status: 400 });

    const { user } = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const owner = await isTreeOwner(user.id, treeId, prisma);
    if (!owner) {
      return NextResponse.json({ error: 'Only the tree owner can delete this tree' }, { status: 403 });
    }

    await prisma.tree.delete({ where: { id: treeId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE tree error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
