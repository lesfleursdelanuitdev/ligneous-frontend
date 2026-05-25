#!/usr/bin/env node
/**
 * Add one-parent union for Jamie Lynn Gonsalves: one child Genevieve Gonsalves
 * (b. 4 Dec 2018, California). No second parent; family has wife only.
 * Run: node scripts/add-jamie-lynn-genevieve.js
 */
import './load-env.js';
import { createHash } from 'crypto';
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.database?.url || process.env.DATABASE_URL });
const FILE_UUID = '6791c94e-a2a7-43c1-b73f-32cc0cb164e9';

const JAMIE_LYNN_XREF = '@I0142@';
const CHILD_BIRTH_ORIGINAL = '4 DEC 2018';
const CHILD_BIRTH_PLACE_ORIGINAL = 'California';

function dateHash(original) {
  return createHash('sha256').update(String(original).trim()).digest('hex');
}

function placeHash(original) {
  return createHash('sha256').update(String(original).trim().toLowerCase()).digest('hex');
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

function ensurePlace(client, fileUuid, original, name = null, state = null, country = null) {
  const hash = placeHash(original);
  return client.query(
    `SELECT id FROM gedcom_places_v2 WHERE file_uuid = $1 AND hash = $2`,
    [fileUuid, hash]
  ).then((r) => {
    if (r.rows[0]) return r.rows[0].id;
    const n = name ?? original;
    return client.query(
      `INSERT INTO gedcom_places_v2 (id, file_uuid, original, name, state, country, hash)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [fileUuid, original, n, state, country, hash]
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
    if (birthFields.placeId != null) {
      cols.push('birth_place_id', 'birth_place_display');
      vals.push(birthFields.placeId, birthFields.placeDisplay ?? birthFields.placeOriginal);
    }
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

async function createBirtEvent(client, fileUuid, individualId, dateId, placeId = null) {
  const eventId = crypto.randomUUID();
  await client.query(
    `INSERT INTO gedcom_events_v2 (id, file_uuid, event_type, date_id, place_id, sort_order)
     VALUES ($1, $2, 'BIRT', $3, $4, 0)`,
    [eventId, fileUuid, dateId, placeId]
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

    const jamie = await client.query(
      `SELECT id, xref FROM gedcom_individuals_v2 WHERE file_uuid = $1 AND xref = $2`,
      [FILE_UUID, JAMIE_LYNN_XREF]
    );
    if (!jamie.rows[0]) throw new Error('Jamie Lynn Gonsalves (@I0142@) not found');
    const jamieId = jamie.rows[0].id;
    const jamieXref = jamie.rows[0].xref;

    const [childXref] = await nextXrefs(client, FILE_UUID, 'I', 1);
    const [familyXref] = await nextXrefs(client, FILE_UUID, 'F', 1);

    const birthDateId = await ensureDate(client, FILE_UUID, CHILD_BIRTH_ORIGINAL, 2018, 12, 4);
    const birthPlaceId = await ensurePlace(client, FILE_UUID, CHILD_BIRTH_PLACE_ORIGINAL, 'California', 'California', 'USA');

    const familyId = crypto.randomUUID();
    await client.query(
      `INSERT INTO gedcom_families_v2
       (id, file_uuid, xref, wife_id, wife_xref, children_count)
       VALUES ($1, $2, $3, $4, $5, 1)`,
      [familyId, FILE_UUID, familyXref, jamieId, jamieXref]
    );

    const childId = await createIndividualWithName(
      client, FILE_UUID, childXref,
      'Genevieve /Gonsalves/', 'genevieve /gonsalves/', 'F',
      {
        dateId: birthDateId,
        dateDisplay: CHILD_BIRTH_ORIGINAL,
        year: 2018,
        placeId: birthPlaceId,
        placeDisplay: CHILD_BIRTH_PLACE_ORIGINAL,
        placeOriginal: CHILD_BIRTH_PLACE_ORIGINAL,
      }
    );
    await createBirtEvent(client, FILE_UUID, childId, birthDateId, birthPlaceId);

    await client.query(
      `INSERT INTO gedcom_family_children_v2 (id, file_uuid, family_id, child_id, child_xref, birth_order)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 1)`,
      [FILE_UUID, familyId, childId, childXref]
    );
    await client.query(
      `INSERT INTO gedcom_parent_child_v2 (id, file_uuid, parent_id, child_id, family_id, relationship_type)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'biological')`,
      [FILE_UUID, jamieId, childId, familyId]
    );

    await client.query(
      `UPDATE gedcom_individuals_v2 SET has_children = true WHERE id = $1`,
      [jamieId]
    );

    await client.query('COMMIT');
    console.log('Done. One-parent union for Jamie Lynn /Gonsalves/', JAMIE_LYNN_XREF);
    console.log('Child: Genevieve /Gonsalves/', childXref, '(b. 4 Dec 2018, California).');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
