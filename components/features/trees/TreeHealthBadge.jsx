'use client';

import Link from 'next/link';
import { useTreeHealth } from '@/hooks/queries/useTreeHealth';

export default function TreeHealthBadge({ treeId }) {
  const { data, isLoading } = useTreeHealth(treeId);

  if (isLoading) {
    return <div className="h-6 w-20 bg-base-200 rounded-full animate-pulse" />;
  }

  if (!data) return null;

  const issueCount = Array.isArray(data.checks)
    ? data.checks.reduce((sum, c) => sum + (c.count ?? 0), 0)
    : 0;

  if (issueCount === 0) {
    return (
      <Link
        href={`/trees/${treeId}/manage/health`}
        className="badge badge-success badge-sm gap-1"
      >
        Healthy
      </Link>
    );
  }

  return (
    <Link
      href={`/trees/${treeId}/manage/health`}
      className="badge badge-warning badge-sm gap-1"
    >
      {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
    </Link>
  );
}
