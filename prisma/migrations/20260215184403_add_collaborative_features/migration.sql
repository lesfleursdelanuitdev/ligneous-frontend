
-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('media', 'event', 'individual', 'family', 'note', 'source', 'place', 'date');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('pending', 'approved', 'rejected', 'needs_info');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('public', 'collaborators_only', 'private');

-- CreateEnum
CREATE TYPE "ActivityVisibility" AS ENUM ('public', 'followers_only', 'collaborators_only', 'private');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('research_update', 'family_story', 'research_discovery', 'collaboration_request', 'recipe', 'research_log');

-- CreateEnum
CREATE TYPE "ContentVisibility" AS ENUM ('public', 'followers_only', 'collaborators_only', 'private');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('comment', 'reply', 'mention', 'suggestion', 'message', 'access_request', 'activity', 'system', 'follow', 'content_like', 'content_comment', 'content_share');

-- CreateTable
CREATE TABLE "albums" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cover_media_id" VARCHAR(255),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album_media" (
    "id" UUID NOT NULL,
    "album_id" UUID NOT NULL,
    "file_id" VARCHAR(255) NOT NULL,
    "media_id" VARCHAR(255) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by" UUID,

    CONSTRAINT "album_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album_shares" (
    "id" UUID NOT NULL,
    "album_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "shared_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shared_by" UUID NOT NULL,

    CONSTRAINT "album_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7),
    "description" TEXT,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tagged_items" (
    "id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "tagged_by" UUID NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "file_id" VARCHAR(255) NOT NULL,
    "entity_id" VARCHAR(255) NOT NULL,
    "entity_xref" VARCHAR(50),
    "tagged_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tagged_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(255) NOT NULL,
    "tree_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" UUID,
    "content" TEXT NOT NULL,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussion_threads" (
    "id" UUID NOT NULL,
    "tree_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "tags" TEXT[],
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "discussion_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussion_posts" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "discussion_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestions" (
    "id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(255) NOT NULL,
    "tree_id" UUID NOT NULL,
    "field_name" VARCHAR(255) NOT NULL,
    "current_value" TEXT,
    "suggested_value" TEXT NOT NULL,
    "evidence" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'pending',
    "suggested_by" UUID NOT NULL,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "review_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_notes" (
    "id" UUID NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" VARCHAR(255),
    "tree_id" UUID,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255),
    "content" TEXT NOT NULL,
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "notebook_id" UUID,
    "tags" TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "research_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notebooks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notebooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "recipient_id" UUID,
    "group_id" UUID,
    "subject" VARCHAR(255),
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_groups" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "tree_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "display_name" VARCHAR(255),
    "bio" TEXT,
    "location" VARCHAR(255),
    "profile_photo_url" VARCHAR(500),
    "cover_photo_url" VARCHAR(500),
    "research_surnames" TEXT[],
    "research_locations" TEXT[],
    "research_time_periods" TEXT[],
    "research_goals" TEXT,
    "years_researching" INTEGER,
    "specializations" TEXT[],
    "certifications" TEXT[],
    "languages" TEXT[],
    "profile_visibility" "ProfileVisibility" NOT NULL DEFAULT 'collaborators_only',
    "activity_visibility" "ActivityVisibility" NOT NULL DEFAULT 'collaborators_only',
    "allow_direct_messages" BOOLEAN NOT NULL DEFAULT true,
    "allow_following" BOOLEAN NOT NULL DEFAULT true,
    "trees_owned_count" INTEGER NOT NULL DEFAULT 0,
    "trees_maintained_count" INTEGER NOT NULL DEFAULT 0,
    "contributions_count" INTEGER NOT NULL DEFAULT 0,
    "followers_count" INTEGER NOT NULL DEFAULT 0,
    "following_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" UUID NOT NULL,
    "follower_id" UUID NOT NULL,
    "followee_id" UUID,
    "tree_id" UUID,
    "entity_type" VARCHAR(50),
    "entity_id" VARCHAR(255),
    "discussion_thread_id" UUID,
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_content" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "title" VARCHAR(255),
    "content" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "ContentVisibility" NOT NULL DEFAULT 'followers_only',
    "tree_id" UUID,
    "entity_type" VARCHAR(50),
    "entity_id" VARCHAR(255),
    "surnames" TEXT[],
    "locations" TEXT[],
    "time_periods" TEXT[],
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "shares_count" INTEGER NOT NULL DEFAULT 0,
    "recipe_ingredients" TEXT,
    "recipe_instructions" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_likes" (
    "id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_comments" (
    "id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" UUID,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "content_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_shares" (
    "id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "shared_with" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_feeds" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content_id" UUID NOT NULL,
    "source_type" VARCHAR(50) NOT NULL,
    "source_id" VARCHAR(255) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "link" VARCHAR(500),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "activity_type" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" VARCHAR(255),
    "tree_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_attachments" (
    "id" UUID NOT NULL,
    "file_id" VARCHAR(255) NOT NULL,
    "media_id" VARCHAR(255) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CommentMentions" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_CommentMentions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ThreadWatchers" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ThreadWatchers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PostMentions" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_PostMentions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PostAttachments" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_PostAttachments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GroupMembers" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_GroupMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SuggestionAttachments" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_SuggestionAttachments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ResearchNoteAttachments" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ResearchNoteAttachments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MessageAttachments" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_MessageAttachments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ContentMedia" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ContentMedia_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "albums_user_id_idx" ON "albums"("user_id");

-- CreateIndex
CREATE INDEX "albums_user_id_is_public_idx" ON "albums"("user_id", "is_public");

-- CreateIndex
CREATE INDEX "album_media_album_id_idx" ON "album_media"("album_id");

-- CreateIndex
CREATE INDEX "album_media_file_id_media_id_idx" ON "album_media"("file_id", "media_id");

-- CreateIndex
CREATE UNIQUE INDEX "album_media_album_id_file_id_media_id_key" ON "album_media"("album_id", "file_id", "media_id");

-- CreateIndex
CREATE INDEX "album_shares_album_id_idx" ON "album_shares"("album_id");

-- CreateIndex
CREATE INDEX "album_shares_user_id_idx" ON "album_shares"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "album_shares_album_id_user_id_key" ON "album_shares"("album_id", "user_id");

-- CreateIndex
CREATE INDEX "tags_user_id_idx" ON "tags"("user_id");

-- CreateIndex
CREATE INDEX "tags_is_global_idx" ON "tags"("is_global");

-- CreateIndex
CREATE INDEX "tags_is_global_name_idx" ON "tags"("is_global", "name");

-- CreateIndex
CREATE INDEX "tags_name_idx" ON "tags"("name");

-- CreateIndex
CREATE INDEX "tags_user_id_name_idx" ON "tags"("user_id", "name");

-- CreateIndex
CREATE INDEX "tagged_items_tag_id_idx" ON "tagged_items"("tag_id");

-- CreateIndex
CREATE INDEX "tagged_items_tagged_by_entity_type_file_id_entity_id_idx" ON "tagged_items"("tagged_by", "entity_type", "file_id", "entity_id");

-- CreateIndex
CREATE INDEX "tagged_items_entity_type_file_id_entity_id_idx" ON "tagged_items"("entity_type", "file_id", "entity_id");

-- CreateIndex
CREATE INDEX "tagged_items_tagged_by_idx" ON "tagged_items"("tagged_by");

-- CreateIndex
CREATE UNIQUE INDEX "tagged_items_tag_id_tagged_by_entity_type_file_id_entity_id_key" ON "tagged_items"("tag_id", "tagged_by", "entity_type", "file_id", "entity_id");

-- CreateIndex
CREATE INDEX "comments_entity_type_entity_id_idx" ON "comments"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "comments_tree_id_idx" ON "comments"("tree_id");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");

-- CreateIndex
CREATE INDEX "discussion_threads_tree_id_idx" ON "discussion_threads"("tree_id");

-- CreateIndex
CREATE INDEX "discussion_threads_created_by_idx" ON "discussion_threads"("created_by");

-- CreateIndex
CREATE INDEX "discussion_threads_category_idx" ON "discussion_threads"("category");

-- CreateIndex
CREATE INDEX "discussion_threads_tags_idx" ON "discussion_threads"("tags");

-- CreateIndex
CREATE INDEX "discussion_posts_thread_id_idx" ON "discussion_posts"("thread_id");

-- CreateIndex
CREATE INDEX "discussion_posts_user_id_idx" ON "discussion_posts"("user_id");

-- CreateIndex
CREATE INDEX "discussion_posts_created_at_idx" ON "discussion_posts"("created_at");

-- CreateIndex
CREATE INDEX "suggestions_entity_type_entity_id_idx" ON "suggestions"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "suggestions_tree_id_idx" ON "suggestions"("tree_id");

-- CreateIndex
CREATE INDEX "suggestions_status_idx" ON "suggestions"("status");

-- CreateIndex
CREATE INDEX "suggestions_suggested_by_idx" ON "suggestions"("suggested_by");

-- CreateIndex
CREATE INDEX "suggestions_reviewed_by_idx" ON "suggestions"("reviewed_by");

-- CreateIndex
CREATE INDEX "research_notes_entity_type_entity_id_idx" ON "research_notes"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "research_notes_tree_id_idx" ON "research_notes"("tree_id");

-- CreateIndex
CREATE INDEX "research_notes_user_id_idx" ON "research_notes"("user_id");

-- CreateIndex
CREATE INDEX "research_notes_notebook_id_idx" ON "research_notes"("notebook_id");

-- CreateIndex
CREATE INDEX "research_notes_tags_idx" ON "research_notes"("tags");

-- CreateIndex
CREATE INDEX "notebooks_user_id_idx" ON "notebooks"("user_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_recipient_id_idx" ON "messages"("recipient_id");

-- CreateIndex
CREATE INDEX "messages_group_id_idx" ON "messages"("group_id");

-- CreateIndex
CREATE INDEX "messages_is_read_idx" ON "messages"("is_read");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "message_groups_tree_id_idx" ON "message_groups"("tree_id");

-- CreateIndex
CREATE INDEX "message_groups_created_by_idx" ON "message_groups"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "follows_follower_id_idx" ON "follows"("follower_id");

-- CreateIndex
CREATE INDEX "follows_followee_id_idx" ON "follows"("followee_id");

-- CreateIndex
CREATE INDEX "follows_tree_id_idx" ON "follows"("tree_id");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_followee_id_key" ON "follows"("follower_id", "followee_id");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_tree_id_key" ON "follows"("follower_id", "tree_id");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_entity_type_entity_id_key" ON "follows"("follower_id", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_discussion_thread_id_key" ON "follows"("follower_id", "discussion_thread_id");

-- CreateIndex
CREATE INDEX "user_content_user_id_idx" ON "user_content"("user_id");

-- CreateIndex
CREATE INDEX "user_content_content_type_idx" ON "user_content"("content_type");

-- CreateIndex
CREATE INDEX "user_content_tree_id_idx" ON "user_content"("tree_id");

-- CreateIndex
CREATE INDEX "user_content_is_public_idx" ON "user_content"("is_public");

-- CreateIndex
CREATE INDEX "user_content_created_at_idx" ON "user_content"("created_at");

-- CreateIndex
CREATE INDEX "user_content_surnames_idx" ON "user_content"("surnames");

-- CreateIndex
CREATE INDEX "user_content_locations_idx" ON "user_content"("locations");

-- CreateIndex
CREATE INDEX "user_content_time_periods_idx" ON "user_content"("time_periods");

-- CreateIndex
CREATE INDEX "content_likes_content_id_idx" ON "content_likes"("content_id");

-- CreateIndex
CREATE INDEX "content_likes_user_id_idx" ON "content_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_likes_content_id_user_id_key" ON "content_likes"("content_id", "user_id");

-- CreateIndex
CREATE INDEX "content_comments_content_id_idx" ON "content_comments"("content_id");

-- CreateIndex
CREATE INDEX "content_comments_user_id_idx" ON "content_comments"("user_id");

-- CreateIndex
CREATE INDEX "content_comments_parent_id_idx" ON "content_comments"("parent_id");

-- CreateIndex
CREATE INDEX "content_shares_content_id_idx" ON "content_shares"("content_id");

-- CreateIndex
CREATE INDEX "content_shares_user_id_idx" ON "content_shares"("user_id");

-- CreateIndex
CREATE INDEX "user_feeds_user_id_is_read_created_at_idx" ON "user_feeds"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "user_feeds_content_id_idx" ON "user_feeds"("content_id");

-- CreateIndex
CREATE INDEX "user_feeds_source_type_source_id_idx" ON "user_feeds"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "activities_tree_id_idx" ON "activities"("tree_id");

-- CreateIndex
CREATE INDEX "activities_user_id_idx" ON "activities"("user_id");

-- CreateIndex
CREATE INDEX "activities_activity_type_idx" ON "activities"("activity_type");

-- CreateIndex
CREATE INDEX "activities_created_at_idx" ON "activities"("created_at");

-- CreateIndex
CREATE INDEX "media_attachments_file_id_media_id_idx" ON "media_attachments"("file_id", "media_id");

-- CreateIndex
CREATE INDEX "media_attachments_entity_type_entity_id_idx" ON "media_attachments"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "_CommentMentions_B_index" ON "_CommentMentions"("B");

-- CreateIndex
CREATE INDEX "_ThreadWatchers_B_index" ON "_ThreadWatchers"("B");

-- CreateIndex
CREATE INDEX "_PostMentions_B_index" ON "_PostMentions"("B");

-- CreateIndex
CREATE INDEX "_PostAttachments_B_index" ON "_PostAttachments"("B");

-- CreateIndex
CREATE INDEX "_GroupMembers_B_index" ON "_GroupMembers"("B");

-- CreateIndex
CREATE INDEX "_SuggestionAttachments_B_index" ON "_SuggestionAttachments"("B");

-- CreateIndex
CREATE INDEX "_ResearchNoteAttachments_B_index" ON "_ResearchNoteAttachments"("B");

-- CreateIndex
CREATE INDEX "_MessageAttachments_B_index" ON "_MessageAttachments"("B");

-- CreateIndex
CREATE INDEX "_ContentMedia_B_index" ON "_ContentMedia"("B");

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_media" ADD CONSTRAINT "album_media_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_media" ADD CONSTRAINT "album_media_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_shares" ADD CONSTRAINT "album_shares_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_shares" ADD CONSTRAINT "album_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_shares" ADD CONSTRAINT "album_shares_shared_by_fkey" FOREIGN KEY ("shared_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tagged_items" ADD CONSTRAINT "tagged_items_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tagged_items" ADD CONSTRAINT "tagged_items_tagged_by_fkey" FOREIGN KEY ("tagged_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_threads" ADD CONSTRAINT "discussion_threads_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_threads" ADD CONSTRAINT "discussion_threads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_posts" ADD CONSTRAINT "discussion_posts_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "discussion_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_posts" ADD CONSTRAINT "discussion_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_suggested_by_fkey" FOREIGN KEY ("suggested_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_notes" ADD CONSTRAINT "research_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_notes" ADD CONSTRAINT "research_notes_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_notes" ADD CONSTRAINT "research_notes_notebook_id_fkey" FOREIGN KEY ("notebook_id") REFERENCES "notebooks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notebooks" ADD CONSTRAINT "notebooks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "message_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_groups" ADD CONSTRAINT "message_groups_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_groups" ADD CONSTRAINT "message_groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followee_id_fkey" FOREIGN KEY ("followee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_discussion_thread_id_fkey" FOREIGN KEY ("discussion_thread_id") REFERENCES "discussion_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_content" ADD CONSTRAINT "user_content_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_content" ADD CONSTRAINT "user_content_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_likes" ADD CONSTRAINT "content_likes_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "user_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_likes" ADD CONSTRAINT "content_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_comments" ADD CONSTRAINT "content_comments_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "user_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_comments" ADD CONSTRAINT "content_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_comments" ADD CONSTRAINT "content_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "content_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_shares" ADD CONSTRAINT "content_shares_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "user_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_shares" ADD CONSTRAINT "content_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feeds" ADD CONSTRAINT "user_feeds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feeds" ADD CONSTRAINT "user_feeds_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "user_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommentMentions" ADD CONSTRAINT "_CommentMentions_A_fkey" FOREIGN KEY ("A") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommentMentions" ADD CONSTRAINT "_CommentMentions_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ThreadWatchers" ADD CONSTRAINT "_ThreadWatchers_A_fkey" FOREIGN KEY ("A") REFERENCES "discussion_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ThreadWatchers" ADD CONSTRAINT "_ThreadWatchers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostMentions" ADD CONSTRAINT "_PostMentions_A_fkey" FOREIGN KEY ("A") REFERENCES "discussion_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostMentions" ADD CONSTRAINT "_PostMentions_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostAttachments" ADD CONSTRAINT "_PostAttachments_A_fkey" FOREIGN KEY ("A") REFERENCES "discussion_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostAttachments" ADD CONSTRAINT "_PostAttachments_B_fkey" FOREIGN KEY ("B") REFERENCES "media_attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupMembers" ADD CONSTRAINT "_GroupMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "message_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupMembers" ADD CONSTRAINT "_GroupMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SuggestionAttachments" ADD CONSTRAINT "_SuggestionAttachments_A_fkey" FOREIGN KEY ("A") REFERENCES "media_attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SuggestionAttachments" ADD CONSTRAINT "_SuggestionAttachments_B_fkey" FOREIGN KEY ("B") REFERENCES "suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchNoteAttachments" ADD CONSTRAINT "_ResearchNoteAttachments_A_fkey" FOREIGN KEY ("A") REFERENCES "media_attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchNoteAttachments" ADD CONSTRAINT "_ResearchNoteAttachments_B_fkey" FOREIGN KEY ("B") REFERENCES "research_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MessageAttachments" ADD CONSTRAINT "_MessageAttachments_A_fkey" FOREIGN KEY ("A") REFERENCES "media_attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MessageAttachments" ADD CONSTRAINT "_MessageAttachments_B_fkey" FOREIGN KEY ("B") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentMedia" ADD CONSTRAINT "_ContentMedia_A_fkey" FOREIGN KEY ("A") REFERENCES "media_attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentMedia" ADD CONSTRAINT "_ContentMedia_B_fkey" FOREIGN KEY ("B") REFERENCES "user_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

