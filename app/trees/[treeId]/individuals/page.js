'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GitMerge, BarChart2, BarChart3, Users } from 'lucide-react';
import { DashboardMainContentLayout, PersonCard } from '@/components';
import { DataViewContainer, AddNewPlaceholder, ChartsPlaceholder, StatisticsPlaceholder } from '@/components/shared/data-display';
import { useTreeEntityList } from '@/hooks/queries/useTreeEntityList';

function stripGedcomSlashes(name) {
  if (!name) return name;
  return name.replace(/\//g, '').replace(/\s+/g, ' ').trim();
}

const FILTER_LABELS = {
  given_name: 'Given Name',
  surname: 'Surname',
  sex: 'Sex',
  living: 'Living',
  has_children: 'Has Children',
  has_spouse: 'Has Spouse',
  birth_year: 'Birth Year',
  birth_place: 'Birth Place',
  search: 'Search',
};

const SEX_LABELS = { M: 'Male', F: 'Female', U: 'Unknown' };
const BOOLEAN_LABELS = { true: 'Yes', false: 'No' };

function getActiveFiltersList(params) {
  if (!params) return [];
  const list = [];
  if (params.search?.trim()) {
    list.push({ label: 'Search', value: params.search });
  }
  const filters = params.filters || {};
  const filterKeys = ['given_name', 'surname', 'sex', 'living', 'has_children', 'has_spouse', 'birth_year', 'birth_place'];
  for (const key of filterKeys) {
    const value = filters[key];
    if (value === undefined || value === null || String(value).trim() === '') continue;
    const label = FILTER_LABELS[key] || key.replace(/_/g, ' ');
    let displayValue = String(value);
    if (key === 'sex') displayValue = SEX_LABELS[value] || displayValue;
    else if (['living', 'has_children', 'has_spouse'].includes(key)) displayValue = BOOLEAN_LABELS[value] || displayValue;
    list.push({ label, value: displayValue });
  }
  return list;
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
  const searchParams = useSearchParams();
  const treeId = params?.treeId;
  const givenNameFromUrl = searchParams?.get('given_name');
  const surnameFromUrl = searchParams?.get('surname');
  const [queryParams, setQueryParams] = useState({});
  const { data, isLoading, error, refetch } = useTreeEntityList(treeId, 'individuals', queryParams);
  const items = (data?.data || []).map((i) => mapIndividualFromApi(i, treeId));
  const totalItems = data?.pagination?.total ?? 0;
  const activeFilters = getActiveFiltersList(queryParams);

  if (!treeId) {
    return (
      <DashboardMainContentLayout treeId={treeId} title="Individuals">
        <p className="text-base-content/60">Missing tree ID.</p>
      </DashboardMainContentLayout>
    );
  }

  return (
    <DashboardMainContentLayout
      treeId={treeId}
      title="Individuals"
      subtitle={`${totalItems} people in this tree`}
    >
        {activeFilters.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/70 mb-4">
            {activeFilters.map(({ label, value }) => (
              <li key={label}>
                <span className="font-medium text-base-content/80">{label}:</span> {value}
              </li>
            ))}
          </ul>
        )}
        <DataViewContainer
          items={items}
          loading={isLoading}
          error={error ? { message: error.message, onRetry: refetch } : null}
          emptyState={{ title: 'No individuals', message: 'No individuals found in this tree.' }}
          defaultView="card"
          renderCard={(person) => <PersonCard person={person} treeId={treeId} />}
          renderRow={(person) => (
            <>
              <td className="px-6 py-4">
                <Link href={`/trees/${treeId}/individuals/${encodeURIComponent(person.id)}`} className="link link-primary font-medium">
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
            { label: 'Sex', key: 'sex', sortable: true },
          ]}
          searchPlaceholder="Search individuals by name..."
          searchLabel="Name"
          advancedSearchFields={[
            { key: 'name',        label: 'Name' },
            { key: 'birth_place', label: 'Birth Place' },
            { key: 'death_place', label: 'Death Place' },
            { key: 'sex', label: 'Sex', type: 'select', options: [
              { value: 'M', label: 'Male' },
              { value: 'F', label: 'Female' },
              { value: 'U', label: 'Unknown' },
            ]},
            { key: 'birth_year',  label: 'Birth Year',  type: 'number' },
            { key: 'death_year',  label: 'Death Year',  type: 'number' },
            { key: 'living', label: 'Living', type: 'select', options: [
              { value: 'true',  label: 'Yes' },
              { value: 'false', label: 'No' },
            ]},
            { key: 'has_children', label: 'Has Children', type: 'select', options: [
              { value: 'true',  label: 'Yes' },
              { value: 'false', label: 'No' },
            ]},
            { key: 'has_spouse', label: 'Has Spouse', type: 'select', options: [
              { value: 'true',  label: 'Yes' },
              { value: 'false', label: 'No' },
            ]},
          ]}
          defaultFilterValues={
            (givenNameFromUrl || surnameFromUrl)
              ? { ...(givenNameFromUrl && { given_name: givenNameFromUrl }), ...(surnameFromUrl && { surname: surnameFromUrl }) }
              : {}
          }
          filters={[
            { key: 'given_name', label: 'Given Name', type: 'text' },
            { key: 'surname', label: 'Surname', type: 'text' },
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
            { value: 'sex', label: 'Gender' },
          ]}
          defaultSort="name"
          defaultSortDirection="asc"
          totalItems={totalItems}
          defaultPerPage={10}
          onParamsChange={setQueryParams}
          addNewComponent={<AddNewPlaceholder message="Add new individual form coming soon." />}
          extraTabs={[
            { key: 'charts', label: 'Charts', content: <ChartsPlaceholder message="Charts coming soon." />, icon: BarChart2 },
            { key: 'statistics', label: 'Statistics', content: <StatisticsPlaceholder message="Statistics coming soon." />, icon: BarChart3 },
            { key: 'merge', label: 'Merge', content: <AddNewPlaceholder message="Merge individuals form coming soon." />, icon: GitMerge },
          ]}
          actions={[
            { key: 'view', label: 'View', href: (item) => `/trees/${treeId}/individuals/${encodeURIComponent(item.id)}` },
            { key: 'find_similar', label: 'Find Similar', icon: Users, onClick: () => {} },
            { key: 'edit', label: 'Edit', href: () => '#' },
            { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
        />
    </DashboardMainContentLayout>
  );
}
