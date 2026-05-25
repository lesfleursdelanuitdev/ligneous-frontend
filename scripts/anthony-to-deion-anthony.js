#!/usr/bin/env node
import './load-env.js';
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.database?.url || process.env.DATABASE_URL });
const FILE_UUID = '6791c94e-a2a7-43c1-b73f-32cc0cb164e9';

const ind = await pool.query(
  `SELECT i.id, i.xref FROM gedcom_individuals_v2 i
   JOIN gedcom_files f ON f.id = i.file_uuid
   WHERE f.name = 'Gonsalves Family Tree'
     AND i.full_name_lower LIKE '%anthony%' AND i.full_name_lower LIKE '%gonsalves%'
     AND i.birth_year = 1995`
);
if (!ind.rows[0]) throw new Error('Anthony Gonsalves b.1995 not found');
const individualId = ind.rows[0].id;

const nameForm = await pool.query(
  `SELECT id FROM gedcom_individual_name_forms
   WHERE file_uuid = $1 AND individual_id = $2 AND is_primary = true LIMIT 1`,
  [FILE_UUID, individualId]
);
const nameFormId = nameForm.rows[0].id;

const gnDeion = await pool.query(
  `INSERT INTO gedcom_given_names_v2 (id, file_uuid, given_name, given_name_lower, frequency)
   VALUES (gen_random_uuid(), $1, 'Deion', 'deion', 0)
   ON CONFLICT (file_uuid, given_name_lower) DO UPDATE SET given_name = EXCLUDED.given_name
   RETURNING id`,
  [FILE_UUID]
);
const deionGivenId = gnDeion.rows[0].id;

await pool.query(
  `UPDATE gedcom_name_form_given_names SET position = 2
   WHERE name_form_id = $1 AND given_name_id = (SELECT id FROM gedcom_given_names_v2 WHERE file_uuid = $2 AND given_name_lower = 'anthony')`,
  [nameFormId, FILE_UUID]
);
await pool.query(
  `INSERT INTO gedcom_name_form_given_names (id, file_uuid, name_form_id, given_name_id, position)
   VALUES (gen_random_uuid(), $1, $2, $3, 1)`,
  [FILE_UUID, nameFormId, deionGivenId]
);

await pool.query(
  `UPDATE gedcom_individuals_v2
   SET full_name = 'Deion Anthony /Gonsalves/', full_name_lower = 'deion anthony /gonsalves/'
   WHERE file_uuid = $1 AND xref = $2`,
  [FILE_UUID, ind.rows[0].xref]
);

console.log('Done. Anthony /Gonsalves/ (@I0159@) → Deion Anthony /Gonsalves/');
await pool.end();
