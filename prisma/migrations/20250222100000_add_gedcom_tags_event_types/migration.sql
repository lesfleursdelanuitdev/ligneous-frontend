-- CreateEnum
CREATE TYPE "GedcomTagScope" AS ENUM ('INDI', 'FAM', 'BOTH', 'OTHER');

-- CreateEnum
CREATE TYPE "EventTypeOwnerScope" AS ENUM ('INDI', 'FAM', 'BOTH');

-- CreateTable
CREATE TABLE "gedcom_tags" (
    "id" UUID NOT NULL,
    "tag" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "scope" "GedcomTagScope" NOT NULL DEFAULT 'OTHER',
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "file_uuid" UUID,

    CONSTRAINT "gedcom_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_types" (
    "id" UUID NOT NULL,
    "tag" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "owner_scope" "EventTypeOwnerScope" NOT NULL DEFAULT 'INDI',
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "file_uuid" UUID,

    CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gedcom_tags_tag_idx" ON "gedcom_tags"("tag");

-- CreateIndex
CREATE INDEX "gedcom_tags_file_uuid_idx" ON "gedcom_tags"("file_uuid");

-- CreateIndex
CREATE INDEX "gedcom_tags_is_custom_idx" ON "gedcom_tags"("is_custom");

-- CreateIndex
CREATE UNIQUE INDEX "gedcom_tags_tag_file_uuid_key" ON "gedcom_tags"("tag", "file_uuid");

-- Partial unique: one row per tag for global (file_uuid IS NULL) tags
CREATE UNIQUE INDEX "gedcom_tags_tag_global_unique" ON "gedcom_tags"("tag") WHERE "file_uuid" IS NULL;

-- CreateIndex
CREATE INDEX "event_types_tag_idx" ON "event_types"("tag");

-- CreateIndex
CREATE INDEX "event_types_file_uuid_idx" ON "event_types"("file_uuid");

-- CreateIndex
CREATE INDEX "event_types_is_custom_idx" ON "event_types"("is_custom");

-- CreateIndex
CREATE UNIQUE INDEX "event_types_tag_file_uuid_key" ON "event_types"("tag", "file_uuid");

-- Partial unique: one row per tag for global (file_uuid IS NULL) event types
CREATE UNIQUE INDEX "event_types_tag_global_unique" ON "event_types"("tag") WHERE "file_uuid" IS NULL;

-- AddForeignKey
ALTER TABLE "gedcom_tags" ADD CONSTRAINT "gedcom_tags_file_uuid_fkey" FOREIGN KEY ("file_uuid") REFERENCES "gedcom_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_types" ADD CONSTRAINT "event_types_file_uuid_fkey" FOREIGN KEY ("file_uuid") REFERENCES "gedcom_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
