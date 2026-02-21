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
      include: {
        birthDate: true,
        birthPlace: true,
        deathDate: true,
        deathPlace: true,
        individualEvents: {
          include: { event: { include: { date: true, place: true } } },
          orderBy: { event: { sortOrder: 'asc' } },
        },
        individualNotes: {
          include: { note: { select: { id: true, xref: true, content: true } } },
        },
        individualSources: {
          include: { source: { select: { id: true, xref: true, title: true, author: true } } },
        },
        individualSurnames: {
          include: { surname: { select: { id: true, surname: true } } },
        },
        individualGivenNames: {
          include: { givenName: { select: { id: true, givenName: true } } },
        },
        individualMedia: {
          include: { media: { select: { id: true, xref: true, fileRef: true, form: true, title: true } } },
        },
        husbandInFamilies: {
          select: { id: true, xref: true, wifeXref: true, wife: { select: { xref: true, fullName: true } }, childrenCount: true, marriageDateDisplay: true },
        },
        wifeInFamilies: {
          select: { id: true, xref: true, husbandXref: true, husband: { select: { xref: true, fullName: true } }, childrenCount: true, marriageDateDisplay: true },
        },
      },
    });

    if (!individual) {
      return NextResponse.json({ error: 'Individual not found' }, { status: 404 });
    }

    return NextResponse.json({ data: individual });
  } catch (err) {
    console.error('Individual detail error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
