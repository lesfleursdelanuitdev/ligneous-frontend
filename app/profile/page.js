'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components';
import BaseCard from '@/components/shared/cards/BaseCard';
import { useAuthState } from '@/hooks/useAuthState';
import { useProfile } from '@/hooks/queries/useProfile';
import {
  User, MapPin, Calendar, TreePine, Users, UserPlus,
  Settings, Heart, MessageCircle, Pencil,
} from 'lucide-react';

const DUMMY_PROFILE = {
  displayName: 'Mona Lig',
  bio: 'Passionate genealogist researching Irish, Italian, and Polish roots. Documenting family stories for future generations.',
  location: 'New York, USA',
  researchSurnames: ['Smith', 'Sullivan', 'Rossi', 'Kowalski'],
  researchLocations: ['County Cork, Ireland', 'Sicily, Italy', 'Krakow, Poland'],
  yearsResearching: 8,
  specializations: ['Immigration Records', 'DNA Analysis'],
  languages: ['English', 'Italian'],
};

const DUMMY_STATS = {
  followersCount: 47,
  followingCount: 32,
  treesCount: 4,
  individualsLinked: 3,
};

const DUMMY_TREES = [
  { id: 't1', name: 'xavier', role: 'owner' },
  { id: 't2', name: 'tree1', role: 'owner' },
  { id: 't3', name: 'royal92', role: 'maintainer' },
  { id: 't4', name: 'pres2020', role: 'contributor' },
];

const DUMMY_FEED = [
  { id: '1', contentType: 'research_discovery', title: 'Found a new birth record!', content: 'Discovered a birth certificate for my great-grandmother in the county archives.', likesCount: 12, commentsCount: 3, createdAt: '2026-02-20' },
  { id: '2', contentType: 'family_story', title: 'The story of how my grandparents met', content: 'My grandfather was a baker in a small village in Sicily...', likesCount: 24, commentsCount: 8, createdAt: '2026-02-18' },
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

export default function ProfilePage() {
  const { user } = useAuthState();
  const { data: profileData } = useProfile();

  const profile = profileData?.profile || DUMMY_PROFILE;
  const stats = profileData?.stats || DUMMY_STATS;
  const connectedTrees = profileData?.connectedTrees?.length > 0 ? profileData.connectedTrees : DUMMY_TREES;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">

        <BaseCard>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-content text-2xl font-bold shrink-0">
                {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h1 className="text-2xl font-bold text-base-content">
                      {profile.displayName || user?.name || user?.username}
                    </h1>
                    <p className="text-sm text-base-content/50">@{user?.username}</p>
                  </div>
                  <Link href="/settings" className="btn btn-ghost btn-sm gap-1">
                    <Pencil size={14} /> Edit Profile
                  </Link>
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

            {profile.specializations?.length > 0 && (
              <div>
                <span className="text-xs text-base-content/50">Specializations:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {profile.specializations.map((s) => (
                    <span key={s} className="badge badge-ghost badge-sm">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </BaseCard>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <BaseCard><StatBox label="Followers" value={stats.followersCount} icon={Users} /></BaseCard>
          <BaseCard><StatBox label="Following" value={stats.followingCount} icon={UserPlus} /></BaseCard>
          <BaseCard><StatBox label="Trees" value={stats.treesCount} icon={TreePine} /></BaseCard>
          <BaseCard><StatBox label="Linked" value={stats.individualsLinked} icon={User} /></BaseCard>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-base-content mb-3">Connected Trees</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {connectedTrees.map((tree) => (
              <BaseCard key={tree.id}>
                <Link href={`/trees/${tree.id}`} className="flex items-center gap-3 hover:opacity-80">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TreePine size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-base-content truncate">{tree.name}</div>
                    <span className={`badge badge-sm ${ROLE_BADGES[tree.role] || 'badge-ghost'}`}>{tree.role}</span>
                  </div>
                </Link>
              </BaseCard>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-base-content mb-3">Recent Activity</h2>
          <div className="space-y-3">
            {DUMMY_FEED.map((post) => (
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
