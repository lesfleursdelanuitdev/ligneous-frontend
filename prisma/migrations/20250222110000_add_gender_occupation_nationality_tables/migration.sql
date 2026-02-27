-- AlterTable: Add gender column to gedcom_individuals_v2
ALTER TABLE "gedcom_individuals_v2" ADD COLUMN "gender" TEXT;

-- CreateTable: gedcom_occupations_v2
CREATE TABLE "gedcom_occupations_v2" (
    "id" UUID NOT NULL,
    "file_uuid" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "value_lower" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gedcom_occupations_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable: gedcom_nationalities_v2
CREATE TABLE "gedcom_nationalities_v2" (
    "id" UUID NOT NULL,
    "file_uuid" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "value_lower" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gedcom_nationalities_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable: gedcom_individual_occupations_v2
CREATE TABLE "gedcom_individual_occupations_v2" (
    "id" UUID NOT NULL,
    "file_uuid" UUID NOT NULL,
    "individual_id" UUID NOT NULL,
    "occupation_id" UUID NOT NULL,
    "value_override" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gedcom_individual_occupations_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable: gedcom_individual_nationalities_v2
CREATE TABLE "gedcom_individual_nationalities_v2" (
    "id" UUID NOT NULL,
    "file_uuid" UUID NOT NULL,
    "individual_id" UUID NOT NULL,
    "nationality_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gedcom_individual_nationalities_v2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gedcom_occupations_v2_file_uuid_value_lower_key" ON "gedcom_occupations_v2"("file_uuid", "value_lower");

-- CreateIndex
CREATE INDEX "gedcom_occupations_v2_file_uuid_idx" ON "gedcom_occupations_v2"("file_uuid");

-- CreateIndex
CREATE INDEX "gedcom_occupations_v2_file_uuid_value_lower_idx" ON "gedcom_occupations_v2"("file_uuid", "value_lower");

-- CreateIndex
CREATE UNIQUE INDEX "gedcom_nationalities_v2_file_uuid_value_lower_key" ON "gedcom_nationalities_v2"("file_uuid", "value_lower");

-- CreateIndex
CREATE INDEX "gedcom_nationalities_v2_file_uuid_idx" ON "gedcom_nationalities_v2"("file_uuid");

-- CreateIndex
CREATE INDEX "gedcom_nationalities_v2_file_uuid_value_lower_idx" ON "gedcom_nationalities_v2"("file_uuid", "value_lower");

-- CreateIndex
CREATE UNIQUE INDEX "gedcom_individual_occupations_v2_individual_id_occupation_id_key" ON "gedcom_individual_occupations_v2"("individual_id", "occupation_id");

-- CreateIndex
CREATE INDEX "gedcom_individual_occupations_v2_individual_id_idx" ON "gedcom_individual_occupations_v2"("individual_id");

-- CreateIndex
CREATE INDEX "gedcom_individual_occupations_v2_occupation_id_idx" ON "gedcom_individual_occupations_v2"("occupation_id");

-- CreateIndex
CREATE UNIQUE INDEX "gedcom_individual_nationalities_v2_individual_id_nationality_id_key" ON "gedcom_individual_nationalities_v2"("individual_id", "nationality_id");

-- CreateIndex
CREATE INDEX "gedcom_individual_nationalities_v2_individual_id_idx" ON "gedcom_individual_nationalities_v2"("individual_id");

-- CreateIndex
CREATE INDEX "gedcom_individual_nationalities_v2_nationality_id_idx" ON "gedcom_individual_nationalities_v2"("nationality_id");

-- AddForeignKey
ALTER TABLE "gedcom_occupations_v2" ADD CONSTRAINT "gedcom_occupations_v2_file_uuid_fkey" FOREIGN KEY ("file_uuid") REFERENCES "gedcom_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gedcom_nationalities_v2" ADD CONSTRAINT "gedcom_nationalities_v2_file_uuid_fkey" FOREIGN KEY ("file_uuid") REFERENCES "gedcom_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gedcom_individual_occupations_v2" ADD CONSTRAINT "gedcom_individual_occupations_v2_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "gedcom_individuals_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gedcom_individual_occupations_v2" ADD CONSTRAINT "gedcom_individual_occupations_v2_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "gedcom_occupations_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gedcom_individual_nationalities_v2" ADD CONSTRAINT "gedcom_individual_nationalities_v2_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "gedcom_individuals_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gedcom_individual_nationalities_v2" ADD CONSTRAINT "gedcom_individual_nationalities_v2_nationality_id_fkey" FOREIGN KEY ("nationality_id") REFERENCES "gedcom_nationalities_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;
