-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('read', 'write', 'delete', 'admin');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('tree', 'individual', 'family', 'subtree');

-- CreateEnum
CREATE TYPE "AccessRequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "is_website_owner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "last_login_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" INET,
    "user_agent" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trees" (
    "id" UUID NOT NULL,
    "file_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tree_owners" (
    "id" UUID NOT NULL,
    "tree_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by" UUID,

    CONSTRAINT "tree_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_individual_links" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tree_id" UUID NOT NULL,
    "individual_xref" VARCHAR(50) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_individual_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tree_id" UUID NOT NULL,
    "resource_type" "ResourceType" NOT NULL,
    "resource_id" VARCHAR(255) NOT NULL,
    "permission_type" "PermissionType" NOT NULL,
    "granted_by" UUID,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "notes" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tree_maintainers" (
    "id" UUID NOT NULL,
    "tree_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by" UUID,

    CONSTRAINT "tree_maintainers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tree_id" UUID NOT NULL,
    "resource_type" "ResourceType" NOT NULL,
    "resource_id" VARCHAR(255) NOT NULL,
    "permission_type" "PermissionType" NOT NULL DEFAULT 'write',
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "response_message" TEXT,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ(6),
    "responded_by" UUID,

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_data" (
    "id" UUID NOT NULL,
    "tree_id" UUID NOT NULL,
    "resource_type" "ResourceType" NOT NULL,
    "resource_id" VARCHAR(255) NOT NULL,
    "field_name" VARCHAR(255) NOT NULL,
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "private_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_hash_idx" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "sessions_user_id_is_revoked_expires_at_idx" ON "sessions"("user_id", "is_revoked", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "trees_file_id_key" ON "trees"("file_id");

-- CreateIndex
CREATE INDEX "trees_file_id_idx" ON "trees"("file_id");

-- CreateIndex
CREATE INDEX "trees_is_public_idx" ON "trees"("is_public");

-- CreateIndex
CREATE INDEX "tree_owners_tree_id_idx" ON "tree_owners"("tree_id");

-- CreateIndex
CREATE INDEX "tree_owners_user_id_idx" ON "tree_owners"("user_id");

-- CreateIndex
CREATE INDEX "tree_owners_tree_id_is_primary_idx" ON "tree_owners"("tree_id", "is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "tree_owners_tree_id_user_id_key" ON "tree_owners"("tree_id", "user_id");

-- CreateIndex
CREATE INDEX "user_individual_links_user_id_idx" ON "user_individual_links"("user_id");

-- CreateIndex
CREATE INDEX "user_individual_links_tree_id_idx" ON "user_individual_links"("tree_id");

-- CreateIndex
CREATE INDEX "user_individual_links_tree_id_individual_xref_idx" ON "user_individual_links"("tree_id", "individual_xref");

-- CreateIndex
CREATE INDEX "user_individual_links_user_id_verified_idx" ON "user_individual_links"("user_id", "verified");

-- CreateIndex
CREATE UNIQUE INDEX "user_individual_links_user_id_tree_id_individual_xref_key" ON "user_individual_links"("user_id", "tree_id", "individual_xref");

-- CreateIndex
CREATE INDEX "permissions_user_id_tree_id_idx" ON "permissions"("user_id", "tree_id");

-- CreateIndex
CREATE INDEX "permissions_tree_id_resource_type_resource_id_idx" ON "permissions"("tree_id", "resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "permissions_expires_at_idx" ON "permissions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_user_id_tree_id_resource_type_resource_id_permi_key" ON "permissions"("user_id", "tree_id", "resource_type", "resource_id", "permission_type");

-- CreateIndex
CREATE INDEX "tree_maintainers_tree_id_idx" ON "tree_maintainers"("tree_id");

-- CreateIndex
CREATE INDEX "tree_maintainers_user_id_idx" ON "tree_maintainers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tree_maintainers_tree_id_user_id_key" ON "tree_maintainers"("tree_id", "user_id");

-- CreateIndex
CREATE INDEX "access_requests_user_id_idx" ON "access_requests"("user_id");

-- CreateIndex
CREATE INDEX "access_requests_tree_id_idx" ON "access_requests"("tree_id");

-- CreateIndex
CREATE INDEX "access_requests_status_idx" ON "access_requests"("status");

-- CreateIndex
CREATE INDEX "access_requests_tree_id_status_idx" ON "access_requests"("tree_id", "status");

-- CreateIndex
CREATE INDEX "private_data_tree_id_resource_type_resource_id_idx" ON "private_data"("tree_id", "resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "private_data_tree_id_idx" ON "private_data"("tree_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_owners" ADD CONSTRAINT "tree_owners_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_owners" ADD CONSTRAINT "tree_owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_owners" ADD CONSTRAINT "tree_owners_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_individual_links" ADD CONSTRAINT "user_individual_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_individual_links" ADD CONSTRAINT "user_individual_links_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_maintainers" ADD CONSTRAINT "tree_maintainers_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_maintainers" ADD CONSTRAINT "tree_maintainers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_maintainers" ADD CONSTRAINT "tree_maintainers_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_responded_by_fkey" FOREIGN KEY ("responded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_data" ADD CONSTRAINT "private_data_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
