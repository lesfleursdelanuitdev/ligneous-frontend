-- CreateTable
CREATE TABLE "discussion_thread_entities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "thread_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discussion_thread_entities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discussion_thread_entities_thread_id_idx" ON "discussion_thread_entities"("thread_id");

-- CreateIndex
CREATE INDEX "discussion_thread_entities_entity_type_entity_id_idx" ON "discussion_thread_entities"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "discussion_thread_entities_thread_id_entity_type_entity_id_key" ON "discussion_thread_entities"("thread_id", "entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "discussion_thread_entities" ADD CONSTRAINT "discussion_thread_entities_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "discussion_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
