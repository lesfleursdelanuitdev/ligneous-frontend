import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess } from '@/lib/tree-access';

export async function GET(request, { params }) {
  try {
    const { treeId, xref } = await params;
    const { fileUuid, error } = await resolveTreeAccess(request, treeId);
    if (error) return error;

    const child = await prisma.gedcomIndividual.findFirst({
      where: { fileUuid, xref },
      select: { id: true },
    });
    if (!child) {
      return NextResponse.json({ error: 'Individual not found' }, { status: 404 });
    }

    const parentRels = await prisma.gedcomParentChild.findMany({
      where: { fileUuid, childId: child.id },
      include: {
        parent: {
          select: {
            id: true, xref: true, fullName: true, sex: true,
            birthYear: true, birthDateDisplay: true, birthPlaceDisplay: true,
            deathYear: true, deathDateDisplay: true, deathPlaceDisplay: true,
            isLiving: true,
          },
        },
      },
    });

    const parents = parentRels.map((r) => ({
      ...r.parent,
      parentType: r.parentType,
      relationshipType: r.relationshipType,
    }));

    return NextResponse.json({ data: parents });
  } catch (err) {
    console.error('Parents error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
