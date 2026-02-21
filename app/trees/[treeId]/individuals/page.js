'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { GitMerge } from 'lucide-react';
import { DashboardLayout, PersonCard, TreePageHeader } from '@/components';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';
import { authFetch } from '@/lib/api';

function stripGedcomSlashes(name) {
  if (!name) return name;
  return name.replace(/\//g, '').replace(/\s+/g, ' ').trim();
}

function mapIndividualFromApi(indi, treeId) {
  return {
    id: indi.xref,
    xref: indi.xref,
    name: stripGedcomSlashes(indi.fullName),
    birthDate: indi.birthDateDisplay,
    birthPlace: indi.birthPlaceDisplay,
    deathDate: indi.deathDateDisplay,
    deathPlace: indi.deathPlaceDisplay,
    gender: indi.sex,
    isLiving: indi.isLiving,
    hasParents: indi.hasParents,
    hasChildren: indi.hasChildren,
    hasSpouse: indi.hasSpouse,
    treeId,
  };
}

export default function TreeIndividualsPage() {
  const params = useParams();
  const treeId = params?.treeId;
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const retryRef = useRef(null);

  const fetchData = useCallback(async ({ search, advancedConditions, filters, sort, sortDirection, page, perPage }) => {
    if (!treeId) return;
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams();
      qs.set('limit', String(perPage));
      qs.set('offset', String((page - 1) * perPage));
      if (search) qs.set('search', search);
      if (sort) qs.set('sort', sort);
      qs.set('order', sortDirection);
      if (filters.sex) qs.set('sex', filters.sex);
      if (filters.living) qs.set('living', filters.living);
      if (filters.has_children) qs.set('has_children', filters.has_children);
      if (filters.has_spouse) qs.set('has_spouse', filters.has_spouse);
      if (filters.birth_year) qs.set('birth_year', filters.birth_year);
      if (filters.birth_place) qs.set('birth_place', filters.birth_place);
      if (advancedConditions?.length > 0) {
        qs.set('advanced_conditions', JSON.stringify(advancedConditions));
      }

      const res = await authFetch(`/api/trees/${treeId}/individuals?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to fetch individuals');
      }
      setItems((data.data || []).map((i) => mapIndividualFromApi(i, treeId)));
      setTotalItems(data.pagination?.total ?? data.data?.length ?? 0);
    } catch (err) {
      setError(err?.message || 'Failed to load individuals');
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  if (!treeId) {
    return (
      <DashboardLayout>
        <div className="p-6"><p className="text-base-content/60">Missing tree ID.</p></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <TreePageHeader
          treeId={treeId}
          title="Individuals"
          subtitle={`${totalItems} people in this tree`}
        />

        <DataViewContainer
          items={items}
          loading={loading}
          error={error ? { message: error, onRetry: () => retryRef.current?.() } : null}
          emptyState={{ title: 'No individuals', message: 'No individuals found in this tree.' }}
          defaultView="card"
          renderCard={(person) => <PersonCard person={person} treeId={treeId} />}
          renderRow={(person) => (
            <>
              <td className="px-6 py-4">
                <Link href={`/trees/${treeId}/individuals/${person.id}`} className="link link-primary font-medium">
                  {person.name || person.xref}
                </Link>
              </td>
              <td className="px-6 py-4 text-base-content/70 text-sm">{person.birthDate || '—'}</td>
              <td className="px-6 py-4 text-base-content/70 text-sm">{person.deathDate || '—'}</td>
              <td className="px-6 py-4 text-base-content/70 text-sm">{person.gender || '—'}</td>
            </>
          )}
          listHeaders={[
            { label: 'Name', key: 'name', sortable: true },
            { label: 'Birth', key: 'birth_year', sortable: true },
            { label: 'Death', key: 'death_year', sortable: true },
            { label: 'Sex', key: 'sex', sortable: false },
          ]}
          searchPlaceholder="Search individuals by name..."
          searchLabel="Name"
          advancedSearchFields={[
            { key: 'name', label: 'Name' },
            { key: 'birth_place', label: 'Birth Place' },
            { key: 'death_place', label: 'Death Place' },
            { key: 'sex', label: 'Sex' },
            { key: 'birth_year', label: 'Birth Year' },
            { key: 'death_year', label: 'Death Year' },
            { key: 'living', label: 'Living' },
            { key: 'has_children', label: 'Has Children' },
            { key: 'has_spouse', label: 'Has Spouse' },
          ]}
          filters={[
            { key: 'sex', label: 'Sex', type: 'select', options: [{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }, { value: 'U', label: 'Unknown' }] },
            { key: 'living', label: 'Living', type: 'select', options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }] },
            { key: 'has_children', label: 'Has Children', type: 'select', options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }] },
            { key: 'has_spouse', label: 'Has Spouse', type: 'select', options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }] },
            { key: 'birth_place', label: 'Birth Place', type: 'text' },
          ]}
          sortOptions={[
            { value: 'name', label: 'Name' },
            { value: 'birth_year', label: 'Birth Year' },
            { value: 'death_year', label: 'Death Year' },
          ]}
          defaultSort="name"
          defaultSortDirection="asc"
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={(p) => {
            retryRef.current = () => fetchData(p);
            fetchData(p);
          }}
          addNewComponent={<AddNewPlaceholder message="Add new individual form coming soon." />}
          extraTabs={[
            { key: 'merge', label: 'Merge', content: <AddNewPlaceholder message="Merge individuals form coming soon." />, icon: GitMerge },
          ]}
          actions={[
            { key: 'view', label: 'View', href: (item) => `/trees/${treeId}/individuals/${item.id}` },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
