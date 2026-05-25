'use client';

import Link from 'next/link';
import { useTreeActivity } from '@/hooks/queries/useTreeActivity';

function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function activityLabel(entry) {
  if (entry.summary) return entry.summary;
  const op = entry.operation === 'create' ? 'Created' : entry.operation === 'delete' ? 'Deleted' : 'Updated';
  return `${op} ${entry.entityType}`;
}

export default function TreeRecentActivity({ treeId }) {
  const { data, isLoading } = useTreeActivity(treeId);
  const items = data?.activity ?? [];

  return (
    <section className="card bg-base-200 rounded-box p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-base-content">Recent Activity</h2>
        <Link
          href={`/trees/${treeId}/manage/health`}
          className="text-xs text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {isLoading ? (
        <ul className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="h-5 bg-base-300 rounded animate-pulse" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="text-sm text-base-content/50">No recent activity.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((entry) => (
            <li
              key={entry.batchId}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b border-base-content/5 last:border-0"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm text-base-content/80 truncate">
                  {activityLabel(entry)}
                </span>
                {entry.user?.name && (
                  <span className="text-xs text-base-content/40">{entry.user.name}</span>
                )}
              </div>
              <span className="text-xs text-base-content/50 shrink-0">
                {formatRelativeTime(entry.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
