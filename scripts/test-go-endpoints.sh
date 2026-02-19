#!/usr/bin/env bash
# Test Go API endpoints used by tree overview and families page.
# Usage: ./scripts/test-go-endpoints.sh [GO_API_URL] [FILE_ID]
# Example: ./scripts/test-go-endpoints.sh http://localhost:8090 abc123-def456

set -e
GO_API_URL="${1:-${NEXT_PUBLIC_GO_API_URL:-http://localhost:8090}}"
FILE_ID="${2}"

if [ -z "$FILE_ID" ]; then
  echo "Usage: $0 [GO_API_URL] [FILE_ID]"
  echo ""
  echo "Tree overview uses: GET /api/v1/files/{fileId}     (file metadata + counts)"
  echo "Families page uses: GET /api/v1/files/{fileId}/families"
  echo ""
  echo "Get a FILE_ID from your database: Tree.fileId (e.g. from Prisma: tree.fileId)"
  echo ""
  echo "Example: $0 http://localhost:8090 your-file-id-here"
  exit 1
fi

echo "Go API base: $GO_API_URL"
echo "File ID:     $FILE_ID"
echo ""

echo "1. Tree overview endpoint (GET /api/v1/files/{fileId}):"
curl -s -w "\nHTTP %{http_code}\n" "${GO_API_URL}/api/v1/files/${FILE_ID}" | head -80
echo ""

echo "2. Families endpoint (GET /api/v1/files/{fileId}/families):"
curl -s -w "\nHTTP %{http_code}\n" "${GO_API_URL}/api/v1/files/${FILE_ID}/families?limit=5" | head -80
