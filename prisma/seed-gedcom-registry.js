/**
 * Seeds the gedcom_tags and event_types tables with standard GEDCOM 5.5.1 data.
 * Idempotent: skips if records already exist.
 */

/** @typedef {import('@prisma/client').PrismaClient} PrismaClient */

/** Standard GEDCOM tags: tag, label, scope (INDI|FAM|BOTH|OTHER) */
const STANDARD_GEDCOM_TAGS = [
  { tag: 'BIRT', label: 'Birth', scope: 'INDI' },
  { tag: 'CHR', label: 'Christening', scope: 'INDI' },
  { tag: 'DEAT', label: 'Death', scope: 'INDI' },
  { tag: 'BURI', label: 'Burial', scope: 'INDI' },
  { tag: 'CREM', label: 'Cremation', scope: 'INDI' },
  { tag: 'ADOP', label: 'Adoption', scope: 'INDI' },
  { tag: 'BAPM', label: 'Baptism', scope: 'INDI' },
  { tag: 'BARM', label: 'Bar Mitzvah', scope: 'INDI' },
  { tag: 'BASM', label: 'Bat Mitzvah', scope: 'INDI' },
  { tag: 'BLES', label: 'Blessing', scope: 'INDI' },
  { tag: 'CHRA', label: 'Adult Christening', scope: 'INDI' },
  { tag: 'CONF', label: 'Confirmation', scope: 'INDI' },
  { tag: 'FCOM', label: 'First Communion', scope: 'INDI' },
  { tag: 'ORDN', label: 'Ordination', scope: 'INDI' },
  { tag: 'NATU', label: 'Naturalization', scope: 'INDI' },
  { tag: 'EMIG', label: 'Emigration', scope: 'INDI' },
  { tag: 'IMMI', label: 'Immigration', scope: 'INDI' },
  { tag: 'CENS', label: 'Census', scope: 'INDI' },
  { tag: 'PROB', label: 'Probate', scope: 'INDI' },
  { tag: 'WILL', label: 'Will', scope: 'INDI' },
  { tag: 'GRAD', label: 'Graduation', scope: 'INDI' },
  { tag: 'RETI', label: 'Retirement', scope: 'INDI' },
  { tag: 'RESI', label: 'Residence', scope: 'INDI' },
  { tag: 'OCCU', label: 'Occupation', scope: 'INDI' },
  { tag: 'EDUC', label: 'Education', scope: 'INDI' },
  { tag: 'EVEN', label: 'Event', scope: 'BOTH' },
  { tag: 'CAST', label: 'Caste', scope: 'INDI' },
  { tag: 'DSCR', label: 'Physical Description', scope: 'INDI' },
  { tag: 'NATI', label: 'Nationality', scope: 'INDI' },
  { tag: 'PROP', label: 'Property', scope: 'INDI' },
  { tag: 'RELI', label: 'Religion', scope: 'INDI' },
  { tag: 'TITL', label: 'Title', scope: 'INDI' },
  { tag: 'MARR', label: 'Marriage', scope: 'FAM' },
  { tag: 'ANUL', label: 'Annulment', scope: 'FAM' },
  { tag: 'DIV', label: 'Divorce', scope: 'FAM' },
  { tag: 'DIVF', label: 'Divorce Filed', scope: 'FAM' },
  { tag: 'ENGA', label: 'Engagement', scope: 'FAM' },
  { tag: 'MARB', label: 'Marriage Bann', scope: 'FAM' },
  { tag: 'MARC', label: 'Marriage Contract', scope: 'FAM' },
  { tag: 'MARL', label: 'Marriage License', scope: 'FAM' },
  { tag: 'MARS', label: 'Marriage Settlement', scope: 'FAM' },
];

/** Standard event types: tag, label, ownerScope (INDI|FAM|BOTH) */
const STANDARD_EVENT_TYPES = [
  { tag: 'BIRT', label: 'Birth', ownerScope: 'INDI' },
  { tag: 'CHR', label: 'Christening', ownerScope: 'INDI' },
  { tag: 'DEAT', label: 'Death', ownerScope: 'INDI' },
  { tag: 'BURI', label: 'Burial', ownerScope: 'INDI' },
  { tag: 'CREM', label: 'Cremation', ownerScope: 'INDI' },
  { tag: 'ADOP', label: 'Adoption', ownerScope: 'INDI' },
  { tag: 'BAPM', label: 'Baptism', ownerScope: 'INDI' },
  { tag: 'BARM', label: 'Bar Mitzvah', ownerScope: 'INDI' },
  { tag: 'BASM', label: 'Bat Mitzvah', ownerScope: 'INDI' },
  { tag: 'BLES', label: 'Blessing', ownerScope: 'INDI' },
  { tag: 'CHRA', label: 'Adult Christening', ownerScope: 'INDI' },
  { tag: 'CONF', label: 'Confirmation', ownerScope: 'INDI' },
  { tag: 'FCOM', label: 'First Communion', ownerScope: 'INDI' },
  { tag: 'ORDN', label: 'Ordination', ownerScope: 'INDI' },
  { tag: 'NATU', label: 'Naturalization', ownerScope: 'INDI' },
  { tag: 'EMIG', label: 'Emigration', ownerScope: 'INDI' },
  { tag: 'IMMI', label: 'Immigration', ownerScope: 'INDI' },
  { tag: 'CENS', label: 'Census', ownerScope: 'INDI' },
  { tag: 'PROB', label: 'Probate', ownerScope: 'INDI' },
  { tag: 'WILL', label: 'Will', ownerScope: 'INDI' },
  { tag: 'GRAD', label: 'Graduation', ownerScope: 'INDI' },
  { tag: 'RETI', label: 'Retirement', ownerScope: 'INDI' },
  { tag: 'RESI', label: 'Residence', ownerScope: 'INDI' },
  { tag: 'OCCU', label: 'Occupation', ownerScope: 'INDI' },
  { tag: 'EDUC', label: 'Education', ownerScope: 'INDI' },
  { tag: 'EVEN', label: 'Event', ownerScope: 'BOTH' },
  { tag: 'CAST', label: 'Caste', ownerScope: 'INDI' },
  { tag: 'DSCR', label: 'Physical Description', ownerScope: 'INDI' },
  { tag: 'NATI', label: 'Nationality', ownerScope: 'INDI' },
  { tag: 'PROP', label: 'Property', ownerScope: 'INDI' },
  { tag: 'RELI', label: 'Religion', ownerScope: 'INDI' },
  { tag: 'TITL', label: 'Title', ownerScope: 'INDI' },
  { tag: 'MARR', label: 'Marriage', ownerScope: 'FAM' },
  { tag: 'ANUL', label: 'Annulment', ownerScope: 'FAM' },
  { tag: 'DIV', label: 'Divorce', ownerScope: 'FAM' },
  { tag: 'DIVF', label: 'Divorce Filed', ownerScope: 'FAM' },
  { tag: 'ENGA', label: 'Engagement', ownerScope: 'FAM' },
  { tag: 'MARB', label: 'Marriage Bann', ownerScope: 'FAM' },
  { tag: 'MARC', label: 'Marriage Contract', ownerScope: 'FAM' },
  { tag: 'MARL', label: 'Marriage License', ownerScope: 'FAM' },
  { tag: 'MARS', label: 'Marriage Settlement', ownerScope: 'FAM' },
];

/**
 * @param {PrismaClient} prisma
 */
export async function seedGedcomRegistry(prisma) {
  const tagCount = await prisma.gedcomTag.count({ where: { fileUuid: null } });
  if (tagCount > 0) {
    console.log('✅ GedcomTags already seeded; skipping.');
  } else {
    for (let i = 0; i < STANDARD_GEDCOM_TAGS.length; i++) {
      const { tag, label, scope } = STANDARD_GEDCOM_TAGS[i];
      const existing = await prisma.gedcomTag.findFirst({ where: { tag, fileUuid: null } });
      if (!existing) {
        await prisma.gedcomTag.create({
          data: { tag, label, scope, isCustom: false, sortOrder: i },
        });
      }
    }
    console.log('✅ Seeded', STANDARD_GEDCOM_TAGS.length, 'GedcomTags');
  }

  const eventTypeCount = await prisma.eventType.count({ where: { fileUuid: null } });
  if (eventTypeCount > 0) {
    console.log('✅ EventTypes already seeded; skipping.');
  } else {
    for (let i = 0; i < STANDARD_EVENT_TYPES.length; i++) {
      const { tag, label, ownerScope } = STANDARD_EVENT_TYPES[i];
      const existing = await prisma.eventType.findFirst({ where: { tag, fileUuid: null } });
      if (!existing) {
        await prisma.eventType.create({
          data: { tag, label, ownerScope, isCustom: false, sortOrder: i },
        });
      }
    }
    console.log('✅ Seeded', STANDARD_EVENT_TYPES.length, 'EventTypes');
  }
}
