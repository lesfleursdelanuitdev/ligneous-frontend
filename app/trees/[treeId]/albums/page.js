'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer } from '@/components/shared/data-display';
import { useTreeAlbums } from '@/hooks/queries/useAlbums';
import { useDeleteAlbum } from '@/hooks/mutations/useAlbumMutations';
import { useTreeCanManage } from '@/hooks/queries/useTreeCanManage';

export default function TreeAlbumsPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [queryParams, setQueryParams] = useState({});

  const { data, isLoading, error } = useTreeAlbums(treeId, {
    limit: queryParams.perPage,
    offset: queryParams.page && queryParams.perPage ? (queryParams.page - 1) * queryParams.perPage : undefined,
    search: queryParams.search,
  });
  const items = data?.data || [];
  const totalItems = data?.pagination?.total ?? 0;

  const { canManage } = useTreeCanManage(treeId);
  const deleteAlbum = useDeleteAlbum(treeId);

  if (!treeId) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Albums">
        <p className="text-base-content/60">Missing tree ID.</p>
      </DashboardMainContentLayout>
    );
  }

  return (
    <DashboardMainContentLayout
      treeId={treeId}
      title="Albums"
      subtitle={isLoading ? 'Loading…' : `${totalItems} album${totalItems !== 1 ? 's' : ''}`}
    >
      <DataViewContainer
        items={items}
        loading={isLoading}
        error={error?.message}
        emptyState={{ title: 'No albums', message: 'No albums in this tree yet.' }}
        defaultView="card"
        renderCard={(row) => (
          <BaseCard>
            <div className="space-y-3">
              <div className="w-full h-40 bg-base-200 rounded-lg flex items-center justify-center overflow-hidden">
                {row.coverId ? (
                  <img src={`/media/${row.coverId}`} alt={row.title} className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-base-content/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div>
                <Link
                  href={`/trees/${treeId}/albums/${row.id}`}
                  className="font-semibold text-base-content hover:underline"
                >
                  {row.title}
                </Link>
                {row.description && (
                  <p className="text-sm text-base-content/60 line-clamp-2 mt-0.5">{row.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-base-content/50">
                <span>{row.itemCount ?? 0} item{row.itemCount !== 1 ? 's' : ''}</span>
                {row.updatedAt && (
                  <span>Updated {new Date(row.updatedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </BaseCard>
        )}
        renderRow={(row) => (
          <>
            <td className="px-6 py-4 font-medium">
              <Link href={`/trees/${treeId}/albums/${row.id}`} className="hover:underline">
                {row.title}
              </Link>
            </td>
            <td className="px-6 py-4 text-sm text-base-content/70 max-w-[200px] truncate">{row.description ?? '—'}</td>
            <td className="px-6 py-4 text-sm">{(row.itemCount ?? 0).toLocaleString()}</td>
            <td className="px-6 py-4 text-sm text-base-content/50">
              {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}
            </td>
          </>
        )}
        listHeaders={[
          { label: 'Title', key: 'title', sortable: true },
          { label: 'Description', key: 'description', sortable: false },
          { label: 'Items', key: 'itemCount', sortable: false },
          { label: 'Updated', key: 'updatedAt', sortable: true },
        ]}
        searchPlaceholder="Search albums…"
        totalItems={totalItems}
        defaultPerPage={20}
        onParamsChange={setQueryParams}
        addNewComponent={
          canManage ? (
            <Link href={`/trees/${treeId}/albums/new`} className="btn btn-primary btn-sm gap-1.5">
              + New album
            </Link>
          ) : null
        }
        actions={[
          { key: 'view', label: 'View', href: (row) => `/trees/${treeId}/albums/${row.id}` },
          ...(canManage ? [
            { key: 'edit', label: 'Edit', href: (row) => `/trees/${treeId}/albums/${row.id}/edit` },
            { key: 'delete', label: 'Delete', onClick: (row) => deleteAlbum.mutate(row.id), variant: 'danger' },
          ] : []),
        ]}
      />
    </DashboardMainContentLayout>
  );
}
