import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';

const CHILD_SELECT = {
  id: true,
  xref: true,
  fullName: true,
  sex: true,
  birthDateDisplay: true,
  birthPlaceDisplay: true,
  birthYear: true,
};

export async function GET(request, { params }) {
  try {
    const { treeId, id } = await params;
    const { fileUuid, error } = await resolveTreeAuthz(request, treeId, 'family');
    if (error) return error;

    const family = await prisma.gedcomFamily.findFirst({
      where: { fileUuid, id },
      include: {
        husband: { select: { id: true, xref: true, fullName: true } },
        wife: { select: { id: true, xref: true, fullName: true } },
        marriageDate: { select: { original: true, year: true, month: true, day: true } },
        marriagePlace: { select: { original: true, name: true } },
        divorceDate: { select: { original: true, year: true, month: true, day: true } },
        divorcePlace: { select: { original: true, name: true } },
        familyChildren: {
          select: { birthOrder: true, child: { select: CHILD_SELECT } },
          orderBy: { birthOrder: 'asc' },
        },
        familyEvents: {
          include: {
            event: {
              include: { date: true, place: true },
            },
          },
        },
        familyNotes: {
          include: { note: { select: { id: true, xref: true, content: true } } },
        },
        familySources: {
          include: { source: { select: { id: true, xref: true, title: true, author: true } } },
        },
        familyMedia: {
          include: { media: { select: { id: true, xref: true, fileRef: true, form: true, title: true } } },
        },
      },
    });

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    const divorceDateDisplay = family.divorceDate?.original ?? null;
    const divorcePlaceDisplay = family.divorcePlace?.original || family.divorcePlace?.name || null;
    const children = (family.familyChildren || []).map((fc) => fc.child).filter(Boolean);
    const events = (family.familyEvents || []).map((fe) => ({ ...fe.event, _source: 'family' }));
    const notes = (family.familyNotes || []).map((fn) => fn.note).filter(Boolean);
    const media = (family.familyMedia || []).map((fm) => fm.media).filter(Boolean);
    const sources = (family.familySources || []).map((fs) => fs.source).filter(Boolean);

    return NextResponse.json({
      data: {
        ...family,
        divorceDateDisplay,
        divorcePlaceDisplay,
        children,
        allEvents: events,
        notes,
        media,
        sources,
      },
    });
  } catch (err) {
    console.error('Family detail error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
