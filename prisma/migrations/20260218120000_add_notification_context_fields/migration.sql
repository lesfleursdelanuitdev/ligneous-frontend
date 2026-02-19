-- AlterTable: Add optional context fields to notifications for linking to entities and actor
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "entity_type" VARCHAR(50);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "entity_id" VARCHAR(255);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "tree_id" UUID;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "actor_id" UUID;

-- Add foreign key for actor (who triggered the notification)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_actor_id_fkey'
  ) THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_fkey"
      FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Add foreign key for tree (optional tree context)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_tree_id_fkey'
  ) THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tree_id_fkey"
      FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");
CREATE INDEX IF NOT EXISTS "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications"("type");
