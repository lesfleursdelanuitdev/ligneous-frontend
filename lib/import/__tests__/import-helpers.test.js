import { describe, expect, it } from 'vitest';
import { dedupeFamiliesByCouple } from '../import-helpers.js';

describe('dedupeFamiliesByCouple', () => {
  it('remaps duplicate couple FAM xrefs to one UUID and keeps richer row', () => {
    const indiXrefToUUID = { '@I1@': 'u1', '@I2@': 'u2' };
    const families = [
      {
        id: 'fam-a',
        xref: '@F1@',
        husband_xref: '@I1@',
        wife_xref: '@I2@',
        children_count: 0,
      },
      {
        id: 'fam-b',
        xref: '@F2@',
        husband_xref: '@I1@',
        wife_xref: '@I2@',
        children_count: 2,
      },
    ];
    const { families: out, famXrefToUUID, duplicateCoupleMergeCount } = dedupeFamiliesByCouple(
      families,
      indiXrefToUUID,
    );
    expect(duplicateCoupleMergeCount).toBe(1);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('fam-b');
    expect(out[0].children_count).toBe(2);
    expect(famXrefToUUID['@F1@']).toBe('fam-b');
    expect(famXrefToUUID['@F2@']).toBe('fam-b');
  });

  it('leaves incomplete families untouched', () => {
    const indiXrefToUUID = { '@I1@': 'u1' };
    const families = [
      { id: 'f1', xref: '@FA@', husband_xref: '@I1@', wife_xref: null, children_count: 0 },
    ];
    const { families: out, duplicateCoupleMergeCount } = dedupeFamiliesByCouple(
      families,
      indiXrefToUUID,
    );
    expect(duplicateCoupleMergeCount).toBe(0);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('f1');
  });
});
