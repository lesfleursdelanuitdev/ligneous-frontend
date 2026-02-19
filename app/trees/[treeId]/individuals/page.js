'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout, PersonCard } from '@/components';
import { DataView } from '@/components/shared/data-display';
import { ViewToggle } from '@/components/shared/navigation';
import { authFetch } from '@/lib/api';

function mapIndividualFromApi(indi, treeId) {
  return {
    id: indi.xref,
    xref: indi.xref,
    name: indi.name,
    givenName: indi.given_name,
    surname: indi.surname,
    birthDate: indi.birth_date,
    birthPlace: indi.birth_place,
    deathDate: indi.death_date,
    deathPlace: indi.death_place,
    gender: indi.sex,
    isLiving: indi.living,
    treeId,
  };
}

export default function TreeIndividualsPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [individuals, setIndividuals] = useState([]);
  const [meta, setMeta] = useState({ total: 0, limit: 100, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('card');

  const fetchIndividuals = useCallback(async () => {
    if (!treeId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch(
        `/api/trees/${treeId}/individuals?limit=500&offset=0`
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = typeof data?.error === 'string' ? data.error : (data?.error?.message ?? data?.message ?? 'Failed to fetch individuals');
        throw new Error(msg);
      }

      const list = (data.individuals || []).map((i) => mapIndividualFromApi(i, treeId));
      setIndividuals(list);
      setMeta(data.meta || { total: list.length, limit: 500, offset: 0 });
    } catch (err) {
      const msg = err?.message && typeof err.message === 'string' ? err.message : String(err);
      setError(msg || 'Failed to load individuals');
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    fetchIndividuals();
  }, [fetchIndividuals]);

  const listHeaders = [
    { label: 'Name', key: 'name', sortable: false },
    { label: 'Birth', key: 'birthDate', sortable: false },
    { label: 'Death', key: 'deathDate', sortable: false },
    { label: 'Sex', key: 'gender', sortable: false },
  ];

  if (!treeId) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-base-content/60">Missing tree ID.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={`/trees/${treeId}`}
              className="text-sm link link-primary mb-1 inline-block"
            >
              ← Tree overview
            </Link>
            <h1 className="text-2xl font-bold text-base-content">
              Individuals
            </h1>
            <p className="text-base-content/60 mt-1">
              {meta.total} people in this tree
            </p>
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>

        {error && (
          <div className="alert alert-error flex items-center justify-between gap-4">
            <span>{error}</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => fetchIndividuals()}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-box border border-base-content/10 bg-base-200/50 p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-sm text-base-content/60">Loading individuals…</p>
          </div>
        ) : error ? null : individuals.length === 0 ? (
          <div className="card bg-base-100 border border-base-content/10 p-12 text-center rounded-box">
            <p className="text-base-content/60">No individuals in this tree.</p>
          </div>
        ) : (
          <DataView
            view={view}
            items={individuals}
            renderCard={(person) => (
              <PersonCard person={person} treeId={treeId} />
            )}
            renderRow={(person) => (
              <>
                <td className="px-6 py-4">
                  <Link
                    href={`/trees/${treeId}/individuals/${person.id}`}
                    className="link link-primary font-medium"
                  >
                    {person.name || `${person.givenName || ''} ${person.surname || ''}`.trim() || person.xref}
                  </Link>
                </td>
                <td className="px-6 py-4 text-base-content/70 text-sm">
                  {person.birthDate || '—'}
                </td>
                <td className="px-6 py-4 text-base-content/70 text-sm">
                  {person.deathDate || '—'}
                </td>
                <td className="px-6 py-4 text-base-content/70 text-sm">
                  {person.gender || '—'}
                </td>
              </>
            )}
            listViewProps={{ headers: listHeaders }}
            className={view === 'list' ? 'overflow-x-auto' : ''}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
