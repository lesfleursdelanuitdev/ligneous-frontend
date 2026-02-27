/**
 * Update individual names (given names + surnames with name types).
 * Uses NameForm model: individual -> name forms -> given names, surnames.
 * Used by the PATCH handler for individual overview edits.
 */

import { prisma } from '@/lib/database/prisma';

const NAME_TYPE_OPTIONS = ['birth', 'maiden', 'married', 'aka', 'immigrant', 'professional', 'other'];
const DEFAULT_NAME_TYPE = 'birth';

function normalizeForLookup(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Update given names and surnames for an individual via NameForm model.
 *
 * @param {object} tx - Prisma transaction client
 * @param {string} fileUuid - GEDCOM file UUID
 * @param {string} individualId - Individual UUID
 * @param {{ value: string }[]} givenNames - Array of given name objects (from primary block)
 * @param {{ value: string, nameType?: string, isPrimary?: boolean }[]} surnames - Array of surname objects
 * @returns {Promise<{ fullName: string }>} Computed full name from primary parts
 */
export async function updateIndividualNames(tx, fileUuid, individualId, givenNames, surnames) {
  const validGiven = (givenNames || []).filter((g) => g?.value?.trim());
  const validSurnames = (surnames || []).filter((s) => s?.value?.trim());

  // Delete existing name forms (cascade deletes NameFormGivenName and NameFormSurname)
  await tx.gedcomIndividualNameForm.deleteMany({
    where: { fileUuid, individualId },
  });

  if (validGiven.length === 0 && validSurnames.length === 0) {
    return { fullName: null };
  }

  // Group surnames by nameType; track which is primary
  const surnameByType = new Map();
  let primaryNameType = null;
  for (const s of validSurnames) {
    const nt = NAME_TYPE_OPTIONS.includes(s.nameType) ? s.nameType : DEFAULT_NAME_TYPE;
    if (!surnameByType.has(nt)) {
      surnameByType.set(nt, []);
    }
    surnameByType.get(nt).push(s);
    if (s.isPrimary) primaryNameType = nt;
  }
  if (!primaryNameType && validSurnames.length) {
    primaryNameType = validSurnames[0].nameType && NAME_TYPE_OPTIONS.includes(validSurnames[0].nameType)
      ? validSurnames[0].nameType
      : DEFAULT_NAME_TYPE;
  }
  if (!primaryNameType && validGiven.length) primaryNameType = DEFAULT_NAME_TYPE;

  const nameTypes = Array.from(surnameByType.keys());
  if (nameTypes.length === 0 && validGiven.length) nameTypes.push(DEFAULT_NAME_TYPE);

  let primarySurname = null;
  let sortOrder = 0;

  for (const nameType of nameTypes) {
    const isPrimary = nameType === primaryNameType;
    const typeSurnames = surnameByType.get(nameType) || [];

    const nf = await tx.gedcomIndividualNameForm.create({
      data: {
        fileUuid,
        individualId,
        nameType: nameType,
        isPrimary,
        sortOrder: sortOrder++,
      },
    });

    // Add given names to primary form (or to the only form if no surnames)
    if (isPrimary && validGiven.length) {
      for (let i = 0; i < validGiven.length; i++) {
        const v = validGiven[i].value.trim();
        const lower = normalizeForLookup(v);
        if (!lower) continue;

        const gn = await tx.gedcomGivenName.upsert({
          where: { fileUuid_givenNameLower: { fileUuid, givenNameLower: lower } },
          create: { fileUuid, givenName: v, givenNameLower: lower },
          update: {},
        });

        await tx.gedcomNameFormGivenName.create({
          data: {
            fileUuid,
            nameFormId: nf.id,
            givenNameId: gn.id,
            position: i + 1,
          },
        });
      }
    }

    // Add surnames for this form
    for (let i = 0; i < typeSurnames.length; i++) {
      const { value } = typeSurnames[i];
      const v = value.trim();
      const lower = normalizeForLookup(v);
      if (!lower) continue;

      const sn = await tx.gedcomSurname.upsert({
        where: { fileUuid_surnameLower: { fileUuid, surnameLower: lower } },
        create: { fileUuid, surname: v, surnameLower: lower },
        update: {},
      });

      await tx.gedcomNameFormSurname.create({
        data: {
          fileUuid,
          nameFormId: nf.id,
          surnameId: sn.id,
          position: i + 1,
        },
      });
      if (isPrimary && i === 0) primarySurname = v;
    }
  }
  if (!primarySurname && validSurnames.length) {
    primarySurname = validSurnames.find((s) => s.value?.trim())?.value?.trim() || null;
  }

  const givenStr = validGiven.map((g) => g.value.trim()).join(' ').trim();
  const surnameStr = primarySurname || '';
  const fullName = [givenStr, surnameStr].filter(Boolean).join(' ') || null;

  return { fullName };
}
