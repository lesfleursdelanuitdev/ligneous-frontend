import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';

export async function GET(request, { params }) {
  try {
    const { treeId, xref: rawXref } = await params;
    const xref = decodeURIComponent(rawXref);
    const { fileUuid, error } = await resolveTreeAuthz(request, treeId, 'individual');
    if (error) return error;

    const parent = await prisma.gedcomIndividual.findFirst({
      where: { fileUuid, xref },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json({ error: 'Individual not found' }, { status: 404 });
    }

    const childRels = await prisma.gedcomParentChild.findMany({
      where: { fileUuid, parentId: parent.id },
      include: {
        child: {
          select: {
            id: true, xref: true, fullName: true, sex: true,
            birthYear: true, birthDateDisplay: true, birthPlaceDisplay: true,
            deathYear: true, deathDateDisplay: true, deathPlaceDisplay: true,
            isLiving: true,
          },
        },
      },
    });

    const children = childRels.map((r) => ({
      ...r.child,
      relationshipType: r.relationshipType,
    }));

    return NextResponse.json({ data: children });
  } catch (err) {
    console.error('Children error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
