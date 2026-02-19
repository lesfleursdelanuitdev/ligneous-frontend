-- AlterTable: add refresh token columns to sessions (used by login route)
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "refresh_token_hash" VARCHAR(255);
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "refresh_expires_at" TIMESTAMPTZ(6);

-- Unique constraint on refresh_token_hash (Prisma schema has @unique)
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");

-- Indexes from Prisma schema
CREATE INDEX IF NOT EXISTS "sessions_refresh_token_hash_idx" ON "sessions"("refresh_token_hash");
CREATE INDEX IF NOT EXISTS "sessions_refresh_expires_at_idx" ON "sessions"("refresh_expires_at");
CREATE INDEX IF NOT EXISTS "sessions_user_id_is_revoked_refresh_expires_at_idx" ON "sessions"("user_id", "is_revoked", "refresh_expires_at");
