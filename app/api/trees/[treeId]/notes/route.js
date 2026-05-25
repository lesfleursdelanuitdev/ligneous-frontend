import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';
import { parsePagination, paginatedResponse } from '@/lib/tree-access';

function clean(name) {
  if (!name) return null;
  return name.replace(/\//g, '').replace(/\s+/g, ' ').trim();
}

function buildLinkedTo(note) {
  const linked = [];

  for (const inNote of note.individualNotes || []) {
    linked.push({
      type: 'individual',
      xref: inNote.individual.xref,
      name: clean(inNote.individual.fullName),
    });
  }

  for (const fnNote of note.familyNotes || []) {
    const f = fnNote.family;
    linked.push({
      type: 'family',
      xref: f.xref,
      husbandXref: f.husband?.xref ?? null,
      husbandName: clean(f.husband?.fullName),
      wifeXref: f.wife?.xref ?? null,
      wifeName: clean(f.wife?.fullName),
    });
  }

  for (const enNote of note.eventNotes || []) {
    linked.push({
      type: 'event',
      eventType: enNote.event.eventType,
      customType: enNote.event.customType,
    });
  }

  for (const snNote of note.sourceNotes || []) {
    linked.push({
      type: 'source',
      xref: snNote.source.xref,
      title: snNote.source.title,
    });
  }

  return linked;
}

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { fileUuid, error } = await resolveTreeAuthz(request, treeId, 'note');
    if (error) return error;

    const url = new URL(request.url);
    const { limit, offset, search } = parsePagination(url);
    const topLevel = url.searchParams.get('top_level');

    const where = { fileUuid };
    if (topLevel === 'true') where.isTopLevel = true;
    if (topLevel === 'false') where.isTopLevel = false;
    if (search) where.content = { contains: search, mode: 'insensitive' };
    const advancedConditionsJson = url.searchParams.get('advanced_conditions');
    let advancedConditions = [];
    try { if (advancedConditionsJson) advancedConditions = JSON.parse(advancedConditionsJson); } catch { advancedConditions = []; }
    const andParts = [];
    const mode = { mode: 'insensitive' };
    for (const c of advancedConditions) {
      if (!c.value?.trim?.()) continue;
      const val = c.value.trim();
      const op = c.operator || 'contains';
      if (c.field === 'xref') {
        if (op === 'contains') andParts.push({ xref: { contains: val, ...mode } });
        else if (op === 'not_contains') andParts.push({ NOT: { xref: { contains: val, ...mode } } });
        else if (op === 'equals') andParts.push({ xref: { equals: val, ...mode } });
        else if (op === 'not_equals') andParts.push({ NOT: { xref: { equals: val, ...mode } } });
        else if (op === 'starts_with') andParts.push({ xref: { startsWith: val, ...mode } });
        else if (op === 'ends_with') andParts.push({ xref: { endsWith: val, ...mode } });
      } else if (c.field === 'content') {
        if (op === 'contains') andParts.push({ content: { contains: val, ...mode } });
        else if (op === 'not_contains') andParts.push({ NOT: { content: { contains: val, ...mode } } });
        else if (op === 'equals') andParts.push({ content: { equals: val, ...mode } });
        else if (op === 'not_equals') andParts.push({ NOT: { content: { equals: val, ...mode } } });
        else if (op === 'starts_with') andParts.push({ content: { startsWith: val, ...mode } });
        else if (op === 'ends_with') andParts.push({ content: { endsWith: val, ...mode } });
      }
    }
    if (andParts.length > 0) where.AND = andParts;

    const [notes, total] = await Promise.all([
      prisma.gedcomNote.findMany({
        where,
        select: {
          id: true, xref: true, content: true, isTopLevel: true,
          individualNotes: {
            select: {
              individual: { select: { xref: true, fullName: true } },
            },
          },
          familyNotes: {
            select: {
              family: {
                select: {
                  xref: true,
                  husband: { select: { xref: true, fullName: true } },
                  wife: { select: { xref: true, fullName: true } },
                },
              },
            },
          },
          eventNotes: {
            select: {
              event: { select: { id: true, eventType: true, customType: true } },
            },
          },
          sourceNotes: {
            select: {
              source: { select: { xref: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.gedcomNote.count({ where }),
    ]);

    const enriched = notes.map((n) => ({
      id: n.id,
      xref: n.xref,
      content: n.content,
      isTopLevel: n.isTopLevel,
      linkedTo: buildLinkedTo(n),
    }));

    return paginatedResponse(enriched, total, limit, offset);
  } catch (err) {
    console.error('Notes list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
