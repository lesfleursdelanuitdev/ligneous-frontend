-- Backfill gedcom_occupations_v2 from gedcom_individuals_v2.occupation
INSERT INTO gedcom_occupations_v2 (id, file_uuid, value, value_lower, frequency, created_at)
SELECT
  gen_random_uuid(),
  sub.file_uuid,
  sub.value,
  sub.value_lower,
  1,
  NOW()
FROM (
  SELECT DISTINCT file_uuid, TRIM(occupation) AS value, LOWER(TRIM(occupation)) AS value_lower
  FROM gedcom_individuals_v2
  WHERE occupation IS NOT NULL AND TRIM(occupation) <> ''
) sub
ON CONFLICT (file_uuid, value_lower) DO UPDATE SET frequency = gedcom_occupations_v2.frequency + 1;

-- Insert junction rows for occupation
INSERT INTO gedcom_individual_occupations_v2 (id, file_uuid, individual_id, occupation_id, sort_order, created_at)
SELECT
  gen_random_uuid(),
  i.file_uuid,
  i.id,
  o.id,
  0,
  NOW()
FROM gedcom_individuals_v2 i
JOIN gedcom_occupations_v2 o ON o.file_uuid = i.file_uuid AND o.value_lower = LOWER(TRIM(i.occupation))
WHERE i.occupation IS NOT NULL AND TRIM(i.occupation) <> ''
ON CONFLICT (individual_id, occupation_id) DO NOTHING;

-- Backfill gedcom_nationalities_v2 from gedcom_individuals_v2.nationality
INSERT INTO gedcom_nationalities_v2 (id, file_uuid, value, value_lower, created_at)
SELECT
  gen_random_uuid(),
  sub.file_uuid,
  sub.value,
  sub.value_lower,
  NOW()
FROM (
  SELECT DISTINCT file_uuid, TRIM(nationality) AS value, LOWER(TRIM(nationality)) AS value_lower
  FROM gedcom_individuals_v2
  WHERE nationality IS NOT NULL AND TRIM(nationality) <> ''
) sub
ON CONFLICT (file_uuid, value_lower) DO NOTHING;

-- Insert junction rows for nationality
INSERT INTO gedcom_individual_nationalities_v2 (id, file_uuid, individual_id, nationality_id, sort_order, created_at)
SELECT
  gen_random_uuid(),
  i.file_uuid,
  i.id,
  n.id,
  0,
  NOW()
FROM gedcom_individuals_v2 i
JOIN gedcom_nationalities_v2 n ON n.file_uuid = i.file_uuid AND n.value_lower = LOWER(TRIM(i.nationality))
WHERE i.nationality IS NOT NULL AND TRIM(i.nationality) <> ''
ON CONFLICT (individual_id, nationality_id) DO NOTHING;
