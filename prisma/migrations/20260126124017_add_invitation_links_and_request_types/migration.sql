/*
  Warnings:

  - You are about to drop the column `message` on the `access_requests` table. All the data in the column will be lost.
  - You are about to drop the column `permission_type` on the `access_requests` table. All the data in the column will be lost.
  - You are about to drop the column `response_message` on the `access_requests` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AccessRequestType" AS ENUM ('basic_access', 'individual_link', 'maintainer_role', 'owner_role');

-- AlterTable
ALTER TABLE "access_requests" DROP COLUMN "message",
DROP COLUMN "permission_type",
DROP COLUMN "response_message",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "request_type" "AccessRequestType" NOT NULL DEFAULT 'basic_access',
ADD COLUMN     "requested_permission_type" "PermissionType",
ADD COLUMN     "response_notes" TEXT,
ALTER COLUMN "resource_type" DROP NOT NULL,
ALTER COLUMN "resource_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "invitation_links" (
    "id" UUID NOT NULL,
    "token" UUID NOT NULL,
    "tree_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "role_type" VARCHAR(50) NOT NULL,
    "individual_xref" VARCHAR(50),
    "expires_at" TIMESTAMPTZ(6),
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation_link_uses" (
    "id" UUID NOT NULL,
    "link_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" INET,

    CONSTRAINT "invitation_link_uses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitation_links_token_key" ON "invitation_links"("token");

-- CreateIndex
CREATE INDEX "invitation_links_token_idx" ON "invitation_links"("token");

-- CreateIndex
CREATE INDEX "invitation_links_tree_id_idx" ON "invitation_links"("tree_id");

-- CreateIndex
CREATE INDEX "invitation_links_created_by_idx" ON "invitation_links"("created_by");

-- CreateIndex
CREATE INDEX "invitation_links_is_revoked_expires_at_idx" ON "invitation_links"("is_revoked", "expires_at");

-- CreateIndex
CREATE INDEX "invitation_link_uses_link_id_idx" ON "invitation_link_uses"("link_id");

-- CreateIndex
CREATE INDEX "invitation_link_uses_user_id_idx" ON "invitation_link_uses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitation_link_uses_link_id_user_id_key" ON "invitation_link_uses"("link_id", "user_id");

-- CreateIndex
CREATE INDEX "access_requests_request_type_status_idx" ON "access_requests"("request_type", "status");

-- AddForeignKey
ALTER TABLE "invitation_links" ADD CONSTRAINT "invitation_links_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation_links" ADD CONSTRAINT "invitation_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation_link_uses" ADD CONSTRAINT "invitation_link_uses_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "invitation_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation_link_uses" ADD CONSTRAINT "invitation_link_uses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
