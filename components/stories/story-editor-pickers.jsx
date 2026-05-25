'use client';

// Picker adapter components for the @ligneous/story-creator/editor injection
// contract. Each component calls the ligneous tree API and maps results to the
// package's minimal item shapes.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/api';
import { X, Search } from 'lucide-react';

const DEBOUNCE_MS = 300;

function useDebounced(value, ms = DEBOUNCE_MS) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debouncedValue;
}

function familyPrimaryLine(fam) {
  const h = fam.husband?.fullName?.replace(/\//g, '').trim() ?? '';
  const w = fam.wife?.fullName?.replace(/\//g, '').trim() ?? '';
  const parts = [h, w].filter(Boolean);
  if (parts.length === 0) return fam.xref ?? fam.id;
  if (parts.length === 1) return parts[0];
  const [a, b] = [parts[0], parts[1]];
  return a.toLowerCase() <= b.toLowerCase() ? `${a} * ${b}` : `${b} * ${a}`;
}

// ── Individual search picker ──────────────────────────────────────────────────

export function LigneousIndividualPickerAdapter({ treeId, idPrefix = 'ind', label, excludeIds, onPick }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query);

  const { data, isLoading } = useQuery({
    queryKey: ['ligneous-picker-individuals', treeId, debounced],
    queryFn: async () => {
      const qs = new URLSearchParams({ search: debounced, limit: '25' });
      const res = await authFetch(`/api/trees/${treeId}/individuals?${qs}`);
      const json = await res.json().catch(() => ({}));
      return json.data ?? [];
    },
    enabled: !!treeId && debounced.length >= 1,
    staleTime: 30_000,
  });

  const results = (data ?? []).filter((ind) => !excludeIds?.has(ind.id));

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-base-content/70">{label}</p>}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-3.5 text-base-content/40 pointer-events-none" />
        <input
          id={`${idPrefix}-q`}
          type="text"
          className="input input-sm input-bordered w-full pl-8"
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {isLoading && <p className="text-xs text-base-content/50 px-1">Searching…</p>}
      {results.length > 0 && (
        <ul className="max-h-52 overflow-y-auto rounded-lg border border-base-content/10 divide-y divide-base-content/5">
          {results.map((ind) => {
            const name = (ind.fullName ?? '').replace(/\//g, '').trim() || ind.xref || ind.id;
            const meta = [ind.birthYear && `b. ${ind.birthYear}`, ind.deathYear && `d. ${ind.deathYear}`].filter(Boolean).join(' ');
            return (
              <li key={ind.id}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-base-200 transition-colors"
                  onClick={() => onPick({ id: ind.id, xref: ind.xref, fullName: ind.fullName, birthYear: ind.birthYear, deathYear: ind.deathYear })}
                >
                  <p className="text-sm font-medium text-base-content leading-snug">{name}</p>
                  {meta && <p className="text-xs text-base-content/50">{meta}</p>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Family search picker ──────────────────────────────────────────────────────

export function LigneousFamilyPickerAdapter({ treeId, idPrefix = 'fam', excludeIds, onPick }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query);

  const { data, isLoading } = useQuery({
    queryKey: ['ligneous-picker-families', treeId, debounced],
    queryFn: async () => {
      const qs = new URLSearchParams({ search: debounced, limit: '25' });
      const res = await authFetch(`/api/trees/${treeId}/families?${qs}`);
      const json = await res.json().catch(() => ({}));
      return json.data ?? [];
    },
    enabled: !!treeId && debounced.length >= 1,
    staleTime: 30_000,
  });

  const results = (data ?? []).filter((f) => !excludeIds?.has(f.id));

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-3.5 text-base-content/40 pointer-events-none" />
        <input
          id={`${idPrefix}-q`}
          type="text"
          className="input input-sm input-bordered w-full pl-8"
          placeholder="Search families…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {isLoading && <p className="text-xs text-base-content/50 px-1">Searching…</p>}
      {results.length > 0 && (
        <ul className="max-h-52 overflow-y-auto rounded-lg border border-base-content/10 divide-y divide-base-content/5">
          {results.map((fam) => {
            const primary = familyPrimaryLine(fam);
            return (
              <li key={fam.id}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-base-200 transition-colors"
                  onClick={() => onPick({ id: fam.id, xref: fam.xref, primaryLine: primary })}
                >
                  <p className="text-sm font-medium text-base-content leading-snug">{primary}</p>
                  {fam.xref && <p className="text-xs text-base-content/50">{fam.xref}</p>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Place search picker ───────────────────────────────────────────────────────

export function LigneousPlacePickerAdapter({ treeId, idPrefix = 'place', excludeIds, onPick, className }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query);

  const { data, isLoading } = useQuery({
    queryKey: ['ligneous-picker-places', treeId, debounced],
    queryFn: async () => {
      const qs = new URLSearchParams({ search: debounced, limit: '20' });
      const res = await authFetch(`/api/trees/${treeId}/places?${qs}`);
      const json = await res.json().catch(() => ({}));
      return json.data ?? [];
    },
    enabled: !!treeId && debounced.length >= 2,
    staleTime: 30_000,
  });

  const results = (data ?? []).filter((p) => !excludeIds?.has(p.id));

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-3.5 text-base-content/40 pointer-events-none" />
        <input
          id={`${idPrefix}-q`}
          type="text"
          className="input input-sm input-bordered w-full pl-8"
          placeholder="Search places…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {isLoading && <p className="text-xs text-base-content/50 px-1">Searching…</p>}
      {results.length > 0 && (
        <ul className="max-h-48 overflow-y-auto rounded-lg border border-base-content/10 divide-y divide-base-content/5">
          {results.map((place) => {
            const label = place.original || place.name || place.id;
            return (
              <li key={place.id}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-base-200 transition-colors"
                  onClick={() => onPick({ id: place.id, name: place.name || place.original, original: place.original, county: place.county, state: place.state, country: place.country, label })}
                >
                  <p className="text-sm font-medium text-base-content leading-snug truncate">{label}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Media picker button + modal ───────────────────────────────────────────────

function LigneousMediaPickerModalInner({ treeId, open, onOpenChange, mode, onAttach }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query);
  const [selected, setSelected] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['ligneous-picker-media', treeId, debounced],
    queryFn: async () => {
      const qs = new URLSearchParams({ search: debounced, limit: '36' });
      const res = await authFetch(`/api/trees/${treeId}/media?${qs}`);
      const json = await res.json().catch(() => ({}));
      return json.data ?? [];
    },
    enabled: !!treeId && open,
    staleTime: 30_000,
  });

  const results = data ?? [];
  const isSingle = mode === 'single';

  const toggle = useCallback((item) => {
    if (isSingle) {
      onAttach([{ id: item.id, title: item.title ?? null, description: item.description ?? null, fileRef: item.fileRef ?? null, form: item.form ?? null }]);
      onOpenChange(false);
      return;
    }
    setSelected((prev) =>
      prev.some((s) => s.id === item.id)
        ? prev.filter((s) => s.id !== item.id)
        : [...prev, item],
    );
  }, [isSingle, onAttach, onOpenChange]);

  const handleAttach = () => {
    onAttach(selected.map((m) => ({ id: m.id, title: m.title ?? null, description: m.description ?? null, fileRef: m.fileRef ?? null, form: m.form ?? null })));
    onOpenChange(false);
    setSelected([]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-2xl bg-base-100 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-content/10">
          <h2 className="text-sm font-semibold">Choose media</h2>
          <button type="button" onClick={() => onOpenChange(false)} className="btn btn-ghost btn-xs btn-square">
            <X className="size-3.5" />
          </button>
        </div>
        <div className="p-3 border-b border-base-content/10">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-base-content/40 pointer-events-none" />
            <input
              type="text"
              className="input input-sm input-bordered w-full pl-8"
              placeholder="Search media…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading && <p className="text-sm text-center text-base-content/50 py-8">Loading…</p>}
          {!isLoading && results.length === 0 && (
            <p className="text-sm text-center text-base-content/50 py-8">No media found.</p>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {results.map((item) => {
              const isSelected = selected.some((s) => s.id === item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item)}
                  className={`relative rounded-lg border-2 p-2 text-left transition-colors ${isSelected ? 'border-primary bg-primary/10' : 'border-base-content/10 hover:border-base-content/30 bg-base-200/40'}`}
                >
                  <p className="text-xs font-medium text-base-content truncate">{item.title || item.xref || item.id}</p>
                  {item.form && <p className="text-xs text-base-content/50 truncate">{item.form}</p>}
                  {item.fileRef && <p className="text-xs text-base-content/40 truncate">{item.fileRef}</p>}
                </button>
              );
            })}
          </div>
        </div>
        {!isSingle && (
          <div className="px-4 py-3 border-t border-base-content/10 flex items-center justify-between gap-2">
            <p className="text-xs text-base-content/60">{selected.length} selected</p>
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={handleAttach}
              className="btn btn-sm btn-primary"
            >
              Attach {selected.length > 0 ? `(${selected.length})` : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function LigneousMediaPickerModalAdapter({ treeId }) {
  return function BoundMediaPickerModal({ open, onOpenChange, mode, onAttach }) {
    return (
      <LigneousMediaPickerModalInner
        treeId={treeId}
        open={open}
        onOpenChange={onOpenChange}
        mode={mode}
        onAttach={onAttach}
      />
    );
  };
}

export function LigneousMediaPickerButtonAdapter({ treeId }) {
  return function BoundMediaPickerButton({ mode, triggerLabel, triggerClassName, onAttach }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" className={`btn btn-sm btn-outline ${triggerClassName ?? ''}`} onClick={() => setOpen(true)}>
          {triggerLabel}
        </button>
        <LigneousMediaPickerModalInner
          treeId={treeId}
          open={open}
          onOpenChange={setOpen}
          mode={mode}
          onAttach={onAttach}
        />
      </>
    );
  };
}

// ── Editor pill ───────────────────────────────────────────────────────────────

export function LigneousEditorPillAdapter({ label, onRemove }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-base-content/15 bg-base-200/60 px-2.5 py-0.5 text-xs font-medium text-base-content">
      <span className="truncate">{label}</span>
      <button
        type="button"
        className="rounded-full p-0.5 text-base-content/60 hover:bg-base-300/80 hover:text-base-content"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      >
        <X className="size-3.5 shrink-0" />
      </button>
    </span>
  );
}
