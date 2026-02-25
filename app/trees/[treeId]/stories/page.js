'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder, TagsCell } from '@/components/shared/data-display';

const DUMMY_STORIES = [
  { id: '1', title: 'How Grandpa came to America', excerpt: 'William Smith left Liverpool in 1909 and arrived at Ellis Island in March 1910. He had only a small trunk and a few dollars...', author: 'Jane Doe', publishedAt: '2024-01-15', isPublished: true, tags: ['Immigration', 'Family'], linkedTo: [{ type: 'individual', name: 'William Smith', xref: 'I4' }] },
  { id: '2', title: 'The wedding at St. Mary\'s', excerpt: 'James and Mary were married on a sunny Saturday in June 1982. The church was full of family and friends...', author: 'John Smith', publishedAt: '2024-02-20', isPublished: true, tags: ['Wedding', 'Family'], linkedTo: [{ type: 'family', husbandName: 'James Smith', wifeName: 'Mary Jones', xref: 'F1' }] },
  { id: '3', title: 'Memories of the farm', excerpt: 'Growing up on the Smith family farm in Ohio meant early mornings, hard work, and Sunday dinners with the whole family...', author: 'Sarah Smith', publishedAt: null, isPublished: false, tags: ['Childhood', 'Family'], linkedTo: [{ type: 'individual', name: 'Sarah Smith', xref: 'I3' }] },
  { id: '4', title: 'Military service – 1942–1945', excerpt: 'Robert Smith served in the Army during World War II. He was stationed in Europe and wrote letters home every week...', author: 'Mary Jones', publishedAt: '2024-03-10', isPublished: true, tags: ['Military', 'WWII'], linkedTo: [{ type: 'individual', name: 'Robert Smith', xref: 'I2' }] },
];

function LinkedTo({ items, treeId }) {
  if (!items || items.length === 0) return <span className="text-base-content/40">—</span>;
  return (
    <span className="inline-flex flex-wrap gap-x-1.5 gap-y-0.5">
      {items.map((link, i) => {
        if (link.type === 'individual') {
          return (
            <Link key={i} href={`/trees/${treeId}/individuals/${encodeURIComponent(link.xref)}`} className="link link-primary text-sm">
              {link.name || link.xref}
            </Link>
          );
        }
        if (link.type === 'family') {
          return (
            <span key={i} className="text-sm">
              {link.husbandName} &amp; {link.wifeName}
            </span>
          );
        }
        return null;
      })}
    </span>
  );
}

export default function TreeStoriesPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [queryParams, setQueryParams] = useState({ page: 1, perPage: 10 });

  const page = queryParams.page || 1;
  const perPage = queryParams.perPage || 10;
  const start = (page - 1) * perPage;
  const items = DUMMY_STORIES.slice(start, start + perPage);
  const totalItems = DUMMY_STORIES.length;

  if (!treeId) return <DashboardMainContentLayout treeId={treeId} title="Stories"><p className="text-base-content/60">Missing tree ID.</p></DashboardMainContentLayout>;

  return (
    <DashboardMainContentLayout treeId={treeId} title="Stories" subtitle={`${totalItems} stories (dummy data)`}>
        <DataViewContainer
          items={items}
          loading={false}
          emptyState={{ title: 'No stories', message: 'No stories in this tree yet.' }}
          defaultView="card"
          renderCard={(row) => (
            <BaseCard>
              <div className="space-y-3">
                <div className="font-medium text-base-content">{row.title}</div>
                <div className="text-sm text-base-content/70 line-clamp-2">{row.excerpt ?? '—'}</div>
                <div className="flex flex-wrap gap-2 items-center text-xs text-base-content/50">
                  <span>By {row.author}</span>
                  {row.isPublished && row.publishedAt && (
                    <span>Published {row.publishedAt}</span>
                  )}
                  {!row.isPublished && (
                    <span className="badge badge-ghost badge-xs">Draft</span>
                  )}
                </div>
                <div className="pt-2 border-t border-base-content/10 space-y-1.5">
                  <div><span className="text-xs text-base-content/50">Linked to:</span> <LinkedTo items={row.linkedTo} treeId={treeId} /></div>
                  <div><span className="text-xs text-base-content/50">Tags:</span> <TagsCell tags={row.tags} /></div>
                </div>
              </div>
            </BaseCard>
          )}
          renderRow={(row) => (
            <>
              <td className="px-6 py-4 font-medium">{row.title}</td>
              <td className="px-6 py-4 text-sm text-base-content/70 max-w-[200px] truncate">{row.excerpt ?? '—'}</td>
              <td className="px-6 py-4 text-sm">{row.author ?? '—'}</td>
              <td className="px-6 py-4 text-sm">{row.isPublished ? (row.publishedAt ?? '—') : 'Draft'}</td>
              <td className="px-6 py-4"><LinkedTo items={row.linkedTo} treeId={treeId} /></td>
              <td className="px-6 py-4"><TagsCell tags={row.tags} /></td>
            </>
          )}
          listHeaders={[
            { label: 'Title', key: 'title', sortable: true },
            { label: 'Excerpt', key: 'excerpt', sortable: false },
            { label: 'Author', key: 'author', sortable: true },
            { label: 'Status', key: 'publishedAt', sortable: true },
            { label: 'Linked to', key: 'linkedTo', sortable: false },
            { label: 'Tags', key: 'tags', sortable: false },
          ]}
          searchPlaceholder="Search stories..."
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={setQueryParams}
          addNewComponent={<AddNewPlaceholder message="Add new story form coming soon." />}
          actions={[
            { key: 'view', label: 'View', href: () => '#' },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
