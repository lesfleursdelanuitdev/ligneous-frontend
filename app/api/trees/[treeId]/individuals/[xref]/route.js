import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess } from '@/lib/tree-access';
import { updateIndividualNames } from '@/lib/individuals/update-names';

const CHILD_SELECT = {
  xref: true, fullName: true, sex: true,
  birthDateDisplay: true, birthPlaceDisplay: true, birthYear: true,
  birthDate: { select: { year: true, month: true, day: true, original: true } },
  birthPlace: { select: { original: true, name: true } },
  deathDateDisplay: true, isLiving: true,
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request, { params }) {
  try {
    const { treeId, xref: rawXref } = await params;
    let identifier;
    try {
      identifier = rawXref;
      let prev = '';
      while (prev !== identifier) {
        prev = identifier;
        identifier = decodeURIComponent(identifier);
      }
    } catch (decodeErr) {
      throw decodeErr;
    }
    const { fileUuid, error } = await resolveTreeAccess(request, treeId);
    if (error) return error;
    const isUuid = UUID_REGEX.test(identifier);
    const where = isUuid
      ? { fileUuid, id: identifier }
      : { fileUuid, xref: identifier };

    const individual = await prisma.gedcomIndividual.findFirst({
      where,
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
        individualNameForms: {
          include: {
            givenNames: {
              include: { givenName: { select: { id: true, givenName: true } } },
              orderBy: { position: 'asc' },
            },
            surnames: {
              include: { surname: { select: { id: true, surname: true } } },
              orderBy: { position: 'asc' },
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { isPrimary: 'desc' }],
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

    const xref = individual.xref;

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
    const body = { error: 'Internal server error' };
    return new Response(JSON.stringify(body), { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { treeId, xref: rawXref } = await params;
    let identifier = rawXref;
    try {
      let prev = '';
      while (prev !== identifier) {
        prev = identifier;
        identifier = decodeURIComponent(identifier);
      }
    } catch {
      // keep identifier as-is
    }

    const { fileUuid, error } = await resolveTreeAccess(request, treeId, 'write');
    if (error) return error;

    const body = await request.json();
    const validSex = ['M', 'F', 'U', 'X'].includes(body.sex) ? body.sex : body.sex === '' ? null : undefined;
    if (validSex === undefined && body.sex !== undefined) {
      return NextResponse.json({ error: 'Invalid sex value' }, { status: 400 });
    }

    const updateData = {};
    if (body.sex !== undefined) updateData.sex = validSex;
    if (body.gender !== undefined) updateData.gender = body.gender && body.gender.trim() ? body.gender.trim() : null;
    if (body.isLiving !== undefined) updateData.isLiving = Boolean(body.isLiving);
    if (body.occupation !== undefined) updateData.occupation = body.occupation && body.occupation.trim() ? body.occupation.trim() : null;
    if (body.religion !== undefined) updateData.religion = body.religion && body.religion.trim() ? body.religion.trim() : null;
    if (body.nationality !== undefined) updateData.nationality = body.nationality && body.nationality.trim() ? body.nationality.trim() : null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const where = isUuid ? { fileUuid, id: identifier } : { fileUuid, xref: identifier };

    const individualRecord = await prisma.gedcomIndividual.findFirst({
      where,
      select: { id: true },
    });
    if (!individualRecord) {
      return NextResponse.json({ error: 'Individual not found' }, { status: 404 });
    }
    const individualId = individualRecord.id;

    // If names are provided, update them in a transaction
    if (Array.isArray(body.givenNames) || Array.isArray(body.surnames)) {
      await prisma.$transaction(async (tx) => {
        const { fullName } = await updateIndividualNames(
          tx,
          fileUuid,
          individualId,
          body.givenNames || [],
          body.surnames || [],
        );
        if (fullName !== null) {
          updateData.fullName = fullName;
          updateData.fullNameLower = fullName.toLowerCase();
        }
      });
    }

    const individual = await prisma.gedcomIndividual.updateMany({
      where,
      data: updateData,
    });

    if (individual.count === 0) {
      return NextResponse.json({ error: 'Individual not found' }, { status: 404 });
    }

    return NextResponse.json({ data: { updated: true } });
  } catch (err) {
    console.error('Individual PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
