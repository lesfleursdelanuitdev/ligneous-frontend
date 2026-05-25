'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardMainContentLayout } from '@/components';
import { useAlbumDetail } from '@/hooks/queries/useAlbums';
import { useTreeCanManage } from '@/hooks/queries/useTreeCanManage';

function MediaThumbnail({ item }) {
  const isImage = item.mediaKind === 'gedcom' || item.mediaKind === 'site' || item.mediaKind === 'user';
  return (
    <div className="relative aspect-square bg-base-200 rounded-lg overflow-hidden group">
      <div className="w-full h-full flex items-center justify-center text-base-content/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      {item.caption && (
        <div className="absolute bottom-0 inset-x-0 bg-base-300/80 px-2 py-1 text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
          {item.caption}
        </div>
      )}
      <div className="absolute top-1.5 right-1.5">
        <span className="badge badge-ghost badge-xs opacity-0 group-hover:opacity-100 transition-opacity">
          {item.mediaKind}
        </span>
      </div>
    </div>
  );
}

export default function AlbumDetailPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const albumId = params?.id;

  const { data: album, isLoading, error } = useAlbumDetail(treeId, albumId);
  const { canManage } = useTreeCanManage(treeId);

  if (!treeId || !albumId) return null;

  if (isLoading) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Album">
        <div className="flex items-center justify-center py-16 text-base-content/40">Loading…</div>
      </DashboardMainContentLayout>
    );
  }

  if (error) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Album">
        <div className="alert alert-error max-w-xl mx-auto mt-8">
          <span>{error.message}</span>
        </div>
      </DashboardMainContentLayout>
    );
  }

  if (!album) return null;

  const media = album.media ?? [];

  return (
    <DashboardMainContentLayout treeId={treeId} title={album.title}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content: media grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-base-content/60">
              {media.length} item{media.length !== 1 ? 's' : ''}
            </p>
            {canManage && (
              <Link
                href={`/trees/${treeId}/albums/${albumId}/edit`}
                className="btn btn-sm btn-outline gap-1.5"
              >
                Manage media
              </Link>
            )}
          </div>

          {media.length === 0 ? (
            <div className="border-2 border-dashed border-base-content/10 rounded-xl flex flex-col items-center justify-center py-16 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-base-content/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-base-content/40 text-sm">No media in this album yet.</p>
              {canManage && (
                <Link href={`/trees/${treeId}/albums/${albumId}/edit`} className="btn btn-primary btn-sm mt-4">
                  Add media
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {media.map((item) => (
                <MediaThumbnail key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="card bg-base-200">
            <div className="card-body gap-3 p-4">
              <h2 className="card-title text-base">{album.title}</h2>
              {album.description && (
                <p className="text-sm text-base-content/70">{album.description}</p>
              )}
              <div className="text-xs text-base-content/40 space-y-0.5">
                <div>{album.itemCount ?? media.length} item{(album.itemCount ?? media.length) !== 1 ? 's' : ''}</div>
                {album.updatedAt && (
                  <div>Updated {new Date(album.updatedAt).toLocaleDateString()}</div>
                )}
                {album.createdAt && (
                  <div>Created {new Date(album.createdAt).toLocaleDateString()}</div>
                )}
              </div>

              {canManage && (
                <div className="flex flex-col gap-2 pt-2 border-t border-base-content/10">
                  <Link href={`/trees/${treeId}/albums/${albumId}/edit`} className="btn btn-sm btn-outline w-full">
                    Edit album
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="text-xs">
            <Link href={`/trees/${treeId}/albums`} className="link link-hover text-base-content/50">
              ← All albums
            </Link>
          </div>
        </aside>
      </div>
    </DashboardMainContentLayout>
  );
}
