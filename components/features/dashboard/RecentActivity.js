'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock activity data
const mockActivities = [
  {
    id: '1',
    type: 'individual_added',
    actor: { name: 'Jane Smith', avatar: null },
    target: { name: 'Maria Gonsalves', id: 'ind-1' },
    tree: { name: 'Gonsalves Family Tree', id: 'tree-1' },
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'tree_updated',
    actor: { name: 'Michael Johnson', avatar: null },
    count: 3,
    tree: { name: 'Smith-Johnson Archives', id: 'tree-2' },
    time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'photo_added',
    actor: { name: 'Jane Smith', avatar: null },
    target: { name: 'Norman Peter Gonsalves', id: 'ind-2' },
    tree: { name: 'Gonsalves Family Tree', id: 'tree-1' },
    time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'note_added',
    actor: { name: 'Ana Pereira', avatar: null },
    target: { name: 'Carlos Pereira', id: 'ind-3' },
    tree: { name: 'Pereira-Santos Family', id: 'tree-3' },
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const activityIcons = {
  individual_added: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  tree_updated: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  photo_added: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  note_added: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
};

const activityColors = {
  individual_added: 'text-success bg-success/20',
  tree_updated: 'text-info bg-info/20',
  photo_added: 'text-secondary bg-secondary/20',
  note_added: 'text-warning bg-warning/20',
};

function formatActivityMessage(activity) {
  switch (activity.type) {
    case 'individual_added':
      return (
        <>
          <strong>{activity.actor.name}</strong> added{' '}
          <Link href={`/trees/${activity.tree.id}/individuals/${activity.target.id}`} 
                className="link link-primary">
            {activity.target.name}
          </Link>{' '}
          to{' '}
          <Link href={`/trees/${activity.tree.id}`} className="link link-primary">
            {activity.tree.name}
          </Link>
        </>
      );
    case 'tree_updated':
      return (
        <>
          <strong>{activity.actor.name}</strong> added {activity.count} individuals to{' '}
          <Link href={`/trees/${activity.tree.id}`} className="link link-primary">
            {activity.tree.name}
          </Link>
        </>
      );
    case 'photo_added':
      return (
        <>
          <strong>{activity.actor.name}</strong> added a photo of{' '}
          <Link href={`/trees/${activity.tree.id}/individuals/${activity.target.id}`} className="link link-primary">
            {activity.target.name}
          </Link>
        </>
      );
    case 'note_added':
      return (
        <>
          <strong>{activity.actor.name}</strong> added a note about{' '}
          <Link href={`/trees/${activity.tree.id}/individuals/${activity.target.id}`} className="link link-primary">
            {activity.target.name}
          </Link>
        </>
      );
    default:
      return `${activity.actor.name} performed an action`;
  }
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

export default function RecentActivity({ 
  title = 'Recent Activity',
  limit = 5,
  showViewAll = true,
}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // TODO: Replace with real API call
        await new Promise(resolve => setTimeout(resolve, 300));
        setActivities(mockActivities.slice(0, limit));
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [limit]);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-base-content">{title}</h2>
        </div>
        {showViewAll && (
          <Link href="/activity" className="link link-primary text-sm font-medium flex items-center gap-1">
            View all
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      <div className="card bg-base-100 border border-base-content/10 overflow-hidden rounded-box">
        {loading ? (
          <div className="divide-y divide-base-content/10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-4 py-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-base-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-base-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-base-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-base-content/60">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-base-content/10">
            {activities.map((activity) => (
              <div key={activity.id} className="px-4 py-4 hover:bg-base-200 transition-colors">
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activityColors[activity.type]}`}>
                    {activityIcons[activity.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-base-content/80">
                      {formatActivityMessage(activity)}
                    </p>
                    <p className="text-xs text-base-content/50 mt-1">
                      {formatRelativeTime(activity.time)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


