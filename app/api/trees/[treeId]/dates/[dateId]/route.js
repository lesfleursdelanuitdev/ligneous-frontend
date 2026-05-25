import { prisma } from '@/lib/database/prisma';
import { resolveTreeAuthz } from '@/lib/authz';

function stripSlashes(name) {
  if (!name) return null;
  return name.replace(/\//g, '').replace(/\s+/g, ' ').trim();
}

export async function GET(request, { params }) {
  try {
    const { treeId, dateId } = await params;
    const { fileUuid, error } = await resolveTreeAuthz(request, treeId, 'date');
    if (error) return error;

    const date = await prisma.gedcomDate.findFirst({
      where: { id: dateId, fileUuid },
      select: {
        id: true,
        original: true,
        dateType: true,
        calendar: true,
        year: true,
        month: true,
        day: true,
        endYear: true,
        endMonth: true,
        endDay: true,

        individualBirthDates: {
          select: {
            xref: true,
            fullName: true,
            sex: true,
            birthYear: true,
            birthPlaceDisplay: true,
          },
        },
        individualDeathDates: {
          select: {
            xref: true,
            fullName: true,
            sex: true,
            deathYear: true,
            deathPlaceDisplay: true,
          },
        },
        familyMarriageDates: {
          select: {
            xref: true,
            husband: { select: { xref: true, fullName: true } },
            wife: { select: { xref: true, fullName: true } },
            marriagePlaceDisplay: true,
          },
        },
        familyDivorceDates: {
          select: {
            xref: true,
            husband: { select: { xref: true, fullName: true } },
            wife: { select: { xref: true, fullName: true } },
          },
        },
        events: {
          select: {
            id: true,
            eventType: true,
            customType: true,
            value: true,
            cause: true,
            place: { select: { original: true } },
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
        },
      },
    });

    if (!date) {
      return new Response(JSON.stringify({ error: 'Date not found' }), { status: 404 });
    }

    const clean = (name) => stripSlashes(name);

    const births = date.individualBirthDates.map((i) => ({
      type: 'birth',
      label: 'Birth of ' + (clean(i.fullName) || 'Unknown'),
      individualXref: i.xref,
      individualName: clean(i.fullName),
      sex: i.sex,
      place: i.birthPlaceDisplay,
    }));

    const deaths = date.individualDeathDates.map((i) => ({
      type: 'death',
      label: 'Death of ' + (clean(i.fullName) || 'Unknown'),
      individualXref: i.xref,
      individualName: clean(i.fullName),
      sex: i.sex,
      place: i.deathPlaceDisplay,
    }));

    const marriages = date.familyMarriageDates.map((f) => {
      const h = clean(f.husband?.fullName);
      const w = clean(f.wife?.fullName);
      let label = 'Marriage';
      if (h && w) label = 'Marriage of ' + h + ' & ' + w;
      else if (h || w) label = 'Marriage of ' + (h || w);
      return {
        type: 'marriage',
        label,
        familyXref: f.xref,
        husbandName: h,
        wifeName: w,
        place: f.marriagePlaceDisplay,
      };
    });

    const divorces = date.familyDivorceDates.map((f) => {
      const h = clean(f.husband?.fullName);
      const w = clean(f.wife?.fullName);
      let label = 'Divorce';
      if (h && w) label = 'Divorce of ' + h + ' & ' + w;
      else if (h || w) label = 'Divorce of ' + (h || w);
      return { type: 'divorce', label, familyXref: f.xref, husbandName: h, wifeName: w };
    });

    const events = date.events.map((e) => {
      const participants = [
        ...e.individualEvents.map((ie) => ({
          type: 'individual',
          xref: ie.individual.xref,
          name: clean(ie.individual.fullName),
          role: ie.role,
        })),
        ...e.familyEvents.map((fe) => ({
          type: 'family',
          xref: fe.family.xref,
          husbandName: clean(fe.family.husband?.fullName),
          wifeName: clean(fe.family.wife?.fullName),
        })),
      ];
      return {
        type: 'event',
        eventType: e.eventType,
        customType: e.customType,
        label: e.customType || e.eventType || 'Event',
        value: e.value,
        cause: e.cause,
        place: e.place?.original,
        participants,
      };
    });

    const linkedEvents = [...births, ...deaths, ...marriages, ...divorces, ...events];

    return Response.json({
      date: {
        id: date.id,
        original: date.original,
        dateType: date.dateType,
        calendar: date.calendar,
        year: date.year,
        month: date.month,
        day: date.day,
        endYear: date.endYear,
        endMonth: date.endMonth,
        endDay: date.endDay,
      },
      linkedEvents,
      totalEvents: linkedEvents.length,
    });
  } catch (err) {
    console.error('Date detail error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
