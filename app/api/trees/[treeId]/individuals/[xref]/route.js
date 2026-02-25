import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess } from '@/lib/tree-access';

const CHILD_SELECT = {
  xref: true, fullName: true, sex: true,
  birthDateDisplay: true, birthPlaceDisplay: true, birthYear: true,
  birthDate: { select: { year: true, month: true, day: true, original: true } },
  birthPlace: { select: { original: true, name: true } },
  deathDateDisplay: true, isLiving: true,
};

export async function GET(request, { params }) {
  try {
    const { treeId, xref: rawXref } = await params;
    const xref = decodeURIComponent(rawXref);
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
          select: {
            id: true, xref: true,
            husbandXref: true, wifeXref: true,
            husband: { select: { xref: true, fullName: true } },
            wife: { select: { xref: true, fullName: true } },
            childrenCount: true, marriageDateDisplay: true,
            familyChildren: {
              select: { birthOrder: true, child: { select: CHILD_SELECT } },
              orderBy: { birthOrder: 'asc' },
            },
            familyEvents: {
              include: { event: { include: { date: true, place: true } } },
            },
          },
        },
        wifeInFamilies: {
          select: {
            id: true, xref: true,
            husbandXref: true, wifeXref: true,
            husband: { select: { xref: true, fullName: true } },
            wife: { select: { xref: true, fullName: true } },
            childrenCount: true, marriageDateDisplay: true,
            familyChildren: {
              select: { birthOrder: true, child: { select: CHILD_SELECT } },
              orderBy: { birthOrder: 'asc' },
            },
            familyEvents: {
              include: { event: { include: { date: true, place: true } } },
            },
          },
        },
        familyChildAsChild: {
          include: {
            family: {
              select: {
                id: true, xref: true,
                husbandXref: true, husband: { select: { xref: true, fullName: true } },
                wifeXref: true, wife: { select: { xref: true, fullName: true } },
                marriageDateDisplay: true, childrenCount: true,
                familyChildren: {
                  select: { birthOrder: true, child: { select: CHILD_SELECT } },
                  orderBy: { birthOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!individual) {
      return NextResponse.json({ error: 'Individual not found' }, { status: 404 });
    }

    // Compute siblings: other children in families of origin
    const siblingMap = new Map();
    for (const fc of individual.familyChildAsChild || []) {
      for (const ch of fc.family?.familyChildren || []) {
        const c = ch.child;
        if (c && c.xref !== xref && !siblingMap.has(c.xref)) {
          siblingMap.set(c.xref, c);
        }
      }
    }

    // Merge individual events + family events into a single timeline
    const indivEvents = (individual.individualEvents || []).map((ie) => ({
      ...ie.event,
      _source: 'individual',
    }));

    const spouseFamilies = [
      ...(individual.husbandInFamilies || []),
      ...(individual.wifeInFamilies || []),
    ];
    const famEvents = [];
    const seenEventIds = new Set(indivEvents.map((e) => e.id));
    for (const fam of spouseFamilies) {
      const spouseName = fam.husbandXref === xref
        ? fam.wife?.fullName
        : fam.husband?.fullName;
      for (const fe of fam.familyEvents || []) {
        if (!seenEventIds.has(fe.event.id)) {
          seenEventIds.add(fe.event.id);
          famEvents.push({
            ...fe.event,
            _source: 'family',
            _familyXref: fam.xref,
            _spouseName: spouseName,
          });
        }
      }
    }

    // Derive "birth of children" events from spouse families
    const birthOfChildEvents = [];
    const seenChildXrefs = new Set();
    for (const fam of spouseFamilies) {
      for (const fc of fam.familyChildren || []) {
        const child = fc.child;
        if (!child || seenChildXrefs.has(child.xref)) continue;
        seenChildXrefs.add(child.xref);
        const dateObj = child.birthDate;
        const placeObj = child.birthPlace;
        const placeStr = placeObj?.original || placeObj?.name || child.birthPlaceDisplay;
        const dateForSort = dateObj
          ? { year: dateObj.year, month: dateObj.month, day: dateObj.day, original: dateObj.original }
          : child.birthYear ? { year: child.birthYear, month: null, day: null, original: child.birthDateDisplay } : null;
        birthOfChildEvents.push({
          id: `birth-of-child-${child.xref}`,
          eventType: 'BIRTH_OF_CHILD',
          date: dateForSort,
          place: placeStr ? { original: placeStr, name: placeStr } : null,
          _source: 'birth_of_child',
          _childName: child.fullName,
          _childXref: child.xref,
        });
      }
    }

    const allEvents = [...indivEvents, ...famEvents, ...birthOfChildEvents].sort((a, b) => {
      const ya = a.date?.year ?? 9999;
      const yb = b.date?.year ?? 9999;
      if (ya !== yb) return ya - yb;
      const ma = a.date?.month ?? 99;
      const mb = b.date?.month ?? 99;
      if (ma !== mb) return ma - mb;
      const da = a.date?.day ?? 99;
      const db = b.date?.day ?? 99;
      return da - db;
    });

    return NextResponse.json({
      data: {
        ...individual,
        siblings: Array.from(siblingMap.values()),
        allEvents,
      },
    });
  } catch (err) {
    console.error('Individual detail error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
