'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useGivenNamesAnalytics } from '@/hooks/queries/useGivenNamesAnalytics';

function LineChartSection({ popularityByDecade, treeId }) {
  const { series, decades, maxCount } = useMemo(() => {
    if (!popularityByDecade?.length) return { series: [], decades: [], maxCount: 1 };
    const byName = {};
    const decadeSet = new Set();
    for (const row of popularityByDecade) {
      if (!byName[row.name]) byName[row.name] = {};
      byName[row.name][row.decade] = row.count;
      decadeSet.add(row.decade);
    }
    const decades = [...decadeSet].sort((a, b) => a - b);
    const names = Object.keys(byName);
    const top5 = names.map((n) => ({ name: n, total: Object.values(byName[n]).reduce((s, c) => s + c, 0) }))
      .sort((a, b) => b.total - a.total).slice(0, 5).map((x) => x.name);
    const series = top5.map((name) => ({ name, points: decades.map((d) => ({ decade: d, count: byName[name][d] || 0 })) }));
    const maxCount = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.count)));
    return { series, decades, maxCount };
  }, [popularityByDecade]);
  const colors = ['hsl(var(--p))', 'hsl(var(--s))', 'hsl(var(--a))', '#22c55e', '#f59e0b'];
  const w = 400; const h = 200; const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerW = w - pad.left - pad.right; const innerH = h - pad.top - pad.bottom;
  if (series.length === 0 || decades.length === 0) return null;
  const xScale = (d) => pad.left + (innerW * (decades.indexOf(d) / (decades.length - 1 || 1)));
  const yScale = (c) => pad.top + innerH - (innerH * (c / maxCount));
  return (
    <div className="rounded-box border border-base-content/10 bg-base-100 p-6">
      <h3 className="text-base font-semibold text-base-content mb-4">Popularity over decades (top 5 names)</h3>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-xl h-52" preserveAspectRatio="xMidYMid meet">
        {decades.map((d) => (
          <line key={d} x1={xScale(d)} y1={pad.top} x2={xScale(d)} y2={h - pad.bottom} stroke="currentColor" strokeOpacity={0.1} />
        ))}
        {series.map((s, i) => {
          const pts = s.points.map((p) => `${xScale(p.decade)},${yScale(p.count)}`).join(' ');
          return (
            <g key={s.name}>
              <polyline fill="none" stroke={colors[i % colors.length]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={pts} />
              {s.points.map((p, j) => <circle key={j} cx={xScale(p.decade)} cy={yScale(p.count)} r={3} fill={colors[i % colors.length]} />)}
            </g>
          );
        })}
        {decades.map((d) => <text key={d} x={xScale(d)} y={h - 8} textAnchor="middle" className="text-[10px] fill-base-content/60">{d}s</text>)}
      </svg>
      <div className="flex flex-wrap gap-4 mt-4">
        {series.map((s, i) => (
          <Link key={s.name} href={`/trees/${treeId}/individuals?given_name=${encodeURIComponent(s.name)}`} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-sm link link-primary">{s.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function HeatmapSection({ popularityByDecade, treeId }) {
  const { rows, cols, grid, maxVal } = useMemo(() => {
    if (!popularityByDecade?.length) return { rows: [], cols: [], grid: {}, maxVal: 1 };
    const grid = {}; const nameSet = new Set(); const decadeSet = new Set();
    for (const row of popularityByDecade) {
      nameSet.add(row.name); decadeSet.add(row.decade); grid[`${row.name}-${row.decade}`] = row.count;
    }
    const rows = [...nameSet].sort();
    const cols = [...decadeSet].sort((a, b) => a - b);
    const maxVal = Math.max(1, ...Object.values(grid));
    return { rows, cols, grid, maxVal };
  }, [popularityByDecade]);
  if (rows.length === 0 || cols.length === 0) return null;
  return (
    <div className="rounded-box border border-base-content/10 bg-base-100 p-6">
      <h3 className="text-base font-semibold text-base-content mb-4">Name popularity heatmap</h3>
      <p className="text-sm text-base-content/60 mb-4">Names by decades. Darker = more individuals.</p>
      <div className="overflow-x-auto">
        <div className="inline-grid gap-px bg-base-content/20 p-px" style={{ gridTemplateColumns: `120px repeat(${cols.length}, 1fr)` }}>
          <div className="bg-base-200 p-2 text-xs font-medium" />
          {cols.map((d) => <div key={d} className="bg-base-200 p-2 text-xs text-center text-base-content/70 font-medium min-w-[3rem]">{d}s</div>)}
          {rows.slice(0, 15).map((name) => (
            <div key={name} className="contents">
              <div className="bg-base-200 p-2 flex items-center">
                <Link href={`/trees/${treeId}/individuals?given_name=${encodeURIComponent(name)}`} className="link link-primary text-xs truncate">{name}</Link>
              </div>
              {cols.map((d) => {
                const val = grid[`${name}-${d}`] || 0;
                const opacity = val ? Math.max(0.2, val / maxVal) : 0;
                return <div key={`${name}-${d}`} className="h-8 min-w-[3rem] transition-colors bg-primary" style={{ opacity }} title={`${name} in ${d}s: ${val}`} />;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WordCloudSection({ topNamesWithSex, treeId }) {
  const words = useMemo(() => {
    if (!topNamesWithSex?.length) return [];
    const max = Math.max(...topNamesWithSex.map((n) => n.frequency), 1);
    return topNamesWithSex.slice(0, 40).map((n) => {
      const dominant = n.males_count >= n.females_count && n.males_count >= n.unknown_count ? 'male' : n.females_count >= n.unknown_count ? 'female' : 'unknown';
      return { ...n, dominant, size: 12 + Math.round((n.frequency / max) * 24) };
    });
  }, [topNamesWithSex]);
  if (words.length === 0) return null;
  const colorClass = (d) => d === 'male' ? 'text-blue-600 dark:text-blue-400' : d === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-base-content/70';
  return (
    <div className="rounded-box border border-base-content/10 bg-base-100 p-6">
      <h3 className="text-base font-semibold text-base-content mb-4">Name cloud</h3>
      <p className="text-sm text-base-content/60 mb-4">Size = frequency. Blue = mostly male, pink = mostly female, gray = unknown.</p>
      <div className="flex flex-wrap gap-2 justify-center py-4">
        {words.map((w) => (
          <Link key={w.name} href={`/trees/${treeId}/individuals?given_name=${encodeURIComponent(w.name)}`} className={`link link-hover font-medium transition-transform hover:scale-110 ${colorClass(w.dominant)}`} style={{ fontSize: `${w.size}px` }}>
            {w.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function GivenNamesCharts({ treeId }) {
  const { data, isLoading, error, refetch } = useGivenNamesAnalytics(treeId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-base-200 rounded-box animate-pulse" />
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
            <p>Start the research API: <code className="bg-base-300 px-2 py-1 rounded text-xs">cd ligneous-python-api &amp;&amp; source .venv/bin/activate &amp;&amp; python run.py</code></p>
            <p>Verify: <a href="/api/research/connectivity" target="_blank" rel="noopener noreferrer" className="link link-primary">/api/research/connectivity</a></p>
          </div>
        )}
      </div>
    );
  }

  if (!data) return null;

  const top10Male = data.top_10_male || [];
  const top10Female = data.top_10_female || [];
  const popularityByDecade = data.popularity_by_decade || [];
  const topNamesWithSex = data.top_names_with_sex || [];
  const maxMale = Math.max(...top10Male.map((n) => n.males_count), 1);
  const maxFemale = Math.max(...top10Female.map((n) => n.females_count), 1);
  const hasAny = top10Male.length > 0 || top10Female.length > 0 || popularityByDecade.length > 0 || topNamesWithSex.length > 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {top10Male.length > 0 && (
          <div className="rounded-box border border-base-content/10 bg-base-100 p-6">
            <h3 className="text-base font-semibold text-base-content mb-4">Top 10 names for men</h3>
            <div className="space-y-3">
              {top10Male.map((n) => (
                <div key={n.id} className="flex items-center gap-4">
                  <Link href={`/trees/${treeId}/individuals?given_name=${encodeURIComponent(n.name)}`} className="link link-primary w-28 shrink-0 font-medium">
                    {n.name}
                  </Link>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-6 bg-base-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(n.males_count / maxMale) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 w-10">{n.males_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {top10Female.length > 0 && (
          <div className="rounded-box border border-base-content/10 bg-base-100 p-6">
            <h3 className="text-base font-semibold text-base-content mb-4">Top 10 names for women</h3>
            <div className="space-y-3">
              {top10Female.map((n) => (
                <div key={n.id} className="flex items-center gap-4">
                  <Link href={`/trees/${treeId}/individuals?given_name=${encodeURIComponent(n.name)}`} className="link link-primary w-28 shrink-0 font-medium">
                    {n.name}
                  </Link>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-6 bg-base-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${(n.females_count / maxFemale) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-pink-600 dark:text-pink-400 w-10">{n.females_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <LineChartSection popularityByDecade={popularityByDecade} treeId={treeId} />
      <HeatmapSection popularityByDecade={popularityByDecade} treeId={treeId} />
      <WordCloudSection topNamesWithSex={topNamesWithSex} treeId={treeId} />

      {!hasAny && (
        <div className="rounded-box border border-base-content/10 bg-base-200/50 p-12 text-center">
          <p className="text-base-content/60">No chart data available for this tree.</p>
        </div>
      )}
    </div>
  );
}
