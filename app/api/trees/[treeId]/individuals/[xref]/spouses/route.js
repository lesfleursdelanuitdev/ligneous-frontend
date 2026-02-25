import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess } from '@/lib/tree-access';

export async function GET(request, { params }) {
  try {
    const { treeId, xref: rawXref } = await params;
    const xref = decodeURIComponent(rawXref);
    const { fileUuid, error } = await resolveTreeAccess(request, treeId);
    if (error) return error;

    const individual = await prisma.gedcomIndividual.findFirst({
      where: { fileUuid, xref },
      select: { id: true },
    });
    if (!individual) {
      return NextResponse.json({ error: 'Individual not found' }, { status: 404 });
    }

    const selectFields = {
      id: true, xref: true, fullName: true, sex: true,
      birthYear: true, birthDateDisplay: true, birthPlaceDisplay: true,
      deathYear: true, deathDateDisplay: true, deathPlaceDisplay: true,
      isLiving: true,
    };

    const [asIndi, asSpouse] = await Promise.all([
      prisma.gedcomSpouse.findMany({
        where: { fileUuid, individualId: individual.id },
        include: { spouse: { select: selectFields } },
      }),
      prisma.gedcomSpouse.findMany({
        where: { fileUuid, spouseId: individual.id },
        include: { individual: { select: selectFields } },
      }),
    ]);

    const seen = new Set();
    const spouses = [];
    for (const r of asIndi) {
      if (!seen.has(r.spouse.id)) { seen.add(r.spouse.id); spouses.push(r.spouse); }
    }
    for (const r of asSpouse) {
      if (!seen.has(r.individual.id)) { seen.add(r.individual.id); spouses.push(r.individual); }
    }

    return NextResponse.json({ data: spouses });
  } catch (err) {
    console.error('Spouses error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
