'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import {
  User, MapPin, Calendar, TreePine, Users, UserPlus, UserMinus,
  Heart, MessageCircle, MessageSquare,
} from 'lucide-react';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { useFollowUser, useUnfollowUser } from '@/hooks/mutations/useProfileMutations';

const DUMMY_USER = {
  id: 'u1',
  username: 'janesmith',
  name: 'Jane Smith',
};

const DUMMY_PROFILE = {
  displayName: 'Jane Smith',
  bio: 'Genealogy enthusiast researching Irish and English ancestry. Love connecting with distant cousins!',
  location: 'Boston, MA',
  researchSurnames: ['Murphy', 'Sullivan', 'Williams'],
  researchLocations: ['County Cork, Ireland', 'Devon, England'],
  yearsResearching: 12,
  specializations: ['Church Records', 'Immigration Records'],
};

const DUMMY_STATS = {
  followersCount: 89,
  followingCount: 54,
  treesCount: 2,
};

const DUMMY_TREES = [
  { id: 'pt1', name: 'Murphy-Sullivan Tree', role: 'owner' },
  { id: 'pt2', name: 'Williams Heritage', role: 'owner' },
];

const DUMMY_CONTENT = [
  { id: 'c1', contentType: 'research_discovery', title: 'Found the original emigration record!', content: 'After years of searching, I found the ship manifest for Patrick Murphy from Cork to Boston in 1847.', likesCount: 45, commentsCount: 12, createdAt: '2026-02-19' },
  { id: 'c2', contentType: 'family_story', title: 'The Murphy Bakery on Hanover Street', content: 'My great-great-grandfather opened a bakery in the North End in 1870...', likesCount: 33, commentsCount: 7, createdAt: '2026-02-14' },
];

const ROLE_BADGES = {
  owner: 'badge-primary',
  maintainer: 'badge-secondary',
  contributor: 'badge-accent',
};

function StatBox({ label, value, icon: Icon }) {
  return (
    <div className="text-center px-4">
      <div className="flex items-center justify-center gap-1.5 text-base-content/50 mb-1">
        <Icon size={14} />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-base-content">{value}</div>
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.userId;
  const { data: profileData } = useUserProfile(userId);
  const followMut = useFollowUser();
  const unfollowMut = useUnfollowUser();

  const isFollowing = profileData?.isFollowing ?? false;
  const targetUser = profileData?.user || DUMMY_USER;
  const profile = profileData?.profile || DUMMY_PROFILE;
  const stats = profileData?.stats || DUMMY_STATS;
  const publicTrees = profileData?.connectedTrees?.length > 0 ? profileData.connectedTrees : DUMMY_TREES;
  const recentContent = profileData?.recentContent?.length > 0 ? profileData.recentContent : DUMMY_CONTENT;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">

        <BaseCard>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-secondary-content text-2xl font-bold shrink-0">
                {targetUser.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-bold text-base-content">
                      {profile.displayName || targetUser.name}
                    </h1>
                    <p className="text-sm text-base-content/50">@{targetUser.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => isFollowing ? unfollowMut.mutate(userId) : followMut.mutate(userId)}
                      className={`btn btn-sm gap-1 ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
                      disabled={followMut.isPending || unfollowMut.isPending}
                    >
                      {isFollowing ? <><UserMinus size={14} /> Unfollow</> : <><UserPlus size={14} /> Follow</>}
                    </button>
                    <Link href={`/messages`} className="btn btn-ghost btn-sm gap-1">
                      <MessageSquare size={14} /> Message
                    </Link>
                  </div>
                </div>
                {profile.bio && (
                  <p className="mt-2 text-sm text-base-content/70">{profile.bio}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-base-content/50">
                  {profile.location && (
                    <span className="flex items-center gap-1"><MapPin size={12} /> {profile.location}</span>
                  )}
                  {profile.yearsResearching && (
                    <span className="flex items-center gap-1"><Calendar size={12} /> {profile.yearsResearching} years researching</span>
                  )}
                </div>
              </div>
            </div>

            {profile.researchSurnames?.length > 0 && (
              <div>
                <span className="text-xs text-base-content/50">Research surnames:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {profile.researchSurnames.map((s) => (
                    <span key={s} className="badge badge-outline badge-sm">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </BaseCard>

        <div className="grid grid-cols-3 gap-4">
          <BaseCard><StatBox label="Followers" value={stats.followersCount} icon={Users} /></BaseCard>
          <BaseCard><StatBox label="Following" value={stats.followingCount} icon={UserPlus} /></BaseCard>
          <BaseCard><StatBox label="Trees" value={stats.treesCount} icon={TreePine} /></BaseCard>
        </div>

        {DUMMY_TREES.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-base-content mb-3">Public Trees</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {publicTrees.map((tree) => (
                <BaseCard key={tree.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TreePine size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base-content truncate">{tree.name}</div>
                      <span className={`badge badge-sm ${ROLE_BADGES[tree.role] || 'badge-ghost'}`}>{tree.role}</span>
                    </div>
                  </div>
                </BaseCard>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-base-content mb-3">Recent Posts</h2>
          <div className="space-y-3">
            {recentContent.map((post) => (
              <BaseCard key={post.id}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary badge-sm">{post.contentType.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-base-content/50">{post.createdAt}</span>
                  </div>
                  <div className="font-medium text-base-content">{post.title}</div>
                  <p className="text-sm text-base-content/70 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-4 text-xs text-base-content/50">
                    <span className="flex items-center gap-1"><Heart size={14} /> {post.likesCount}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={14} /> {post.commentsCount}</span>
                  </div>
                </div>
              </BaseCard>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
