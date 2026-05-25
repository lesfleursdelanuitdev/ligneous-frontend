#!/usr/bin/env node
/**
 * Add new Natasha Chung, union with Brian Alfred Gonsalves, and one child Alyssa Gonsalves.
 * No marriage/birth dates. Run: node scripts/add-brian-natasha-alyssa.js
 */
import './load-env.js';
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.database?.url || process.env.DATABASE_URL });
const FILE_UUID = '6791c94e-a2a7-43c1-b73f-32cc0cb164e9';

const BRIAN_XREF = '@I0086@';

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

async function createIndividualWithName(client, fileUuid, xref, fullName, fullNameLower, sex, isSpouse = true) {
  const id = crypto.randomUUID();
  await client.query(
    `INSERT INTO gedcom_individuals_v2
     (id, file_uuid, xref, full_name, full_name_lower, sex, has_spouse, has_parents)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, fileUuid, xref, fullName, fullNameLower, sex, isSpouse, !isSpouse]
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

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const brian = await client.query(
      `SELECT id, xref FROM gedcom_individuals_v2 WHERE file_uuid = $1 AND xref = $2`,
      [FILE_UUID, BRIAN_XREF]
    );
    if (!brian.rows[0]) throw new Error('Brian Alfred Gonsalves (@I0086@) not found');
    const brianId = brian.rows[0].id;
    const brianXref = brian.rows[0].xref;

    const [natashaXref, alyssaXref] = await nextXrefs(client, FILE_UUID, 'I', 2);
    const [familyXref] = await nextXrefs(client, FILE_UUID, 'F', 1);

    const natashaId = await createIndividualWithName(
      client, FILE_UUID, natashaXref,
      'Natasha /Chung/', 'natasha /chung/', 'F',
      true
    );

    const familyId = crypto.randomUUID();
    await client.query(
      `INSERT INTO gedcom_families_v2
       (id, file_uuid, xref, husband_id, wife_id, husband_xref, wife_xref, children_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
      [familyId, FILE_UUID, familyXref, brianId, natashaId, brianXref, natashaXref]
    );

    await client.query(
      `INSERT INTO gedcom_spouses_v2 (id, file_uuid, individual_id, spouse_id, family_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [FILE_UUID, brianId, natashaId, familyId]
    );
    await client.query(
      `INSERT INTO gedcom_spouses_v2 (id, file_uuid, individual_id, spouse_id, family_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [FILE_UUID, natashaId, brianId, familyId]
    );

    await client.query(
      `UPDATE gedcom_individuals_v2 SET has_spouse = true WHERE id = $1`,
      [brianId]
    );

    const alyssaId = await createIndividualWithName(
      client, FILE_UUID, alyssaXref,
      'Alyssa /Gonsalves/', 'alyssa /gonsalves/', 'F',
      false
    );

    await client.query(
      `INSERT INTO gedcom_family_children_v2 (id, file_uuid, family_id, child_id, child_xref, birth_order)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 1)`,
      [FILE_UUID, familyId, alyssaId, alyssaXref]
    );
    await client.query(
      `INSERT INTO gedcom_parent_child_v2 (id, file_uuid, parent_id, child_id, family_id, relationship_type)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'biological')`,
      [FILE_UUID, brianId, alyssaId, familyId]
    );
    await client.query(
      `INSERT INTO gedcom_parent_child_v2 (id, file_uuid, parent_id, child_id, family_id, relationship_type)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'biological')`,
      [FILE_UUID, natashaId, alyssaId, familyId]
    );

    await client.query(
      `UPDATE gedcom_individuals_v2 SET has_children = true WHERE id IN ($1, $2)`,
      [brianId, natashaId]
    );

    await client.query('COMMIT');
    console.log('Done. New Natasha /Chung/', natashaXref, '+ Brian Alfred /Gonsalves/', BRIAN_XREF, '-> family', familyXref);
    console.log('Child: Alyssa /Gonsalves/', alyssaXref);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
