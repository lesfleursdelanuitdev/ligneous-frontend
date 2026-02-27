'use client';

import Link from 'next/link';
import { Users, Hash, TrendingUp, BarChart2 } from 'lucide-react';
import BaseCard from '../cards/BaseCard';
import { useGivenNamesAnalytics } from '@/hooks/queries/useGivenNamesAnalytics';

export default function GivenNamesStatistics({ treeId }) {
  const { data, isLoading, error, refetch } = useGivenNamesAnalytics(treeId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-base-200 rounded-box animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-base-200 rounded-box animate-pulse" />
      </div>
    );
  }

  if (error) {
    const isApiUnavailable = error.message?.toLowerCase().includes('not running') || error.message?.toLowerCase().includes('unavailable');
    return (
      <div className="alert alert-warning flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <span>{error.message}</span>
          <button type="button" className="btn btn-sm btn-ghost shrink-0" onClick={() => refetch()}>
            Try again
          </button>
        </div>
        {isApiUnavailable && (
          <div className="text-sm opacity-90 space-y-2">
            <p>The research API (ligneous-python-api) provides statistics. Start it:</p>
            <code className="block bg-base-300 px-2 py-1 rounded text-xs">cd ligneous-python-api &amp;&amp; source .venv/bin/activate &amp;&amp; python run.py</code>
            <p>Then verify: <a href="/api/research/connectivity" target="_blank" rel="noopener noreferrer" className="link link-primary">/api/research/connectivity</a></p>
          </div>
        )}
      </div>
    );
  }

  if (!data) return null;

  const summary = data.summary || {};
  const topNames = data.top_names || [];
  const top10Male = data.top_10_male || [];
  const top10Female = data.top_10_female || [];
  const frequencyDistribution = data.frequency_distribution || [];
  const popularityByDecade = data.popularity_by_decade || [];

  const statCards = [
    { label: 'Unique names', value: (summary.total_unique_names ?? 0).toLocaleString(), icon: Hash },
    { label: 'Total individuals', value: (summary.total_individuals_with_names ?? 0).toLocaleString(), icon: Users },
    { label: 'Names appearing once', value: (summary.names_appearing_once ?? 0).toLocaleString(), icon: BarChart2 },
    { label: 'Names (10+ people)', value: (summary.names_10_plus ?? 0).toLocaleString(), icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <BaseCard key={label} variant="flat" className="text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-base-content">{value}</div>
              <div className="text-sm text-base-content/60">{label}</div>
            </div>
          </BaseCard>
        ))}
      </div>

      {frequencyDistribution.length > 0 && (
        <BaseCard>
          <h3 className="text-base font-semibold text-base-content mb-4">Name frequency distribution</h3>
          <div className="space-y-3">
            {frequencyDistribution.map(({ bucket, count }) => (
              <div key={bucket} className="flex items-center gap-4">
                <span className="text-sm text-base-content/70 w-16">{bucket}</span>
                <div className="flex-1 flex items-center gap-2">
                  <progress className="progress progress-primary flex-1" value={count} max={Math.max(...frequencyDistribution.map((d) => d.count), 1)} />
                  <span className="text-sm font-medium text-base-content w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </BaseCard>
      )}

      {(top10Male?.length > 0 || top10Female?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {top10Male?.length > 0 && (
            <BaseCard>
              <h3 className="text-base font-semibold text-base-content mb-4">Top 10 names for men</h3>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th className="text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top10Male.map((n) => (
                      <tr key={n.name}>
                        <td>
                          <Link href={`/trees/${treeId}/individuals?given_name=${encodeURIComponent(n.name)}`} className="link link-primary font-medium">
                            {n.name}
                          </Link>
                        </td>
                        <td className="text-right text-blue-600 dark:text-blue-400">{n.males_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BaseCard>
          )}
          {top10Female?.length > 0 && (
            <BaseCard>
              <h3 className="text-base font-semibold text-base-content mb-4">Top 10 names for women</h3>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th className="text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top10Female.map((n) => (
                      <tr key={n.name}>
                        <td>
                          <Link href={`/trees/${treeId}/individuals?given_name=${encodeURIComponent(n.name)}`} className="link link-primary font-medium">
                            {n.name}
                          </Link>
                        </td>
                        <td className="text-right text-pink-600 dark:text-pink-400">{n.females_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BaseCard>
          )}
        </div>
      )}

      {popularityByDecade.length > 0 && (
        <BaseCard>
          <h3 className="text-base font-semibold text-base-content mb-4">Name popularity by birth decade</h3>
          <p className="text-sm text-base-content/60 mb-4">Count of individuals with top names, grouped by decade.</p>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Decade</th>
                  <th className="text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {popularityByDecade.map((row, i) => (
                  <tr key={`${row.name}-${row.decade}-${i}`}>
                    <td>
                      <Link href={`/trees/${treeId}/individuals?given_name=${encodeURIComponent(row.name)}`} className="link link-primary">
                        {row.name}
                      </Link>
                    </td>
                    <td>{row.decade}s</td>
                    <td className="text-right">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BaseCard>
      )}

      {(!top10Male?.length && !top10Female?.length) && topNames.length > 0 && (
        <BaseCard>
          <h3 className="text-base font-semibold text-base-content mb-4">Top names</h3>
          <div className="flex flex-wrap gap-2">
            {topNames.map((n) => (
              <Link key={n.id} href={`/trees/${treeId}/individuals?given_name=${encodeURIComponent(n.name)}`} className="badge badge-lg badge-neutral hover:badge-primary">
                {n.name} ({n.frequency})
              </Link>
            ))}
          </div>
        </BaseCard>
      )}
    </div>
  );
}
