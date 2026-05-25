'use client';

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import * as d3 from 'd3';
import { X, Plus } from 'lucide-react';
import { useSurnamesAnalytics } from '@/hooks/queries/useSurnamesAnalytics';
import ChartsTemplate from './ChartsTemplate';

const LINE_CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function useLineChartData(popularityByDecade, selectedNames, decadeRange = null) {
  return useMemo(() => {
    if (!popularityByDecade?.length) return { byName: {}, decades: [], allDecades: [], allNames: [] };
    const byName = {};
    const decadeSet = new Set();
    for (const row of popularityByDecade) {
      if (!byName[row.name]) byName[row.name] = {};
      byName[row.name][row.decade] = row.count;
      decadeSet.add(row.decade);
    }
    const allDecades = [...decadeSet].sort((a, b) => a - b);
    const decades =
      decadeRange && (decadeRange.start != null || decadeRange.end != null)
        ? allDecades.filter(
            (d) =>
              (decadeRange.start == null || d >= decadeRange.start) &&
              (decadeRange.end == null || d <= decadeRange.end)
          )
        : allDecades;
    const allNames = Object.keys(byName)
      .map((n) => ({ name: n, total: Object.values(byName[n]).reduce((s, c) => s + c, 0) }))
      .sort((a, b) => b.total - a.total);
    const names =
      selectedNames.length > 0
        ? selectedNames.filter((n) => n in byName)
        : allNames.slice(0, 5).map((x) => x.name);
    const series = names.map((name) => ({
      name,
      points: decades.map((d) => ({ decade: d, count: byName[name][d] || 0 })),
    }));
    const maxCount = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.count)));
    return { byName, decades, allDecades, allNames: allNames.map((x) => x.name), series, maxCount };
  }, [popularityByDecade, selectedNames, decadeRange]);
}

function LineChartSection({ popularityByDecade, treeId, innerRef, selectedNames, decadeRange }) {
  const fallbackSvgRef = useRef(null);
  const targetRef = innerRef ?? fallbackSvgRef;
  const [clickedPoint, setClickedPoint] = useState(null);
  const { series, decades, maxCount } = useLineChartData(popularityByDecade, selectedNames, decadeRange);

  const handlePointClick = useCallback((event, point) => {
    setClickedPoint({
      ...point,
      clientX: event.clientX,
      clientY: event.clientY,
    });
  }, []);

  useEffect(() => {
    if (!targetRef?.current || series.length === 0 || decades.length === 0) return;

    const width = 500;
    const height = 220;
    const margin = { top: 20, right: 20, bottom: 52, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const root = d3.select(targetRef.current);
    root.selectAll('*').remove();

    const g = innerRef
      ? root.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
      : root.attr('viewBox', `0 0 ${width} ${height}`).append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scalePoint().domain(decades.map(String)).range([0, innerWidth]).padding(0.1);
    const yScale = d3.scaleLinear().domain([0, maxCount]).range([innerHeight, 0]).nice();
    const line = d3
      .line()
      .x((d) => xScale(String(d.decade)) ?? 0)
      .y((d) => yScale(d.count))
      .curve(d3.curveMonotoneX);

    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('pointer-events', 'all')
      .style('cursor', 'default')
      .on('click', () => setClickedPoint(null))
      .lower();

    g.selectAll('line.grid')
      .data(yScale.ticks(5))
      .join('line')
      .attr('class', 'grid')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale)
      .attr('y2', yScale)
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', 0.1);

    const pathGroup = g.append('g').attr('class', 'paths');
    const circleGroup = g.append('g').attr('class', 'circles');

    series.forEach((s, i) => {
      const color = LINE_CHART_COLORS[i % LINE_CHART_COLORS.length];
      const pathClass = `path-${i}`;
      pathGroup
        .append('path')
        .datum(s.points)
        .attr('class', pathClass)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.9)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', line)
        .style('cursor', 'pointer')
        .on('mouseover', function () {
          d3.select(this).attr('stroke-width', 3).attr('stroke-opacity', 1);
          circleGroup.selectAll(`.pt-${i}`).attr('r', 5);
        })
        .on('mouseout', function () {
          d3.select(this).attr('stroke-width', 2).attr('stroke-opacity', 0.9);
          circleGroup.selectAll(`.pt-${i}`).attr('r', 4);
        })
        .append('title')
        .text(s.name);

      const pointsWithName = s.points.map((p) => ({ ...p, name: s.name }));
      circleGroup
        .selectAll(`circle.pt-${i}`)
        .data(pointsWithName)
        .join('circle')
        .attr('class', `pt-${i}`)
        .attr('cx', (d) => xScale(String(d.decade)) ?? 0)
        .attr('cy', (d) => yScale(d.count))
        .attr('r', 4)
        .attr('fill', color)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function () {
          pathGroup.select(`.${pathClass}`).attr('stroke-width', 3).attr('stroke-opacity', 1);
          circleGroup.selectAll(`.pt-${i}`).attr('r', 5);
        })
        .on('mouseout', function () {
          pathGroup.select(`.${pathClass}`).attr('stroke-width', 2).attr('stroke-opacity', 0.9);
          circleGroup.selectAll(`.pt-${i}`).attr('r', 4);
        })
        .on('click', function (event, d) {
          event.stopPropagation();
          handlePointClick(event, d);
        });
    });

    const xAxis = d3.axisBottom(xScale).tickFormat((d) => `${d}s`).tickSizeOuter(0);
    const xAxisG = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(xAxis);
    xAxisG
      .selectAll('text')
      .attr('class', 'text-[10px] fill-base-content/60')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.35em');

    const yAxis = d3.axisLeft(yScale).ticks(5).tickSizeOuter(0);
    g.append('g').call(yAxis).selectAll('text').attr('class', 'text-[10px] fill-base-content/60');
  }, [series, decades, maxCount, innerRef, targetRef, handlePointClick, decadeRange]);

  if (series.length === 0 || decades.length === 0) return null;

  if (innerRef) {
    return (
      <>
        {clickedPoint && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setClickedPoint(null)}
            onKeyDown={(e) => e.key === 'Escape' && setClickedPoint(null)}
            className="fixed z-50 rounded-lg bg-base-100 border border-base-content/20 shadow-lg px-3 py-2 text-sm cursor-pointer"
            style={{ left: clickedPoint.clientX + 12, top: clickedPoint.clientY + 12 }}
          >
            <p className="font-semibold text-base-content">{clickedPoint.name}</p>
            <p className="text-base-content/70">
              {clickedPoint.decade}s: {clickedPoint.count} {clickedPoint.count === 1 ? 'person' : 'people'}
            </p>
            <p className="text-xs text-base-content/50 mt-1">Click to close</p>
          </div>
        )}
      </>
    );
  }

  return null;
}

function LineChartNamePickerModal({ open, onClose, availableNames, selectedNames, onSelect, maxNames = 5 }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query.trim()) return availableNames.filter((n) => !selectedNames.includes(n));
    const q = query.toLowerCase();
    return availableNames.filter((n) => !selectedNames.includes(n) && n.toLowerCase().includes(q));
  }, [availableNames, selectedNames, query]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} aria-hidden />
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none"
        role="dialog"
        aria-modal
        aria-label="Add surname to chart"
      >
        <div
          className="w-full max-w-sm bg-base-100 rounded-lg shadow-xl overflow-hidden pointer-events-auto flex flex-col max-h-[70vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-content/10 shrink-0">
            <h2 className="text-base font-semibold text-base-content">Add surname to chart</h2>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-square btn-sm" aria-label="Close">
              <X size={18} className="shrink-0" />
            </button>
          </div>
          <div className="px-4 py-2 border-b border-base-content/10 shrink-0">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search surnames..."
              className="input input-bordered input-sm w-full"
            />
          </div>
          <div className="overflow-y-auto flex-1 min-h-0 p-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-base-content/50 py-4 text-center">
                {selectedNames.length < maxNames ? 'No surnames match your search.' : 'All available surnames are already on the chart.'}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {filtered.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(name);
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-base-200 text-sm"
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function LineChartLegend({ popularityByDecade, treeId, selectedNames, decadeRange, onDecadeRangeChange, onRemove, onAdd }) {
  const { allNames, allDecades } = useLineChartData(popularityByDecade, selectedNames, null);
  const [modalOpen, setModalOpen] = useState(false);
  const displayNames = selectedNames.length > 0 ? selectedNames : allNames.slice(0, 5);
  const canAdd = displayNames.length < 5;
  const showTimeRange = allDecades.length > 6;
  const startDecade = decadeRange?.start ?? allDecades[0];
  const endDecade = decadeRange?.end ?? allDecades[allDecades.length - 1];

  if (allNames.length === 0) return null;

  return (
    <>
      {showTimeRange && (
        <div className="flex flex-wrap items-center gap-3 px-2 mb-3">
          <span className="text-xs font-medium text-base-content/70">Time range:</span>
          <select
            value={startDecade ?? ''}
            onChange={(e) => {
              const start = Number(e.target.value);
              onDecadeRangeChange?.({ start, end: start > endDecade ? start : endDecade });
            }}
            className="select select-bordered select-xs w-24"
            aria-label="From decade"
          >
            {allDecades.filter((d) => d <= (endDecade ?? Infinity)).map((d) => (
              <option key={d} value={d}>{d}s</option>
            ))}
          </select>
          <span className="text-xs text-base-content/50">to</span>
          <select
            value={endDecade ?? ''}
            onChange={(e) => {
              const end = Number(e.target.value);
              onDecadeRangeChange?.({ start: end < startDecade ? end : startDecade, end });
            }}
            className="select select-bordered select-xs w-24"
            aria-label="To decade"
          >
            {allDecades.filter((d) => d >= (startDecade ?? -Infinity)).map((d) => (
              <option key={d} value={d}>{d}s</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 px-2">
        {displayNames.map((name, i) => (
          <span key={name} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: LINE_CHART_COLORS[i % LINE_CHART_COLORS.length] }}
            />
            <Link href={`/trees/${treeId}/individuals?surname=${encodeURIComponent(name)}`} className="text-sm link link-primary">
              {name}
            </Link>
            <button
              type="button"
              onClick={() => onRemove(name)}
              className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-base-content"
              aria-label={`Remove ${name} from chart`}
            >
              <X size={14} className="shrink-0" />
            </button>
          </span>
        ))}
        {canAdd && (
          <button type="button" onClick={() => setModalOpen(true)} className="btn btn-ghost btn-sm gap-1">
            <Plus size={14} className="shrink-0" />
            Add surname
          </button>
        )}
      </div>
      <LineChartNamePickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        availableNames={allNames}
        selectedNames={displayNames}
        onSelect={onAdd}
        maxNames={5}
      />
    </>
  );
}

function DecadeHeatmapSection({ popularityByDecade, treeId, innerRef, decadeRange }) {
  const fallbackSvgRef = useRef(null);
  const targetRef = innerRef ?? fallbackSvgRef;
  const { rows, cols, grid, maxVal } = useMemo(() => {
    if (!popularityByDecade?.length) return { rows: [], cols: [], grid: {}, maxVal: 1 };
    const grid = {};
    const nameSet = new Set();
    const decadeSet = new Set();
    for (const row of popularityByDecade) {
      nameSet.add(row.name);
      decadeSet.add(row.decade);
      grid[`${row.name}-${row.decade}`] = row.count;
    }
    let allCols = [...decadeSet].sort((a, b) => a - b);
    if (decadeRange && (decadeRange.start != null || decadeRange.end != null)) {
      allCols = allCols.filter(
        (d) =>
          (decadeRange.start == null || d >= decadeRange.start) &&
          (decadeRange.end == null || d <= decadeRange.end)
      );
    }
    const rows = [...nameSet].sort().slice(0, 15);
    const cols = allCols;
    const maxVal = Math.max(1, ...Object.values(grid));
    return { rows, cols, grid, maxVal };
  }, [popularityByDecade, decadeRange]);

  useEffect(() => {
    if (!targetRef?.current || rows.length === 0 || cols.length === 0) return;

    const cellHeight = 24;
    const cellWidth = 36;
    const nameWidth = 110;
    const headerHeight = 44;
    const width = nameWidth + cols.length * cellWidth;
    const height = headerHeight + rows.length * cellHeight;

    const root = d3.select(targetRef.current);
    root.selectAll('*').remove();

    const g = innerRef ? root.append('g') : root.attr('viewBox', `0 0 ${width} ${height}`).append('g');

    cols.forEach((d, i) => {
      const x = nameWidth + i * cellWidth + cellWidth / 2;
      const y = headerHeight - 10;
      g.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'end')
        .attr('class', 'text-[10px] fill-base-content/70 font-medium')
        .attr('transform', `rotate(-45, ${x}, ${y})`)
        .text(`${d}s`);
    });

    rows.forEach((name, rowIdx) => {
      const href = `/trees/${treeId}/individuals?surname=${encodeURIComponent(name)}`;
      const link = g.append('a').attr('href', href).attr('class', 'link text-[10px] fill-primary hover:opacity-80');
      link
        .append('text')
        .attr('x', nameWidth - 6)
        .attr('y', headerHeight + rowIdx * cellHeight + cellHeight / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('class', 'truncate')
        .text(name);
      link.append('title').text(name);

      cols.forEach((d, colIdx) => {
        const val = grid[`${name}-${d}`] || 0;
        const opacity = val ? Math.max(0.2, val / maxVal) : 0;
        g.append('rect')
          .attr('x', nameWidth + colIdx * cellWidth + 1)
          .attr('y', headerHeight + rowIdx * cellHeight + 1)
          .attr('width', cellWidth - 2)
          .attr('height', cellHeight - 2)
          .attr('fill', 'hsl(var(--p))')
          .attr('opacity', opacity)
          .attr('class', 'transition-colors')
          .append('title')
          .text(`${name} in ${d}s: ${val}`);
      });
    });
  }, [rows, cols, grid, maxVal, treeId, innerRef, targetRef, decadeRange]);

  if (rows.length === 0 || cols.length === 0) return null;
  if (innerRef) return null;
  return null;
}

function DecadeHeatmapLegend({ popularityByDecade, treeId, decadeRange, onDecadeRangeChange }) {
  const rows = useMemo(() => {
    if (!popularityByDecade?.length) return [];
    const nameSet = new Set(popularityByDecade.map((r) => r.name));
    return [...nameSet].sort().slice(0, 15);
  }, [popularityByDecade]);
  const allDecades = useMemo(() => {
    if (!popularityByDecade?.length) return [];
    return [...new Set(popularityByDecade.map((r) => r.decade))].sort((a, b) => a - b);
  }, [popularityByDecade]);
  const showTimeRange = allDecades.length > 6;
  const startDecade = decadeRange?.start ?? allDecades[0];
  const endDecade = decadeRange?.end ?? allDecades[allDecades.length - 1];

  if (rows.length === 0) return null;
  return (
    <>
      {showTimeRange && (
        <div className="flex flex-wrap items-center gap-3 px-2 mb-3">
          <span className="text-xs font-medium text-base-content/70">Time range:</span>
          <select
            value={startDecade ?? ''}
            onChange={(e) => {
              const start = Number(e.target.value);
              onDecadeRangeChange?.({ start, end: start > endDecade ? start : endDecade });
            }}
            className="select select-bordered select-xs w-24"
            aria-label="From decade"
          >
            {allDecades.filter((d) => d <= (endDecade ?? Infinity)).map((d) => (
              <option key={d} value={d}>{d}s</option>
            ))}
          </select>
          <span className="text-xs text-base-content/50">to</span>
          <select
            value={endDecade ?? ''}
            onChange={(e) => {
              const end = Number(e.target.value);
              onDecadeRangeChange?.({ start: end < startDecade ? end : startDecade, end });
            }}
            className="select select-bordered select-xs w-24"
            aria-label="To decade"
          >
            {allDecades.filter((d) => d >= (startDecade ?? -Infinity)).map((d) => (
              <option key={d} value={d}>{d}s</option>
            ))}
          </select>
        </div>
      )}
    <div className="flex flex-wrap gap-2 px-2">
      {rows.slice(0, 5).map((name) => (
        <Link key={name} href={`/trees/${treeId}/individuals?surname=${encodeURIComponent(name)}`} className="link link-primary text-xs">
          {name}
        </Link>
      ))}
      {rows.length > 5 && <span className="text-xs text-base-content/50">…</span>}
    </div>
    </>
  );
}

function LocationHeatmapSection({ popularityByPlace, treeId, innerRef }) {
  const fallbackSvgRef = useRef(null);
  const targetRef = innerRef ?? fallbackSvgRef;
  const { rows, cols, grid, maxVal } = useMemo(() => {
    if (!popularityByPlace?.length) return { rows: [], cols: [], grid: {}, maxVal: 1 };
    const grid = {};
    const nameSet = new Set();
    const countrySet = new Set();
    for (const row of popularityByPlace) {
      nameSet.add(row.name);
      countrySet.add(row.place_country);
      grid[`${row.name}-${row.place_country}`] = row.count;
    }
    const rows = [...nameSet].sort().slice(0, 15);
    const cols = [...countrySet].sort();
    const maxVal = Math.max(1, ...Object.values(grid));
    return { rows, cols, grid, maxVal };
  }, [popularityByPlace]);

  useEffect(() => {
    if (!targetRef?.current || rows.length === 0 || cols.length === 0) return;

    const cellHeight = 24;
    const cellWidth = 50;
    const nameWidth = 110;
    const headerHeight = 28;
    const width = nameWidth + cols.length * cellWidth;
    const height = headerHeight + rows.length * cellHeight;

    const root = d3.select(targetRef.current);
    root.selectAll('*').remove();

    const g = innerRef ? root.append('g') : root.attr('viewBox', `0 0 ${width} ${height}`).append('g');

    cols.forEach((country, i) => {
      g.append('text')
        .attr('x', nameWidth + i * cellWidth + cellWidth / 2)
        .attr('y', headerHeight - 8)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-[10px] fill-base-content/70 font-medium')
        .text(country);
    });

    rows.forEach((name, rowIdx) => {
      const href = `/trees/${treeId}/individuals?surname=${encodeURIComponent(name)}`;
      const link = g.append('a').attr('href', href).attr('class', 'link text-[10px] fill-primary hover:opacity-80');
      link
        .append('text')
        .attr('x', nameWidth - 6)
        .attr('y', headerHeight + rowIdx * cellHeight + cellHeight / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('class', 'truncate')
        .text(name);
      link.append('title').text(name);

      cols.forEach((country, colIdx) => {
        const val = grid[`${name}-${country}`] || 0;
        const opacity = val ? Math.max(0.2, val / maxVal) : 0;
        g.append('rect')
          .attr('x', nameWidth + colIdx * cellWidth + 1)
          .attr('y', headerHeight + rowIdx * cellHeight + 1)
          .attr('width', cellWidth - 2)
          .attr('height', cellHeight - 2)
          .attr('fill', 'hsl(var(--p))')
          .attr('opacity', opacity)
          .attr('class', 'transition-colors')
          .append('title')
          .text(`${name} in ${country}: ${val}`);
      });
    });
  }, [rows, cols, grid, maxVal, treeId, innerRef, targetRef]);

  if (rows.length === 0 || cols.length === 0) return null;
  if (innerRef) return null;
  return null;
}

function LocationHeatmapLegend({ popularityByPlace, treeId }) {
  const rows = useMemo(() => {
    if (!popularityByPlace?.length) return [];
    const nameSet = new Set(popularityByPlace.map((r) => r.name));
    return [...nameSet].sort().slice(0, 15);
  }, [popularityByPlace]);
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 px-2">
      {rows.slice(0, 5).map((name) => (
        <Link key={name} href={`/trees/${treeId}/individuals?surname=${encodeURIComponent(name)}`} className="link link-primary text-xs">
          {name}
        </Link>
      ))}
      {rows.length > 5 && <span className="text-xs text-base-content/50">…</span>}
    </div>
  );
}

function WordCloudSection({ topSurnames, treeId, innerRef }) {
  const fallbackSvgRef = useRef(null);
  const targetRef = innerRef ?? fallbackSvgRef;

  const words = useMemo(() => {
    if (!topSurnames?.length) return [];
    const max = Math.max(...topSurnames.map((n) => n.frequency), 1);
    return topSurnames.slice(0, 40).map((n) => ({
      ...n,
      size: 12 + Math.round((n.frequency / max) * 28),
    }));
  }, [topSurnames]);

  useEffect(() => {
    if (!targetRef?.current || words.length === 0 || !treeId) return;

    const width = 500;
    const height = 280;
    const primaryColor = 'hsl(var(--p))';

    const root = d3.select(targetRef.current);
    root.selectAll('*').remove();

    const g = innerRef
      ? root.append('g').attr('transform', `translate(${width / 2},${height / 2})`)
      : root.attr('viewBox', `0 0 ${width} ${height}`).append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    const nodes = words.map((w) => ({ ...w, x: 0, y: 0 }));

    const simulation = d3
      .forceSimulation(nodes)
      .force('collision', d3.forceCollide().radius((d) => d.size * 1.2))
      .force('x', d3.forceX(0).strength(0.05))
      .force('y', d3.forceY(0).strength(0.05))
      .force('charge', d3.forceManyBody().strength(-20))
      .stop();

    for (let i = 0; i < 100; i++) simulation.tick();

    const link = g
      .selectAll('a')
      .data(nodes)
      .join('a')
      .attr('href', (d) => `/trees/${treeId}/individuals?surname=${encodeURIComponent(d.name)}`)
      .attr('class', 'cursor-pointer hover:opacity-80 transition-opacity');

    link
      .append('text')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', (d) => `${d.size}px`)
      .attr('font-weight', 500)
      .attr('fill', primaryColor)
      .attr('class', 'select-none')
      .text((d) => d.name);

    link.append('title').text((d) => `${d.name} (${d.frequency} people)`);
  }, [words, treeId, innerRef, targetRef]);

  if (words.length === 0) return null;
  if (innerRef) return null;
  return null;
}

function WordCloudLegend() {
  return (
    <div className="text-xs text-base-content/60 px-2">
      <span>Size = frequency. Click a surname to view individuals.</span>
    </div>
  );
}

export default function SurnamesCharts({ treeId }) {
  const { data, isLoading, error, refetch } = useSurnamesAnalytics(treeId);

  const popularityByDecade = data?.popularity_by_decade || [];
  const popularityByPlace = data?.popularity_by_place || [];
  const topSurnames = data?.top_surnames || [];

  const lineChartTop5 = useMemo(() => {
    if (!popularityByDecade?.length) return [];
    const byName = {};
    for (const row of popularityByDecade) {
      if (!byName[row.name]) byName[row.name] = {};
      byName[row.name][row.decade] = row.count;
    }
    return Object.keys(byName)
      .map((n) => ({ name: n, total: Object.values(byName[n]).reduce((s, c) => s + c, 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((x) => x.name);
  }, [popularityByDecade]);

  const [selectedLineNames, setSelectedLineNames] = useState([]);
  const [decadeRange, setDecadeRange] = useState(null);
  const displayLineNames = selectedLineNames.length > 0 ? selectedLineNames : lineChartTop5;

  const handleDecadeRangeChange = useCallback((range) => {
    setDecadeRange(range);
  }, []);

  const heatmapDecades = useMemo(() => {
    if (!popularityByDecade?.length) return [];
    const all = [...new Set(popularityByDecade.map((r) => r.decade))].sort((a, b) => a - b);
    if (!decadeRange) return all;
    return all.filter(
      (d) =>
        (decadeRange.start == null || d >= decadeRange.start) &&
        (decadeRange.end == null || d <= decadeRange.end)
    );
  }, [popularityByDecade, decadeRange]);

  const handleLineRemove = useCallback((name) => {
    setSelectedLineNames((prev) => {
      const cur = prev.length > 0 ? prev : lineChartTop5;
      return cur.filter((n) => n !== name);
    });
  }, [lineChartTop5]);

  const handleLineAdd = useCallback((name) => {
    setSelectedLineNames((prev) => {
      const cur = prev.length > 0 ? prev : lineChartTop5;
      return cur.length < 5 ? [...cur, name] : cur;
    });
  }, [lineChartTop5]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-base-200 rounded-box animate-pulse" />
        <div className="h-48 bg-base-200 rounded-box animate-pulse" />
      </div>
    );
  }

  if (error) {
    const isApiUnavailable =
      error.message?.toLowerCase().includes('not running') ||
      error.message?.toLowerCase().includes('unavailable');
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
            <p>
              Start the research API:{' '}
              <code className="bg-base-300 px-2 py-1 rounded text-xs">
                cd ligneous-python-api &amp;&amp; .venv/bin/python run.py
              </code>
            </p>
            <p>
              Verify:{' '}
              <a href="/api/research/connectivity" target="_blank" rel="noopener noreferrer" className="link link-primary">
                /api/research/connectivity
              </a>
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!data) return null;

  const hasAny = popularityByDecade.length > 0 || popularityByPlace.length > 0 || topSurnames.length > 0;

  const decadeHeatmapWidth = 110 + (heatmapDecades.length > 0 ? heatmapDecades.length * 36 : 200);
  const decadeHeatmapHeight = 44 + Math.min(15, [...new Set(popularityByDecade?.map((r) => r.name) || [])].length) * 24;

  const locationHeatmapRows = popularityByPlace?.length ? [...new Set(popularityByPlace.map((r) => r.name))].length : 0;
  const locationHeatmapCols = popularityByPlace?.length ? [...new Set(popularityByPlace.map((r) => r.place_country))].length : 0;
  const locationHeatmapWidth = 110 + locationHeatmapCols * 50;
  const locationHeatmapHeight = 28 + Math.min(15, locationHeatmapRows) * 24;

  const charts = [
    ...(popularityByDecade.length > 0
      ? [
          {
            id: 'line',
            label: 'Popularity over decades',
            description:
              'Shows how surnames changed in popularity across decades. Hover lines to highlight, click dots for details. Choose up to 5 surnames from the legend.',
            width: 500,
            height: 220,
            renderChart: (innerRef) => (
              <LineChartSection
                popularityByDecade={popularityByDecade}
                treeId={treeId}
                innerRef={innerRef}
                selectedNames={displayLineNames}
                decadeRange={decadeRange}
              />
            ),
            renderLegend: () => (
              <LineChartLegend
                popularityByDecade={popularityByDecade}
                treeId={treeId}
                selectedNames={displayLineNames}
                decadeRange={decadeRange}
                onDecadeRangeChange={handleDecadeRangeChange}
                onRemove={handleLineRemove}
                onAdd={handleLineAdd}
              />
            ),
          },
          {
            id: 'heatmap',
            label: 'Surname popularity by decade',
            description:
              'A grid showing surname frequency by decade. Rows are surnames, columns are decades. Darker cells indicate more individuals. Click a surname to view those individuals.',
            width: decadeHeatmapWidth,
            height: decadeHeatmapHeight,
            renderChart: (innerRef) => (
              <DecadeHeatmapSection
                popularityByDecade={popularityByDecade}
                treeId={treeId}
                innerRef={innerRef}
                decadeRange={decadeRange}
              />
            ),
            renderLegend: () => (
              <DecadeHeatmapLegend
                popularityByDecade={popularityByDecade}
                treeId={treeId}
                decadeRange={decadeRange}
                onDecadeRangeChange={handleDecadeRangeChange}
              />
            ),
          },
        ]
      : []),
    ...(topSurnames.length > 0
      ? [
          {
            id: 'wordcloud',
            label: 'Surname cloud',
            description:
              'Surnames sized by frequency. Click any surname to view individuals. Use zoom and pan to explore.',
            width: 500,
            height: 280,
            renderChart: (innerRef) => <WordCloudSection topSurnames={topSurnames} treeId={treeId} innerRef={innerRef} />,
            renderLegend: () => <WordCloudLegend />,
          },
        ]
      : []),
    ...(popularityByPlace.length > 0
      ? [
          {
            id: 'location',
            label: 'Surnames by birth country',
            description:
              'A grid showing surname frequency by birth country. Rows are surnames, columns are countries. Darker cells indicate more individuals. Click a surname to view those individuals.',
            width: locationHeatmapWidth,
            height: locationHeatmapHeight,
            renderChart: (innerRef) => (
              <LocationHeatmapSection popularityByPlace={popularityByPlace} treeId={treeId} innerRef={innerRef} />
            ),
            renderLegend: () => <LocationHeatmapLegend popularityByPlace={popularityByPlace} treeId={treeId} />,
          },
        ]
      : []),
  ];

  if (!hasAny) {
    return (
      <div className="rounded-box border border-base-content/10 bg-base-200/50 p-12 text-center">
        <p className="text-base-content/60">No chart data available for this tree.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ChartsTemplate charts={charts} defaultChartId={charts[0]?.id} dropdownLabel="Select chart" />
    </div>
  );
}
