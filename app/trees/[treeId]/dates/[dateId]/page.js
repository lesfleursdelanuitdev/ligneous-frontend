'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components';
import { authFetch } from '@/lib/api';
import { Baby, Skull, Heart, Unlink, CalendarDays, User, Users as UsersIcon } from 'lucide-react';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TYPE_CONFIG = {
  birth:    { icon: 'Baby',         color: 'text-success',  bg: 'bg-success/10', badge: 'badge-success', label: 'Birth' },
  death:    { icon: 'Skull',        color: 'text-error',    bg: 'bg-error/10',   badge: 'badge-error',   label: 'Death' },
  marriage: { icon: 'Heart',        color: 'text-info',     bg: 'bg-info/10',    badge: 'badge-info',    label: 'Marriage' },
  divorce:  { icon: 'Unlink',       color: 'text-warning',  bg: 'bg-warning/10', badge: 'badge-warning', label: 'Divorce' },
  event:    { icon: 'CalendarDays', color: 'text-neutral',  bg: 'bg-neutral/10', badge: 'badge-neutral', label: 'Event' },
};

const ICON_MAP = { Baby, Skull, Heart, Unlink, CalendarDays };

function formatDate(d) {
  if (!d) return '\u2014';
  const parts = [];
  if (d.day) parts.push(d.day);
  if (d.month) parts.push(MONTH_NAMES[d.month]);
  if (d.year) parts.push(d.year);
  if (parts.length === 0) return d.original || '\u2014';
  return parts.join(' ');
}

function EventCard({ evt, treeId }) {
  const cfg = TYPE_CONFIG[evt.type] || TYPE_CONFIG.event;
  const Icon = ICON_MAP[cfg.icon] || CalendarDays;

  return (
    <div className="card border border-base-content/10 bg-base-100 rounded-box overflow-hidden">
      <div className={`flex items-center gap-3 px-5 py-3 ${cfg.bg}`}>
        <Icon className={`w-5 h-5 ${cfg.color} flex-shrink-0`} />
        <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
        <span className={`badge badge-sm ${cfg.badge} ml-auto`}>{evt.type}</span>
      </div>
      <div className="px-5 py-4 space-y-2">
        <p className="text-base font-medium text-base-content">{evt.label}</p>

        {evt.place && (
          <p className="text-sm text-base-content/60">
            <span className="font-medium text-base-content/80">Place:</span> {evt.place}
          </p>
        )}

        {evt.value && (
          <p className="text-sm text-base-content/60">
            <span className="font-medium text-base-content/80">Details:</span> {evt.value}
          </p>
        )}

        {evt.cause && (
          <p className="text-sm text-base-content/60">
            <span className="font-medium text-base-content/80">Cause:</span> {evt.cause}
          </p>
        )}

        {evt.individualXref && (
          <Link
            href={`/trees/${treeId}/individuals/${evt.individualXref}`}
            className="inline-flex items-center gap-1.5 text-sm link link-primary"
          >
            <User className="w-3.5 h-3.5" />
            {evt.individualName || evt.individualXref}
          </Link>
        )}

        {evt.familyXref && (
          <div className="flex items-center gap-1.5 text-sm text-base-content/70">
            <UsersIcon className="w-3.5 h-3.5" />
            <span>{[evt.husbandName, evt.wifeName].filter(Boolean).join(' & ') || evt.familyXref}</span>
          </div>
        )}

        {evt.participants && evt.participants.length > 0 && (
          <div className="pt-1 border-t border-base-content/5 mt-2">
            <p className="text-xs font-medium text-base-content/50 mb-1 uppercase tracking-wide">Participants</p>
            <div className="flex flex-wrap gap-2">
              {evt.participants.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-sm">
                  {p.type === 'individual' ? (
                    <Link
                      href={`/trees/${treeId}/individuals/${p.xref}`}
                      className="link link-primary"
                    >
                      {p.name || p.xref}
                    </Link>
                  ) : (
                    <span className="text-base-content/70">
                      {[p.husbandName, p.wifeName].filter(Boolean).join(' & ') || p.xref}
                    </span>
                  )}
                  {p.role && p.role !== 'principal' && (
                    <span className="badge badge-xs badge-ghost">{p.role}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {evt.eventType && evt.type === 'event' && (
          <p className="text-xs text-base-content/40 mt-1">Type: {evt.customType || evt.eventType}</p>
        )}
      </div>
    </div>
  );
}

export default function DateDetailPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const dateId = params?.dateId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!treeId || !dateId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch(`/api/trees/${treeId}/dates/${dateId}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch date details');
      }
      setData(json);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [treeId, dateId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!treeId || !dateId) {
    return (
      <DashboardLayout>
        <div className="p-6"><p className="text-base-content/60">Missing tree or date ID.</p></div>
      </DashboardLayout>
    );
  }

  const date = data?.date;
  const linkedEvents = data?.linkedEvents || [];

  const groupedByType = {};
  for (const evt of linkedEvents) {
    const t = evt.type || 'event';
    if (!groupedByType[t]) groupedByType[t] = [];
    groupedByType[t].push(evt);
  }

  const typeOrder = ['birth', 'death', 'marriage', 'divorce', 'event'];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <Link href={`/trees/${treeId}/dates`} className="text-sm link link-primary mb-1 inline-block">&larr; All dates</Link>
          {loading ? (
            <div className="h-8 w-48 bg-base-300 animate-pulse rounded mt-1" />
          ) : (
            <>
              <h1 className="text-2xl font-bold text-base-content">{date?.original || 'Date Details'}</h1>
              <p className="text-base-content/60 mt-1">{formatDate(date)}</p>
            </>
          )}
        </div>

        {date && (
          <div className="card bg-base-200 rounded-box p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-base-content/50 uppercase tracking-wide">Year</p>
                <p className="text-lg font-semibold">{date.year ?? '\u2014'}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase tracking-wide">Month</p>
                <p className="text-lg font-semibold">{date.month ? MONTH_NAMES[date.month] : '\u2014'}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase tracking-wide">Day</p>
                <p className="text-lg font-semibold">{date.day ?? '\u2014'}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase tracking-wide">Type</p>
                <p className="text-lg font-semibold capitalize">{date.dateType?.toLowerCase() ?? '\u2014'}</p>
              </div>
            </div>
            {date.endYear && (
              <div className="mt-3 pt-3 border-t border-base-content/10 text-center">
                <p className="text-xs text-base-content/50 uppercase tracking-wide">End Date</p>
                <p className="text-base font-medium">
                  {[date.endDay, date.endMonth ? MONTH_NAMES[date.endMonth] : null, date.endYear].filter(Boolean).join(' ')}
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="alert alert-error flex items-center justify-between gap-4">
            <span>{error}</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={fetchData}>Try again</button>
          </div>
        )}

        {loading ? (
          <div className="rounded-box border border-base-content/10 bg-base-200/50 p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-sm text-base-content/60">Loading events...</p>
          </div>
        ) : linkedEvents.length === 0 ? (
          <div className="card bg-base-100 border border-base-content/10 p-12 text-center rounded-box">
            <p className="text-base-content/60">No events linked to this date.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-base-content">
                Linked Events
                <span className="text-base-content/50 font-normal ml-2">({linkedEvents.length})</span>
              </h2>
            </div>

            {typeOrder.map((type) => {
              const items = groupedByType[type];
              if (!items || items.length === 0) return null;
              const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.event;
              const Icon = ICON_MAP[cfg.icon] || CalendarDays;
              return (
                <div key={type} className="space-y-3">
                  <h3 className={`text-sm font-semibold uppercase tracking-wider ${cfg.color} flex items-center gap-2`}>
                    <Icon className="w-4 h-4" />
                    {cfg.label}s ({items.length})
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {items.map((evt, i) => (
                      <EventCard key={i} evt={evt} treeId={treeId} />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
