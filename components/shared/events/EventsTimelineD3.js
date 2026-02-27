'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import Link from 'next/link';
import { MapPin, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { stripSlashes, formatEventType } from '@/lib/individual-utils';

const LINE_X_V = 100;
const BOX_WIDTH = 280;
const BOX_HEIGHT = 140;
const SLOT_HEIGHT = 120;
const EVENT_CARD_BASE = 70;
const EVENT_CARD_PER_EXTRA = 48;
const GAP_BETWEEN_GROUPS = 20;
const SLOT_WIDTH = 320;
const LINE_Y_H = 80;
const DOT_R = 10;

function LinkedToPreview({ linkedTo, treeId }) {
  if (!linkedTo?.length) return null;
  return (
    <p className="text-xs text-base-content/50 flex flex-wrap gap-x-1">
      {linkedTo.map((link, i) => (
        <span key={i}>
          {i > 0 && ', '}
          {link.type === 'individual' && link.xref && treeId ? (
            <Link href={`/trees/${treeId}/individuals/${encodeURIComponent(link.xref)}`} className="link link-primary">
              {link.name || link.xref}
            </Link>
          ) : (
            [link.husbandName, link.wifeName].filter(Boolean).join(' & ') || link.xref
          )}
        </span>
      ))}
    </p>
  );
}

function EventContent({ evt, treeId }) {
  const isBirthOfChild = evt.eventType === 'BIRTH_OF_CHILD';
  const childLabel = stripSlashes(evt._childName) || evt._childXref;
  const typeLabel = isBirthOfChild
    ? null
    : evt.customType
      ? `${formatEventType(evt.eventType)} (${evt.customType})`
      : formatEventType(evt.eventType);

  return (
    <div className="space-y-0.5">
      <p className="font-semibold text-sm text-base-content">
        {isBirthOfChild ? (
          evt._childXref && treeId ? (
            <>
              Birth of <Link href={`/trees/${treeId}/individuals/${encodeURIComponent(evt._childXref)}`} className="link link-primary">{childLabel}</Link>
            </>
          ) : (
            `Birth of ${childLabel}`
          )
        ) : (
          typeLabel
        )}
      </p>
      {(evt.place?.original || evt.place?.name) && (
        <p className="text-xs text-base-content/70 flex items-center gap-1">
          <MapPin size={14} />
          {evt.place?.original || evt.place?.name}
        </p>
      )}
      {evt._spouseName && (
        <p className="text-xs text-base-content/50">With: {stripSlashes(evt._spouseName)}</p>
      )}
      {evt.linkedTo?.length > 0 && !evt._spouseName && (
        <LinkedToPreview linkedTo={evt.linkedTo} treeId={treeId} />
      )}
    </div>
  );
}

const DATE_RANGE_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: '50', label: 'Last 50 years' },
  { key: '100', label: 'Last 100 years' },
  { key: '150', label: 'Last 150 years' },
  { key: '200', label: 'Last 200 years' },
];

function getDateKey(evt) {
  const d = evt.date;
  if (!d || d.year == null) return null;
  const m = d.month ?? 0;
  const day = d.day ?? 0;
  return `${d.year}-${m}-${day}`;
}

function toDateValue(evt) {
  const d = evt?.date;
  if (!d || d.year == null) return null;
  const y = d.year;
  const m = (d.month ?? 1) / 12;
  const day = (d.day ?? 1) / 365;
  return y + m + day;
}

function groupEventsByDate(events) {
  const byKey = new Map();
  for (const evt of events) {
    const key = getDateKey(evt);
    if (!key) continue;
    const dateStr = evt.date?.original || `${evt.date.year}`;
    if (!byKey.has(key)) byKey.set(key, { dateKey: key, dateStr, events: [] });
    byKey.get(key).events.push(evt);
  }
  return Array.from(byKey.values());
}

function filterByDateRange(groups, rangeKey) {
  if (rangeKey === 'all') return groups;
  const years = parseInt(rangeKey, 10);
  if (Number.isNaN(years)) return groups;
  const cutoff = new Date().getFullYear() - years;
  return groups.filter((g) => (g.events[0]?.date?.year ?? 0) >= cutoff);
}

export default function EventsTimelineD3({ events, treeId, orientation = 'vertical' }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dateRange, setDateRange] = useState('all');
  const [windowStart, setWindowStart] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 450 });
  const [dragOffsets, setDragOffsets] = useState({});
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const isVertical = orientation === 'vertical';
  const setDragOffsetsRef = useRef(setDragOffsets);
  setDragOffsetsRef.current = setDragOffsets;

  const groups = useMemo(() => {
    const dated = events.filter((e) => e?.date?.year != null);
    const g = groupEventsByDate(dated);
    return filterByDateRange(g, dateRange).sort((a, b) => {
      const av = toDateValue(a.events[0]);
      const bv = toDateValue(b.events[0]);
      return (av ?? 0) - (bv ?? 0);
    });
  }, [events, dateRange]);

  useEffect(() => {
    setWindowStart(0);
    setDragOffsets({});
    setHoveredGroup(null);
    setSelectedGroup(null);
  }, [groups, dateRange, orientation]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? { width: 400, height: 450 };
      setContainerSize({ width: Math.max(200, width), height: Math.max(200, height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pageSize = useMemo(() => {
    if (isVertical) {
      const minSlot = EVENT_CARD_BASE + 24 + GAP_BETWEEN_GROUPS;
      return Math.max(1, Math.floor(containerSize.height / minSlot));
    }
    return Math.max(1, Math.floor(containerSize.width / SLOT_WIDTH));
  }, [containerSize, isVertical]);

  const visibleGroups = useMemo(() => {
    return groups.slice(windowStart, Math.min(windowStart + pageSize, groups.length));
  }, [groups, windowStart, pageSize]);

  const maxStart = Math.max(0, groups.length - pageSize);
  const canGoPrev = windowStart > 0;
  const canGoNext = windowStart < maxStart;

  const goPrev = () => setWindowStart((s) => Math.max(0, s - pageSize));
  const goNext = () => setWindowStart((s) => Math.min(maxStart, s + pageSize));

  const verticalLayout = useMemo(() => {
    if (!isVertical || visibleGroups.length === 0) return null;
    const DATE_LABEL_OFFSET = 24;
    const positions = [];
    let y = 0;
    for (let i = 0; i < visibleGroups.length; i++) {
      const g = visibleGroups[i];
      const cardHeight = EVENT_CARD_BASE + (g.events.length - 1) * EVENT_CARD_PER_EXTRA;
      const cardY = y + DATE_LABEL_OFFSET;
      const dotY = cardY + cardHeight / 2;
      const slotHeight = DATE_LABEL_OFFSET + cardHeight + GAP_BETWEEN_GROUPS;
      positions.push({ dotY, cardY, cardHeight });
      y += slotHeight;
    }
    return { positions, totalHeight: y };
  }, [visibleGroups, isVertical]);

  const { width, height, centerOffsetY } = useMemo(() => {
    if (visibleGroups.length === 0) return { width: 400, height: 450, centerOffsetY: 0 };
    if (isVertical) {
      const totalH = verticalLayout?.totalHeight ?? visibleGroups.length * SLOT_HEIGHT;
      const h = Math.max(450, totalH);
      const w = LINE_X_V + BOX_WIDTH + 80;
      return { width: w, height: h, centerOffsetY: 0 };
    }
    const w = Math.max(600, visibleGroups.length * SLOT_WIDTH);
    const contentH = LINE_Y_H + 20 + BOX_HEIGHT;
    const h = Math.max(450, contentH + 80);
    const centerOffsetY = (h - contentH) / 2;
    return { width: w, height: h, centerOffsetY };
  }, [visibleGroups.length, isVertical, verticalLayout?.totalHeight]);

  const yForIndex = (i) =>
    isVertical && verticalLayout ? verticalLayout.positions[i].dotY : i * SLOT_HEIGHT + SLOT_HEIGHT / 2;
  const xForIndex = (i) => i * SLOT_WIDTH + SLOT_WIDTH / 2;

  useEffect(() => {
    if (!svgRef.current || visibleGroups.length === 0) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g.zoom-group');
    if (g.empty()) return;

    g.selectAll('line.timeline-spine').remove();

    if (isVertical) {
      g.insert('line', ':first-child')
        .attr('class', 'timeline-spine')
        .attr('x1', LINE_X_V)
        .attr('y1', -1e6)
        .attr('x2', LINE_X_V)
        .attr('y2', 1e6)
        .attr('stroke', 'currentColor')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.2);
    } else {
      const lineY = centerOffsetY + LINE_Y_H;
      g.insert('line', ':first-child')
        .attr('class', 'timeline-spine')
        .attr('x1', -1e6)
        .attr('y1', lineY)
        .attr('x2', 1e6)
        .attr('y2', lineY)
        .attr('stroke', 'currentColor')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.2);
    }

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const drag = d3
      .drag()
      .filter((event) => event.sourceEvent?.button === 0 && !event.sourceEvent?.ctrlKey && !event.sourceEvent?.metaKey)
      .on('drag', function (event) {
        const el = this;
        const key = el.getAttribute?.('data-date-key');
        if (!key) return;
        const setState = setDragOffsetsRef.current;
        if (isVertical) {
          setState((prev) => ({
            ...prev,
            [key]: { ...prev[key], y: (prev[key]?.y ?? 0) + event.dy },
          }));
        } else {
          setState((prev) => ({
            ...prev,
            [key]: { ...prev[key], x: (prev[key]?.x ?? 0) + event.dx },
          }));
        }
      });

    g.selectAll('.timeline-group').call(drag);
    return () => {
      svg.on('.zoom', null);
      g.selectAll('.timeline-group').on('.drag', null);
    };
  }, [visibleGroups, width, height, isVertical, centerOffsetY, verticalLayout]);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col h-[500px] rounded-lg border border-base-content/10">
        <div className="flex items-center gap-3 px-3 py-2 border-b border-base-content/10 bg-base-200/50">
          <span className="text-xs text-base-content/50">Date range:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="select select-sm select-bordered h-7 min-h-6 text-xs"
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-base-content/50 py-12 text-center flex-1">No dated events in selected range.</p>
      </div>
    );
  }

  const ArrowIconPrev = isVertical ? ChevronUp : ChevronLeft;
  const ArrowIconNext = isVertical ? ChevronDown : ChevronRight;

  return (
    <div className="flex flex-col h-[500px] rounded-lg border border-base-content/10 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-3 py-2 border-b border-base-content/10 bg-base-200/50 shrink-0">
        <span className="text-xs text-base-content/50">Date range:</span>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="select select-sm select-bordered h-7 min-h-6 text-xs"
        >
          {DATE_RANGE_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
        {groups.length > pageSize && (
          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canGoPrev}
              className={`btn btn-ghost btn-sm btn-square ${!canGoPrev ? 'btn-disabled opacity-40' : ''}`}
              title={isVertical ? 'Earlier events' : 'Previous events'}
              aria-label={isVertical ? 'Earlier events' : 'Previous events'}
            >
              <ArrowIconPrev size={18} />
            </button>
            <span className="text-xs text-base-content/60 px-2">
              {windowStart + 1}–{Math.min(windowStart + pageSize, groups.length)} of {groups.length}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className={`btn btn-ghost btn-sm btn-square ${!canGoNext ? 'btn-disabled opacity-40' : ''}`}
              title={isVertical ? 'Later events' : 'Next events'}
              aria-label={isVertical ? 'Later events' : 'Next events'}
            >
              <ArrowIconNext size={18} />
            </button>
          </div>
        )}
      </div>
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden bg-base-200/30 text-base-content"
        style={{
          backgroundImage: 'radial-gradient(circle, color-mix(in oklch, currentColor 15%, transparent) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMinYMin meet"
          className="block"
        >
          <g className="zoom-group">
            {visibleGroups.map((group, idx) => {
              if (isVertical && verticalLayout) {
                const { dotY, cardY, cardHeight } = verticalLayout.positions[idx];
                const dy = dragOffsets[group.dateKey]?.y ?? 0;
                const isActive = hoveredGroup === group.dateKey || selectedGroup === group.dateKey;
                const groupHandlers = {
                  onMouseEnter: () => setHoveredGroup(group.dateKey),
                  onMouseLeave: () => setHoveredGroup(null),
                  onClick: () => setSelectedGroup((s) => (s === group.dateKey ? null : group.dateKey)),
                };
                return (
                  <g
                    key={group.dateKey}
                    className={`timeline-group cursor-grab active:cursor-grabbing ${isActive ? 'text-primary' : ''}`}
                    data-date-key={group.dateKey}
                    transform={`translate(0, ${dy})`}
                    {...groupHandlers}
                  >
                    <circle
                      cx={LINE_X_V}
                      cy={dotY}
                      r={DOT_R}
                      fill="currentColor"
                      opacity={isActive ? 0.7 : 0.4}
                      className="transition-all duration-150"
                    />
                    <line
                      x1={LINE_X_V}
                      y1={dotY}
                      x2={LINE_X_V + 28}
                      y2={dotY}
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeOpacity={isActive ? 0.6 : 0.4}
                      className="transition-all duration-150"
                    />
                    <foreignObject
                      x={LINE_X_V + 20}
                      y={cardY}
                      width={BOX_WIDTH}
                      height={cardHeight}
                      className="overflow-visible"
                      {...groupHandlers}
                    >
                      <div
                        xmlns="http://www.w3.org/1999/xhtml"
                        className={`timeline-end timeline-box rounded-lg border border-base-content/10 shadow-sm p-3 transition-all duration-150 ${
                          isActive ? 'bg-base-200 hover:bg-base-300' : 'bg-base-100 hover:bg-base-200/50 hover:shadow-md'
                        }`}
                        style={{ minWidth: BOX_WIDTH - 20 }}
                      >
                        <div className="text-xs font-medium text-primary mb-1">{group.dateStr}</div>
                        <div className="space-y-2">
                          {group.events.map((evt, i) => (
                            <div key={evt.id || i} className={i > 0 ? 'pt-2 border-t border-base-content/10' : ''}>
                              <EventContent evt={evt} treeId={treeId} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </foreignObject>
                    <foreignObject x={0} y={cardY - 12} width={LINE_X_V - 4} height={24} className="overflow-visible" {...groupHandlers}>
                      <div
                        xmlns="http://www.w3.org/1999/xhtml"
                        className={`timeline-start text-sm font-medium text-right pr-1 transition-colors duration-150 ${
                          isActive ? 'text-primary' : 'text-base-content/70'
                        }`}
                      >
                        {group.dateStr}
                        {group.events.length > 1 && (
                          <span className="ml-1 text-xs">({group.events.length})</span>
                        )}
                      </div>
                    </foreignObject>
                  </g>
                );
              }
              const x = xForIndex(idx);
              const contentY = centerOffsetY + LINE_Y_H + 20;
              const lineY = centerOffsetY + LINE_Y_H;
              const dateBandHeight = 24;
              const dateLabelY = lineY - dateBandHeight - 14;
              const dx = dragOffsets[group.dateKey]?.x ?? 0;
              const isActive = hoveredGroup === group.dateKey || selectedGroup === group.dateKey;
              const groupHandlers = {
                onMouseEnter: () => setHoveredGroup(group.dateKey),
                onMouseLeave: () => setHoveredGroup(null),
                onClick: () => setSelectedGroup((s) => (s === group.dateKey ? null : group.dateKey)),
              };
              return (
                <g
                  key={group.dateKey}
                  className={`timeline-group cursor-grab active:cursor-grabbing ${isActive ? 'text-primary' : ''}`}
                  data-date-key={group.dateKey}
                  transform={`translate(${dx}, 0)`}
                  {...groupHandlers}
                >
                  <circle
                    cx={x}
                    cy={lineY}
                    r={DOT_R}
                    fill="currentColor"
                    opacity={isActive ? 0.7 : 0.4}
                    className="transition-all duration-150"
                  />
                  <line
                    x1={x}
                    y1={lineY}
                    x2={x}
                    y2={contentY + 12}
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeOpacity={isActive ? 0.6 : 0.4}
                    className="transition-all duration-150"
                  />
                  <foreignObject
                    x={x - BOX_WIDTH / 2}
                    y={contentY}
                    width={BOX_WIDTH}
                    height={BOX_HEIGHT}
                    className="overflow-visible"
                    {...groupHandlers}
                  >
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      className={`timeline-end timeline-box rounded-lg border border-base-content/10 shadow-sm p-3 transition-all duration-150 ${
                        isActive ? 'bg-base-200 hover:bg-base-300' : 'bg-base-100 hover:bg-base-200/50 hover:shadow-md'
                      }`}
                      style={{ minWidth: BOX_WIDTH - 20 }}
                    >
                      <div className="text-xs font-medium text-primary mb-1">{group.dateStr}</div>
                      <div className="space-y-2">
                        {group.events.map((evt, i) => (
                          <div key={evt.id || i} className={i > 0 ? 'pt-2 border-t border-base-content/10' : ''}>
                            <EventContent evt={evt} treeId={treeId} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </foreignObject>
                  <foreignObject x={x - 60} y={dateLabelY} width={120} height={dateBandHeight} className="overflow-visible" {...groupHandlers}>
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      className={`timeline-start text-sm font-medium text-center transition-colors duration-150 ${
                        isActive ? 'text-primary' : 'text-base-content/70'
                      }`}
                    >
                      {group.dateStr}
                      {group.events.length > 1 && (
                        <span className="ml-1 text-xs">({group.events.length})</span>
                      )}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
