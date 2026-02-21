'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { LayoutGrid, Plus } from 'lucide-react';
import DataView from './DataView';
import DataViewSearch from './DataViewSearch';
import DataViewSearchAdvanced from './DataViewSearchAdvanced';
import DataViewFilter from './DataViewFilter';
import DataViewSort from './DataViewSort';
import DataViewActions from './DataViewActions';
import DataViewTabs from './DataViewTabs';
import DataViewToolbar from './DataViewToolbar';
import Pagination from '../navigation/Pagination';

/**
 * DataViewContainer — single orchestrator for paginated, searchable,
 * filterable, sortable list/card views with tabs and entity actions.
 *
 * All data fetching is done by the parent page via the onParamsChange callback.
 * This component manages UI state and delegates rendering to sub-components.
 */
export default function DataViewContainer({
  // Data
  items = [],
  loading = false,
  error = null,
  emptyState = {},

  // Rendering
  renderCard,
  renderRow,
  defaultView = 'card',
  listHeaders = [],
  cardGridProps = {},

  // Search
  searchPlaceholder = 'Search...',
  searchLabel = '',
  advancedSearchFields = [],

  // Filters
  filters = [],

  // Sort
  sortOptions = [],
  defaultSort = '',
  defaultSortDirection = 'asc',

  // Pagination (from API response)
  totalItems = 0,
  defaultPerPage = 10,

  // Actions
  actions = [],
  userPermissions = {},

  // Callback — parent re-fetches data when params change
  onParamsChange,

  // Tabs
  addNewComponent = null,
  extraTabs = [],

  className = '',
}) {
  const [view, setView] = useState(defaultView);
  const [activeSection, setActiveSection] = useState(null); // 'search' | 'filter' | 'sort' | null
  const [search, setSearch] = useState('');
  const [advancedConditions, setAdvancedConditions] = useState([]);
  const [filterValues, setFilterValues] = useState({});
  const [sortKey, setSortKey] = useState(defaultSort || sortOptions[0]?.value || '');
  const [sortDirection, setSortDirection] = useState(defaultSortDirection);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);

  const isInitialMount = useRef(true);

  const emitParams = useCallback(() => {
    if (onParamsChange) {
      onParamsChange({
        search,
        advancedConditions,
        filters: filterValues,
        sort: sortKey,
        sortDirection,
        page,
        perPage,
      });
    }
  }, [search, advancedConditions, filterValues, sortKey, sortDirection, page, perPage, onParamsChange]);

  // Emit on initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      emitParams();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Emit whenever params change (skip initial since handled above)
  const prevParams = useRef(null);
  useEffect(() => {
    const key = JSON.stringify({ search, advancedConditions, filterValues, sortKey, sortDirection, page, perPage });
    if (prevParams.current !== null && prevParams.current !== key) {
      emitParams();
    }
    prevParams.current = key;
  }, [search, advancedConditions, filterValues, sortKey, sortDirection, page, perPage, emitParams]);

  // Reset to page 1 when search, advanced conditions, filters, sort, or perPage change
  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleAdvancedConditions = (conds) => { setAdvancedConditions(conds); setPage(1); };
  const handleFilterChange = (vals) => { setFilterValues(vals); setPage(1); };
  const handleFilterClear = () => { setFilterValues({}); setPage(1); };
  const handleSortChange = (key, dir) => { setSortKey(key); setSortDirection(dir); setPage(1); };
  const handlePerPageChange = (n) => { setPerPage(n); setPage(1); };

  // Wire list header clicks to sort
  const handleHeaderSort = (key, direction) => {
    setSortKey(key);
    setSortDirection(direction);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  // Augment list headers with an actions column when actions are defined
  const augmentedHeaders = actions.length > 0
    ? [...listHeaders, { label: 'Actions', key: '_actions', sortable: false }]
    : listHeaders;

  // Wrap renderRow to append actions column
  const wrappedRenderRow = (item, index) => {
    const rowContent = renderRow(item, index);
    if (actions.length === 0) return rowContent;
    return (
      <>
        {rowContent}
        <td className="px-4 py-3">
          <DataViewActions actions={actions} item={item} userPermissions={userPermissions} layout="row" />
        </td>
      </>
    );
  };

  // Wrap renderCard — outer wrapper becomes the card, inner card styling is stripped
  const wrappedRenderCard = (item, index) => {
    const cardContent = renderCard(item, index);
    if (actions.length === 0) return cardContent;
    return (
      <div className="rounded-box border border-base-content/10 bg-base-100 overflow-hidden flex flex-col h-full">
        <div className="flex-1 min-h-0 [&>*]:border-0 [&>*]:rounded-none [&>*]:shadow-none">
          {cardContent}
        </div>
        <div className="flex-shrink-0 px-4 pb-3">
          <DataViewActions actions={actions} item={item} userPermissions={userPermissions} layout="card" />
        </div>
      </div>
    );
  };

  // Tab content: list/grid + pagination only (toolbar is above tabs)
  const dataViewContent = (
    <div className="space-y-4">
      {loading ? (
        <div className="rounded-box border border-base-content/10 bg-base-200/50 p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-sm text-base-content/60">Loading...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error flex items-center justify-between gap-4">
          <span>{typeof error === 'string' ? error : error.message || 'An error occurred'}</span>
          {error.onRetry && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={error.onRetry}>Try again</button>
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="card bg-base-100 border border-base-content/10 p-12 text-center rounded-box">
          <p className="text-lg font-medium text-base-content mb-1">{emptyState.title || 'No items found'}</p>
          <p className="text-base-content/60">{emptyState.message || 'Try adjusting your search or filters.'}</p>
          {emptyState.action && (
            <div className="mt-4">{emptyState.action}</div>
          )}
        </div>
      ) : (
        <DataView
          view={view}
          items={items}
          renderCard={wrappedRenderCard}
          renderRow={wrappedRenderRow}
          cardGridProps={cardGridProps}
          listViewProps={{
            headers: augmentedHeaders,
            onSort: handleHeaderSort,
            sortKey,
            sortDirection,
          }}
          className={view === 'list' ? 'overflow-x-auto' : ''}
        />
      )}

      {/* Pagination — always show when there are items (even 1 page, for the per-page selector) */}
      {!loading && !error && items.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={perPage}
          onPageChange={setPage}
          onPerPageChange={handlePerPageChange}
        />
      )}
    </div>
  );

  // Build tabs — "View All" is always the first tab
  const tabs = [{ key: 'view-all', label: 'View All', content: dataViewContent, icon: LayoutGrid }];
  if (addNewComponent) {
    tabs.push({ key: 'add', label: 'Add New', content: addNewComponent, icon: Plus });
  }
  for (const extra of extraTabs) {
    tabs.push(extra);
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar — above tabs */}
      <DataViewToolbar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        view={view}
        onViewChange={setView}
        hasSearch={true}
        hasFilters={filters.length > 0}
        hasSort={sortOptions.length > 0}
        renderSearchSection={() => (
          <div className="flex flex-col gap-3">
            <div className="w-full sm:max-w-sm">
              <DataViewSearch
                value={search}
                onChange={handleSearch}
                placeholder={searchPlaceholder}
                searchLabel={searchLabel}
              />
            </div>
            {advancedSearchFields.length > 0 && (
              <DataViewSearchAdvanced
                fields={advancedSearchFields}
                value={advancedConditions}
                onChange={handleAdvancedConditions}
              />
            )}
          </div>
        )}
        renderFilterSection={() => filters.length > 0 ? (
          <DataViewFilter
            filters={filters}
            values={filterValues}
            onChange={handleFilterChange}
            onClear={handleFilterClear}
          />
        ) : null}
        renderSortSection={() => sortOptions.length > 0 ? (
          <DataViewSort
            options={sortOptions}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onChange={handleSortChange}
          />
        ) : null}
      />

      {/* Tabs — below toolbar */}
      <DataViewTabs tabs={tabs} defaultTab="view-all" />
    </div>
  );
}
