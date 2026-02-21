'use client';

import { useState, useCallback, useRef } from 'react';
import { DashboardLayout, TreeCard } from '@/components';
import { DataViewContainer, AddNewPlaceholder } from '@/components/shared/data-display';
import { authFetch } from '@/lib/api';

export default function ExplorePage() {
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const retryRef = useRef(null);

  const fetchData = useCallback(async ({ search, advancedConditions, filters, sort, sortDirection, page, perPage }) => {
    try {
      setLoading(true);
      setError(null);

      const qs = new URLSearchParams();
      qs.set('limit', String(perPage));
      qs.set('offset', String((page - 1) * perPage));
      if (search) qs.set('search', search);
      if (sort) qs.set('sort', sort);
      qs.set('order', sortDirection);
      if (filters?.visibility && filters.visibility !== 'all') qs.set('visibility', filters.visibility);
      if (advancedConditions?.length > 0) qs.set('advanced_conditions', JSON.stringify(advancedConditions));

      const res = await authFetch(`/api/trees?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch trees');

      const transformedTrees = (data.trees || []).map((tree) => {
        const primaryOwner = tree.owners?.find((o) => o.isPrimary)?.user || tree.owners?.[0]?.user;
        return {
          id: tree.id,
          name: tree.name,
          description: tree.description || 'No description provided',
          isPublic: tree.isPublic,
          individualsCount: tree.individualsCount ?? 0,
          familiesCount: tree.familiesCount ?? 0,
          placesCount: tree.placesCount ?? 0,
          eventsCount: tree.eventsCount ?? 0,
          sourcesCount: tree.sourcesCount ?? 0,
          notesCount: tree.notesCount ?? 0,
          parseStatus: tree.parseStatus,
          fileId: tree.fileId,
          owner: primaryOwner
            ? { name: primaryOwner.name || primaryOwner.username, username: primaryOwner.username }
            : null,
          updatedAt: tree.updatedAt,
          createdAt: tree.createdAt,
        };
      });

      setItems(transformedTrees);
      setTotalItems(data.pagination?.total ?? transformedTrees.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRequestAccess = (tree) => {
    console.log('Request access to:', tree.name);
    // TODO: Open access request modal
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">
          Explore Family Trees
        </h1>
        <p className="text-base-content/60 mt-1">
          Discover family histories from around the world
        </p>
      </div>

      <DataViewContainer
        items={items}
        loading={loading}
        error={error ? { message: error, onRetry: () => retryRef.current?.() } : null}
        emptyState={{
          title: 'No trees found',
          message: 'Try adjusting your filters or search terms',
        }}
        defaultView="card"
        renderCard={(tree) => <TreeCard tree={tree} onRequestAccess={handleRequestAccess} />}
        renderRow={(tree) => (
          <>
            <td className="px-6 py-4">
              <a href={`/trees/${tree.id}`} className="link link-primary font-medium">{tree.name}</a>
            </td>
            <td className="px-6 py-4 text-base-content/70">{tree.individualsCount?.toLocaleString() ?? 0}</td>
            <td className="px-6 py-4 text-base-content/70">{tree.familiesCount?.toLocaleString() ?? 0}</td>
            <td className="px-6 py-4">
              <span className={`badge badge-sm ${tree.isPublic ? 'badge-success' : 'badge-ghost'}`}>
                {tree.isPublic ? 'Public' : 'Private'}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-base-content/60">
              {tree.updatedAt ? new Date(tree.updatedAt).toLocaleDateString() : '\u2014'}
            </td>
          </>
        )}
        listHeaders={[
          { label: 'Name', key: 'name', sortable: true },
          { label: 'People', key: 'individuals_count', sortable: true },
          { label: 'Families', key: 'families_count', sortable: true },
          { label: 'Visibility', key: 'is_public', sortable: false },
          { label: 'Updated', key: 'updated_at', sortable: true },
        ]}
        searchPlaceholder="Search trees by name or description..."
        searchLabel="Name or description"
        advancedSearchFields={[
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
        ]}
        filters={[
          { key: 'visibility', label: 'Show', type: 'select', options: [
            { value: '', label: 'All' },
            { value: 'public', label: 'Public only' },
            { value: 'private', label: 'Private only' },
          ]},
        ]}
        sortOptions={[
          { value: 'name', label: 'Name' },
          { value: 'updatedAt', label: 'Recently Updated' },
          { value: 'createdAt', label: 'Date Created' },
        ]}
        defaultSort="updatedAt"
        defaultSortDirection="desc"
        totalItems={totalItems}
        defaultPerPage={10}
        addNewComponent={<AddNewPlaceholder message="Create new tree form coming soon." />}
        actions={[
          { key: 'view', label: 'View', href: (item) => `/trees/${item.id}` },
          { key: 'edit', label: 'Edit', href: () => '#' },
          { key: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' },
        ]}
        onParamsChange={(p) => { retryRef.current = () => fetchData(p); fetchData(p); }}
      />
    </DashboardLayout>
  );
}
