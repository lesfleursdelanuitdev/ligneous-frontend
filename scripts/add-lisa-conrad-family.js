#!/usr/bin/env node
/**
 * Add Conrad Nolan as spouse of Lisa Gonsalves, and two children:
 * Alexis Nolan (F, b. 9 Apr 2011), Cameron Nolan (b. 22 Apr 2016).
 * Events (BIRT) are created for each child.
 * Run from ligneous-frontend: node scripts/add-lisa-conrad-family.js
 */
import './load-env.js';
import { createHash } from 'crypto';
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.database?.url || process.env.DATABASE_URL });
const FILE_UUID = '6791c94e-a2a7-43c1-b73f-32cc0cb164e9';

const LISA_XREF = '@I0092@';
const ALEXIS_BIRTH_ORIGINAL = '9 APR 2011';
const CAMERON_BIRTH_ORIGINAL = '22 APR 2016';

function dateHash(original) {
  return createHash('sha256').update(String(original).trim()).digest('hex');
}

function ensureDate(client, fileUuid, original, year, month, day) {
  const hash = dateHash(original);
  return client.query(
    `SELECT id FROM gedcom_dates_v2 WHERE file_uuid = $1 AND hash = $2`,
    [fileUuid, hash]
  ).then((r) => {
    if (r.rows[0]) return r.rows[0].id;
    return client.query(
      `INSERT INTO gedcom_dates_v2 (id, file_uuid, original, date_type, calendar, year, month, day, hash)
       VALUES (gen_random_uuid(), $1, $2, 'EXACT', 'GREGORIAN', $3, $4, $5, $6)
       RETURNING id`,
      [fileUuid, original, year, month, day, hash]
    ).then((ins) => ins.rows[0].id);
  });
}

function nextXrefs(client, fileUuid, prefix, count = 1) {
  const table = prefix === 'I' ? 'gedcom_individuals_v2' : 'gedcom_families_v2';
  const col = 'xref';
  return client.query(`SELECT ${col} FROM ${table} WHERE file_uuid = $1`, [fileUuid]).then((r) => {
    const nums = r.rows
      .map((row) => {
        const m = row[col].match(prefix === 'I' ? /@I(\d+)@/ : /@F(\d+)@/);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n) => n > 0);
    const start = nums.length ? Math.max(...nums) + 1 : 1;
    return Array.from({ length: count }, (_, i) =>
      `@${prefix}${String(start + i).padStart(4, '0')}@`
    );
  });
}

function ensureGivenName(client, fileUuid, given) {
  const lower = given.toLowerCase();
  return client.query(
    `INSERT INTO gedcom_given_names_v2 (id, file_uuid, given_name, given_name_lower, frequency)
     VALUES (gen_random_uuid(), $1, $2, $3, 0)
     ON CONFLICT (file_uuid, given_name_lower) DO UPDATE SET given_name = EXCLUDED.given_name
     RETURNING id`,
    [fileUuid, given, lower]
  ).then((r) => r.rows[0].id);
}

function ensureSurname(client, fileUuid, surname) {
  const lower = surname.toLowerCase();
  return client.query(
    `INSERT INTO gedcom_surnames_v2 (id, file_uuid, surname, surname_lower, frequency)
     VALUES (gen_random_uuid(), $1, $2, $3, 0)
     ON CONFLICT (file_uuid, surname_lower) DO UPDATE SET surname = EXCLUDED.surname
     RETURNING id`,
    [fileUuid, surname, lower]
  ).then((r) => r.rows[0].id);
}

async function createIndividualWithName(client, fileUuid, xref, fullName, fullNameLower, sex, birthFields = null) {
  const id = crypto.randomUUID();
  const cols = ['id', 'file_uuid', 'xref', 'full_name', 'full_name_lower', 'sex', 'has_spouse'];
  const vals = [id, fileUuid, xref, fullName, fullNameLower, sex, false];
  if (birthFields) {
    cols.push('birth_date_id', 'birth_date_display', 'birth_year', 'has_parents', 'is_living');
    vals.push(
      birthFields.dateId,
      birthFields.dateDisplay,
      birthFields.year,
      true,
      true
    );
  }
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
  await client.query(
    `INSERT INTO gedcom_individuals_v2 (${cols.join(', ')})
     VALUES (${placeholders})`,
    vals
  );

  const given = fullName.split(/\s*\/\s*/)[0].trim().split(/\s+/)[0];
  const surname = fullName.includes('/') ? fullName.replace(/^.*\/([^/]+)\/.*$/, '$1').trim() : '';
  const givenId = await ensureGivenName(client, fileUuid, given);
  const surnameId = await ensureSurname(client, fileUuid, surname);

  const nameFormId = crypto.randomUUID();
  await client.query(
    `INSERT INTO gedcom_individual_name_forms (id, file_uuid, individual_id, name_type, is_primary, sort_order)
     VALUES ($1, $2, $3, 'birth', true, 0)`,
    [nameFormId, fileUuid, id]
  );
  await client.query(
    `INSERT INTO gedcom_name_form_given_names (id, file_uuid, name_form_id, given_name_id, position)
     VALUES (gen_random_uuid(), $1, $2, $3, 1)`,
    [fileUuid, nameFormId, givenId]
  );
  await client.query(
    `INSERT INTO gedcom_name_form_surnames (id, file_uuid, name_form_id, surname_id, position)
     VALUES (gen_random_uuid(), $1, $2, $3, 1)`,
    [fileUuid, nameFormId, surnameId]
  );

  await client.query(
    `INSERT INTO gedcom_file_objects (id, file_uuid, xref, object_type, object_uuid)
     VALUES (gen_random_uuid(), $1, $2, 'INDI', $3)`,
    [fileUuid, xref, id]
  );

  return id;
}

async function createBirtEvent(client, fileUuid, individualId, dateId) {
  const eventId = crypto.randomUUID();
  await client.query(
    `INSERT INTO gedcom_events_v2 (id, file_uuid, event_type, date_id, sort_order)
     VALUES ($1, $2, 'BIRT', $3, 0)`,
    [eventId, fileUuid, dateId]
  );
  await client.query(
    `INSERT INTO gedcom_individual_events_v2 (id, file_uuid, individual_id, event_id, role)
     VALUES (gen_random_uuid(), $1, $2, $3, 'principal')`,
    [fileUuid, individualId, eventId]
  );
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const lisa = await client.query(
      `SELECT id, xref FROM gedcom_individuals_v2 WHERE file_uuid = $1 AND xref = $2`,
      [FILE_UUID, LISA_XREF]
    );
    if (!lisa.rows[0]) throw new Error('Lisa Gonsalves (@I0092@) not found');
    const lisaId = lisa.rows[0].id;
    const lisaXref = lisa.rows[0].xref;

    const [conradXref, alexisXref, cameronXref] = await nextXrefs(client, FILE_UUID, 'I', 3);
    const [familyXref] = await nextXrefs(client, FILE_UUID, 'F', 1);

    const alexisDateId = await ensureDate(client, FILE_UUID, ALEXIS_BIRTH_ORIGINAL, 2011, 4, 9);
    const cameronDateId = await ensureDate(client, FILE_UUID, CAMERON_BIRTH_ORIGINAL, 2016, 4, 22);

    const conradId = await createIndividualWithName(
      client, FILE_UUID, conradXref,
      'Conrad /Nolan/', 'conrad /nolan/', 'M'
    );
    await client.query(
      `UPDATE gedcom_individuals_v2 SET has_spouse = true WHERE id = $1`,
      [conradId]
    );

    const familyId = crypto.randomUUID();
    await client.query(
      `INSERT INTO gedcom_families_v2
       (id, file_uuid, xref, husband_id, wife_id, husband_xref, wife_xref, children_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 2)`,
      [familyId, FILE_UUID, familyXref, conradId, lisaId, conradXref, lisaXref]
    );
    await client.query(
      `INSERT INTO gedcom_spouses_v2 (id, file_uuid, individual_id, spouse_id, family_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [FILE_UUID, conradId, lisaId, familyId]
    );
    await client.query(
      `INSERT INTO gedcom_spouses_v2 (id, file_uuid, individual_id, spouse_id, family_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [FILE_UUID, lisaId, conradId, familyId]
    );
    await client.query(
      `UPDATE gedcom_individuals_v2 SET has_spouse = true WHERE id = $1`,
      [lisaId]
    );

    const alexisId = await createIndividualWithName(
      client, FILE_UUID, alexisXref,
      'Alexis /Nolan/', 'alexis /nolan/', 'F',
      { dateId: alexisDateId, dateDisplay: ALEXIS_BIRTH_ORIGINAL, year: 2011 }
    );
    await createBirtEvent(client, FILE_UUID, alexisId, alexisDateId);

    const cameronId = await createIndividualWithName(
      client, FILE_UUID, cameronXref,
      'Cameron /Nolan/', 'cameron /nolan/', 'M',
      { dateId: cameronDateId, dateDisplay: CAMERON_BIRTH_ORIGINAL, year: 2016 }
    );
    await createBirtEvent(client, FILE_UUID, cameronId, cameronDateId);

    await client.query(
      `INSERT INTO gedcom_family_children_v2 (id, file_uuid, family_id, child_id, child_xref, birth_order)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 1)`,
      [FILE_UUID, familyId, alexisId, alexisXref]
    );
    await client.query(
      `INSERT INTO gedcom_family_children_v2 (id, file_uuid, family_id, child_id, child_xref, birth_order)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 2)`,
      [FILE_UUID, familyId, cameronId, cameronXref]
    );

    await client.query(
      `INSERT INTO gedcom_parent_child_v2 (id, file_uuid, parent_id, child_id, family_id, relationship_type)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'biological')`,
      [FILE_UUID, lisaId, alexisId, familyId]
    );
    await client.query(
      `INSERT INTO gedcom_parent_child_v2 (id, file_uuid, parent_id, child_id, family_id, relationship_type)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'biological')`,
      [FILE_UUID, lisaId, cameronId, familyId]
    );
    await client.query(
      `INSERT INTO gedcom_parent_child_v2 (id, file_uuid, parent_id, child_id, family_id, relationship_type)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'biological')`,
      [FILE_UUID, conradId, alexisId, familyId]
    );
    await client.query(
      `INSERT INTO gedcom_parent_child_v2 (id, file_uuid, parent_id, child_id, family_id, relationship_type)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'biological')`,
      [FILE_UUID, conradId, cameronId, familyId]
    );

    await client.query(
      `UPDATE gedcom_individuals_v2 SET has_children = true WHERE id IN ($1, $2)`,
      [lisaId, conradId]
    );

    await client.query('COMMIT');
    console.log('Done. Conrad /Nolan/', conradXref, 'added as spouse of Lisa /Gonsalves/', LISA_XREF);
    console.log('Family', familyXref, '; children: Alexis /Nolan/', alexisXref, '(b. 9 Apr 2011), Cameron /Nolan/', cameronXref, '(b. 22 Apr 2016).');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
