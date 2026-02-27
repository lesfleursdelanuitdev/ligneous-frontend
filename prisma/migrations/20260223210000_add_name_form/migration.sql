-- CreateTable: GedcomIndividualNameForm
CREATE TABLE "gedcom_individual_name_forms" (
    "id" UUID NOT NULL,
    "file_uuid" UUID NOT NULL,
    "individual_id" UUID NOT NULL,
    "name_type" TEXT NOT NULL DEFAULT 'birth',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gedcom_individual_name_forms_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "gedcom_individual_name_forms_individual_id_idx" ON "gedcom_individual_name_forms"("individual_id");
CREATE INDEX "gedcom_individual_name_forms_file_uuid_idx" ON "gedcom_individual_name_forms"("file_uuid");
CREATE UNIQUE INDEX "gedcom_individual_name_forms_file_uuid_individual_id_name_type_key" ON "gedcom_individual_name_forms"("file_uuid", "individual_id", "name_type");

-- CreateTable: GedcomNameFormGivenName
CREATE TABLE "gedcom_name_form_given_names" (
    "id" UUID NOT NULL,
    "file_uuid" UUID NOT NULL,
    "name_form_id" UUID NOT NULL,
    "given_name_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gedcom_name_form_given_names_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "gedcom_name_form_given_names_name_form_id_idx" ON "gedcom_name_form_given_names"("name_form_id");
CREATE INDEX "gedcom_name_form_given_names_given_name_id_idx" ON "gedcom_name_form_given_names"("given_name_id");
CREATE UNIQUE INDEX "gedcom_name_form_given_names_name_form_id_given_name_id_position_key" ON "gedcom_name_form_given_names"("name_form_id", "given_name_id", "position");

-- CreateTable: GedcomNameFormSurname
CREATE TABLE "gedcom_name_form_surnames" (
    "id" UUID NOT NULL,
    "file_uuid" UUID NOT NULL,
    "name_form_id" UUID NOT NULL,
    "surname_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gedcom_name_form_surnames_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "gedcom_name_form_surnames_name_form_id_idx" ON "gedcom_name_form_surnames"("name_form_id");
CREATE INDEX "gedcom_name_form_surnames_surname_id_idx" ON "gedcom_name_form_surnames"("surname_id");
CREATE UNIQUE INDEX "gedcom_name_form_surnames_name_form_id_surname_id_position_key" ON "gedcom_name_form_surnames"("name_form_id", "surname_id", "position");

-- Foreign keys
ALTER TABLE "gedcom_individual_name_forms" ADD CONSTRAINT "gedcom_individual_name_forms_file_uuid_fkey" FOREIGN KEY ("file_uuid") REFERENCES "gedcom_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gedcom_individual_name_forms" ADD CONSTRAINT "gedcom_individual_name_forms_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "gedcom_individuals_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gedcom_name_form_given_names" ADD CONSTRAINT "gedcom_name_form_given_names_file_uuid_fkey" FOREIGN KEY ("file_uuid") REFERENCES "gedcom_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gedcom_name_form_given_names" ADD CONSTRAINT "gedcom_name_form_given_names_name_form_id_fkey" FOREIGN KEY ("name_form_id") REFERENCES "gedcom_individual_name_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gedcom_name_form_given_names" ADD CONSTRAINT "gedcom_name_form_given_names_given_name_id_fkey" FOREIGN KEY ("given_name_id") REFERENCES "gedcom_given_names_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gedcom_name_form_surnames" ADD CONSTRAINT "gedcom_name_form_surnames_file_uuid_fkey" FOREIGN KEY ("file_uuid") REFERENCES "gedcom_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gedcom_name_form_surnames" ADD CONSTRAINT "gedcom_name_form_surnames_name_form_id_fkey" FOREIGN KEY ("name_form_id") REFERENCES "gedcom_individual_name_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gedcom_name_form_surnames" ADD CONSTRAINT "gedcom_name_form_surnames_surname_id_fkey" FOREIGN KEY ("surname_id") REFERENCES "gedcom_surnames_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate: create name forms from distinct (individual_id, name_type) in surnames
INSERT INTO "gedcom_individual_name_forms" ("id", "file_uuid", "individual_id", "name_type", "is_primary", "sort_order")
SELECT gen_random_uuid(), file_uuid, individual_id, name_type,
       bool_or(is_primary) AS is_primary,
       (ROW_NUMBER() OVER (PARTITION BY individual_id, file_uuid ORDER BY MIN(CASE WHEN is_primary THEN 0 ELSE 1 END), name_type))::integer - 1 AS sort_order
FROM gedcom_individual_surnames_v2
GROUP BY file_uuid, individual_id, name_type;

-- Ensure exactly one primary per individual
WITH primaries AS (
    SELECT DISTINCT ON (individual_id) id
    FROM gedcom_individual_name_forms
    ORDER BY individual_id, sort_order
)
UPDATE gedcom_individual_name_forms nf SET is_primary = (nf.id IN (SELECT id FROM primaries));

-- Create birth name forms for individuals who have given names but no surnames
INSERT INTO "gedcom_individual_name_forms" ("id", "file_uuid", "individual_id", "name_type", "is_primary", "sort_order")
SELECT gen_random_uuid(), ign.file_uuid, ign.individual_id, 'birth', true, 0
FROM (SELECT DISTINCT file_uuid, individual_id FROM gedcom_individual_given_names_v2) ign
WHERE NOT EXISTS (SELECT 1 FROM gedcom_individual_name_forms nf WHERE nf.individual_id = ign.individual_id AND nf.file_uuid = ign.file_uuid);

-- Migrate given names (assign to primary name form)
INSERT INTO "gedcom_name_form_given_names" ("id", "file_uuid", "name_form_id", "given_name_id", "position")
SELECT gen_random_uuid(), ign.file_uuid,
       (SELECT id FROM gedcom_individual_name_forms WHERE individual_id = ign.individual_id AND file_uuid = ign.file_uuid AND is_primary = true LIMIT 1),
       ign.given_name_id, ign.position
FROM gedcom_individual_given_names_v2 ign
WHERE EXISTS (SELECT 1 FROM gedcom_individual_name_forms nf WHERE nf.individual_id = ign.individual_id AND nf.file_uuid = ign.file_uuid);

-- Migrate surnames
INSERT INTO "gedcom_name_form_surnames" ("id", "file_uuid", "name_form_id", "surname_id", "position")
SELECT gen_random_uuid(), isn.file_uuid,
       (SELECT id FROM gedcom_individual_name_forms WHERE individual_id = isn.individual_id AND file_uuid = isn.file_uuid AND name_type = isn.name_type LIMIT 1),
       isn.surname_id, 1
FROM gedcom_individual_surnames_v2 isn;

-- Drop old tables
DROP TABLE "gedcom_individual_surnames_v2";
DROP TABLE "gedcom_individual_given_names_v2";
