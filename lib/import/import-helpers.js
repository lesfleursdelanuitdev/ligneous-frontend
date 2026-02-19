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
