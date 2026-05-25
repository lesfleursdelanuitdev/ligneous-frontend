'use client';

import Link from 'next/link';
import { Users, Heart, BookOpen, Calendar, FileText, Image } from 'lucide-react';
import { useTreeStats } from '@/hooks/queries/useTreeStats';

const STAT_DEFS = [
  { key: 'individuals', label: 'Individuals', icon: Users, path: 'individuals' },
  { key: 'families', label: 'Families', icon: Heart, path: 'families' },
  { key: 'stories', label: 'Stories', icon: FileText, path: 'stories' },
  { key: 'events', label: 'Events', icon: Calendar, path: 'events' },
  { key: 'sources', label: 'Sources', icon: BookOpen, path: 'sources' },
  { key: 'media', label: 'Media', icon: Image, path: 'pictures' },
];

export default function TreeStatsRow({ treeId }) {
  const { data, isLoading } = useTreeStats(treeId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {STAT_DEFS.map(({ key }) => (
          <div key={key} className="h-20 bg-base-200 rounded-box animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {STAT_DEFS.map(({ key, label, icon: Icon, path }) => (
        <Link
          key={key}
          href={`/trees/${treeId}/${path}`}
          className="card bg-base-200 rounded-box p-4 flex flex-col items-center gap-2 hover:bg-base-300 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Icon className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-base-content">
            {((data?.[key]) ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-base-content/60">{label}</div>
        </Link>
      ))}
    </div>
  );
}
