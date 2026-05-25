/**
 * Shared helpers for GEDCOM import.
 *
 * Pure utility functions and a generic junction-table inserter used by
 * gedcom-import.js to cut down on repetitive createMany boilerplate.
 */

// ---------------------------------------------------------------------------
// XREF / index resolution
// ---------------------------------------------------------------------------

export function buildXrefMap(entities) {
  const map = {};
  for (const e of entities || []) {
    if (e.xref && e.id) map[e.xref] = e.id;
  }
  return map;
}

/**
 * Multiple FAM records for the same resolved couple cannot be stored once the DB
 * enforces a partial unique index on (file_uuid, husband_id, wife_id).
 *
 * Keeps one family per couple (prefer more `children_count`, then earlier in file),
 * remaps every FAM xref to that row's UUID, and bumps `children_count` on the keeper
 * by summing duplicate rows' counts (CHIL edges still attach via xref remap).
 *
 * @param {object[]} families - enriched Families slice
 * @param {Record<string,string>} indiXrefToUUID
 * @returns {{ families: object[], famXrefToUUID: Record<string,string>, duplicateCoupleMergeCount: number }}
 */
export function dedupeFamiliesByCouple(families, indiXrefToUUID) {
  const original = families || [];
  /** @type {Record<string,string>} */
  const famXrefToUUID = {};
  /** @type {object[]} */
  const incomplete = [];
  /** @type {Map<string, { fam: object, index: number }[]>} */
  const coupleGroups = new Map();

  for (let i = 0; i < original.length; i++) {
    const fam = original[i];
    const h = fam.husband_xref ? indiXrefToUUID[fam.husband_xref] || null : null;
    const w = fam.wife_xref ? indiXrefToUUID[fam.wife_xref] || null : null;
    if (h && w) {
      const key = `${h}\t${w}`;
      if (!coupleGroups.has(key)) coupleGroups.set(key, []);
      coupleGroups.get(key).push({ fam, index: i });
    } else {
      incomplete.push(fam);
      if (fam.xref && fam.id) famXrefToUUID[fam.xref] = fam.id;
    }
  }

  /** @type {object[]} */
  const dedupedComplete = [];
  let duplicateCoupleMergeCount = 0;

  for (const members of coupleGroups.values()) {
    members.sort((a, b) => {
      const ca = a.fam.children_count || 0;
      const cb = b.fam.children_count || 0;
      if (cb !== ca) return cb - ca;
      return a.index - b.index;
    });
    const keeper = members[0].fam;
    let totalChildren = 0;
    for (const { fam } of members) {
      famXrefToUUID[fam.xref] = keeper.id;
      totalChildren += fam.children_count || 0;
    }
    if (members.length > 1) duplicateCoupleMergeCount += members.length - 1;
    dedupedComplete.push({
      ...keeper,
      children_count: Math.max(keeper.children_count || 0, totalChildren),
    });
  }

  return {
    families: [...incomplete, ...dedupedComplete],
    famXrefToUUID,
    duplicateCoupleMergeCount,
  };
}

export function safeId(ids, index) {
  return index >= 0 && index < ids.length && ids[index];
}

export function findByIndex(arr, index) {
  return index >= 0 && index < arr.length ? arr[index] : null;
}

// ---------------------------------------------------------------------------
// Enum mappers
// ---------------------------------------------------------------------------

const DATE_TYPE_MAP = {
  EXACT: 'EXACT',
  ABOUT: 'ABOUT',
  BEFORE: 'BEFORE',
  AFTER: 'AFTER',
  BETWEEN: 'BETWEEN',
  CALCULATED: 'CALCULATED',
  ESTIMATED: 'ESTIMATED',
  FROM_TO: 'FROM_TO',
  UNKNOWN: 'UNKNOWN',
};

export function mapDateType(type) {
  return DATE_TYPE_MAP[type] || 'UNKNOWN';
}

export function mapSex(sex) {
  if (!sex) return null;
  const s = sex.toUpperCase();
  if (['M', 'F', 'U', 'X'].includes(s)) return s;
  return null;
}

// ---------------------------------------------------------------------------
// Generic junction-table inserter
// ---------------------------------------------------------------------------

/**
 * Insert rows into a junction (or edge) table, skipping duplicates.
 *
 * @param {object}   tx        Prisma transaction client
 * @param {object}   model     Prisma delegate, e.g. tx.gedcomIndividualEvent
 * @param {any[]}    items     Raw enriched-document array for this junction
 * @param {Function} filterFn  (item) => boolean — drop unresolvable rows
 * @param {Function} mapFn     (item) => Prisma create data object
 */
export async function insertJunction(tx, model, items, filterFn, mapFn) {
  if (!items.length) return;
  const data = items.filter(filterFn).map(mapFn);
  if (!data.length) return;
  await model.createMany({ data, skipDuplicates: true });
}
