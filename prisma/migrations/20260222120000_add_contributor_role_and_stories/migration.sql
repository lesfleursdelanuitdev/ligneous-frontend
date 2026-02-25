-- Migration: Add TreeContributor role, Story, and StorySubject tables
-- Date: 2026-02-22

-- ─── 1. Extend existing enums ─────────────────────────────────────────────────

-- Add contributor_role to AccessRequestType so users can request contributor access
ALTER TYPE "AccessRequestType" ADD VALUE IF NOT EXISTS 'contributor_role';

-- Add story to EntityType so stories can be tagged like any other entity
ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'story';

-- ─── 2. New enum: StorySubjectType ───────────────────────────────────────────
-- Represents the kinds of entities a story can be "about"

CREATE TYPE "StorySubjectType" AS ENUM (
  'individual',
  'family',
  'place',
  'event'
);

-- ─── 3. Tree Contributors ─────────────────────────────────────────────────────
-- Parallel to tree_owners and tree_maintainers.
-- Contributors have write access to a tree's stories (and other user-authored content).

CREATE TABLE "tree_contributors" (
  "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
  "tree_id"    UUID         NOT NULL,
  "user_id"    UUID         NOT NULL,
  "added_by"   UUID,
  "created_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "tree_contributors_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "tree_contributors_tree_id_fkey" FOREIGN KEY ("tree_id")  REFERENCES "trees"("id")  ON DELETE CASCADE,
  CONSTRAINT "tree_contributors_user_id_fkey" FOREIGN KEY ("user_id")  REFERENCES "users"("id")  ON DELETE CASCADE,
  CONSTRAINT "tree_contributors_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "tree_contributors_tree_user_unique" UNIQUE ("tree_id", "user_id")
);

CREATE INDEX "tree_contributors_tree_id_idx" ON "tree_contributors"("tree_id");
CREATE INDEX "tree_contributors_user_id_idx" ON "tree_contributors"("user_id");

-- ─── 4. Stories ───────────────────────────────────────────────────────────────
-- User-authored, long-form narrative content attached to a tree.
-- Body is stored as Markdown.
-- Authorship is tracked via author_id.
-- Visibility: draft (is_published=false) is only visible to the author;
--             published stories on public trees are visible to all.

CREATE TABLE "stories" (
  "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
  "tree_id"         UUID         NOT NULL,
  "author_id"       UUID         NOT NULL,
  "title"           VARCHAR(255) NOT NULL,
  "body"            TEXT         NOT NULL DEFAULT '',
  "excerpt"         VARCHAR(500),                      -- optional short summary
  "cover_media_id"  VARCHAR(255),                      -- Go API media UUID (no FK, cross-DB)
  "is_published"    BOOLEAN      NOT NULL DEFAULT FALSE,
  "published_at"    TIMESTAMPTZ,
  "tags"            TEXT[]       NOT NULL DEFAULT '{}',
  "views_count"     INTEGER      NOT NULL DEFAULT 0,
  "likes_count"     INTEGER      NOT NULL DEFAULT 0,
  "comments_count"  INTEGER      NOT NULL DEFAULT 0,
  "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "deleted_at"      TIMESTAMPTZ,                       -- soft delete

  CONSTRAINT "stories_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "stories_tree_id_fkey"   FOREIGN KEY ("tree_id")   REFERENCES "trees"("id")  ON DELETE CASCADE,
  CONSTRAINT "stories_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id")  ON DELETE CASCADE
);

CREATE INDEX "stories_tree_id_idx"         ON "stories"("tree_id");
CREATE INDEX "stories_author_id_idx"       ON "stories"("author_id");
CREATE INDEX "stories_is_published_idx"    ON "stories"("is_published");
CREATE INDEX "stories_published_at_idx"    ON "stories"("published_at");
CREATE INDEX "stories_created_at_idx"      ON "stories"("created_at");
CREATE INDEX "stories_tags_idx"            ON "stories" USING GIN ("tags");
CREATE INDEX "stories_tree_published_idx"  ON "stories"("tree_id", "is_published");
CREATE INDEX "stories_deleted_at_idx"      ON "stories"("deleted_at") WHERE "deleted_at" IS NULL;

-- ─── 5. Story Subjects ────────────────────────────────────────────────────────
-- A story can be "about" any number of GEDCOM entities (individuals, families,
-- places, events). Each row links one story to one entity.
-- subject_id is the UUID from the GEDCOM tables (e.g. gedcom_individuals_v2.id).
-- file_id is the tree's GEDCOM file_id for cross-referencing the Go API database.

CREATE TABLE "story_subjects" (
  "id"            UUID                NOT NULL DEFAULT gen_random_uuid(),
  "story_id"      UUID                NOT NULL,
  "subject_type"  "StorySubjectType"  NOT NULL,
  "subject_id"    VARCHAR(255)        NOT NULL,  -- UUID from GEDCOM tables
  "subject_xref"  VARCHAR(50),                   -- GEDCOM XREF for convenience
  "file_id"       VARCHAR(255)        NOT NULL,  -- tree's GEDCOM file_id
  "sort_order"    INTEGER             NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  CONSTRAINT "story_subjects_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "story_subjects_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE,
  -- Prevent the same entity appearing as a subject twice in the same story
  CONSTRAINT "story_subjects_story_entity_unique" UNIQUE ("story_id", "subject_type", "subject_id")
);

CREATE INDEX "story_subjects_story_id_idx"    ON "story_subjects"("story_id");
CREATE INDEX "story_subjects_entity_idx"      ON "story_subjects"("subject_type", "subject_id");
CREATE INDEX "story_subjects_file_entity_idx" ON "story_subjects"("file_id", "subject_type", "subject_id");
