import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess, parsePagination, paginatedResponse } from '@/lib/tree-access';

function clean(name) {
  if (!name) return null;
  return name.replace(/\//g, '').replace(/\s+/g, ' ').trim();
}

function buildLinkedTo(event) {
  const linked = [];

  for (const ie of event.individualEvents || []) {
    linked.push({
      type: 'individual',
      xref: ie.individual.xref,
      name: clean(ie.individual.fullName),
      role: ie.role,
    });
  }

  for (const fe of event.familyEvents || []) {
    const f = fe.family;
    const h = clean(f.husband?.fullName);
    const w = clean(f.wife?.fullName);
    linked.push({
      type: 'family',
      xref: f.xref,
      husbandXref: f.husband?.xref ?? null,
      husbandName: h,
      wifeXref: f.wife?.xref ?? null,
      wifeName: w,
    });
  }

  return linked;
}

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { fileUuid, error } = await resolveTreeAccess(request, treeId);
    if (error) return error;

    const url = new URL(request.url);
    const { limit, offset, sort, order } = parsePagination(url, { maxLimit: 10000 });
    const type = url.searchParams.get('type') || url.searchParams.get('event_type');
    const yearFrom = url.searchParams.get('year_from');
    const yearTo = url.searchParams.get('year_to');

    const where = { fileUuid };
    if (type) where.eventType = type.toUpperCase();
    const advancedConditionsJson = url.searchParams.get('advanced_conditions');
    let advancedConditions = [];
    try { if (advancedConditionsJson) advancedConditions = JSON.parse(advancedConditionsJson); } catch { advancedConditions = []; }
    const andParts = [];
    const mode = { mode: 'insensitive' };
    for (const c of advancedConditions) {
      if (!c.value?.trim?.()) continue;
      const val = c.value.trim();
      const op = c.operator || 'contains';
      if (c.field === 'event_type') {
        const t = val.toUpperCase();
        if (op === 'equals') andParts.push({ eventType: t });
        else if (op === 'not_equals') andParts.push({ NOT: { eventType: t } });
        else if (op === 'contains') andParts.push({ eventType: { contains: t, ...mode } });
        else if (op === 'not_contains') andParts.push({ NOT: { eventType: { contains: t, ...mode } } });
      } else if (c.field === 'custom_type') {
        if (op === 'contains') andParts.push({ customType: { contains: val, ...mode } });
        else if (op === 'not_contains') andParts.push({ NOT: { customType: { contains: val, ...mode } } });
        else if (op === 'equals') andParts.push({ customType: { equals: val, ...mode } });
        else if (op === 'not_equals') andParts.push({ NOT: { customType: { equals: val, ...mode } } });
      } else if (c.field === 'place') {
        if (op === 'contains') andParts.push({ place: { original: { contains: val, ...mode } } });
        else if (op === 'not_contains') andParts.push({ NOT: { place: { original: { contains: val, ...mode } } } });
      } else if (c.field === 'year') {
        const num = parseInt(val, 10);
        if (Number.isNaN(num)) continue;
        if (op === 'equals') andParts.push({ date: { year: num } });
        else if (op === 'not_equals') andParts.push({ NOT: { date: { year: num } } });
      }
    }
    if (andParts.length > 0) where.AND = andParts;

    const [events, total] = await Promise.all([
      prisma.gedcomEvent.findMany({
        where,
        select: {
          id: true, eventType: true, customType: true,
          value: true, cause: true, agency: true, sortOrder: true,
          date: { select: { id: true, original: true, year: true, month: true, day: true, dateType: true } },
          place: { select: { id: true, original: true, name: true, country: true } },
          individualEvents: {
            select: {
              role: true,
              individual: { select: { xref: true, fullName: true } },
            },
          },
          familyEvents: {
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
        },
        orderBy: sort === 'date'
          ? [
              { date: { year: order } },
              { date: { month: order } },
              { date: { day: order } },
              { sortOrder: 'asc' },
            ]
          : sort === 'place'
            ? { place: { original: order } }
            : sort === 'event_type'
              ? { eventType: order }
              : { sortOrder: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.gedcomEvent.count({ where }),
    ]);

    let filtered = events;
    if (yearFrom || yearTo) {
      const from = yearFrom ? parseInt(yearFrom, 10) : -Infinity;
      const to = yearTo ? parseInt(yearTo, 10) : Infinity;
      filtered = events.filter((e) => {
        const y = e.date?.year;
        return y != null && y >= from && y <= to;
      });
    }

    const enriched = filtered.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      customType: e.customType,
      value: e.value,
      cause: e.cause,
      agency: e.agency,
      sortOrder: e.sortOrder,
      date: e.date,
      place: e.place,
      linkedTo: buildLinkedTo(e),
    }));

    return paginatedResponse(enriched, total, limit, offset);
  } catch (err) {
    console.error('Events list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
