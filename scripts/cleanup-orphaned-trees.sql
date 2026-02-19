-- Cleanup Script: Remove Orphaned Trees from Frontend Database
-- This script removes trees that don't exist in the backend database
-- while preserving the "monalig" user and all other users

-- Step 1: Identify orphaned trees (trees whose file_id doesn't exist in backend)
-- Backend file_ids that exist:
--   2d407e82-5d07-4bbc-badf-e9b3851dac25
--   b2031a46-bcab-4478-9476-b91fd8a843b5
--   2d795173-a1f1-43b1-8d18-7403cb6ba897
--   ec6975e7-1d07-4a2a-8f4b-8df4230fb1fa
--   98e8f028-a70a-43a3-bb66-07ba91e447e0
--   3d9853a6-8876-46cb-a3c9-69121ebb155a
--   test_permission_check

-- Orphaned file_ids (exist in frontend but not in backend):
--   0308656d-2099-44fa-9df4-b1f6aeaac5c1 - European Royal Families
--   ac324db0-8c70-44bd-a785-0d4a84551d9e - Gonsalves Family Tree
--   b8287770-3927-4812-8fcf-8f8052281057 - Xavier Family Tree
--   af8c962c-afb7-41e2-9a8b-2d3157ef6c01 - Gracis Family Tree
--   8b091512-4aba-4367-816b-41f3bda981ca - US Presidents

BEGIN;

-- Show what will be deleted (for verification)
SELECT 
    'Trees to be deleted:' as action,
    COUNT(*) as count
FROM trees
WHERE file_id IN (
    '0308656d-2099-44fa-9df4-b1f6aeaac5c1',
    'ac324db0-8c70-44bd-a785-0d4a84551d9e',
    'b8287770-3927-4812-8fcf-8f8052281057',
    'af8c962c-afb7-41e2-9a8b-2d3157ef6c01',
    '8b091512-4aba-4367-816b-41f3bda981ca'
);

-- Show tree details
SELECT 
    id,
    name,
    file_id,
    created_at
FROM trees
WHERE file_id IN (
    '0308656d-2099-44fa-9df4-b1f6aeaac5c1',
    'ac324db0-8c70-44bd-a785-0d4a84551d9e',
    'b8287770-3927-4812-8fcf-8f8052281057',
    'af8c962c-afb7-41e2-9a8b-2d3157ef6c01',
    '8b091512-4aba-4367-816b-41f3bda981ca'
)
ORDER BY created_at;

-- Step 2: Delete related records first (due to foreign key constraints)
-- Delete in reverse order of dependencies

-- Note: tagged_items table may not exist if tags feature migrations haven't been run
-- Skip if table doesn't exist (will be handled gracefully)

-- Delete invitation link uses for orphaned trees
DELETE FROM invitation_link_uses
WHERE link_id IN (
    SELECT id FROM invitation_links
    WHERE tree_id IN (
        SELECT id FROM trees
        WHERE file_id IN (
            '0308656d-2099-44fa-9df4-b1f6aeaac5c1',
            'ac324db0-8c70-44bd-a785-0d4a84551d9e',
            'b8287770-3927-4812-8fcf-8f8052281057',
            'af8c962c-afb7-41e2-9a8b-2d3157ef6c01',
            '8b091512-4aba-4367-816b-41f3bda981ca'
        )
    )
);

-- Delete invitation links for orphaned trees
DELETE FROM invitation_links
WHERE tree_id IN (
    SELECT id FROM trees
    WHERE file_id IN (
        '0308656d-2099-44fa-9df4-b1f6aeaac5c1',
        'ac324db0-8c70-44bd-a785-0d4a84551d9e',
        'b8287770-3927-4812-8fcf-8f8052281057',
        'af8c962c-afb7-41e2-9a8b-2d3157ef6c01',
        '8b091512-4aba-4367-816b-41f3bda981ca'
    )
);

-- Delete access requests for orphaned trees
DELETE FROM access_requests
WHERE tree_id IN (
    SELECT id FROM trees
    WHERE file_id IN (
        '0308656d-2099-44fa-9df4-b1f6aeaac5c1',
        'ac324db0-8c70-44bd-a785-0d4a84551d9e',
        'b8287770-3927-4812-8fcf-8f8052281057',
        'af8c962c-afb7-41e2-9a8b-2d3157ef6c01',
        '8b091512-4aba-4367-816b-41f3bda981ca'
    )
);

-- Delete permissions for orphaned trees
DELETE FROM permissions
WHERE tree_id IN (
    SELECT id FROM trees
    WHERE file_id IN (
        '0308656d-2099-44fa-9df4-b1f6aeaac5c1',
        'ac324db0-8c70-44bd-a785-0d4a84551d9e',
        'b8287770-3927-4812-8fcf-8f8052281057',
        'af8c962c-afb7-41e2-9a8b-2d3157ef6c01',
        '8b091512-4aba-4367-816b-41f3bda981ca'
    )
);

-- Delete private data for orphaned trees
DELETE FROM private_data
WHERE tree_id IN (
    SELECT id FROM trees
    WHERE file_id IN (
        '0308656d-2099-44fa-9df4-b1f6aeaac5c1',
        'ac324db0-8c70-44bd-a785-0d4a84551d9e',
        'b8287770-3927-4812-8fcf-8f8052281057',
        'af8c962c-afb7-41e2-9a8b-2d3157ef6c01',
        '8b091512-4aba-4367-816b-41f3bda981ca'
    )
);

-- Delete user individual links for orphaned trees
DELETE FROM user_individual_links
WHERE tree_id IN (
    SELECT id FROM trees
    WHERE file_id IN (
        '0308656d-2099-44fa-9df4-b1f6aeaac5c1',
        'ac324db0-8c70-44bd-a785-0d4a84551d9e',
        'b8287770-3927-4812-8fcf-8f8052281057',
        'af8c962c-afb7-41e2-9a8b-2d3157ef6c01',
        '8b091512-4aba-4367-816b-41f3bda981ca'
    )
);

-- Delete tree maintainers for orphaned trees
DELETE FROM tree_maintainers
WHERE tree_id IN (
    SELECT id FROM trees
    WHERE file_id IN (
        '0308656d-2099-44fa-9df4-b1f6aeaac5c1',
        'ac324db0-8c70-44bd-a785-0d4a84551d9e',
        'b8287770-3927-4812-8fcf-8f8052281057',
        'af8c962c-afb7-41e2-9a8b-2d3157ef6c01',
        '8b091512-4aba-4367-816b-41f3bda981ca'
    )
);

-- Delete tree owners for orphaned trees
DELETE FROM tree_owners
WHERE tree_id IN (
    SELECT id FROM trees
    WHERE file_id IN (
        '0308656d-2099-44fa-9df4-b1f6aeaac5c1',
        'ac324db0-8c70-44bd-a785-0d4a84551d9e',
        'b8287770-3927-4812-8fcf-8f8052281057',
        'af8c962c-afb7-41e2-9a8b-2d3157ef6c01',
        '8b091512-4aba-4367-816b-41f3bda981ca'
    )
);

-- Step 3: Finally, delete the orphaned trees themselves
DELETE FROM trees
WHERE file_id IN (
    '0308656d-2099-44fa-9df4-b1f6aeaac5c1',
    'ac324db0-8c70-44bd-a785-0d4a84551d9e',
    'b8287770-3927-4812-8fcf-8f8052281057',
    'af8c962c-afb7-41e2-9a8b-2d3157ef6c01',
    '8b091512-4aba-4367-816b-41f3bda981ca'
);

-- Step 4: Verify cleanup
SELECT 
    'Remaining trees:' as status,
    COUNT(*) as count
FROM trees;

SELECT 
    'Remaining users:' as status,
    COUNT(*) as count
FROM users;

-- Show remaining trees
SELECT 
    id,
    name,
    file_id,
    created_at
FROM trees
ORDER BY created_at;

-- Show all users (should still have monalig)
SELECT 
    id,
    username,
    email,
    is_website_owner
FROM users
ORDER BY created_at;

COMMIT;

