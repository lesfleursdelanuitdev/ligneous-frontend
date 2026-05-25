#!/usr/bin/env node
/**
 * Add Adam Flores as husband of Carmen Alicia Gonsalves.
 * Creates new individual (Adam), name forms, file object, a new family, and spouse links.
 */
import './load-env.js';
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.database?.url || process.env.DATABASE_URL });
const FILE_UUID = '6791c94e-a2a7-43c1-b73f-32cc0cb164e9';

async function main() {
  const carmen = await pool.query(
    `SELECT i.id, i.xref, i.file_uuid, i.full_name
     FROM gedcom_individuals_v2 i
     JOIN gedcom_files f ON f.id = i.file_uuid
     WHERE f.name = 'Gonsalves Family Tree'
       AND i.full_name_lower LIKE '%carmen%'
       AND i.full_name_lower LIKE '%alicia%'
       AND i.full_name_lower LIKE '%gonsalves%'`
  );
  if (!carmen.rows[0]) throw new Error('Carmen Alicia Gonsalves not found');
  const carmenId = carmen.rows[0].id;
  const carmenXref = carmen.rows[0].xref;

  const existingFam = await pool.query(
    `SELECT id, xref, husband_id, wife_id FROM gedcom_families_v2
     WHERE file_uuid = $1 AND wife_id = $2`,
    [FILE_UUID, carmenId]
  );

  const maxI = await pool.query(
    `SELECT xref FROM gedcom_individuals_v2 WHERE file_uuid = $1`,
    [FILE_UUID]
  );
  const nums = maxI.rows
    .map((r) => {
      const m = r.xref.match(/@I(\d+)@/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const nextINum = nums.length ? Math.max(...nums) + 1 : 1;
  const adamXref = `@I${String(nextINum).padStart(4, '0')}@`;

  const maxF = await pool.query(
    `SELECT xref FROM gedcom_families_v2 WHERE file_uuid = $1`,
    [FILE_UUID]
  );
  const fnums = maxF.rows
    .map((r) => {
      const m = r.xref.match(/@F(\d+)@/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const nextFNum = fnums.length ? Math.max(...fnums) + 1 : 1;
  const familyXref = `@F${String(nextFNum).padStart(4, '0')}@`;

  const adamId = crypto.randomUUID();
  const familyId = crypto.randomUUID();

  await pool.query(
    `INSERT INTO gedcom_individuals_v2
     (id, file_uuid, xref, full_name, full_name_lower, sex, has_spouse)
     VALUES ($1, $2, $3, $4, $5, 'M', true)`,
    [adamId, FILE_UUID, adamXref, 'Adam /Flores/', 'adam /flores/']
  );

  const adamGivenId = await pool.query(
    `INSERT INTO gedcom_given_names_v2 (id, file_uuid, given_name, given_name_lower, frequency)
     VALUES (gen_random_uuid(), $1, 'Adam', 'adam', 0)
     ON CONFLICT (file_uuid, given_name_lower) DO UPDATE SET given_name = EXCLUDED.given_name
     RETURNING id`,
    [FILE_UUID]
  ).then((r) => r.rows[0].id);

  const floresSurnameId = await pool.query(
    `INSERT INTO gedcom_surnames_v2 (id, file_uuid, surname, surname_lower, frequency)
     VALUES (gen_random_uuid(), $1, 'Flores', 'flores', 0)
     ON CONFLICT (file_uuid, surname_lower) DO UPDATE SET surname = EXCLUDED.surname
     RETURNING id`,
    [FILE_UUID]
  ).then((r) => r.rows[0].id);

  const nameFormId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO gedcom_individual_name_forms (id, file_uuid, individual_id, name_type, is_primary, sort_order)
     VALUES ($1, $2, $3, 'birth', true, 0)`,
    [nameFormId, FILE_UUID, adamId]
  );
  await pool.query(
    `INSERT INTO gedcom_name_form_given_names (id, file_uuid, name_form_id, given_name_id, position)
     VALUES (gen_random_uuid(), $1, $2, $3, 1)`,
    [FILE_UUID, nameFormId, adamGivenId]
  );
  await pool.query(
    `INSERT INTO gedcom_name_form_surnames (id, file_uuid, name_form_id, surname_id, position)
     VALUES (gen_random_uuid(), $1, $2, $3, 1)`,
    [FILE_UUID, nameFormId, floresSurnameId]
  );

  await pool.query(
    `INSERT INTO gedcom_file_objects (id, file_uuid, xref, object_type, object_uuid)
     VALUES (gen_random_uuid(), $1, $2, 'INDI', $3)`,
    [FILE_UUID, adamXref, adamId]
  );

  if (existingFam.rows[0] && !existingFam.rows[0].husband_id) {
    const fid = existingFam.rows[0].id;
    await pool.query(
      `UPDATE gedcom_families_v2 SET husband_id = $1, husband_xref = $2 WHERE id = $3`,
      [adamId, adamXref, fid]
    );
    await pool.query(
      `INSERT INTO gedcom_spouses_v2 (id, file_uuid, individual_id, spouse_id, family_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [FILE_UUID, adamId, carmenId, fid]
    );
    await pool.query(
      `INSERT INTO gedcom_spouses_v2 (id, file_uuid, individual_id, spouse_id, family_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [FILE_UUID, carmenId, adamId, fid]
    );
    await pool.query(
      `UPDATE gedcom_individuals_v2 SET has_spouse = true WHERE id = $1`,
      [carmenId]
    );
    console.log('Updated existing family', existingFam.rows[0].xref, 'with husband Adam Flores');
  } else {
    await pool.query(
      `INSERT INTO gedcom_families_v2
       (id, file_uuid, xref, husband_id, wife_id, husband_xref, wife_xref)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [familyId, FILE_UUID, familyXref, adamId, carmenId, adamXref, carmenXref]
    );
    await pool.query(
      `INSERT INTO gedcom_spouses_v2 (id, file_uuid, individual_id, spouse_id, family_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [FILE_UUID, adamId, carmenId, familyId]
    );
    await pool.query(
      `INSERT INTO gedcom_spouses_v2 (id, file_uuid, individual_id, spouse_id, family_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [FILE_UUID, carmenId, adamId, familyId]
    );
    await pool.query(
      `UPDATE gedcom_individuals_v2 SET has_spouse = true WHERE id = $1`,
      [carmenId]
    );
    console.log('Created new family', familyXref, 'Adam Flores', adamXref, '+ Carmen', carmenXref);
  }

  console.log('Done. Adam Flores', adamXref, 'added as husband of Carmen Alicia Gonsalves.');
}

main()
  .then(() => pool.end())
  .catch((e) => { console.error(e); process.exit(1); });
