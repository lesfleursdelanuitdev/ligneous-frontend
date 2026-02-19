'use client';

import { useState } from 'react';
import DataView from './DataView';
import ViewToggle from '../navigation/ViewToggle';
import SortDropdown from '../navigation/SortDropdown';
import SearchBar from '../forms/SearchBar';
import Pagination from '../navigation/Pagination';
import { EmptyState, LoadingState, ErrorState } from '../feedback';

/**
 * DataViewContainer Component
 * Main container for list/card views with search, sort, pagination
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of items to display
 * @param {Function} props.renderCard - Function to render card: (item, index) => ReactNode
 * @param {Function} props.renderRow - Function to render list row: (item, index) => ReactNode
 * @param {string} props.defaultView - Default view: 'list' or 'card'
 * @param {Array} props.sortOptions - Array of { value, label } for sorting
 * @param {string} props.defaultSort - Default sort value
 * @param {Function} props.onSortChange - Callback when sort changes
 * @param {string} props.searchValue - Search value
 * @param {Function} props.onSearchChange - Callback when search changes
 * @param {number} props.currentPage - Current page (1-based)
 * @param {number} props.totalPages - Total pages
 * @param {number} props.totalItems - Total items
 * @param {number} props.itemsPerPage - Items per page
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.error - Error object { title, message, onRetry }
 * @param {Object} props.emptyState - Empty state props { title, message, action }
 * @param {Object} props.cardGridProps - Props for CardGrid
 * @param {Object} props.listViewProps - Props for ListView (headers, etc.)
 * @param {string} props.className - Additional CSS classes
 */
export default function DataViewContainer({
  items = [],
  renderCard,
  renderRow,
  defaultView = 'card',
  sortOptions = [],
  defaultSort,
  onSortChange,
  searchValue = '',
  onSearchChange,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  loading = false,
  error,
  emptyState,
  cardGridProps = {},
  listViewProps = {},
  className = '',
}) {
  const [view, setView] = useState(defaultView);
  const [sort, setSort] = useState(defaultSort || (sortOptions[0]?.value));

  const handleSortChange = (value) => {
    setSort(value);
    if (onSortChange) {
      onSortChange(value);
    }
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  // Loading state
  if (loading) {
    return (
      <div className={className}>
        <LoadingState message="Loading items..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <ErrorState
          title={error.title}
          message={error.message}
          onRetry={error.onRetry}
        />
      </div>
    );
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          title={emptyState?.title || 'No items found'}
          message={emptyState?.message || 'Try adjusting your search or filters.'}
          action={emptyState?.action}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          {onSearchChange && (
            <SearchBar
              value={searchValue}
              onChange={onSearchChange}
              placeholder="Search items..."
            />
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {sortOptions.length > 0 && (
            <SortDropdown
              options={sortOptions}
              value={sort}
              onChange={handleSortChange}
            />
          )}
          <ViewToggle view={view} onViewChange={handleViewChange} />
        </div>
      </div>

      {/* Data View */}
      <DataView
        view={view}
        items={items}
        renderCard={renderCard}
        renderRow={renderRow}
        cardGridProps={cardGridProps}
        listViewProps={listViewProps}
      />

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

