'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, TagsCell } from '@/components/shared/data-display';
import { useTreeEntityList } from '@/hooks/queries/useTreeEntityList';

const KIND_LABELS = {
  story: 'Story',
  article: 'Article',
  post: 'Post',
  folklore: 'Folklore',
};

export default function TreeStoriesPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [queryParams, setQueryParams] = useState({});

  const { data, isLoading, error } = useTreeEntityList(treeId, 'stories', queryParams);
  const items = data?.data || [];
  const totalItems = data?.pagination?.total ?? 0;

  if (!treeId) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Stories">
        <p className="text-base-content/60">Missing tree ID.</p>
      </DashboardMainContentLayout>
    );
  }

  return (
    <DashboardMainContentLayout treeId={treeId} title="Stories" subtitle={isLoading ? 'Loading…' : `${totalItems} stories`}>
      <DataViewContainer
        items={items}
        loading={isLoading}
        error={error?.message}
        emptyState={{ title: 'No stories', message: 'No stories in this tree yet.' }}
        defaultView="card"
        renderCard={(row) => (
          <BaseCard>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/trees/${treeId}/stories/${row.slug ?? row.id}`}
                  className="font-medium text-base-content hover:underline"
                >
                  {row.title}
                </Link>
                <span className="badge badge-ghost badge-sm shrink-0">
                  {KIND_LABELS[row.kind] ?? row.kind}
                </span>
              </div>
              {row.excerpt && (
                <div className="text-sm text-base-content/70 line-clamp-2">{row.excerpt}</div>
              )}
              <div className="flex flex-wrap gap-2 items-center text-xs text-base-content/50">
                {row.authorName && <span>By {row.authorName}</span>}
                {row.isPublished ? (
                  <span>Published {new Date(row.updatedAt).toLocaleDateString()}</span>
                ) : (
                  <span className="badge badge-ghost badge-xs">Draft</span>
                )}
              </div>
              {row.tags?.length > 0 && (
                <div className="pt-2 border-t border-base-content/10">
                  <TagsCell tags={row.tags} />
                </div>
              )}
            </div>
          </BaseCard>
        )}
        renderRow={(row) => (
          <>
            <td className="px-6 py-4 font-medium">
              <Link href={`/trees/${treeId}/stories/${row.slug ?? row.id}`} className="hover:underline">
                {row.title}
              </Link>
            </td>
            <td className="px-6 py-4 text-sm text-base-content/70 max-w-[200px] truncate">{row.excerpt ?? '—'}</td>
            <td className="px-6 py-4 text-sm">{KIND_LABELS[row.kind] ?? row.kind}</td>
            <td className="px-6 py-4 text-sm">{row.authorName ?? '—'}</td>
            <td className="px-6 py-4 text-sm">{row.isPublished ? new Date(row.updatedAt).toLocaleDateString() : 'Draft'}</td>
            <td className="px-6 py-4"><TagsCell tags={row.tags ?? []} /></td>
          </>
        )}
        listHeaders={[
          { label: 'Title', key: 'title', sortable: true },
          { label: 'Excerpt', key: 'excerpt', sortable: false },
          { label: 'Kind', key: 'kind', sortable: true },
          { label: 'Author', key: 'authorName', sortable: false },
          { label: 'Status', key: 'updatedAt', sortable: true },
          { label: 'Tags', key: 'tags', sortable: false },
        ]}
        searchPlaceholder="Search stories…"
        totalItems={totalItems}
        defaultPerPage={20}
        onParamsChange={setQueryParams}
        addNewComponent={
          <Link href={`/trees/${treeId}/stories/new`} className="btn btn-primary btn-sm gap-1.5">
            + New story
          </Link>
        }
        actions={[
          { key: 'view', label: 'View', href: (row) => `/trees/${treeId}/stories/${row.slug ?? row.id}` },
          { key: 'edit', label: 'Edit', href: (row) => `/trees/${treeId}/stories/${row.slug ?? row.id}/edit` },
          { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
        ]}
      />
    </DashboardMainContentLayout>
  );
}
