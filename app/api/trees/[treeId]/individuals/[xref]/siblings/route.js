import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess } from '@/lib/tree-access';

export async function GET(request, { params }) {
  try {
    const { treeId, xref } = await params;
    const { fileUuid, error } = await resolveTreeAccess(request, treeId);
    if (error) return error;

    const individual = await prisma.gedcomIndividual.findFirst({
      where: { fileUuid, xref },
      select: { id: true },
    });
    if (!individual) {
      return NextResponse.json({ error: 'Individual not found' }, { status: 404 });
    }

    // Find parents of this individual
    const parentRels = await prisma.gedcomParentChild.findMany({
      where: { fileUuid, childId: individual.id },
      select: { parentId: true },
    });

    if (parentRels.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const parentIds = parentRels.map((r) => r.parentId);

    // Find all children of those parents (siblings)
    const siblingRels = await prisma.gedcomParentChild.findMany({
      where: { fileUuid, parentId: { in: parentIds } },
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

    // Deduplicate and exclude self
    const seen = new Set();
    const siblings = [];
    for (const r of siblingRels) {
      if (r.child.id !== individual.id && !seen.has(r.child.id)) {
        seen.add(r.child.id);
        siblings.push(r.child);
      }
    }

    return NextResponse.json({ data: siblings });
  } catch (err) {
    console.error('Siblings error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
