# Albums and Tags Implementation

**Date:** 2026-02-13  
**Status:** ✅ Complete

---

## Overview

Implemented a comprehensive albums and tags system for organizing media and entities in the Ligneous frontend. Albums allow users to create collections of media items, while tags provide both global and user-specific organization for any entity type.

---

## Database Schema

### Albums Tables

1. **`albums`** - User-created album collections
   - `id` (UUID, PK)
   - `userId` (FK → users)
   - `name`, `description`
   - `coverMediaId` (UUID from Go API)
   - `isPublic`, `sortOrder`
   - Timestamps

2. **`album_media`** - Junction table for album-media relationships
   - `id` (UUID, PK)
   - `albumId` (FK → albums)
   - `fileId`, `mediaId` (references Go API media)
   - `sortOrder` (for ordering within album)
   - `addedBy` (FK → users)

3. **`album_shares`** - Album sharing with other users
   - `id` (UUID, PK)
   - `albumId` (FK → albums)
   - `userId` (FK → users)
   - `canEdit` (boolean)
   - `sharedBy` (FK → users)

### Tags Tables

1. **`tags`** - Tag definitions (global and user-specific)
   - `id` (UUID, PK)
   - `userId` (nullable - null for global tags)
   - `name`, `color`, `description`
   - `isGlobal` (boolean)
   - `createdBy` (FK → users)
   - Timestamps

2. **`tagged_items`** - Polymorphic tagging of entities
   - `id` (UUID, PK)
   - `tagId` (FK → tags)
   - `taggedBy` (FK → users - who applied the tag)
   - `entityType` (enum: media, event, individual, family, note, source, place, date)
   - `fileId`, `entityId`, `entityXref` (optional)
   - `taggedAt`

---

## API Endpoints

### Albums

- `POST /api/albums` - Create album
- `GET /api/albums` - List albums (with filter: owned, shared, or all)
- `GET /api/albums/{id}` - Get album details
- `PUT /api/albums/{id}` - Update album
- `DELETE /api/albums/{id}` - Delete album
- `GET /api/albums/{id}/media` - List album media (enriched from Go API)
- `POST /api/albums/{id}/media` - Add media to album
- `DELETE /api/albums/{id}/media/{mediaId}` - Remove media from album
- `PUT /api/albums/{id}/media` - Reorder media in album
- `GET /api/albums/{id}/share` - List users album is shared with
- `POST /api/albums/{id}/share` - Share album with user
- `DELETE /api/albums/{id}/share/{userId}` - Unshare album

### Tags

- `GET /api/tags` - List tags (user tags + global tags)
- `POST /api/tags` - Create user tag
- `GET /api/tags/global` - List global tags
- `POST /api/tags/global` - Create global tag (admin only)
- `GET /api/tags/{id}` - Get tag details
- `PUT /api/tags/{id}` - Update tag
- `DELETE /api/tags/{id}` - Delete tag
- `GET /api/tags/{id}/items` - List entities with this tag
- `POST /api/tags/{id}/items` - Tag an entity
- `DELETE /api/tags/{id}/items` - Untag an entity
- `GET /api/trees/{treeId}/entities/{entityType}/{entityId}/tags` - Get tags for entity
- `POST /api/trees/{treeId}/entities/{entityType}/{entityId}/tags` - Add tag to entity
- `DELETE /api/trees/{treeId}/entities/{entityType}/{entityId}/tags?tagId={tagId}` - Remove tag from entity

---

## Mycelia Facets

### `useAlbums` Facet

**Methods:**
- `listAlbums(filter)` - List albums (owned, shared, or all)
- `createAlbum(albumData)` - Create new album
- `getAlbum(albumId)` - Get album details
- `updateAlbum(albumId, albumData)` - Update album
- `deleteAlbum(albumId)` - Delete album
- `getAlbumMedia(albumId)` - Get album media (enriched from Go API)
- `addMediaToAlbum(albumId, fileId, mediaId, sortOrder)` - Add media to album
- `removeMediaFromAlbum(albumId, mediaId)` - Remove media from album
- `reorderAlbumMedia(albumId, mediaOrder)` - Reorder media in album
- `shareAlbum(albumId, userId, canEdit)` - Share album with user
- `unshareAlbum(albumId, userId)` - Unshare album
- `getState()` - Get current state
- `clearError()` - Clear error state

**Events:**
- `albums:stateChanged` - State changed
- `albums:listed` - Albums listed
- `albums:created` - Album created
- `albums:updated` - Album updated
- `albums:deleted` - Album deleted
- `albums:media:added` - Media added to album
- `albums:media:removed` - Media removed from album
- `albums:media:reordered` - Media reordered
- `albums:shared` - Album shared
- `albums:unshared` - Album unshared

### `useTags` Facet

**Methods:**
- `listTags()` - List user tags + global tags
- `listGlobalTags()` - List only global tags
- `createTag(tagData)` - Create user tag
- `createGlobalTag(tagData)` - Create global tag (admin only)
- `getTag(tagId)` - Get tag details
- `updateTag(tagId, tagData)` - Update tag
- `deleteTag(tagId)` - Delete tag
- `getEntityTags(treeId, entityType, entityId)` - Get tags for entity
- `tagEntity(treeId, entityType, entityId, tagId, entityXref)` - Tag an entity
- `untagEntity(treeId, entityType, entityId, tagId)` - Remove tag from entity
- `getTaggedItems(tagId, entityType)` - Get entities with a tag
- `getState()` - Get current state
- `clearError()` - Clear error state

**Events:**
- `tags:stateChanged` - State changed
- `tags:listed` - Tags listed
- `tags:created` - Tag created
- `tags:global:created` - Global tag created
- `tags:updated` - Tag updated
- `tags:deleted` - Tag deleted
- `tags:entity:tagged` - Entity tagged
- `tags:entity:untagged` - Entity untagged

---

## Key Features

### Albums

1. **User-Specific Collections**: Albums belong to users and can be shared
2. **Media Enrichment**: Album media details fetched from Go API on-demand
3. **Ordering**: Media can be reordered within albums
4. **Sharing**: Albums can be shared with other users (read-only or edit)
5. **Cover Images**: Albums can have a cover media item

### Tags

1. **Global Tags**: System-wide tags for organization (admin-created)
2. **User Tags**: Personal tags for individual organization
3. **Polymorphic Tagging**: Can tag any entity type (media, event, individual, family, note, source, place, date)
4. **Privacy**: User tags are private; global tags are visible to all
5. **Flexible Application**: Global tags can be applied by anyone; user tags only by owner

---

## Permission Model

### Albums

- **Create**: Any authenticated user
- **Read**: Owner, shared users, or website owner
- **Update**: Owner, users with edit permission, or website owner
- **Delete**: Owner or website owner
- **Share**: Owner or website owner

### Tags

**Global Tags:**
- **Create**: Website owner only
- **Read**: All users
- **Update**: Website owner only
- **Delete**: Website owner only
- **Apply**: Any user with read access to entity
- **Remove**: User who applied it, or website owner

**User Tags:**
- **Create**: Owner only
- **Read**: Owner only
- **Update**: Owner only
- **Delete**: Owner only
- **Apply**: Owner only
- **Remove**: Owner only

---

## Integration Points

### Go API Integration

- Albums reference media by `(fileId, mediaId)` tuple
- Media details fetched from Go API when needed
- No changes required to Go API

### Frontend Integration

- Mycelia facets provide reactive state management
- API routes handle authentication and permissions
- Ready for React component integration

---

## Database Migration

The Prisma schema has been updated with all new models. To apply the migration:

```bash
cd /apps/ligneous-frontend
npx prisma migrate dev --name add_albums_and_tags
```

Or use `prisma db push` for development:

```bash
npx prisma db push
```

---

## Next Steps

1. **UI Components**: Create React components for album and tag management
2. **Tag UI**: Add tagging interface throughout the app (individual pages, media gallery, etc.)
3. **Album Gallery**: Create album browsing and viewing interface
4. **Search by Tag**: Implement tag-based search functionality
5. **Migration**: Run database migration when ready

---

## Files Created/Modified

### Created

- `prisma/schema.prisma` - Updated with Albums and Tags models
- `app/api/albums/route.js` - Albums list/create
- `app/api/albums/[id]/route.js` - Album CRUD
- `app/api/albums/[id]/media/route.js` - Album media management
- `app/api/albums/[id]/media/[mediaId]/route.js` - Remove media from album
- `app/api/albums/[id]/share/route.js` - Album sharing
- `app/api/albums/[id]/share/[userId]/route.js` - Remove share
- `app/api/tags/route.js` - User tags list/create
- `app/api/tags/global/route.js` - Global tags list/create
- `app/api/tags/[id]/route.js` - Tag CRUD
- `app/api/tags/[id]/items/route.js` - Tag items management
- `app/api/trees/[treeId]/entities/[entityType]/[entityId]/tags/route.js` - Entity tags
- `mycelia/facets/albums.js` - Albums Mycelia facet
- `mycelia/facets/tags.js` - Tags Mycelia facet

### Modified

- `mycelia/system.builder.js` - Added useAlbums and useTags

---

## Testing

To test the implementation:

1. **Create an album:**
   ```javascript
   const albums = useFacet('albums');
   const album = await albums.createAlbum({
     name: 'Family Photos',
     description: 'Photos of my family'
   });
   ```

2. **Add media to album:**
   ```javascript
   await albums.addMediaToAlbum(album.id, fileId, mediaId);
   ```

3. **Create a tag:**
   ```javascript
   const tags = useFacet('tags');
   const tag = await tags.createTag({
     name: 'Ancestor',
     color: '#FF5733'
   });
   ```

4. **Tag an entity:**
   ```javascript
   await tags.tagEntity(treeId, 'individual', 'I1', tag.id, 'I1');
   ```

---

**Implementation Complete!** ✅

