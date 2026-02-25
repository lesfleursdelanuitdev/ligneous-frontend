-- CreateTable
CREATE TABLE "entity_likes" (
    "id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entity_likes_entity_type_entity_id_idx" ON "entity_likes"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "entity_likes_user_id_idx" ON "entity_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_likes_entity_type_entity_id_user_id_key" ON "entity_likes"("entity_type", "entity_id", "user_id");

-- AddForeignKey
ALTER TABLE "entity_likes" ADD CONSTRAINT "entity_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
