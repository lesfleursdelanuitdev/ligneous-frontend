'use client';

import CardGrid from './CardGrid';
import ListView from './ListView';

/**
 * DataView Component
 * Switches between ListView and CardGrid based on view mode
 * 
 * @param {Object} props
 * @param {string} props.view - Current view: 'list' or 'card'
 * @param {Array} props.items - Array of items to display
 * @param {Function} props.renderCard - Function to render card: (item, index) => ReactNode
 * @param {Function} props.renderRow - Function to render list row: (item, index) => ReactNode
 * @param {Object} props.cardGridProps - Props to pass to CardGrid
 * @param {Object} props.listViewProps - Props to pass to ListView
 * @param {string} props.className - Additional CSS classes
 */
export default function DataView({
  view = 'card',
  items = [],
  renderCard,
  renderRow,
  cardGridProps = {},
  listViewProps = {},
  className = '',
}) {
  if (view === 'list') {
    return (
      <ListView
        items={items}
        renderRow={renderRow}
        className={className}
        {...listViewProps}
      />
    );
  }

  return (
    <CardGrid
      items={items}
      renderCard={renderCard}
      className={className}
      {...cardGridProps}
    />
  );
}

