import { prisma } from '@/lib/database/prisma';
import { resolveTreeAccess, parsePagination, paginatedResponse } from '@/lib/tree-access';

function buildContext(counts) {
  const parts = [];
  if (counts.individualBirthDates > 0) parts.push({ type: 'birth', count: counts.individualBirthDates });
  if (counts.individualDeathDates > 0) parts.push({ type: 'death', count: counts.individualDeathDates });
  if (counts.familyMarriageDates > 0) parts.push({ type: 'marriage', count: counts.familyMarriageDates });
  if (counts.familyDivorceDates > 0)  parts.push({ type: 'divorce', count: counts.familyDivorceDates });
  if (counts.events > 0)              parts.push({ type: 'event', count: counts.events });
  return parts.length > 0 ? parts : null;
}

export async function GET(request, { params }) {
  try {
    const { treeId } = await params;
    const { fileUuid, error } = await resolveTreeAccess(request, treeId);
    if (error) return error;

    const url = new URL(request.url);
    const { limit, offset, search } = parsePagination(url);
    const year = url.searchParams.get('year');
    const type = url.searchParams.get('type');
    const context = url.searchParams.get('context'); // birth, death, marriage, divorce, event
    const advancedConditionsJson = url.searchParams.get('advanced_conditions');

    const where = { fileUuid };
    if (context === 'birth') where.individualBirthDates = { some: {} };
    else if (context === 'death') where.individualDeathDates = { some: {} };
    else if (context === 'marriage') where.familyMarriageDates = { some: {} };
    else if (context === 'divorce') where.familyDivorceDates = { some: {} };
    else if (context === 'event') where.events = { some: {} };
    if (search) where.original = { contains: search, mode: 'insensitive' };
    if (year) where.year = parseInt(year, 10) || undefined;
    if (type) where.dateType = type.toUpperCase();

    let advancedConditions = [];
    try {
      if (advancedConditionsJson) advancedConditions = JSON.parse(advancedConditionsJson);
    } catch { advancedConditions = []; }
    const andParts = [];
    const fieldToDb = { original: 'original', year: 'year', month: 'month', day: 'day', date_type: 'dateType' };
    const numericFields = ['year', 'month', 'day'];
    for (const c of advancedConditions) {
      const dbField = fieldToDb[c.field];
      if (!dbField || !c.value?.trim?.()) continue;
      const val = c.value.trim();
      const op = c.operator || 'contains';
      if (dbField === 'original') {
        const mode = { mode: 'insensitive' };
        if (op === 'contains') andParts.push({ original: { contains: val, ...mode } });
        else if (op === 'not_contains') andParts.push({ NOT: { original: { contains: val, ...mode } } });
        else if (op === 'equals') andParts.push({ original: { equals: val, ...mode } });
        else if (op === 'not_equals') andParts.push({ NOT: { original: { equals: val, ...mode } } });
        else if (op === 'starts_with') andParts.push({ original: { startsWith: val, ...mode } });
        else if (op === 'ends_with') andParts.push({ original: { endsWith: val, ...mode } });
      } else if (numericFields.includes(c.field)) {
        const num = parseInt(val, 10);
        if (Number.isNaN(num)) continue;
        if (op === 'equals') andParts.push({ [dbField]: num });
        else if (op === 'not_equals') andParts.push({ NOT: { [dbField]: num } });
      } else if (c.field === 'date_type') {
        const t = val.toUpperCase();
        if (op === 'equals') andParts.push({ dateType: t });
        else if (op === 'not_equals') andParts.push({ NOT: { dateType: t } });
      }
    }
    if (andParts.length > 0) where.AND = andParts;

    const [dates, total] = await Promise.all([
      prisma.gedcomDate.findMany({
        where,
        select: {
          id: true, original: true, dateType: true, calendar: true,
          year: true, month: true, day: true,
          endYear: true, endMonth: true, endDay: true,
          _count: {
            select: {
              individualBirthDates: true,
              individualDeathDates: true,
              familyMarriageDates: true,
              familyDivorceDates: true,
              events: true,
            },
          },
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }, { day: 'asc' }],
        skip: offset,
        take: limit,
      }),
      prisma.gedcomDate.count({ where }),
    ]);

    const enriched = dates.map((d) => ({
      id: d.id,
      original: d.original,
      dateType: d.dateType,
      calendar: d.calendar,
      year: d.year,
      month: d.month,
      day: d.day,
      endYear: d.endYear,
      endMonth: d.endMonth,
      endDay: d.endDay,
      context: buildContext(d._count),
    }));

    return paginatedResponse(enriched, total, limit, offset);
  } catch (err) {
    console.error('Dates list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
