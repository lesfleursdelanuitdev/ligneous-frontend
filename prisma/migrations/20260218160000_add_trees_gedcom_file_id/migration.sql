-- AlterTable
ALTER TABLE "trees" ADD COLUMN "gedcom_file_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "trees_gedcom_file_id_key" ON "trees"("gedcom_file_id");

-- AddForeignKey
ALTER TABLE "trees" ADD CONSTRAINT "trees_gedcom_file_id_fkey" FOREIGN KEY ("gedcom_file_id") REFERENCES "gedcom_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
