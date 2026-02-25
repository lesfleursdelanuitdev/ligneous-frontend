-- CreateTable
CREATE TABLE "research_todo_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tree_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "due_date" DATE,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "research_todo_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tree_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" VARCHAR(500) NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "research_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "research_todo_items_tree_id_idx" ON "research_todo_items"("tree_id");

-- CreateIndex
CREATE INDEX "research_todo_items_user_id_idx" ON "research_todo_items"("user_id");

-- CreateIndex
CREATE INDEX "research_links_tree_id_idx" ON "research_links"("tree_id");

-- CreateIndex
CREATE INDEX "research_links_user_id_idx" ON "research_links"("user_id");

-- AddForeignKey
ALTER TABLE "research_todo_items" ADD CONSTRAINT "research_todo_items_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_todo_items" ADD CONSTRAINT "research_todo_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_links" ADD CONSTRAINT "research_links_tree_id_fkey" FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_links" ADD CONSTRAINT "research_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
