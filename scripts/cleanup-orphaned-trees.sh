#!/bin/bash
# Cleanup Script: Remove Orphaned Trees from Frontend Database
# This script removes trees that don't exist in the backend database
# while preserving all users (including "monalig")

set -e

echo "🧹 Cleaning up orphaned trees from frontend database..."
echo ""

# Database connection details
DB_HOST="localhost"
DB_USER="ligneous_user"
DB_NAME="ligneous_frontend"
DB_PASSWORD="ligneous_password"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/cleanup-orphaned-trees.sql"

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: SQL file not found: $SQL_FILE"
    exit 1
fi

echo "📋 Preview of what will be deleted:"
echo ""

# Show trees that will be deleted
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<EOF
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
EOF

echo ""
read -p "⚠️  Are you sure you want to delete these orphaned trees? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cleanup cancelled."
    exit 0
fi

echo ""
echo "🗑️  Executing cleanup..."
echo ""

# Execute the SQL script
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<EOF
SELECT 
    'Remaining trees:' as status,
    COUNT(*) as count
FROM trees;

SELECT 
    'Remaining users:' as status,
    COUNT(*) as count
FROM users;
EOF

echo ""
echo "✅ Done!"

