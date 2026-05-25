#!/usr/bin/env node
/**
 * Retrieve Pamela Ferreira family data (test script).
 * Run: node scripts/pamela-ferreira-family-retrieve.js
 */

import './load-env.js';
import { PrismaClient } from '@ligneous/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.database?.url || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TREE_NAME = 'Gonsalves Family Tree';
const PAMELA_XREF = '@I0143@';

async function main() {
  const tree = await prisma.tree.findFirst({
    where: { name: TREE_NAME },
    select: { gedcomFileId: true, name: true },
  });
  if (!tree?.gedcomFileId) {
    console.log('Tree not found');
    return;
  }
  const fileUuid = tree.gedcomFileId;
  console.log('Tree:', tree.name, '| fileUuid:', fileUuid);
  console.log('');

  const pamela = await prisma.gedcomIndividual.findFirst({
    where: { fileUuid, xref: PAMELA_XREF },
    include: {
      individualNameForms: { include: { givenNames: { include: { givenName: true } }, surnames: { include: { surname: true } } } },
      spouseAsIndividual: { include: { spouse: { select: { xref: true, fullName: true, birthDateDisplay: true, birthPlaceDisplay: true } } } },
      parentAsParent: { include: { child: { select: { xref: true, fullName: true, birthDateDisplay: true } } } },
      parentAsChild: { include: { parent: { select: { xref: true, fullName: true, birthDateDisplay: true, deathDateDisplay: true } } } },
    },
  });
  if (!pamela) {
    console.log('Pamela @I0143@ not found');
    return;
  }
  console.log('--- Pamela ---');
  console.log('xref:', pamela.xref, '| fullName:', pamela.fullName);
  console.log('hasSpouse:', pamela.hasSpouse, '| hasChildren:', pamela.hasChildren);
  console.log('Name forms:', pamela.individualNameForms.map((nf) => ({
    type: nf.nameType,
    given: nf.givenNames.map((g) => g.givenName?.givenName).join(' '),
    surname: nf.surnames.map((s) => s.surname?.surname).join(' '),
  })));
  console.log('Spouses:', pamela.spouseAsIndividual?.map((s) => s.spouse?.fullName + ' (' + s.spouse?.xref + ')') || []);
  console.log('Children (as parent):', pamela.parentAsParent?.map((p) => p.child?.fullName + ' (' + p.child?.xref + ') b. ' + p.child?.birthDateDisplay) || []);
  console.log('Parents:', pamela.parentAsChild?.map((pc) => (pc.parentType || '?') + ': ' + pc.parent?.fullName + ' (' + pc.parent?.xref + ')' + (pc.parent?.birthDateDisplay ? ' b. ' + pc.parent.birthDateDisplay : '') + (pc.parent?.deathDateDisplay ? ' d. ' + pc.parent.deathDateDisplay : '')) || []);
  console.log('');

  const joseph = await prisma.gedcomIndividual.findFirst({
    where: { fileUuid, fullNameLower: 'joseph /ferreira/' },
    include: {
      individualNameForms: { include: { givenNames: { include: { givenName: true } }, surnames: { include: { surname: true } } } },
      spouseAsIndividual: { include: { spouse: { select: { xref: true, fullName: true } } } },
      parentAsParent: { include: { child: { select: { xref: true, fullName: true, birthDateDisplay: true } } } },
    },
  });
  if (!joseph) {
    console.log('Joseph Ferreira not found');
  } else {
    console.log('--- Joseph Ferreira ---');
    console.log('xref:', joseph.xref, '| fullName:', joseph.fullName);
    console.log('Birth:', joseph.birthDateDisplay, joseph.birthPlaceDisplay);
    console.log('Spouses:', joseph.spouseAsIndividual?.map((s) => s.spouse?.fullName) || []);
    console.log('Children:', joseph.parentAsParent?.map((p) => p.child?.fullName + ' b. ' + p.child?.birthDateDisplay) || []);
    console.log('');
  }

  const olivia = await prisma.gedcomIndividual.findFirst({
    where: { fileUuid, fullNameLower: 'olivia paige /ferreira/' },
  });
  const lucas = await prisma.gedcomIndividual.findFirst({
    where: { fileUuid, fullNameLower: 'lucas peter /gonsalves/' },
  });
  console.log('--- Olivia ---', olivia ? { xref: olivia.xref, fullName: olivia.fullName, birth: olivia.birthDateDisplay, place: olivia.birthPlaceDisplay } : 'not found');
  console.log('--- Lucas ---', lucas ? { xref: lucas.xref, fullName: lucas.fullName, birth: lucas.birthDateDisplay, place: lucas.birthPlaceDisplay } : 'not found');
  console.log('');

  const family = await prisma.gedcomFamily.findFirst({
    where: { fileUuid, wifeId: pamela.id },
    include: {
      husband: { select: { xref: true, fullName: true } },
      wife: { select: { xref: true, fullName: true } },
      familyChildren: { include: { child: { select: { xref: true, fullName: true } } } },
      familyEvents: { include: { event: { include: { date: true, place: true } } } },
    },
  });
  if (!family) {
    console.log('Family (Pamela as wife) not found');
  } else {
    console.log('--- Family ---');
    console.log('xref:', family.xref);
    console.log('Husband:', family.husband?.fullName, family.husband?.xref);
    console.log('Wife:', family.wife?.fullName, family.wife?.xref);
    console.log('Marriage:', family.marriageDateDisplay, family.marriagePlaceDisplay);
    console.log('Children:', family.familyChildren?.map((fc) => fc.child?.fullName + ' (' + fc.child?.xref + ')') || []);
    console.log('Events:', family.familyEvents?.map((fe) => fe.event?.eventType + ' @ ' + fe.event?.date?.original + ' ' + fe.event?.place?.original) || []);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
