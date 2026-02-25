'use client';

import { useState } from 'react';
import { DashboardMainContentLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { DataViewContainer, AddNewPlaceholder, TagsCell } from '@/components/shared/data-display';
import { Eye, Pencil, Trash2, ImageIcon, Film, FileAudio } from 'lucide-react';
import { useMyMedia } from '@/hooks/queries/useMyMedia';

const DUMMY_MEDIA = [
  { id: '1', filename: 'grandparents_wedding.jpg', type: 'photo', description: 'Wedding photo of James and Mary Smith, June 1982', tags: ['Wedding', 'Smith Family'], albums: ['Family Weddings'], uploadedAt: '2026-01-15' },
  { id: '2', filename: 'family_reunion_2024.mp4', type: 'video', description: 'Annual family reunion at the lake house', tags: ['Reunion', 'Summer'], albums: ['Reunions'], uploadedAt: '2026-01-10' },
  { id: '3', filename: 'great_grandpa_portrait.jpg', type: 'photo', description: 'Portrait of William Smith, circa 1920', tags: ['Portrait', 'Historical'], albums: ['Historical Photos'], uploadedAt: '2025-12-20' },
  { id: '4', filename: 'grandma_interview.mp3', type: 'audio', description: 'Recorded interview with Grandma Rosa about her childhood in Italy', tags: ['Interview', 'Oral History'], albums: ['Oral Histories'], uploadedAt: '2025-12-05' },
  { id: '5', filename: 'old_farm_house.jpg', type: 'photo', description: 'The Smith family farm in Ohio, photographed in 1945', tags: ['Farm', 'Historical', 'Ohio'], albums: ['Historical Photos'], uploadedAt: '2025-11-28' },
  { id: '6', filename: 'christmas_1995.jpg', type: 'photo', description: 'Christmas gathering at Grandma\'s house, 1995', tags: ['Christmas', 'Holiday'], albums: ['Holidays'], uploadedAt: '2025-11-15' },
];

const TYPE_ICONS = {
  photo: <ImageIcon size={16} />,
  video: <Film size={16} />,
  audio: <FileAudio size={16} />,
};

export default function MyMediaPage() {
  const [queryParams, setQueryParams] = useState({ page: 1, perPage: 12 });
  const { data, isLoading } = useMyMedia(queryParams);

  const items = data?.data?.length > 0 ? data.data : DUMMY_MEDIA;
  const totalItems = data?.pagination?.total ?? DUMMY_MEDIA.length;
  const usingDummy = !data?.data?.length;

  return (
    <DashboardMainContentLayout title="My Media" subtitle={`${totalItems} item${totalItems !== 1 ? 's' : ''}${usingDummy ? ' (dummy data)' : ''}`}>
      <DataViewContainer
        items={items}
        loading={isLoading}
        emptyState={{ title: 'No media', message: 'You haven\'t uploaded any media yet.' }}
        defaultView="card"
        renderCard={(row) => (
          <BaseCard>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm text-base-content/70">
                  {TYPE_ICONS[row.type] || null}
                  <span className="capitalize">{row.type}</span>
                </span>
              </div>
              <div className="w-full h-32 bg-base-200 rounded-lg flex items-center justify-center">
                <span className="text-base-content/30">{TYPE_ICONS[row.type]}</span>
              </div>
              <div className="font-medium text-sm text-base-content truncate">{row.filename}</div>
              <div className="text-xs text-base-content/70 line-clamp-2">{row.description}</div>
              <div className="pt-2 border-t border-base-content/10 space-y-1.5">
                {row.tags?.length > 0 && (
                  <div><span className="text-xs text-base-content/50">Tags:</span> <TagsCell tags={row.tags} /></div>
                )}
                {row.albums?.length > 0 && (
                  <div><span className="text-xs text-base-content/50">Albums:</span> <TagsCell tags={row.albums} /></div>
                )}
              </div>
              <div className="text-xs text-base-content/50">{row.uploadedAt}</div>
            </div>
          </BaseCard>
        )}
        renderRow={(row) => (
          <>
            <td className="px-6 py-4">
              <span className="flex items-center gap-1.5">{TYPE_ICONS[row.type]} <span className="capitalize">{row.type}</span></span>
            </td>
            <td className="px-6 py-4 font-medium">{row.filename}</td>
            <td className="px-6 py-4 text-sm text-base-content/70 max-w-[200px] truncate">{row.description}</td>
            <td className="px-6 py-4"><TagsCell tags={row.tags} /></td>
            <td className="px-6 py-4"><TagsCell tags={row.albums} /></td>
            <td className="px-6 py-4 text-sm">{row.uploadedAt}</td>
          </>
        )}
        listHeaders={[
          { label: 'Type', key: 'type', sortable: true },
          { label: 'Filename', key: 'filename', sortable: true },
          { label: 'Description', key: 'description', sortable: false },
          { label: 'Tags', key: 'tags', sortable: false },
          { label: 'Albums', key: 'albums', sortable: false },
          { label: 'Uploaded', key: 'uploadedAt', sortable: true },
        ]}
        searchPlaceholder="Search media..."
        totalItems={totalItems}
        defaultPerPage={12}
        onParamsChange={setQueryParams}
        addNewComponent={<AddNewPlaceholder message="Upload media form coming soon." />}
        actions={[
          { key: 'view', label: 'View', icon: <Eye size={16} />, href: () => '#' },
          { key: 'edit', label: 'Edit', icon: <Pencil size={16} />, href: () => '#' },
          { key: 'delete', label: 'Delete', icon: <Trash2 size={16} />, onClick: () => {}, variant: 'danger' },
        ]}
      />
    </DashboardMainContentLayout>
  );
}
