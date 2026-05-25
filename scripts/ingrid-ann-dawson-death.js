#!/usr/bin/env node
/**
 * Ingrid → Ingrid Ann Dawson (GEDCOM /Dawson/) and add death 16 Oct 2014, Concord, California.
 */
import './load-env.js';
import { createHash } from 'crypto';
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({ connectionString: config.database?.url || process.env.DATABASE_URL });
const FILE_UUID = '6791c94e-a2a7-43c1-b73f-32cc0cb164e9';
const XREF = '@I0141@';

const DEATH_ORIGINAL = '16 Oct 2014';
const DEATH_PLACE_ORIGINAL = 'Concord, California';
const NEW_FULL_NAME = 'Ingrid Ann /Dawson/';
const NEW_FULL_NAME_LOWER = 'ingrid ann /dawson/';

function dateHash(original) {
  return createHash('sha256').update(String(original).trim()).digest('hex');
}
function placeHash(original) {
  return createHash('sha256').update(String(original).trim().toLowerCase()).digest('hex');
}

async function main() {
  const ind = await pool.query(
    `SELECT id FROM gedcom_individuals_v2 WHERE file_uuid = $1 AND xref = $2`,
    [FILE_UUID, XREF]
  );
  if (!ind.rows[0]) throw new Error('Ingrid @I0141@ not found in Gonsalves Family Tree');
  const individualId = ind.rows[0].id;

  // ---- 1. Name: Ingrid Ann Dawson (GEDCOM surname) ----
  const nameForm = await pool.query(
    `SELECT id FROM gedcom_individual_name_forms
     WHERE file_uuid = $1 AND individual_id = $2 AND is_primary = true LIMIT 1`,
    [FILE_UUID, individualId]
  );
  const nameFormId = nameForm.rows[0]?.id;

  if (nameFormId) {
    const ann = await pool.query(
      `INSERT INTO gedcom_given_names_v2 (id, file_uuid, given_name, given_name_lower, frequency)
       VALUES (gen_random_uuid(), $1, 'Ann', 'ann', 0)
       ON CONFLICT (file_uuid, given_name_lower) DO UPDATE SET given_name = EXCLUDED.given_name
       RETURNING id`,
      [FILE_UUID]
    );
    const annId = ann.rows[0].id;
    await pool.query(
      `INSERT INTO gedcom_name_form_given_names (id, file_uuid, name_form_id, given_name_id, position)
       VALUES (gen_random_uuid(), $1, $2, $3, 2)`,
      [FILE_UUID, nameFormId, annId]
    );
    const dawson = await pool.query(
      `INSERT INTO gedcom_surnames_v2 (id, file_uuid, surname, surname_lower, frequency)
       VALUES (gen_random_uuid(), $1, 'Dawson', 'dawson', 0)
       ON CONFLICT (file_uuid, surname_lower) DO UPDATE SET surname = EXCLUDED.surname
       RETURNING id`,
      [FILE_UUID]
    );
    const dawsonId = dawson.rows[0].id;
    await pool.query(
      `UPDATE gedcom_name_form_surnames SET surname_id = $1
       WHERE name_form_id = $2 AND surname_id = (SELECT id FROM gedcom_surnames_v2 WHERE file_uuid = $3 AND surname_lower IN ('dawson','dawon'))`,
      [dawsonId, nameFormId, FILE_UUID]
    );
  }

  await pool.query(
    `UPDATE gedcom_individuals_v2 SET full_name = $1, full_name_lower = $2 WHERE file_uuid = $3 AND xref = $4`,
    [NEW_FULL_NAME, NEW_FULL_NAME_LOWER, FILE_UUID, XREF]
  );
  console.log('Name updated to Ingrid Ann /Dawson/');

  // ---- 2. Death date row ----
  const hashDate = dateHash(DEATH_ORIGINAL);
  let dateId = (await pool.query(
    `SELECT id FROM gedcom_dates_v2 WHERE file_uuid = $1 AND hash = $2`,
    [FILE_UUID, hashDate]
  )).rows[0]?.id;
  if (!dateId) {
    const r = await pool.query(
      `INSERT INTO gedcom_dates_v2 (id, file_uuid, original, date_type, calendar, year, month, day, hash)
       VALUES (gen_random_uuid(), $1, $2, 'EXACT', 'GREGORIAN', 2014, 10, 16, $3)
       RETURNING id`,
      [FILE_UUID, DEATH_ORIGINAL, hashDate]
    );
    dateId = r.rows[0].id;
  }

  // ---- 3. Death place row ----
  const hashPlace = placeHash(DEATH_PLACE_ORIGINAL);
  let placeId = (await pool.query(
    `SELECT id FROM gedcom_places_v2 WHERE file_uuid = $1 AND hash = $2`,
    [FILE_UUID, hashPlace]
  )).rows[0]?.id;
  if (!placeId) {
    const r = await pool.query(
      `INSERT INTO gedcom_places_v2 (id, file_uuid, original, name, state, country, hash)
       VALUES (gen_random_uuid(), $1, $2, 'Concord', 'California', 'USA', $3)
       RETURNING id`,
      [FILE_UUID, DEATH_PLACE_ORIGINAL, hashPlace]
    );
    placeId = r.rows[0].id;
  }

  // ---- 4. DEAT event + individual_event ----
  const eventId = (await pool.query(
    `INSERT INTO gedcom_events_v2 (id, file_uuid, event_type, date_id, place_id, sort_order)
     VALUES (gen_random_uuid(), $1, 'DEAT', $2, $3, 0)
     RETURNING id`,
    [FILE_UUID, dateId, placeId]
  )).rows[0].id;

  await pool.query(
    `INSERT INTO gedcom_individual_events_v2 (id, file_uuid, individual_id, event_id, role)
     VALUES (gen_random_uuid(), $1, $2, $3, 'principal')`,
    [FILE_UUID, individualId, eventId]
  );

  // ---- 5. Individual death fields ----
  await pool.query(
    `UPDATE gedcom_individuals_v2
     SET death_date_id = $1, death_place_id = $2, death_date_display = $3, death_place_display = $4, death_year = 2014, is_living = false
     WHERE file_uuid = $5 AND xref = $6`,
    [dateId, placeId, DEATH_ORIGINAL, DEATH_PLACE_ORIGINAL, FILE_UUID, XREF]
  );

  console.log('Death added: 16 Oct 2014, Concord, California');
  console.log('Done. Ingrid Ann /Dawson/ (@I0141@) name and death updated.');
}

main()
  .then(() => pool.end())
  .catch((e) => { console.error(e); process.exit(1); });
