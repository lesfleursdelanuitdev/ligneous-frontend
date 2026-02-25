'use client';

import { useState } from 'react';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';
import { Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useMyFeed } from '@/hooks/queries/useMyFeed';

const DUMMY_FEED = [
  { id: '1', contentType: 'research_discovery', title: 'Found a new birth record!', content: 'I discovered a birth certificate for my great-grandmother in the county archives. It confirms the family was from County Cork, Ireland.', author: 'You', likesCount: 12, commentsCount: 3, sharesCount: 1, visibility: 'public', createdAt: '2026-02-20' },
  { id: '2', contentType: 'family_story', title: 'The story of how my grandparents met', content: 'My grandfather was a baker in a small village in Sicily. My grandmother would walk past his shop every morning on the way to school...', author: 'You', likesCount: 24, commentsCount: 8, sharesCount: 5, visibility: 'followers_only', createdAt: '2026-02-18' },
  { id: '3', contentType: 'research_update', title: 'DNA results are in!', content: 'Just got my ancestry DNA results back. 45% Southern European, 30% Irish/Scottish, 15% Eastern European, 10% other.', author: 'You', likesCount: 31, commentsCount: 15, sharesCount: 2, visibility: 'public', createdAt: '2026-02-15' },
  { id: '4', contentType: 'collaboration_request', title: 'Looking for Smith descendants from Ohio', content: 'If anyone has information about the Smith family that lived in Hamilton County, Ohio in the 1800s, please reach out!', author: 'You', likesCount: 5, commentsCount: 2, sharesCount: 3, visibility: 'public', createdAt: '2026-02-10' },
  { id: '5', contentType: 'research_log', title: 'Visited the National Archives today', content: 'Spent 6 hours going through immigration records from 1890-1910. Found 3 potential matches for the Rossi family.', author: 'You', likesCount: 8, commentsCount: 1, sharesCount: 0, visibility: 'followers_only', createdAt: '2026-02-05' },
];

const TYPE_LABELS = {
  research_update: 'Research Update',
  family_story: 'Family Story',
  research_discovery: 'Discovery',
  collaboration_request: 'Collaboration',
  research_log: 'Research Log',
  recipe: 'Recipe',
};

export default function MyFeedPage() {
  const [queryParams, setQueryParams] = useState({ page: 1, perPage: 10 });
  const { data, isLoading } = useMyFeed(queryParams);

  const items = data?.data?.length > 0 ? data.data : DUMMY_FEED;
  const totalItems = data?.pagination?.total ?? DUMMY_FEED.length;
  const usingDummy = !data?.data?.length;

  return (
    <DashboardMainContentLayout title="My Feed" subtitle={`${totalItems} post${totalItems !== 1 ? 's' : ''}${usingDummy ? ' (dummy data)' : ''}`}>
      <DataViewContainer
        items={items}
        loading={isLoading}
        emptyState={{ title: 'No posts', message: 'You have not created any posts yet.' }}
        defaultView="card"
        renderCard={(row) => (
          <BaseCard>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="badge badge-primary badge-sm">{TYPE_LABELS[row.contentType] || row.contentType}</span>
                <span className="badge badge-ghost badge-sm">{row.visibility === 'public' ? 'Public' : 'Followers'}</span>
              </div>
              <div className="font-medium text-base-content">{row.title}</div>
              <div className="text-sm text-base-content/70 line-clamp-3">{row.content}</div>
              <div className="pt-2 border-t border-base-content/10 flex items-center gap-4 text-xs text-base-content/50">
                <span className="flex items-center gap-1"><Heart size={14} /> {row.likesCount}</span>
                <span className="flex items-center gap-1"><MessageCircle size={14} /> {row.commentsCount}</span>
                <span className="flex items-center gap-1"><Share2 size={14} /> {row.sharesCount}</span>
                <span className="ml-auto">{row.createdAt}</span>
              </div>
            </div>
          </BaseCard>
        )}
        renderRow={(row) => (
          <>
            <td className="px-6 py-4 font-medium">{row.title}</td>
            <td className="px-6 py-4"><span className="badge badge-primary badge-sm">{TYPE_LABELS[row.contentType] || row.contentType}</span></td>
            <td className="px-6 py-4 text-sm text-base-content/70 max-w-[250px] truncate">{row.content}</td>
            <td className="px-6 py-4 text-sm">{row.likesCount}</td>
            <td className="px-6 py-4 text-sm">{row.commentsCount}</td>
            <td className="px-6 py-4 text-sm">{row.createdAt}</td>
          </>
        )}
        listHeaders={[
          { label: 'Title', key: 'title', sortable: true },
          { label: 'Type', key: 'contentType', sortable: true },
          { label: 'Content', key: 'content', sortable: false },
          { label: 'Likes', key: 'likesCount', sortable: true },
          { label: 'Comments', key: 'commentsCount', sortable: true },
          { label: 'Created', key: 'createdAt', sortable: true },
        ]}
        searchPlaceholder="Search posts..."
        totalItems={totalItems}
        defaultPerPage={10}
        onParamsChange={setQueryParams}
        addNewComponent={<AddNewPlaceholder message="Create new post form coming soon." />}
        actions={[
          { key: 'view', label: 'View', icon: <Eye size={16} />, href: () => '#' },
          { key: 'edit', label: 'Edit', href: () => '#' },
          { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
        ]}
      />
    </DashboardMainContentLayout>
  );
}
