'use client';

import Avatar from '@/components/shared/ui/avatars/Avatar';

/**
 * Profile-style header for the tree overview page.
 * Avatar, tree info, followers/members counts, Follow and Join buttons. UI only for now.
 */
export default function TreeProfileHeader({ tree }) {
  const ownerName = tree?.owner?.name || tree?.owner?.username || 'Unknown';
  const followerCount = 0; // placeholder
  const memberCount = 0; // placeholder

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
      <div className="relative flex-shrink-0">
        <Avatar
          name={tree?.name}
          size="xl"
          className="!w-24 !h-24 sm:!w-28 sm:!h-28 ring-2 ring-base-content/10 shadow-md"
        />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">
          {tree?.name}
        </h1>
        {tree?.description && (
          <p className="text-base-content/70">{tree.description}</p>
        )}
        {tree?.owner && (
          <p className="text-sm text-base-content/50">Owner: {ownerName}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/60">
          <span>{followerCount.toLocaleString()} followers</span>
          <span>·</span>
          <span>{memberCount.toLocaleString()} members</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button type="button" className="btn btn-primary btn-sm">
            Follow
          </button>
          <button type="button" className="btn btn-primary btn-sm">
            Join
          </button>
          <button type="button" className="btn btn-primary btn-sm">
            Email maintainers
          </button>
        </div>
      </div>
    </div>
  );
}
